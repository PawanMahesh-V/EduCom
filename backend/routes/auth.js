const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const userQuery = await pool.query(
            'SELECT user_id, reg_id, email, full_name, role, department, password_hash FROM users WHERE email = $1 OR reg_id = $1',
            [identifier]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userQuery.rows[0];

        // Debug logging
        console.log('Found user:', {
            email: user.email,
            hasPasswordHash: !!user.password_hash,
            passwordHashType: typeof user.password_hash
        });

        // Handle null or invalid password_hash
        if (!user.password_hash) {
            console.log('No password hash found for user');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const userFound = userQuery.rows[0];
        
        // Verify password
        const passwordCheck = await pool.query(
            'SELECT * FROM users WHERE user_id = $1 AND password_hash = $2',
            [userFound.user_id, password]
        );

        if (passwordCheck.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: userFound.user_id,
                email: userFound.email,
                role: userFound.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Remove sensitive data before sending response
        delete userFound.password_hash;
        
        res.json({
            user: {
                id: userFound.user_id,
                reg_id: userFound.reg_id,
                email: userFound.email,
                full_name: userFound.full_name,
                role: userFound.role,
                department: userFound.department
            },
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;