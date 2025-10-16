// server/preferencesRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('./authMiddleware'); // we'll extract auth next

// POST /api/preferences
// Expected body: { newspapers: [...], sections: [...], topics: [...] }
router.post('/', auth, async (req, res) => {
    console.log('📥 Received POST /api/preferences');
    console.log('Headers:', req.headers.authorization);
    console.log('Body:', req.body);

    const userId = req.userId;
    const { newspapers = [], sections = [], topics = [] } = req.body || {};

    try {
        await req.db.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
        console.log('🧹 Deleted old preferences for user', userId);

        const allPrefs = [
            ...newspapers.map(v => ({ type: 'newspaper', value: v })),
            ...sections.map(v => ({ type: 'section', value: v })),
            ...topics.map(v => ({ type: 'topic', value: v })),
        ];

        if (allPrefs.length === 0) {
            console.log('No preferences provided');
            return res.json({ success: true, inserted: 0 });
        }

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
                RETURNING preference_id
        `;

        const { rows } = await req.db.query(sql, values);
        console.log('✅ Inserted preferences count:', rows.length);
        res.json({ success: true, inserted: rows.length });
    } catch (err) {
        console.error('❌ Error saving preferences:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});


// GET /api/preferences
router.get('/', auth, async (req, res) => {
    try {
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
