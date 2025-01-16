const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');
const fileUpload = require('express-fileupload');

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 4000; // Võtab porta `.env` failist või kasutab vaikimisi 4000

// MariaDB ühenduse loomine
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MariaDB:', err);
        process.exit(1);
    }
    console.log('Connected to MariaDB');
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(fileUpload(undefined));

// Teeninda staatilised failid kaustast 'uploads'
app.use(express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// API, et saada taimede nimekiri
app.get('/plants', (req, res) => {
    const sql = 'SELECT * FROM plants';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).send('Database error');
        } else {
            res.json(results);
        }
    });
});

// Taime lisamise lõpp-punkt
app.post('/add-plant', (req, res) => {
    const {name, species, type, description} = req.body;

    if (!req.files || !req.files['plant-picture']) {
        console.error('No picture uploaded');
        return res.status(400).send('No picture uploaded.');
    }

    const file = req.files['plant-picture'];
    const uploadPath = path.join(__dirname, '../public/uploads/', file.name);

    file.mv(uploadPath, (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return res.status(500).send('Error uploading file');
        }

        const imageUrl = `/uploads/${file.name}`;
        const sql = `
            INSERT INTO plants (name, species, type, description, image_url)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(sql, [name, species, type, description, imageUrl], (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Error inserting plant data');
            }
            res.status(200).send('Plant added successfully');
        });
    });
});

app.get('/plants', (req, res) => {
    const sql = 'SELECT * FROM plants';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error fetching plants');
        }
        res.json(results);
    });
});
app.put('/plants/:id', (req, res) => {
    const {id} = req.params;
    const {name, species, type, description} = req.body;

    const sql = `
        UPDATE plants
        SET name        = ?,
            species     = ?,
            type        = ?,
            description = ?
        WHERE id = ?
    `;

    db.query(sql, [name, species, type, description, id], (err) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).send('Error updating plant');
        } else {
            res.status(200).send('Plant updated successfully');
        }
    });
});

// Käivita server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});