/**
 * Middleware to check for required fields in req.body
 * @param {string[]} fields - Array of required field names
 */
const validate = (fields) => {
    return (req, res, next) => {
        const missing = [];

        fields.forEach(field => {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                missing.push(field);
            }
        });

        if (missing.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missing.join(', ')}`
            });
        }

        next();
    };
};

module.exports = validate;
