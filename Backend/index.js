require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query } = require('./db');
const { authorizeB2 } = require('./b2-client');
const authRoutes = require('./authRoutes');
const preferencesRoutes = require('./preferencesRoutes');
const passwordResetRoutes = require('./passwordResetRoutes');
const articlesRoutes = require('./articlesRoutes');
const hlsRoutes = require('./hlsRoutes');

const app = express();

// reflect any origin + allow credentials (dev-wide-open)
const corsOptions = {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
};

app.use(cors(corsOptions));      // <-- handles preflight automatically in Express 5
// app.options('*', cors(corsOptions)); // ❌ remove this

app.use(express.json());

// attach db
app.use((req, _res, next) => { req.db = { query }; next(); });

// healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

app.use('/api/auth', passwordResetRoutes);

app.use('/api/preferences', preferencesRoutes);

app.use('/api/articles', articlesRoutes);

app.use('/api', hlsRoutes);

const port = process.env.PORT || 4000;
async function startServer() {
    try {
        await authorizeB2(); // <-- Authorize with B2
        app.listen(port, () => console.log(`auth API on :${port}`));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
