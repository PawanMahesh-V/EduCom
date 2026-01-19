const express = require('express');
const router = express.Router()
const UserController = require('../controllers/UserController');
const auth = require('../middleware/auth');

router.get('/teachers', auth, UserController.getTeachers);
router.get('/', auth, UserController.getUsers);
router.get('/:id', auth, UserController.getUserById);
router.post('/', auth, UserController.createUser);
router.put('/:id', auth, UserController.updateUser);
router.delete('/:id', auth, UserController.deleteUser);
router.get('/admin/profile', auth, UserController.getAdminProfile);
router.post('/admin/reset-invalid-passwords', auth, UserController.resetInvalidPasswords);

module.exports = router;
