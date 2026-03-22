import express from 'express';
const router = express.Router();
import * as mlController from '../controllers/mlController.js';

// ML endpoints
router.post('/verify', mlController.verifyFace);

export default router;
