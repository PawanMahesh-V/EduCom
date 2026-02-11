const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.url}:`, err);

    // Default error status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Postgres specific errors
    if (err.code) {
        if (err.code === '23505') { // Unique constraint violation
            statusCode = 400;
            message = 'Duplicate entry found. This record already exists.';
        }
    }

    res.status(statusCode).json({
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
