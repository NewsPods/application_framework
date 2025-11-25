const express = require('express');
const router = express.Router();
const { auth } = require('./authMiddleware');

router.get('/feed', auth, async (req, res) => {
    const userId = req.userId;
    const TARGET_DATE = '2025-11-25';

    try {
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

        // CHANGED: Added 'a.word_timestamps' to the SELECT list
        const articlesSql = `
            SELECT DISTINCT ON (a.article_id)
                a.article_id,
                a.title,
                a.description,
                a.news_source,
                a.created_at,
                a.audio_duration_seconds,
                a.audio_key,
                a.word_timestamps,  -- 👈 NEW COLUMN
                (SELECT array_agg(s.news_section) FROM articles_sections s WHERE s.article_id = a.article_id) as sections
            FROM articles a
                LEFT JOIN articles_sections sec ON a.article_id = sec.article_id
            WHERE
                a.created_at::date = $1::date
              AND a.audio_key IS NOT NULL
        `;

        const { rows: allArticles } = await req.db.query(articlesSql, [TARGET_DATE]);

        // Helper to pass data through
        const processArticle = (a) => ({
            ...a,
            hlsPath: a.audio_key,
            // Ensure timestamps are parsed if they come as a string from DB driver
            word_timestamps: typeof a.word_timestamps === 'string' ? JSON.parse(a.word_timestamps) : a.word_timestamps
        });

        let dailyDigest = allArticles.filter(a => {
            if (mySources.length === 0 && mySections.length === 0) return true;
            const sourceMatch = mySources.includes(a.news_source);
            const sectionMatch = a.sections && a.sections.some(s => mySections.includes(s));
            return sourceMatch || sectionMatch;
        });
        dailyDigest = dailyDigest.map(processArticle);

        const shuffled = [...allArticles].sort(() => 0.5 - Math.random());
        const topNews = shuffled.slice(0, 4).map(processArticle);

        const sectionEpisodes = {};
        allArticles.forEach(a => {
            if (!a.sections) return;
            a.sections.forEach(sect => {
                if (mySections.length > 0 && !mySections.includes(sect)) return;
                if (!sectionEpisodes[sect]) sectionEpisodes[sect] = [];
                sectionEpisodes[sect].push(processArticle(a));
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