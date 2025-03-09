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
const csurf = require('csurf');

// Import custom modules
const { AppError, handleError, logSecurityEvent } = require('./errorHandler');
const { fileUploadHandler } = require('./fileUploadHandler');
const plantService = require('./db/plantService');
const reminderService = require('./db/reminderService');
const healthService = require('./db/healthService');

// Initialize express app
const app = express();

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

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { message: 'Too many requests, please try again later' }
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
    saveUninitialized: false, // Changed to false to save resources
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

// CSRF Protection
const csrfProtection = csurf({
    cookie: {
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false
    }
});

// Apply CSRF protection to all routes except login/signup
app.use((req, res, next) => {
    if (req.path === '/signin' || req.path === '/signup') {
        return next();
    }
    // Skip for GET/HEAD/OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    csrfProtection(req, res, next);
});

// Make CSRF token available to frontend
app.use((req, res, next) => {
    if (req.csrfToken) {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {
            sameSite: 'Lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false,
            path: '/'
        });
        res.locals.csrfToken = req.csrfToken();
    }
    next();
});

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// Apply API rate limiting
app.use('/api', apiLimiter);

// Authentication Routes
app.post('/signup', [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 8 })
], async (req, res, next) => {
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

        logSecurityEvent(req, 'USER_CREATED', { username });
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        next(new AppError('Server error during signup', 500));
    }
});

app.post('/signin', authLimiter, [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            logSecurityEvent(req, 'FAILED_LOGIN', { username, reason: 'User not found' });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logSecurityEvent(req, 'FAILED_LOGIN', { username, reason: 'Incorrect password' });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = { id: user.user_id, username: user.username };
        logSecurityEvent(req, 'SUCCESSFUL_LOGIN', { username, userId: user.user_id });
        res.json({ message: 'Signed in successfully' });
    } catch (error) {
        console.error('Signin error:', error);
        next(new AppError('Server error during signin', 500));
    }
});

app.post('/logout', requireAuth, (req, res, next) => {
    const userId = req.session.user.id;
    const username = req.session.user.username;
    
    req.session.destroy((err) => {
        if (err) {
            return next(new AppError('Error logging out', 500));
        }
        res.clearCookie('connect.sid');
        logSecurityEvent(req, 'LOGOUT', { username, userId });
        res.json({ message: 'Logged out successfully' });
    });
});

// Plant API Routes
app.get('/api/plants', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const plants = await plantService.getUserPlants(pool, userId);
        res.json(plants);
    } catch (error) {
        console.error('Error fetching plants:', error);
        next(new AppError('Error fetching plants', 500));
    }
});

app.get('/api/plants/:id', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const plantId = req.params.id;
        
        const plant = await plantService.getPlantById(pool, plantId, userId);
        
        if (!plant) {
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }
        
        res.json(plant);
    } catch (error) {
        console.error('Error fetching plant details:', error);
        next(new AppError('Error fetching plant details', 500));
    }
});

app.post('/api/plants', requireAuth, fileUploadHandler, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const { plant_cultivar, plant_species, planting_time, est_cropping } = req.body;

        if (!plant_cultivar || !plant_species || !planting_time) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const plantData = {
            cultivar: plant_cultivar,
            species: plant_species,
            plantingTime: planting_time,
            estCropping: est_cropping || null,
            photoUrl: req.photoUrl || null
        };

        const newPlant = await plantService.addPlant(pool, plantData, userId);

        res.status(201).json({
            message: 'Plant added successfully',
            plant: newPlant
        });
    } catch (error) {
        console.error('Add plant error:', error);
        next(new AppError('Error adding plant', 500));
    }
});

app.put('/api/plants/:id', requireAuth, fileUploadHandler, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const plantId = req.params.id;
        const { plant_cultivar, plant_species, planting_time, est_cropping } = req.body;

        if (!plant_cultivar || !plant_species || !planting_time) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const plantData = {
            cultivar: plant_cultivar,
            species: plant_species,
            plantingTime: planting_time,
            estCropping: est_cropping || null,
            photoUrl: req.photoUrl || null
        };

        const updatedPlant = await plantService.updatePlant(pool, plantId, plantData, userId);

        if (!updatedPlant) {
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }

        res.json({
            message: 'Plant updated successfully',
            plant: updatedPlant
        });
    } catch (error) {
        console.error('Update plant error:', error);
        next(new AppError('Error updating plant', 500));
    }
});

app.delete('/api/plants/:id', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const plantId = req.params.id;

        const success = await plantService.deletePlant(pool, plantId, userId);

        if (!success) {
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }

        res.json({ message: 'Plant deleted successfully' });
    } catch (error) {
        console.error('Delete plant error:', error);
        next(new AppError('Error deleting plant', 500));
    }
});

// Reminder API Routes
app.get('/api/plants/:id/reminders', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const plantId = req.params.id;
        
        const reminders = await reminderService.getPlantReminders(pool, plantId, userId);
        
        if (reminders === null) {
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }
        
        res.json(reminders);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        next(new AppError('Error fetching reminders', 500));
    }
});

app.post('/api/plants/:id/reminders', requireAuth, [
    body('type').isIn(['watering', 'fertilizing', 'harvesting', 'other']),
    body('intervalDays').isInt({ min: 1 }),
    body('startDate').isDate()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const userId = req.session.user.id;
        const plantId = req.params.id;
        const reminderData = {
            type: req.body.type,
            intervalDays: req.body.intervalDays,
            startDate: req.body.startDate,
            notes: req.body.notes
        };
        
        const reminder = await reminderService.saveReminder(pool, plantId, reminderData, userId);
        
        if (reminder === null) {
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }
        
        res.status(201).json({
            message: 'Reminder saved successfully',
            reminder
        });
    } catch (error) {
        console.error('Error saving reminder:', error);
        next(new AppError('Error saving reminder', 500));
    }
});

app.put('/api/reminders/:id/complete', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const reminderId = req.params.id;
        
        const reminder = await reminderService.completeReminder(pool, reminderId, userId);
        
        if (reminder === null) {
            return res.status(404).json({ message: 'Reminder not found or unauthorized' });
        }
        
        res.json({
            message: 'Reminder marked as completed',
            reminder
        });
    } catch (error) {
        console.error('Error completing reminder:', error);
        next(new AppError('Error completing reminder', 500));
    }
});

app.delete('/api/reminders/:id', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const reminderId = req.params.id;
        
        const success = await reminderService.deleteReminder(pool, reminderId, userId);
        
        if (!success) {
            return res.status(404).json({ message: 'Reminder not found or unauthorized' });
        }
        
        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        console.error('Error deleting reminder:', error);
        next(new AppError('Error deleting reminder', 500));
    }
});

app.get('/api/reminders/upcoming', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const daysAhead = parseInt(req.query.days) || 7;
        
        const reminders = await reminderService.getUpcomingReminders(pool, userId, daysAhead);
        
        res.json(reminders);
    } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
        next(new AppError('Error fetching upcoming reminders', 500));
    }
});

// Plant Health API Routes
app.get('/api/plants/:id/health', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const plantId = req.params.id;
        
        const remarks = await healthService.getPlantHealthRemarks(pool, plantId, userId);
        
        if (remarks === null) {
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }
        
        res.json(remarks);
    } catch (error) {
        console.error('Error fetching health remarks:', error);
        next(new AppError('Error fetching health remarks', 500));
    }
});

app.post('/api/plants/:id/health', requireAuth, [
    body('remarks').notEmpty().trim()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const userId = req.session.user.id;
        const plantId = req.params.id;
        const remarks = req.body.remarks;
        
        const healthRemark = await healthService.addHealthRemark(pool, plantId, remarks, userId);
        
        if (healthRemark === null) {
            return res.status(404).json({ message: 'Plant not found or unauthorized' });
        }
        
        res.status(201).json({
            message: 'Health remark added successfully',
            healthRemark
        });
    } catch (error) {
        console.error('Error adding health remark:', error);
        next(new AppError('Error adding health remark', 500));
    }
});

app.get('/api/plants/:id/health/latest', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const plantId = req.params.id;
        
        const latestRemark = await healthService.getLatestHealthRemark(pool, plantId, userId);
        
        if (latestRemark === null) {
            return res.status(404).json({ message: 'No health remarks found for this plant' });
        }
        
        res.json(latestRemark);
    } catch (error) {
        console.error('Error fetching latest health remark:', error);
        next(new AppError('Error fetching latest health remark', 500));
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

// Error handler middleware (must be last)
app.use(handleError);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
