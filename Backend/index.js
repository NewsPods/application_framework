require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query } = require('./db');
const authRoutes = require('./authRoutes');
const preferencesRoutes = require('./preferencesRoutes');
const passwordResetRoutes = require('./passwordResetRoutes');
const articlesRoutes = require('./articlesRoutes');

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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`auth API on :${port}`));
