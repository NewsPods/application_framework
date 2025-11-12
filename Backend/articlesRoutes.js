// server/articlesRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('./authMiddleware');

/**
 * GET /api/articles/search
 * Query params (all optional):
 *   sections=Politics,Sports        (comma-separated)
 *   sources=The%20Guardian,Reuters  (comma-separated)
 *   startUtc=ISO8601
 *   endUtc=ISO8601
 *
 * Notes:
 * - Uses articles_sections (article_id, news_section) for section filter.
 * - Returns DISTINCT articles (handles multi-section → same article).
 * - Aggregates all sections per article into `sections` (STRING[]).
 * - Defaults to "today IST" window if startUtc/endUtc not provided.
 */
router.get('/search', auth, async (req, res) => {
    try {
        const sections = (req.query.sections || '').split(',').filter(Boolean);
        const sources  = (req.query.sources  || '').split(',').filter(Boolean);

        // If client didn’t send bounds, compute “today” in IST (UTC+5:30)
        let { startUtc, endUtc } = req.query;
        if (!startUtc || !endUtc) {
            const now = new Date();
            const utcMs = now.getTime() - 330 * 60 * 1000; // shift -5:30
            const d = new Date(utcMs);
            const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
            const s = new Date(Date.UTC(y, m, day, 18, 30));     // 00:00 IST
            const e = new Date(Date.UTC(y, m, day + 1, 18, 30)); // 24:00 IST
            startUtc = s.toISOString();
            endUtc   = e.toISOString();
        }

        const params = [startUtc, endUtc];
        let i = params.length;

        // If sections provided, join to articles_sections with ANY($array)
        const joinClause = sections.length
            ? `JOIN public.articles_sections sec
           ON sec.article_id = a.article_id
          AND sec.news_section = ANY($${++i})`
            : '';

        const where = [
            `a.created_at >= $1`,
            `a.created_at <  $2`,
            sources.length ? `a.news_source = ANY($${++i})` : null,
        ].filter(Boolean).join(' AND ');

        const sql = `
      WITH base AS (
        SELECT a.article_id,
               a.title,
               a.description,
               a.news_source,
               a.created_at,
               a.audio_duration_seconds,
               a.audio_file_name
        FROM public.articles a
        ${joinClause}
        WHERE ${where}
      ),
      with_sections AS (
        SELECT b.*,
               COALESCE(
                 (SELECT array_agg(DISTINCT s2.news_section)
                    FROM public.articles_sections s2
                   WHERE s2.article_id = b.article_id),
                 ARRAY[]::STRING[]
               ) AS sections
        FROM base b
      )
      SELECT DISTINCT ON (article_id)
             article_id,
             title,
             description,
             news_source,
             sections,
             created_at,
             audio_duration_seconds,
             audio_file_name
      FROM with_sections
      ORDER BY article_id, created_at DESC
      LIMIT 200
    `;

        const finalParams = [...params];
        if (sections.length) finalParams.push(sections);
        if (sources.length)  finalParams.push(sources);

        const { rows } = await req.db.query(sql, finalParams);
        res.json(rows);
    } catch (e) {
        console.error('GET /api/articles/search error:', e);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
