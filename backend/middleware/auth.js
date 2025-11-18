const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ message: 'No Authorization header found' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid token format. Must start with Bearer' });
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token found in Authorization header' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        
        if (!jwtSecret) {
            return res.status(500).json({ message: 'Server configuration error' });
        }

        try {
            const decoded = jwt.verify(token, jwtSecret);
            req.user = decoded;
            next();
        } catch (jwtError) {
            return res.status(401).json({ 
                message: 'Token is not valid',
                details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error in auth middleware' });
    }
};