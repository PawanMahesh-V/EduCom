const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// Get all sections
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, department, year, name, created_at 
             FROM sections 
             ORDER BY department, year, name`
        );

        res.json({
            sections: result.rows,
            total: result.rows.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error while fetching sections' });
    }
});

// Get sections by department and year
router.get('/filter', auth, async (req, res) => {
    try {
        const { department, year } = req.query;
        
        let query = 'SELECT id, department, year, name, created_at FROM sections WHERE 1=1';
        const params = [];
        
        if (department) {
            params.push(department);
            query += ` AND department = $${params.length}`;
        }
        
        if (year) {
            params.push(year);
            query += ` AND year = $${params.length}`;
        }
        
        query += ' ORDER BY department, year, name';
        
        const result = await pool.query(query, params);

        res.json({
            sections: result.rows,
            total: result.rows.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error while fetching sections' });
    }
});

// Create new section
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can create sections' });
        }

        const { department, year, name } = req.body;

        if (!department || !year || !name) {
            return res.status(400).json({ message: 'Department, year, and name are required' });
        }

        const result = await pool.query(
            `INSERT INTO sections (department, year, name) 
             VALUES ($1, $2, $3) 
             RETURNING id, department, year, name, created_at`,
            [department, year, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Section already exists for this department and year' });
        }
        res.status(500).json({ message: 'Server error while creating section' });
    }
});

// Delete section
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can delete sections' });
        }

        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM sections WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Section not found' });
        }

        res.json({ message: 'Section deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error while deleting section' });
    }
});

module.exports = router;
