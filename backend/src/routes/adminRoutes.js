import express from 'express';
import { getDomainTeachers } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Specific boundary restricted tightly
router.route('/teachers')
  .get(restrictTo('admin'), getDomainTeachers);

export default router;
