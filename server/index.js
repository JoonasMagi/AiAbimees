const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
