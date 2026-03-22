const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');

// ML endpoints
router.post('/verify', mlController.verifyFace);

module.exports = router;
