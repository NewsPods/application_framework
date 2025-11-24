const express = require('express');
const router = express.Router();
const { auth } = require('./authMiddleware');
const { pool } = require('./db'); // 👈 IMPORT POOL HERE

// POST /api/preferences
router.post('/', auth, async (req, res) => {
    const userId = req.userId;
    const { newspapers = [], sections = [], topics = [] } = req.body || {};

    // 1. Get a dedicated client for the transaction
    const client = await pool.connect(); // 👈 CHANGED: Use pool directly, not req.db.pool

    try {
        await client.query('BEGIN');

        // 1. Delete old (Fast)
        await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);

        // 2. Prepare Insert
        const allPrefs = [
            ...newspapers.map(v => ({ type: 'newspaper', value: v })),
            ...sections.map(v => ({ type: 'section', value: v })),
            ...topics.map(v => ({ type: 'topic', value: v })),
        ];

        if (allPrefs.length > 0) {
            const values = [];
            const placeholders = [];

            allPrefs.forEach((p, i) => {
                const base = i * 4;
                placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
                values.push(userId, p.type, p.value, 1.0);
            });

            const sql = `
                INSERT INTO user_preferences (user_id, preference_type, preference_value, score)
                VALUES ${placeholders.join(', ')}
            `;
            await client.query(sql, values);
        }

        await client.query('COMMIT');
        res.json({ success: true, count: allPrefs.length });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Save prefs error:', err);
        res.status(500).json({ success: false, error: 'Failed to save' });
    } finally {
        client.release();
    }
});


// GET /api/preferences
router.get('/', auth, async (req, res) => {
    try {
        // Use req.db.query here (simple query, no transaction needed)
        const { rows } = await req.db.query(
            'SELECT preference_id, preference_type, preference_value, score FROM user_preferences WHERE user_id = $1',
            [req.userId]
        );
        res.json({ success: true, preferences: rows });
    } catch (err) {
        console.error('Error fetching preferences:', err);
        res.status(500).json({ success: false, error: 'Server error fetching preferences' });
    }
});

module.exports = router;