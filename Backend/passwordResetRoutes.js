// server/passwordResetRoutes.js
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const router = express.Router();

// --- util: base64url encode w/out +/ / = (URL-safe)
function toBase64Url(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- generate a high-entropy, single-use token
function generateToken() {
    return toBase64Url(crypto.randomBytes(32)); // 256-bit random; URL-safe
}

// --- stable SHA-256 for server-side storage (do NOT store raw token)
function hashToken(token) {
    return crypto.createHash('sha256').update(token, 'utf8').digest();
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
// --- minimal mailer abstraction (fill in later)
async function sendResetEmail({ to, resetLink }) {
    const subject = 'Reset your Newspods password';
    const html = `
    <p>We received a request to reset your Newspods password.</p>
    <p><a href="${resetLink}" target="_blank" rel="noopener">Reset your password</a></p>
    <p>This link expires in 30 minutes. If you didn’t request this, you can ignore this email.</p>
  `;
    const text =
        `We received a request to reset your Newspods password.
Reset link: ${resetLink}
This link expires in 30 minutes. If you didn’t request this, you can ignore this email.`;

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        text,
        html
    });

    if (process.env.NODE_ENV !== 'production') {
        console.log('Reset email sent:', info.messageId);
    }
}

// --- CONSTANTS
const TOKEN_TTL_MINUTES = 30;

// Request a reset link (generic response to prevent user enumeration)
router.post('/password-reset/request', async (req, res) => {
    try {
        const email = (req.body?.email || '').trim().toLowerCase();
        // Always respond generically, per OWASP (avoid user enumeration).
        const generic = { success: true, message: 'If that email exists, we\'ve sent reset instructions.' };

        if (!email) return res.json(generic);

        // Look up user silently
        const { rows } = await req.db.query(
            `SELECT user_id, email FROM users WHERE email = $1 LIMIT 1`,
            [email]
        );
        const user = rows[0];
        if (!user) return res.json(generic);

        // Create token + store the hash
        const token = generateToken();
        const tokenHash = hashToken(token);

        await req.db.query(
            `INSERT INTO password_resets (user_id, token_hash, requested_at, ip, user_agent)
       VALUES ($1, $2, now(), $3, $4)`,
            [user.user_id, tokenHash, req.ip, req.headers['user-agent'] || null]
        );

        // Build reset link using a trusted base URL (DON'T trust Host header)
        const appUrl = process.env.APP_URL; // e.g. https://yourdomain.com
        const resetLink = `${appUrl.replace(/\/$/, '')}/reset?token=${encodeURIComponent(token)}`;

        await sendResetEmail({ to: user.email, resetLink });

        return res.json(generic);
    } catch (err) {
        console.error('password-reset/request error:', err);
        // Still return generic message to avoid enumeration
        return res.json({ success: true, message: 'If that email exists, we\'ve sent reset instructions.' });
    }
});

// Validate token before showing reset UI
router.get('/password-reset/validate', async (req, res) => {
    try {
        const token = (req.query?.token || '').trim();
        if (!token) return res.status(400).json({ success: false, error: 'Missing token' });

        const tokenHash = hashToken(token);
        const { rows } = await req.db.query(
            `SELECT pr.user_id, u.email, pr.requested_at, pr.used_at
       FROM password_resets pr
       JOIN users u ON u.user_id = pr.user_id
       WHERE pr.token_hash = $1
       LIMIT 1`,
            [tokenHash]
        );
        const row = rows[0];
        if (!row) return res.status(400).json({ success: false, error: 'Invalid or expired token' });

        // Ensure not used and not past TTL window (defense-in-depth against eventual TTL)
        const expiresAt = new Date(new Date(row.requested_at).getTime() + TOKEN_TTL_MINUTES * 60 * 1000);
        if (row.used_at || new Date() > expiresAt) {
            return res.status(400).json({ success: false, error: 'Invalid or expired token' });
        }

        // OK — you can optionally return a masked email
        const masked = row.email.replace(/^(.).+(@.+)$/, (_, a, b) => a + '***' + b);
        return res.json({ success: true, email_masked: masked });
    } catch (err) {
        console.error('password-reset/validate error:', err);
        return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
});

// Confirm reset (set new password, mark token used)
router.post('/password-reset/confirm', async (req, res) => {
    try {
        const { token, new_password } = req.body || {};
        if (!token || !new_password) {
            return res.status(400).json({ success: false, error: 'Missing fields' });
        }

        const tokenHash = hashToken(token);
        const { rows } = await req.db.query(
            `SELECT pr.user_id, pr.requested_at, pr.used_at, u.password_hash
       FROM password_resets pr
       JOIN users u ON u.user_id = pr.user_id
       WHERE pr.token_hash = $1
       LIMIT 1`,
            [tokenHash]
        );
        const row = rows[0];
        if (!row) return res.status(400).json({ success: false, error: 'Invalid or expired token' });

        const expiresAt = new Date(new Date(row.requested_at).getTime() + TOKEN_TTL_MINUTES * 60 * 1000);
        if (row.used_at || new Date() > expiresAt) {
            return res.status(400).json({ success: false, error: 'Invalid or expired token' });
        }

        // Reject if new password equals current (compare against existing hash)
        const same = await bcrypt.compare(new_password, row.password_hash);
        if (same) {
            return res.status(400).json({ success: false, error: 'New password cannot be same as old password' });
        }

        // Update password
        const newHash = await bcrypt.hash(new_password, 12);
        await req.db.query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [newHash, row.user_id]);

        // Mark token as used (prevents reuse)
        await req.db.query(`UPDATE password_resets SET used_at = now() WHERE token_hash = $1`, [tokenHash]);

        // (Recommended) Invalidate existing sessions/tokens here if you maintain a session store.

        return res.json({ success: true });
    } catch (err) {
        console.error('password-reset/confirm error:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
