import express from 'express';
const router = express.Router();
import * as analyticsController from '../controllers/analyticsController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

// All analytics routes require authentication
// Only teachers and admins can access
router.use(protect, restrictTo('teacher', 'admin'));

// Class Analytics
router.get('/class/:classId', analyticsController.getClassAnalytics);

// At-Risk Predictions
router.post('/predict-at-risk', analyticsController.getAtRiskPredictions);

// Student Clustering
router.post('/clustering', analyticsController.getStudentClusters);

// Anomaly Detection
router.post('/anomalies', analyticsController.detectAnomalies);

// Advanced Analytics Features
router.post('/friendships', analyticsController.analyzeStudentFriendships);
router.post('/wellness-risk', analyticsController.assessWellnessRisk);
router.post('/performance-risk', analyticsController.predictPoorPerformers);
router.post('/engagement', analyticsController.calculateEngagementScores);

// Analytics Configuration
router.get('/config', restrictTo('admin'), analyticsController.getAnalyticsConfig);
router.put('/config', restrictTo('admin'), analyticsController.updateAnalyticsConfig);

export default router;
