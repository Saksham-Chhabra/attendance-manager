const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Enrollment endpoints
router.post('/face', protect, restrictTo('student'), enrollmentController.enrollFace);
router.get('/status', protect, enrollmentController.getEnrollmentStatus);

module.exports = router;
