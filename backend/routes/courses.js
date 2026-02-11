const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CourseController = require('../controllers/CourseController');

// --- Specific Routes (Must come before /:id) ---

// Get all courses
router.get('/', auth, CourseController.getAllCourses);

// Get courses for a specific student (enrolled courses)
router.get('/student/:studentId', auth, CourseController.getStudentCourses);

// Get courses for a specific teacher
router.get('/teacher/:teacherId', auth, CourseController.getTeacherCourses);

// Get teacher dashboard stats
router.get('/teacher/:teacherId/stats', auth, CourseController.getTeacherStats);

// Get all course requests (admin only)
router.get('/requests/all', auth, CourseController.getAllRequests);

// --- Parameterized Routes ---

// Get course by ID
router.get('/:id', auth, CourseController.getCourseById);

// Create new course
router.post('/', auth, CourseController.createCourse);

// Update course
router.put('/:id', auth, CourseController.updateCourse);

// Delete course
router.delete('/:id', auth, CourseController.deleteCourse);

// Get enrolled students for a course
router.get('/:id/enrolled', auth, CourseController.getEnrolledStudents);

// Remove students from course
router.post('/:id/remove', auth, CourseController.removeStudents);

// Assign course to students
router.post('/:id/assign', auth, CourseController.assignStudents);

// Submit course request
router.post('/request', auth, CourseController.createRequest);

// Approve course request (admin only)
router.post('/requests/:id/approve', auth, CourseController.approveRequest);

// Reject course request (admin only)
router.post('/requests/:id/reject', auth, CourseController.rejectRequest);

module.exports = router;
