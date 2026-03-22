const { spawn } = require('child_process');
const path = require('path');
const User = require('../models/User');

/**
 * Run Python Inference Script with Matching
 * @param {string} imagePath 
 * @returns {Promise<Object>}
 */
const runInference = (imagePath) => {
  return new Promise((resolve, reject) => {
    const pythonPath = 'python';
    // Use the OpenCV-based real face detection script
    const scriptPath = path.join(__dirname, '../../../ml/opencv_inference.py');
    const knownFacesDir = path.join(__dirname, '../../../ml/known_faces1');
    
    // Pass both image path and known faces directory
    const pyProcess = spawn(pythonPath, [scriptPath, imagePath, knownFacesDir]);

    let output = '';
    let errorOutput = '';

    pyProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
      }
      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${output}`));
      }
    });
  });
};

const multer = require('multer');
const fs = require('fs');

// Configure Multer for temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `verify-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage }).single('photo');

/**
 * Verify Face via ML Pipeline
 * @route POST /api/ml/verify
 * @access Public/Private
 */
exports.verifyFace = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'fail', message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'Please upload a photo' });
    }

    try {
        const absolutePath = path.resolve(req.file.path);
        const result = await runInference(absolutePath);

        // Delete temp file after inference
        fs.unlinkSync(absolutePath);

        if (result.status === 'error') {
            return res.status(400).json({ status: 'fail', message: result.message });
        }

        // TODO: Perform matching against database embeddings
        // For now, return the raw ML result
        res.status(200).json({
            status: 'success',
            message: 'ML Inference complete',
            data: result.data
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
  });
};
