// server/db.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: '$ newspods_auth', // shows up in Cockroach
});

async function query(text, params) {
    return pool.query(text, params);
}

// Retry loop for SERIALIZABLE conflicts (SQLSTATE 40001)
async function runTx(fn, maxRetries = 5) {
    let attempt = 0;
    while (true) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await fn(client);
            await client.query('COMMIT');
            client.release();
            return result;
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch {}
            client.release();
            if (err && err.code === '40001' && attempt < maxRetries) {
                attempt++;
                const backoff = Math.floor((2 ** attempt) * 100 + Math.random() * 100);
                await new Promise(r => setTimeout(r, backoff));
                continue; // retry
            }
            throw err;
        }
    }
}

module.exports = { pool, query, runTx };
