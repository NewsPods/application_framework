const express = require('express');
const router = express.Router();
const { auth } = require('./authMiddleware');

router.get('/feed', auth, async (req, res) => {
    const userId = req.userId;
    const TARGET_DATE = '2025-11-25'; // Hardcoded as requested

    try {
        // --- 1. Get User Preferences ---
        const prefSql = `
            SELECT
                array_agg(DISTINCT preference_value) FILTER (WHERE preference_type = 'newspaper') as my_sources,
                array_agg(DISTINCT preference_value) FILTER (WHERE preference_type = 'section') as my_sections
            FROM user_preferences
            WHERE user_id = $1
        `;
        const prefRes = await req.db.query(prefSql, [userId]);
        const prefs = prefRes.rows[0] || {};
        const mySources = prefs.my_sources || [];
        const mySections = prefs.my_sections || [];

        // --- 2. Fetch All Audio Articles for Date ---
        const articlesSql = `
            SELECT DISTINCT ON (a.article_id)
                a.article_id,
                a.title,
                a.description,
                a.news_source,
                a.created_at,
                a.audio_duration_seconds,
                a.audio_file_name, -- This contains "audio/hls/.../index.m3u8"
                (SELECT array_agg(s.news_section) FROM articles_sections s WHERE s.article_id = a.article_id) as sections
            FROM articles a
            LEFT JOIN articles_sections sec ON a.article_id = sec.article_id
            WHERE 
                a.created_at::date = $1::date 
                AND a.audio_file_name IS NOT NULL
        `;

        const { rows: allArticles } = await req.db.query(articlesSql, [TARGET_DATE]);

        // --- 3. Process Data ---

        // Helper to ensure we don't pass null paths
        const getPath = (a) => a.audio_file_name || null;

        // A. Daily Digest (Preference Match)
        let dailyDigest = allArticles.filter(a => {
            if (mySources.length === 0 && mySections.length === 0) return true;
            const sourceMatch = mySources.includes(a.news_source);
            const sectionMatch = a.sections && a.sections.some(s => mySections.includes(s));
            return sourceMatch || sectionMatch;
        });

        // Map to include hlsPath (DIRECTLY from DB now)
        dailyDigest = dailyDigest.map(a => ({ ...a, hlsPath: getPath(a) }));

        // B. Top News (Random 4)
        const shuffled = [...allArticles].sort(() => 0.5 - Math.random());
        const topNews = shuffled.slice(0, 4).map(a => ({ ...a, hlsPath: getPath(a) }));

        // C. Section Episodes
        const sectionEpisodes = {};

        allArticles.forEach(a => {
            if (!a.sections) return;
            a.sections.forEach(sect => {
                if (mySections.length > 0 && !mySections.includes(sect)) return;
                if (!sectionEpisodes[sect]) sectionEpisodes[sect] = [];
                // Use DB value directly
                sectionEpisodes[sect].push({ ...a, hlsPath: getPath(a) });
            });
        });

        const sectionsList = Object.entries(sectionEpisodes).map(([section, arts]) => ({
            id: `sec-${section}`,
            title: `${section} Briefing`,
            section: section,
            articleCount: arts.length,
            duration: arts.reduce((sum, item) => sum + (item.audio_duration_seconds || 0), 0),
            articles: arts
        })).filter(s => s.articleCount > 0);

        res.json({
            date: TARGET_DATE,
            dailyDigest,
            topNews,
            sections: sectionsList
        });

    } catch (e) {
        console.error('Home feed error:', e);
        res.status(500).json({ error: 'Server error fetching feed' });
    }
});

module.exports = router;