// server/passwordResetRoutes.js
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend'); // 👈 Import Resend

const router = express.Router();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// --- util: base64url encode w/out +/ / = (URL-safe)
function toBase64Url(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- generate a high-entropy, single-use token
function generateToken() {
    return toBase64Url(crypto.randomBytes(32));
}

// --- stable SHA-256 for server-side storage
function hashToken(token) {
    return crypto.createHash('sha256').update(token, 'utf8').digest();
}

// --- CONSTANTS
const TOKEN_TTL_MINUTES = 30;

// --- Helper: Send Email via Resend (HTTP API) ---
async function sendResetEmail({ to, resetLink }) {
    console.log('🔗 [DEV BACKUP] Password Reset Link:', resetLink); // 👈 Guaranteed way to see link in Render Logs

    // If no API key, stop here (dev mode)
    if (!process.env.RESEND_API_KEY) {
        console.log('⚠️ No RESEND_API_KEY found. Using console logs only.');
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'NewsPods <support@amoghgoyal.online>', // 👈 Resend Free Tier MUST use this sender
            to: [to], // 👈 In Free Tier, you can only send to YOUR OWN email (the one you signed up with)
            subject: 'Reset your NewsPods password',
            html: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>Click the button below to reset your password. Valid for 30 minutes.</p>
                <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">If you didn't request this, ignore this email.</p>
            </div>
            `
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
        } else {
            console.log('✅ Email sent via Resend:', data.id);
        }
    } catch (err) {
        console.error('❌ Failed to send email:', err);
    }
}

// --- ROUTES ---

// 1. Bouncer (Deep Link Redirection)
router.get('/password-reset/bouncer', (req, res) => {
    const token = req.query.token;
    const deepLink = `newspods://reset?token=${token}`;

    const html = `
      <html>
        <body style="background-color: #fdfbf7; font-family: serif; text-align: center; padding-top: 50px;">
          <h2>Opening NewsPods...</h2>
          <p>If the app doesn't open, <a href="${deepLink}">click here</a>.</p>
          <script>
            window.location.href = "${deepLink}";
          </script>
        </body>
      </html>
    `;
    res.send(html);
});

// 2. Request Reset Link
router.post('/password-reset/request', async (req, res) => {
    try {
        const email = (req.body?.email || '').trim().toLowerCase();
        const generic = { success: true, message: 'If that email exists, we\'ve sent reset instructions.' };

        if (!email) return res.json(generic);

        const { rows } = await req.db.query(
            `SELECT user_id, email FROM users WHERE email = $1 LIMIT 1`,
            [email]
        );
        const user = rows[0];
        if (!user) {
            // Log for debugging, but don't tell client
            console.log(`⚠️ Password reset requested for non-existent email: ${email}`);
            return res.json(generic);
        }

        const token = generateToken();
        const tokenHash = hashToken(token);

        await req.db.query(
            `INSERT INTO password_resets (user_id, token_hash, requested_at, ip, user_agent)
             VALUES ($1, $2, now(), $3, $4)`,
            [user.user_id, tokenHash, req.ip, req.headers['user-agent'] || null]
        );

        const appUrl = process.env.VITE_API_URL || `${req.protocol}://${req.get('host')}`;
        // Ensure we point to the API route, not just the base domain
        const baseUrl = appUrl.endsWith('/api') ? appUrl : `${appUrl}/api`;

        const resetLink = `${baseUrl}/auth/password-reset/bouncer?token=${encodeURIComponent(token)}`;

        // Send (or log)
        await sendResetEmail({ to: user.email, resetLink });

        return res.json(generic);
    } catch (err) {
        console.error('password-reset/request error:', err);
        return res.json({ success: true, message: 'If that email exists, we\'ve sent reset instructions.' });
    }
});

// 3. Validate Token
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

        const expiresAt = new Date(new Date(row.requested_at).getTime() + TOKEN_TTL_MINUTES * 60 * 1000);
        if (row.used_at || new Date() > expiresAt) {
            return res.status(400).json({ success: false, error: 'Invalid or expired token' });
        }

        const masked = row.email.replace(/^(.).+(@.+)$/, (_, a, b) => a + '***' + b);
        return res.json({ success: true, email_masked: masked });
    } catch (err) {
        console.error('password-reset/validate error:', err);
        return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
});

// 4. Confirm Reset
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

        const same = await bcrypt.compare(new_password, row.password_hash);
        if (same) {
            return res.status(400).json({ success: false, error: 'New password cannot be same as old password' });
        }

        const newHash = await bcrypt.hash(new_password, 12);
        await req.db.query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [newHash, row.user_id]);
        await req.db.query(`UPDATE password_resets SET used_at = now() WHERE token_hash = $1`, [tokenHash]);

        return res.json({ success: true });
    } catch (err) {
        console.error('password-reset/confirm error:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;