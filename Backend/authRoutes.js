// server/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { auth } = require('./authMiddleware');

router.post('/signup', async (req, res) => {
    const { first_name, last_name, email, username, password } = req.body || {};
    console.log('Signup request body:', req.body);

    if (!email || !username || !password) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    try {
        const hash = await bcrypt.hash(password, 12);
        console.log('✅ Password hashed');

        const { rows } = await req.db.query(
            `INSERT INTO users (first_name, last_name, email, username, password_hash)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING user_id, first_name, last_name, email, username, created_at`,
            [first_name || null, last_name || null, email, username, hash]
        );

        console.log('✅ DB insert success, returned:', rows);
        const user = rows[0];
        const token = jwt.sign({ sub: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        console.log('✅ JWT created');
        res.json({ success: true, user, token });
    } catch (err) {
        console.error('❌ Signup error:', err);
        if (err.code === '23505') {
            return res.status(409).json({ success: false, error: 'Email or username already in use' });
        }
        res.status(500).json({ success: false, error: 'Server error' });
    }
});


router.post('/login', async (req, res) => {
    const { identifier, password } = req.body || {};
    const { rows } = await req.db.query(
        `SELECT user_id, first_name, last_name, email, username, password_hash, created_at
     FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
        [identifier]
    );
    const u = rows[0];
    if (!u) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    delete u.password_hash;
    const token = jwt.sign({ sub: u.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user: u, token });
});

router.get('/me', auth, async (req, res) => {
    const { rows } = await req.db.query(
        `SELECT user_id, first_name, last_name, email, username, created_at
     FROM users WHERE user_id = $1`,
        [req.userId]
    );
    res.json({ user: rows[0] || null });
});

router.post('/change-username', auth, async (req, res) => {
    const { username } = req.body || {};
    try {
        const { rows } = await req.db.query(
            `UPDATE users SET username = $1 WHERE user_id = $2
       RETURNING user_id, first_name, last_name, email, username, created_at`,
            [username, req.userId]
        );
        res.json({ success: true, user: rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, error: 'Username taken' });
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

router.post('/change-password', auth, async (req, res) => {
    const { old_password, new_password } = req.body || {};
    const { rows } = await req.db.query(
        `SELECT password_hash FROM users WHERE user_id = $1`, [req.userId]
    );
    const ok = rows[0] && await bcrypt.compare(old_password, rows[0].password_hash);
    if (!ok) return res.status(400).json({ success: false, error: 'Old password incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    await req.db.query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [hash, req.userId]);
    res.json({ success: true });
});

router.delete('/delete', auth, async (req, res) => {
    const { password } = req.body || {};
    const { rows } = await req.db.query(
        `SELECT password_hash FROM users WHERE user_id = $1`, [req.userId]
    );
    const ok = rows[0] && await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(400).json({ success: false, error: 'Password incorrect' });

    await req.db.query(`DELETE FROM users WHERE user_id = $1`, [req.userId]);
    res.json({ success: true });
});

module.exports = router;
