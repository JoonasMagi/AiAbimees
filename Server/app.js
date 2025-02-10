
// Import required modules
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const fileUpload = require('express-fileupload');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const csrf = require('csrf');

// Initialize express app
const app = express();

// Initialize CSRF tokens
const tokens = new csrf();

// Define root directory (parent of server folder)
const ROOT_DIR = path.join(__dirname, '..');

// Load environment variables
require('dotenv').config();

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: { message: 'Too many login attempts, please try again later' }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:"]
        }
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(ROOT_DIR, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true, // Changed to true
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Only use secure in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// File upload configuration
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    abortOnLimit: true,
    createParentPath: true,
    responseOnLimit: 'File size exceeded',
    safeFileNames: true,
    useTempFiles: true,
    tempFileDir: path.join(ROOT_DIR, 'tmp')
}));

// CSRF Protection Middleware
app.use((req, res, next) => {
    // Skip CSRF for login/signup routes
    if (req.path === '/signin' || req.path === '/signup') {
        return next();
    }

    // Ensure session exists
    if (!req.session) {
        return next(new Error('Session not found'));
    }

    // Create new secret if one doesn't exist
    if (!req.session.csrfSecret) {
        req.session.csrfSecret = tokens.secretSync();
    }

    // Create token
    const token = tokens.create(req.session.csrfSecret);

    // Set token in cookie
    res.cookie('XSRF-TOKEN', token, {
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        path: '/'
    });

    // Make token available to views
    res.locals.csrfToken = token;
    next();
});

// CSRF Validation Middleware
const validateCSRF = (req, res, next) => {
    // Skip CSRF for login/signup routes
    if (req.path === '/signin' || req.path === '/signup') {
        return next();
    }

    // Skip for GET/HEAD/OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const token = req.headers['x-xsrf-token'] ||
        req.headers['x-csrf-token'] ||
        req.body._csrf ||
        req.query._csrf;

    if (!token || !req.session.csrfSecret) {
        console.error('CSRF validation failed:', {
            hasToken: !!token,
            hasSecret: !!req.session.csrfSecret,
            path: req.path
        });
        return res.status(403).json({ message: 'Invalid CSRF token' });
    }

    if (!tokens.verify(req.session.csrfSecret, token)) {
        console.error('CSRF token verification failed');
        return res.status(403).json({ message: 'Invalid CSRF token' });
    }

    next();
};

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// Apply CSRF validation to specific routes
app.use('/api', validateCSRF);
app.use('/logout', validateCSRF);

// Authentication Routes
app.post('/signup', [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 8 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

app.post('/signin', authLimiter, [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = { id: user.user_id, username: user.username };
        res.json({ message: 'Signed in successfully' });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ message: 'Server error during signin' });
    }
});

app.post('/logout', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Plant API Routes
app.get('/api/plants', requireAuth, async (req, res) => {
    try {
        const [plants] = await pool.query(`
            SELECT up.user_plant_id,
                   up.planting_time,
                   up.est_cropping,
                   up.photo_url,
                   ap.plant_cultivar,
                   ap.plant_species
            FROM user_plants up
                     JOIN all_plants ap ON up.plant_id = ap.plant_id
            WHERE up.user_id = ?
              AND up.is_deleted = 0
        `, [req.session.user.id]);

        const formattedPlants = plants.map(plant => ({
            id: plant.user_plant_id,
            name: plant.plant_cultivar,
            species: plant.plant_species,
            plantingTime: plant.planting_time,
            estCropping: plant.est_cropping,
            photoUrl: plant.photo_url || null
        }));

        res.json(formattedPlants);
    } catch (error) {
        console.error('Error fetching plants:', error);
        res.status(500).json({ message: 'Error fetching plants' });
    }
});

app.post('/api/plants', requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { plant_cultivar, plant_species, planting_time, est_cropping } = req.body;

    if (!plant_cultivar || !plant_species || !planting_time) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    let photoUrl = null;
    if (req.files && req.files.photo) {
        const uploadedPhoto = req.files.photo;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!allowedTypes.includes(uploadedPhoto.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        const fileName = `${Date.now()}-${uploadedPhoto.name}`;
        const uploadPath = path.join(ROOT_DIR, 'public/uploads/', fileName);

        try {
            await uploadedPhoto.mv(uploadPath);
            photoUrl = `/uploads/${fileName}`;
        } catch (err) {
            console.error('Photo upload error:', err);
            return res.status(500).json({ message: 'Photo upload failed' });
        }
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let insertPlantResult;
        const [existingPlants] = await connection.query(
            'SELECT plant_id FROM all_plants WHERE plant_cultivar = ? AND plant_species = ? AND is_deleted = 0',
            [plant_cultivar, plant_species]
        );

        if (existingPlants.length > 0) {
            insertPlantResult = existingPlants[0];
        } else {
            const [newPlantResult] = await connection.query(
                'INSERT INTO all_plants (plant_cultivar, plant_species) VALUES (?, ?)',
                [plant_cultivar, plant_species]
            );
            insertPlantResult = { plant_id: newPlantResult.insertId };
        }

        const [userPlantResult] = await connection.query(
            'INSERT INTO user_plants (user_id, plant_id, planting_time, est_cropping, photo_url) VALUES (?, ?, ?, ?, ?)',
            [userId, insertPlantResult.plant_id, planting_time, est_cropping || null, photoUrl]
        );

        await connection.commit();

        const [newPlant] = await connection.query(`
            SELECT
                up.user_plant_id as id,
                ap.plant_cultivar as name,
                ap.plant_species as species,
                up.planting_time as plantingTime,
                up.est_cropping as estCropping,
                up.photo_url as photoUrl
            FROM user_plants up
                     JOIN all_plants ap ON up.plant_id = ap.plant_id
            WHERE up.user_plant_id = ?
        `, [userPlantResult.insertId]);

        res.status(201).json({
            message: 'Plant added successfully',
            plant: newPlant[0]
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Add plant error:', error);
        res.status(500).json({ message: 'Error adding plant' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

app.delete('/api/plants/:id', requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const plantId = req.params.id;

    try {
        const [result] = await pool.query(
            'UPDATE user_plants SET is_deleted = 1 WHERE user_plant_id = ? AND user_id = ?',
            [plantId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }

        res.json({ message: 'Plant deleted successfully' });
    } catch (error) {
        console.error('Delete plant error:', error);
        res.status(500).json({ message: 'Error deleting plant' });
    }
});

app.put('/api/plants/:id', requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const plantId = req.params.id;
    const { plant_cultivar, plant_species, planting_time, est_cropping } = req.body;

    if (!plant_cultivar || !plant_species || !planting_time) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    let photoUrl = null;
    if (req.files && req.files.photo) {
        const uploadedPhoto = req.files.photo;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!allowedTypes.includes(uploadedPhoto.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        const fileName = `${Date.now()}-${uploadedPhoto.name}`;
        const uploadPath = path.join(ROOT_DIR, 'public/uploads/', fileName);

        try {
            await uploadedPhoto.mv(uploadPath);
            photoUrl = `/uploads/${fileName}`;
        } catch (err) {
            console.error('Photo upload error:', err);
            return res.status(500).json({ message: 'Photo upload failed' });
        }
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // First verify the plant belongs to the user
        const [existingPlant] = await connection.query(
            'SELECT up.*, ap.plant_cultivar, ap.plant_species FROM user_plants up JOIN all_plants ap ON up.plant_id = ap.plant_id WHERE up.user_plant_id = ? AND up.user_id = ? AND up.is_deleted = 0',
            [plantId, userId]
        );

        if (existingPlant.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }

        // Update or create plant in all_plants
        let plantTypeId;
        const [existingPlantType] = await connection.query(
            'SELECT plant_id FROM all_plants WHERE plant_cultivar = ? AND plant_species = ? AND is_deleted = 0',
            [plant_cultivar, plant_species]
        );

        if (existingPlantType.length > 0) {
            plantTypeId = existingPlantType[0].plant_id;
        } else {
            const [newPlantType] = await connection.query(
                'INSERT INTO all_plants (plant_cultivar, plant_species) VALUES (?, ?)',
                [plant_cultivar, plant_species]
            );
            plantTypeId = newPlantType.insertId;
        }

        // Update the user_plants record
        const updateData = {
            plant_id: plantTypeId,
            planting_time,
            est_cropping: est_cropping || null,
            ...(photoUrl && { photo_url: photoUrl })
        };

        const updateFields = Object.entries(updateData)
            .map(([key]) => `${key} = ?`)
            .join(', ');
        const updateValues = [...Object.values(updateData), plantId, userId];

        await connection.query(
            `UPDATE user_plants SET ${updateFields} WHERE user_plant_id = ? AND user_id = ?`,
            updateValues
        );

        await connection.commit();

        // Fetch the updated plant data
        const [updatedPlant] = await connection.query(`
            SELECT
                up.user_plant_id as id,
                ap.plant_cultivar as name,
                ap.plant_species as species,
                up.planting_time as plantingTime,
                up.est_cropping as estCropping,
                up.photo_url as photoUrl
            FROM user_plants up
            JOIN all_plants ap ON up.plant_id = ap.plant_id
            WHERE up.user_plant_id = ?
        `, [plantId]);

        res.json({
            message: 'Plant updated successfully',
            plant: updatedPlant[0]
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Update plant error:', error);
        res.status(500).json({ message: 'Error updating plant' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Frontend Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'public/index.html'));
});

app.get('/plants', requireAuth, (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'public/plants.html'));
});

// Catch-all route for frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'public/index.html'));
});

// Error handler
app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;