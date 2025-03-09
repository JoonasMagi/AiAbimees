/**
 * Custom error class that extends the built-in Error class
 * Used for operational errors that can be handled gracefully
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Centralized error handler middleware
 * Handles both operational and programming errors
 */
const handleError = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Something went wrong!';
    
    // Log error details to console with structured format
    console.error({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        statusCode,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    // Send response to client
    res.status(statusCode).json({
        status: 'error',
        message
    });
};

/**
 * Logger for security-related events
 */
const logSecurityEvent = (req, event, details) => {
    console.log({
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userId: req.session.user?.id || 'unauthenticated',
        event,
        details,
        path: req.originalUrl,
        method: req.method
    });
    
    // In production, you might want to send this to a proper logging service
};

module.exports = { AppError, handleError, logSecurityEvent };
