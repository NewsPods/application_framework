const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const router = express.Router();

// --- Config (Loaded from .env by your index.js) ---
const TOKEN_SECRET = process.env.JWT_SECRET;
const B2_BASE_URL = process.env.B2_BASE_URL;

if (!TOKEN_SECRET || !B2_BASE_URL) {
    console.error('FATAL ERROR: Missing .env variables for HLS (TOKEN_SECRET, B2_BASE_URL)');
    // You might want to handle this more gracefully
}

// --- Endpoint 1: Create the Virtual Episode ---
// POST /api/episodes/hls
router.post('/episodes/hls', (req, res) => {
    // This comes from your CockroachDB
    // e.g., ["audio/hls/article_1/index.m3u8", ...]
    const { playlistPaths } = req.body;

    if (!Array.isArray(playlistPaths) || playlistPaths.length === 0) {
        return res.status(400).json({ error: 'playlistPaths must be a non-empty array' });
    }

    try {
        // Create a JWT that expires in 2 hours
        const token = jwt.sign(
            { playlists: playlistPaths },
            TOKEN_SECRET,
            { expiresIn: '2h' }
        );

        // Get the base URL (e.g., http://localhost:4000)
        const selfUrl = `${req.protocol}://${req.get('host')}`;

        // This is the final URL you will give to hls.js
        // It matches the mount point in index.js
        const episodeUrl = `${selfUrl}/api/hls/episode/${token}.m3u8`;

        res.json({ episodeUrl });

    } catch (error) {
        console.error('Error creating token:', error);
        res.status(500).json({ error: 'Could not create episode' });
    }
});


// --- Endpoint 2: Serve the Stitched HLS Playlist ---
// GET /api/hls/episode/:token.m3u8
router.get('/hls/episode/:token.m3u8', async (req, res) => {
    const { token } = req.params;

    try {
        // 1. Verify and decode the token
        const decoded = jwt.verify(token, TOKEN_SECRET);
        const playlistPaths = decoded.playlists;

        // 2. Fetch all individual playlists from B2 in parallel
        const playlistPromises = playlistPaths.map(path => {
            const url = `${B2_BASE_URL}/${path}`;
            return axios.get(url, { responseType: 'text' });
        });

        const responses = await Promise.all(playlistPromises);
        const playlists = responses.map(response => response.data);

        // 3. "Stitch" the playlists together
        const masterPlaylist = buildMasterPlaylist(playlists, playlistPaths);

        // 4. Send the final playlist to the client
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(masterPlaylist);

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(410).send('Playlist URL has expired. Please refresh.');
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).send('Invalid playlist token.');
        }
        console.error('Error serving HLS playlist:', error.message);
        res.status(500).send('Could not generate playlist');
    }
});


// --- Core Logic: The HLS "Stitcher" ---
function buildMasterPlaylist(playlists, playlistPaths) {
    let segments = [];
    let header = '';

    for (const [index, playlistText] of playlists.entries()) {
        const lines = playlistText.split('\n');

        // The HLS path (e.g., "audio/hls/article_1")
        const basePath = getBasePath(playlistPaths[index]);

        if (index === 0) {
            // Get the header from the *first* playlist
            header = lines.filter(line =>
                line.startsWith('#EXTM3U') ||
                line.startsWith('#EXT-X-VERSION') ||
                line.startsWith('#EXT-X-TARGETDURATION') ||
                line.startsWith('#EXT-X-PLAYLIST-TYPE') ||
                line.startsWith('#EXT-X-MEDIA-SEQUENCE')
            ).join('\n');
        }

        // Get all segments
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('#EXTINF:')) {
                const segmentInfo = line;
                const segmentFile = lines[i + 1]; // e.g., "seg_000.aac"

                if (segmentFile && !segmentFile.startsWith('#')) {
                    // IMPORTANT: Create an absolute B2 URL for the segment
                    const absoluteSegmentUrl = `${B2_BASE_URL}/${basePath}/${segmentFile}`;
                    segments.push(segmentInfo);
                    segments.push(absoluteSegmentUrl);
                    i++; // Skip the next line
                }
            }
        }
    }

    // Assemble the final playlist
    return [
        header,
        ...segments,
        '#EXT-X-ENDLIST'
    ].join('\n');
}

// Helper to get the "directory" of a playlist
// e.g., "audio/hls/article_1/index.m3u8" -> "audio/hls/article_1"
function getBasePath(playlistPath) {
    return playlistPath.substring(0, playlistPath.lastIndexOf('/'));
}

module.exports = router;