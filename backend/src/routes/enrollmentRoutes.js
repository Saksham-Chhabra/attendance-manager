import express from 'express';
const router = express.Router();
import * as enrollmentController from '../controllers/enrollmentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

// Enrollment endpoints
// Upload face photos (3-10 photos)
router.post('/upload-photos', protect, restrictTo('student'), enrollmentController.uploadFacePhotos);

// Get enrollment status
router.get('/status', protect, enrollmentController.getEnrollmentStatus);

// Remove a specific photo
router.delete('/photo/:photoIndex', protect, restrictTo('student'), enrollmentController.removePhoto);

// Train face model / Generate embeddings
router.post('/train', protect, restrictTo('student'), enrollmentController.trainFaceModel);

export default router;
