import path from 'path';
import fs from 'fs';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';

const ML_SERVER_URL = 'http://localhost:5050';

/**
 * Send image to persistent ML Server for fast inference
 */
const runInference = async (imagePath) => {
  const startTime = Date.now();
  console.log(`[ML] ⏳ Starting inference for: ${path.basename(imagePath)}`);
  const formData = new FormData();
  formData.append('photo', fs.createReadStream(imagePath));

  console.log(`[ML] 📡 Sending to ML Server...`);
  const response = await fetch(`${ML_SERVER_URL}/analyze`, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders(),
    timeout: 30000, // 30s timeout
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ML Server error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[ML] ✅ Inference complete: ${result.faces_count} faces detected in ${elapsed}s`);
  console.log(`[ML]    Server-side inference time: ${result.inference_time}s`);
  
  return result;
};

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
 */
export const verifyFace = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(`[ML] ❌ Upload error: ${err.message}`);
      return res.status(400).json({ status: 'fail', message: err.message });
    }

    if (!req.file) {
      console.log(`[ML] ❌ No photo in request`);
      return res.status(400).json({ status: 'fail', message: 'Please upload a photo' });
    }

    try {
      const absolutePath = path.resolve(req.file.path);
      console.log(`[ML] 📷 Photo received: ${req.file.originalname} (${(req.file.size / 1024).toFixed(0)} KB)`);

      const result = await runInference(absolutePath);

      // Delete temp file
      fs.unlinkSync(absolutePath);

      if (result.status === 'error') {
        console.log(`[ML] ❌ ML Error: ${result.message}`);
        return res.status(400).json({ status: 'fail', message: result.message });
      }

      console.log(`[ML] 🎯 Returning ${result.faces_count} detections to frontend`);
      res.status(200).json({
        status: 'success',
        message: 'ML Inference complete',
        data: result.data
      });
    } catch (error) {
      console.error(`[ML] ❌ Error: ${error.message}`);
      if (error.message.includes('ECONNREFUSED')) {
        return res.status(503).json({ 
          status: 'error', 
          message: 'ML Server is not running. Please start it with: python ml/server.py' 
        });
      }
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
};
