const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 4000; // Võtab porta `.env` failist või kasutab vaikimisi 4000

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Teeninda staatilised failid kaustast 'public'
app.use(express.static(path.join(__dirname, '../public')));

// API, et saada taimede nimekiri
app.get('/plants', (req, res) => {
    db.query('SELECT * FROM plants', (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            res.json(results);
        }
    });
});

// Käivita server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
