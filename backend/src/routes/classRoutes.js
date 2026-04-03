import express from 'express';
const router = express.Router();
import { 
  createClass, 
  getClasses, 
  getClassById, 
  deleteClass,
  generateJoinCode,
  addStudentToClass,
  removeStudentFromClass,
  getClassAnalytics,
  getStudentClassAnalytics,
  submitClassAttendance,
  joinClass
} from '../controllers/classController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

// Protect all class routes
router.use(protect);

router.post('/join', restrictTo('student'), joinClass);

// Routes for classes
router.route('/')
  .post(restrictTo('teacher', 'admin'), createClass)
  .get(getClasses);

router.route('/:id')
  .get(getClassById)
  .delete(restrictTo('teacher', 'admin'), deleteClass);

router.post('/:id/generate-code', restrictTo('teacher', 'admin'), generateJoinCode);

router.route('/:id/analytics')
  .get(restrictTo('teacher', 'admin'), getClassAnalytics);

router.route('/:id/student-analytics')
  .get(restrictTo('student'), getStudentClassAnalytics);

router.route('/:id/attendance')
  .post(restrictTo('teacher', 'admin'), submitClassAttendance);

router.route('/:id/students')
  .post(restrictTo('teacher', 'admin'), addStudentToClass);

router.route('/:id/students/:studentId')
  .delete(restrictTo('teacher', 'admin'), removeStudentFromClass);

export default router;
