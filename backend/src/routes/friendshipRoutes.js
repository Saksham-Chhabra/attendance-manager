/**
 * Friendship Analysis Routes
 * Endpoints for analyzing student friendships based on seating patterns
 */

import express from 'express';
import * as friendshipController from '../controllers/friendshipController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All friendship analysis routes require authentication
router.use(protect);

// Analyze a single attendance session for friendship patterns
// POST /api/friendships/analyze-session/:sessionId
router.post('/analyze-session/:sessionId', 
  restrictTo('admin', 'teacher'),
  friendshipController.analyzeSessionFriendships
);

// Analyze multiple sessions
// POST /api/friendships/analyze-sessions
router.post('/analyze-sessions',
  restrictTo('admin', 'teacher'),
  friendshipController.analyzeMultipleSessions
);

// Get friend groups in a class/school
// GET /api/friendships/groups
router.get('/groups',
  restrictTo('admin', 'teacher'),
  friendshipController.detectFriendGroups
);

// Get friendship metrics for a specific student
// GET /api/friendships/student/:studentId/metrics
router.get('/student/:studentId/metrics',
  friendshipController.getStudentFriendshipMetrics
);

// Get list of friends for a student
// GET /api/friendships/student/:studentId/friends
router.get('/student/:studentId/friends',
  friendshipController.getStudentFriends
);

// Get detailed information about friendship between two students
// GET /api/friendships/pair/:student1Id/:student2Id
router.get('/pair/:student1Id/:student2Id',
  friendshipController.getFriendshipDetails
);

// Update friendship metadata
// PATCH /api/friendships/:friendshipId
router.patch('/:friendshipId',
  restrictTo('admin', 'teacher'),
  friendshipController.updateFriendship
);

export default router;
