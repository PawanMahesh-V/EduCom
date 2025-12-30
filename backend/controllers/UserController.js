const bcrypt = require('bcrypt');
const User = require('../models/User');

class UserController {
    static async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 10, role, department } = req.query;
            const offset = (page - 1) * limit;

            const filters = {};
            if (role) filters.role = role;
            if (department) filters.department = department;

            const users = await User.findAll(filters);
            const paginatedUsers = users.slice(offset, offset + parseInt(limit));
            
            res.json({
                users: paginatedUsers,
                totalUsers: users.length,
                currentPage: parseInt(page),
                totalPages: Math.ceil(users.length / limit)
            });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async getTeachers(req, res) {
        try {
            const teachers = await User.findAll({ role: 'Teacher' });
            res.json({ teachers });
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(user);
        } catch (err) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async createUser(req, res) {
        try {
            const { reg_id, name, email, password, role = 'Student', department = 'CS', semester, program_year, section } = req.body;
            if (!reg_id || !name || !email || !password) {
                return res.status(400).json({ message: 'Missing required fields' });
            }
            const { ROLES: validRoles, DEPARTMENTS: validDepartments } = require('../config/constants');

            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
                });
            }

            if (!validDepartments.includes(department)) {
                return res.status(400).json({ 
                    message: `Invalid department. Must be one of: ${validDepartments.join(', ')}` 
                });
            }
            const existingUser = await User.findByIdentifier(email) || await User.findByIdentifier(reg_id);
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                reg_id,
                name,
                email,
                password: hashedPassword,
                role,
                department,
                semester,
                program_year,
                section
            });

            res.status(201).json(newUser);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(400).json({ 
                    message: 'A user with this registration ID or email already exists'
                });
            }

            res.status(500).json({ message: 'Server error while creating user' });
        }
    }

    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { reg_id, name, email, password, role, department, semester, program_year, section } = req.body;
            const { ROLES: validRoles, DEPARTMENTS: validDepartments } = require('../config/constants');

            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
                });
            }

            if (!validDepartments.includes(department)) {
                return res.status(400).json({ 
                    message: `Invalid department. Must be one of: ${validDepartments.join(', ')}` 
                });
            }

            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (existingUser.role === 'Admin' && role !== 'Admin') {
                const roleCount = await User.countByRole();
                const adminCount = roleCount.find(r => r.role === 'Admin')?.count || 0;
                if (parseInt(adminCount) <= 1) {
                    return res.status(400).json({ 
                        message: 'Cannot change role of the last admin user' 
                    });
                }
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await User.updatePassword(id, hashedPassword);
            }
            const updatedUser = await User.update(id, {
                name,
                email,
                role,
                department,
                semester,
                program_year,
                section
            });

            res.json(updatedUser);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(400).json({ 
                    message: 'A user with this registration ID or email already exists'
                });
            }

            res.status(500).json({ message: 'Server error while updating user' });
        }
    }

    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (user.role === 'Admin') {
                const roleCount = await User.countByRole();
                const adminCount = roleCount.find(r => r.role === 'Admin')?.count || 0;
                if (parseInt(adminCount) <= 1) {
                    return res.status(400).json({ 
                        message: 'Cannot delete the last admin user' 
                    });
                }
            }
            await User.delete(id);

            res.json({ message: 'User deleted successfully' });
        } catch (err) {
            res.status(500).json({ message: 'Server error while deleting user' });
        }
    }
}

module.exports = UserController;
