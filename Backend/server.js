// server.js
'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const BackblazeB2 = require('backblaze-b2');

const {
    B2_KEY_ID,
    B2_APP_KEY,
    B2_BUCKET_NAME,
    AUDIO_PREFIX = 'audio/',
    PORT = 3000,
} = process.env;

if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_NAME) {
    console.error('Missing required env vars: B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME');
    process.exit(1);
}

const app = express();
app.use(morgan('dev'));
app.use(cors());

// ---- init B2 client ----
const b2 = new BackblazeB2({
    applicationKeyId: B2_KEY_ID,
    applicationKey: B2_APP_KEY,
});

// In-memory index of files for quick size/contentType lookup
// { [fileName]: { fileId, size, contentType } }
let audioIndex = {};

async function b2Authorize() {
    // re-authorize on startup and occasionally when 401 happens
    await b2.authorize();
}

// Build/refresh a simple index of audio files
async function refreshAudioIndex() {
    await b2Authorize();

    audioIndex = {};
    let nextFileName = null;

    do {
        const res = await b2.listFileNames({
            bucketId: await getBucketId(),
            startFileName: nextFileName || undefined,
            maxFileCount: 1000,
            prefix: AUDIO_PREFIX || undefined,
        });

        const { files, nextFileName: nf } = res.data;
        nextFileName = nf || null;

        for (const f of files) {
            // Only keep common audio mime types; fall back if absent.
            const contentType = f.contentType || 'audio/mpeg';
            audioIndex[f.fileName] = {
                fileId: f.fileId,
                size: Number(f.contentLength),
                contentType,
            };
        }
    } while (nextFileName);
}

let cachedBucketId = null;
async function getBucketId() {
    if (cachedBucketId) return cachedBucketId;
    await b2Authorize();
    const res = await b2.listBuckets();
    const bucket = res.data.buckets.find((b) => b.bucketName === B2_BUCKET_NAME);
    if (!bucket) throw new Error(`Bucket ${B2_BUCKET_NAME} not found`);
    cachedBucketId = bucket.bucketId;
    return cachedBucketId;
}

// ---- API: list available audios ----
app.get('/audios', async (req, res) => {
    try {
        if (Object.keys(audioIndex).length === 0) {
            await refreshAudioIndex();
        }

        const list = Object.entries(audioIndex).map(([fileName, meta]) => ({
            key: fileName,
            name: fileName.replace(AUDIO_PREFIX, ''),
            size: meta.size,
            contentType: meta.contentType,
        }));

        res.json({ bucket: B2_BUCKET_NAME, prefix: AUDIO_PREFIX, count: list.length, files: list });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list audio files' });
    }
});

// ---- API: stream with Range support ----
// Example: /stream?key=audio/my-audio.mp3
app.get('/stream', async (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Missing query param: key' });

    try {
        if (!audioIndex[key]) {
            // possibly a fresh upload – try refreshing
            await refreshAudioIndex();
        }
        const meta = audioIndex[key];
        if (!meta) return res.status(404).json({ error: 'Audio not found' });

        const { size, contentType } = meta;

        // Parse Range header
        const range = req.headers.range;
        let start = 0;
        let end = size - 1;
        let statusCode = 200;

        if (range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(range);
            if (match) {
                if (match[1]) start = parseInt(match[1], 10);
                if (match[2]) end = parseInt(match[2], 10);
                if (isNaN(start) || isNaN(end) || start > end || end >= size) {
                    return res.status(416).set({
                        'Content-Range': `bytes */${size}`,
                    }).end();
                }
                statusCode = 206; // Partial Content
            }
        }

        // Always authorize; handle token expiry automatically
        await b2Authorize();

        // We can stream by *name* and pass Range upstream to B2:
        const rangeHeader = `bytes=${start}-${end}`;
        const dl = await b2.downloadFileByName({
            bucketName: B2_BUCKET_NAME,
            fileName: key,
            responseType: 'stream',
            headers: {
                Range: range ? rangeHeader : undefined,
            },
        });

        // Set correct headers for streaming/ seeking
        const headers = {
            'Content-Type': contentType || 'audio/mpeg',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=86400, immutable',
        };

        if (statusCode === 206) {
            headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
            headers['Content-Length'] = (end - start + 1).toString();
        } else {
            headers['Content-Length'] = size.toString();
        }

        res.writeHead(statusCode, headers);

        // Pipe the B2 stream to client
        dl.data.on('error', (e) => {
            console.error('B2 stream error:', e.message);
            if (!res.headersSent) res.writeHead(500);
            res.end();
        });

        dl.data.pipe(res);
    } catch (err) {
        // Re-authorize once if needed
        if (err?.response?.status === 401) {
            try {
                await b2Authorize();
            } catch (_) {}
        }
        console.error(err?.response?.data || err);
        res.status(500).json({ error: 'Streaming failed' });
    }
});

// ---- health & index refresh endpoints (optional) ----
app.get('/healthz', (_, res) => res.json({ ok: true }));
app.post('/refresh-index', async (_, res) => {
    try {
        await refreshAudioIndex();
        res.json({ ok: true, count: Object.keys(audioIndex).length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'refresh failed' });
    }
});

app.listen(PORT, async () => {
    try {
        await refreshAudioIndex();
        console.log(`Audio API running on http://localhost:${PORT}`);
    } catch (e) {
        console.error('Startup failed:', e.message);
        process.exit(1);
    }
});
