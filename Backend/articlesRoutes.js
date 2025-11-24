const express = require('express');
const router = express.Router();
const { auth } = require('./authMiddleware');

/**
 * GET /api/articles/search
 * Optimized to exclude heavy columns like 'embedding' or 'full_text'.
 */
router.get('/search', auth, async (req, res) => {
    try {
        const sections = (req.query.sections || '').split(',').filter(Boolean);
        const sources  = (req.query.sources  || '').split(',').filter(Boolean);

        // Pagination logic (Defaults to latest 50)
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        // Default Date Range: If not provided, we don't restrict (we just order by DESC)
        // This is faster than calculating ISODates unless specific dates are requested.
        const { startUtc, endUtc } = req.query;

        const params = [];
        let paramIdx = 1;

        const whereClauses = [];

        // 1. Date Filter (Optional)
        if (startUtc) {
            whereClauses.push(`a.created_at >= $${paramIdx++}`);
            params.push(startUtc);
        }
        if (endUtc) {
            whereClauses.push(`a.created_at < $${paramIdx++}`);
            params.push(endUtc);
        }

        // 2. Source Filter
        if (sources.length > 0) {
            whereClauses.push(`a.news_source = ANY($${paramIdx++})`);
            params.push(sources);
        }

        // 3. Section Filter (Requires Join)
        // We use EXISTS because we only care if the article HAS the section, 
        // we don't need to join the row multiple times. This is much faster.
        if (sections.length > 0) {
            whereClauses.push(`EXISTS (
                SELECT 1 FROM articles_sections s 
                WHERE s.article_id = a.article_id 
                AND s.news_section = ANY($${paramIdx++})
            )`);
            params.push(sections);
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 4. The Optimized Query
        // note: array_agg is expensive. If you just need the primary section, 
        // storing it on the articles table as 'primary_section' is 10x faster.
        // Assuming we need the list, we subquery it efficiently.
        const sql = `
            SELECT 
                a.article_id,
                a.title,
                a.description, -- make sure this isn't the full 5000 word text
                a.news_source,
                a.created_at,
                a.audio_duration_seconds,
                a.audio_file_name,
                (
                    SELECT array_agg(s.news_section)
                    FROM articles_sections s
                    WHERE s.article_id = a.article_id
                ) as sections
            FROM articles a
            ${whereSQL}
            ORDER BY a.created_at DESC
            LIMIT $${paramIdx++} OFFSET $${paramIdx++}
        `;

        params.push(limit, offset);

        const { rows } = await req.db.query(sql, params);

        // Cache for 60 seconds on the client to prevent rapid re-fetching
        res.set('Cache-Control', 'public, max-age=60');
        res.json(rows);

    } catch (e) {
        console.error('GET /api/articles/search error:', e);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;