// server/authMiddleware.js
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.sub;
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

module.exports = { auth };
