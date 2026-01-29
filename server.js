require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- 1. Middleware ---
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- 2. Rate Limiting ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: "Too many requests, please try again later." }
});
app.use('/api', limiter);

// --- 3. Database Connection ---
const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('?')[0] : '';
const pool = mysql.createPool({
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: { rejectUnauthorized: false }
});

// Keep-Alive Loop
setInterval(() => {
    pool.query('SELECT 1', (err) => {
        if (err) console.error('⚠️ Keep-alive ping failed:', err.message);
    });
}, 60000); 

// --- 4. Routes ---

// A. Home Check
app.get('/', (req, res) => res.send('Likith Portfolio Backend is Live & Stable! 🚀'));

// B. (NEW) The Secret Admin Route 🕵️‍♂️
app.get('/api/messages', (req, res) => {
    const secretKey = req.query.secret; // We look for ?secret=... in the URL

    // 🔒 SECURITY CHECK: Only allow if password matches
    if (secretKey !== "likith_god_mode_2026") { 
        return res.status(401).json({ error: "⛔ ACCESS DENIED: Invalid Security Protocol" });
    }

    // If password is correct, fetch all data
    const sql = 'SELECT * FROM contact_messages ORDER BY created_at DESC';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Fetch Error:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results); // Send the data back to the frontend
    });
});

// C. The Contact Form Route
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const sql = 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)';
    pool.execute(sql, [name, email, message], (err, result) => {
        if (err) {
            console.error("❌ Insert Error:", err);
            return res.status(500).json({ error: 'Failed to save message' });
        }
        res.json({ success: true, message: 'Message Saved to Cloud!' });
    });
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
