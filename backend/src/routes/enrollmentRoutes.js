import express from 'express';
const router = express.Router();
import * as enrollmentController from '../controllers/enrollmentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

// Enrollment endpoints
router.post('/face', protect, restrictTo('student'), enrollmentController.enrollFace);
router.get('/status', protect, enrollmentController.getEnrollmentStatus);

export default router;
