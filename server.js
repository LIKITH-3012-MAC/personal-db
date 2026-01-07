require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Create the connection using the Aiven URL
const connection = mysql.createConnection(process.env.DATABASE_URL);

connection.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to Aiven Cloud Database');
});

app.get('/', (req, res) => res.send('Likith Portfolio Backend is Live! 🚀'));

app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    // Prevent empty submissions
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)';
    connection.query(sql, [name, email, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to save message' });
        }
        res.json({ success: true, message: 'Message Saved to Cloud!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
