const express = require('express');
const jwt = require('jsonwebtoken');
const { b2, downloadB2FileAsText } = require('./b2-client'); // Import our B2 client

const router = express.Router();

// --- Config (Loaded from .env by your index.js) ---
const TOKEN_SECRET = process.env.TOKEN_SECRET;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;

// --- Endpoint 1: Create the Virtual Episode (No Changes) ---
// POST /api/episodes/hls
router.post('/episodes/hls', (req, res) => {
    const { playlistPaths } = req.body;
    if (!Array.isArray(playlistPaths) || playlistPaths.length === 0) {
        return res.status(400).json({ error: 'playlistPaths must be a non-empty array' });
    }
    try {
        const token = jwt.sign({ playlists: playlistPaths }, TOKEN_SECRET, { expiresIn: '2h' });
        const selfUrl = `${req.protocol}://${req.get('host')}`;
        const episodeUrl = `${selfUrl}/api/hls/episode/${token}.m3u8`;
        res.json({ episodeUrl });
    } catch (error) {
        res.status(500).json({ error: 'Could not create episode' });
    }
});


// --- Endpoint 2: Serve the Stitched HLS Playlist (MODIFIED) ---
// GET /api/hls/episode/:token.m3u8
router.get('/hls/episode/:token.m3u8', async (req, res) => {
    const { token } = req.params;
    try {
        // 1. Verify token
        const decoded = jwt.verify(token, TOKEN_SECRET);
        const playlistPaths = decoded.playlists;

        // 2. Fetch all playlists from B2 (using the SDK, not axios)
        const playlistPromises = playlistPaths.map(path =>
            downloadB2FileAsText(B2_BUCKET_NAME, path)
        );
        const playlists = await Promise.all(playlistPromises);

        // 3. "Stitch" the playlists together
        // We pass the token so the segment URLs can also be secured
        const masterPlaylist = buildMasterPlaylist(playlists, playlistPaths, token);

        // 4. Send the final playlist to the client
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(masterPlaylist);

    } catch (error) {
        // ... (your existing error handling) ...
        console.error('Error serving HLS playlist:', error.message);
        res.status(500).send('Could not generate playlist');
    }
});


// --- Endpoint 3: Proxy for Audio Segments (NEW) ---
// This is the route that streams the actual audio
// GET /api/hls/segment
router.get('/hls/segment', async (req, res) => {
    // We use a query param `?file=...`
    const key = req.query.file;
    if (!key) {
        return res.status(400).json({ error: 'Missing query param: file' });
    }

    try {
        const range = req.headers.range;
        let start = 0;
        let end; // We'll let B2 handle the end if not specified

        if (range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(range);
            if (match) {
                if (match[1]) start = parseInt(match[1], 10);
                if (match[2]) end = parseInt(match[2], 10);
            }
        }

        // We download the file as a stream
        const dl = await b2.downloadFileByName({
            bucketName: B2_BUCKET_NAME,
            fileName: key,
            responseType: 'stream',
            headers: {
                // Pass the Range header to B2
                Range: range ? `bytes=${start}-${end || ''}` : undefined,
            },
        });

        // Get file size from B2's response headers
        const size = parseInt(dl.headers['content-length'], 10);
        const contentType = dl.headers['content-type'] || 'audio/aac';

        // Set headers for streaming/seeking
        const headers = {
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Content-Length': size.toString(),
        };

        let statusCode = 200; // OK

        if (range) {
            statusCode = 206; // Partial Content
            headers['Content-Range'] = dl.headers['content-range'] || `bytes ${start}-${end || size - 1}/${size}`;
        }

        res.writeHead(statusCode, headers);

        // Pipe the B2 stream directly to the client
        dl.data.pipe(res);

    } catch (err) {
        console.error(err?.response?.data || err);
        res.status(500).json({ error: 'Streaming failed' });
    }
});


// --- Core Logic: The HLS "Stitcher" (MODIFIED) ---
function buildMasterPlaylist(playlists, playlistPaths) {
    let segments = [];
    let header = '';

    for (const [index, playlistText] of playlists.entries()) {
        const lines = playlistText.split('\n');
        const basePath = getBasePath(playlistPaths[index]);

        if (index === 0) {
            header = lines.filter(line => line.startsWith('#EXTM3U') || line.startsWith('#EXT-X-VERSION') || line.startsWith('#EXT-X-TARGETDURATION') || line.startsWith('#EXT-X-PLAYLIST-TYPE') || line.startsWith('#EXT-X-MEDIA-SEQUENCE')).join('\n');
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('#EXTINF:')) {
                const segmentInfo = line;
                const segmentFile = lines[i + 1]; // e.g., "seg_000.aac"
                if (segmentFile && !segmentFile.startsWith('#')) {
                    // IMPORTANT: Create a URL to our new proxy
                    const segmentB2Path = `${basePath}/${segmentFile}`;
                    const proxySegmentUrl = `/api/hls/segment?file=${encodeURIComponent(segmentB2Path)}`;

                    segments.push(segmentInfo);
                    segments.push(proxySegmentUrl);
                    i++;
                }
            }
        }
    }
    return [header, ...segments, '#EXT-X-ENDLIST'].join('\n');
}

// Helper to get the "directory" of a playlist
function getBasePath(playlistPath) {
    return playlistPath.substring(0, playlistPath.lastIndexOf('/'));
}

module.exports = router;