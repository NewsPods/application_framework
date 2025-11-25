const express = require('express');
const router = express.Router();
const { auth } = require('./authMiddleware');

// Helper: Construct HLS path from DB filename
const getHlsPath = (fileName) => {
    if (!fileName) return null;
    // Clean extension if present
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    return `audio/hls/${cleanName}/index.m3u8`;
};

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
        // We fetch all candidate articles once, then sort/filter in memory or SQL
        // This is often faster than 3 separate complex queries on CRDB for moderate datasets
        const articlesSql = `
            SELECT DISTINCT ON (a.article_id)
                a.article_id,
                a.title,
                a.description,
                a.news_source,
                a.created_at,
                a.audio_duration_seconds,
                a.audio_file_name,
                (SELECT array_agg(s.news_section) FROM articles_sections s WHERE s.article_id = a.article_id) as sections
            FROM articles a
            LEFT JOIN articles_sections sec ON a.article_id = sec.article_id
            WHERE 
                a.created_at::date = $1::date 
                AND a.audio_file_name IS NOT NULL
        `;

        const { rows: allArticles } = await req.db.query(articlesSql, [TARGET_DATE]);

        // --- 3. Process Data in Node.js ---

        // A. Daily Digest (Preference Match)
        // Logic: Matches User Source OR User Section
        let dailyDigest = allArticles.filter(a => {
            // If no prefs, return everything
            if (mySources.length === 0 && mySections.length === 0) return true;

            const sourceMatch = mySources.includes(a.news_source);
            const sectionMatch = a.sections && a.sections.some(s => mySections.includes(s));
            return sourceMatch || sectionMatch;
        });

        // Add HLS paths
        dailyDigest = dailyDigest.map(a => ({ ...a, hlsPath: getHlsPath(a.audio_file_name) }));

        // B. Top News (Random 4 from the same date)
        // We shuffle the 'allArticles' array
        const shuffled = [...allArticles].sort(() => 0.5 - Math.random());
        const topNews = shuffled.slice(0, 4).map(a => ({ ...a, hlsPath: getHlsPath(a.audio_file_name) }));

        // C. Section Episodes (Group by Section)
        // Only sections the user likes, AND only if articles exist for them
        const sectionEpisodes = {};

        allArticles.forEach(a => {
            if (!a.sections) return;
            a.sections.forEach(sect => {
                // Only include if it's a preferred section (or if user has no prefs, include all)
                if (mySections.length > 0 && !mySections.includes(sect)) return;

                if (!sectionEpisodes[sect]) sectionEpisodes[sect] = [];
                sectionEpisodes[sect].push({ ...a, hlsPath: getHlsPath(a.audio_file_name) });
            });
        });

        // Format section episodes for frontend
        const sectionsList = Object.entries(sectionEpisodes).map(([section, arts]) => ({
            id: `sec-${section}`,
            title: `${section} Briefing`,
            section: section,
            articleCount: arts.length,
            duration: arts.reduce((sum, item) => sum + (item.audio_duration_seconds || 0), 0),
            articles: arts
        })).filter(s => s.articleCount > 0); // Only sections with content

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