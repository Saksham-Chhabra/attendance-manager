import express from 'express';
const router = express.Router();
import { 
  createClass, 
  getClasses, 
  getClassById, 
  addStudentToClass,
  getClassAnalytics,
  submitClassAttendance
} from '../controllers/classController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

// Protect all class routes
router.use(protect);

// Routes for classes
router.route('/')
  .post(restrictTo('teacher', 'admin'), createClass)
  .get(getClasses);

router.route('/:id')
  .get(getClassById);

router.route('/:id/analytics')
  .get(getClassAnalytics);

router.route('/:id/attendance')
  .post(restrictTo('teacher', 'admin'), submitClassAttendance);

router.route('/:id/students')
  .post(restrictTo('teacher', 'admin'), addStudentToClass);

export default router;
