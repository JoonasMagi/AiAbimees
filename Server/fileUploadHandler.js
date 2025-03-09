const path = require('path');
const { AppError } = require('./errorHandler');

/**
 * Enhanced middleware for handling photo uploads
 * Validates file type, sanitizes filenames, and handles errors
 * Sets req.photoUrl if upload is successful
 */
const fileUploadHandler = async (req, res, next) => {
    // Skip if no files were uploaded
    if (!req.files || !req.files.photo) {
        return next();
    }
    
    const uploadedPhoto = req.files.photo;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    try {
        // Check file type
        if (!allowedTypes.includes(uploadedPhoto.mimetype)) {
            throw new AppError('Invalid file type. Only JPEG, PNG, and GIF are allowed.', 400);
        }
        
        // Check file size again (even though we have the limit in the fileUpload middleware)
        if (uploadedPhoto.size > MAX_FILE_SIZE) {
            throw new AppError('File size exceeds the 5MB limit.', 400);
        }
        
        // Sanitize filename - remove potentially dangerous characters
        const safeFileName = uploadedPhoto.name.replace(/[^a-zA-Z0-9\._-]/g, '_');
        const fileName = `${Date.now()}-${safeFileName}`;
        
        // Get root directory (parent of server folder)
        const ROOT_DIR = path.join(__dirname, '..');
        
        // Upload path
        const uploadPath = path.join(ROOT_DIR, 'public/uploads/', fileName);
        
        // Move the file to the uploads directory
        await uploadedPhoto.mv(uploadPath);
        
        // Set the photo URL for use in the route handler
        req.photoUrl = `/uploads/${fileName}`;
        
        next();
    } catch (err) {
        if (err instanceof AppError) {
            return next(err);
        }
        console.error('Photo upload error:', err);
        return next(new AppError('Photo upload failed', 500));
    }
};

module.exports = { fileUploadHandler };
