import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5050';

// Configure Multer storage for student face photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = `uploads/students/${req.user.id}/faces`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `face-${timestamp}${path.extname(file.originalname)}`);
  }
});

const uploadMultiple = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeMatch = allowedTypes.test(file.mimetype);
    if (extMatch && mimeMatch) {
      return cb(null, true);
    }
    cb(new Error('Only JPG and PNG images are allowed'));
  }
}).array('photos', 10); // Allow up to 10 photos at once

/**
 * Upload Face Photos for Enrollment
 * @route POST /api/enrollment/upload-photos
 * @access Private/Student
 * @param {File[]} photos - Array of photo files (3-10 required)
 */
export const uploadFacePhotos = async (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'fail', message: err.message });
    }

    try {
      // Validate file count
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          status: 'fail', 
          message: 'Please upload at least 3 photos' 
        });
      }

      const uploadedCount = req.files.length;
      
      // Check if user already has photos
      const user = await User.findById(req.user.id);
      const currentPhotos = user.faceEnrollment.referencePhotos || [];
      const totalPhotos = currentPhotos.length + uploadedCount;

      if (totalPhotos > 10) {
        // Delete uploaded files
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        
        return res.status(400).json({
          status: 'fail',
          message: `Maximum 10 photos allowed. You already have ${currentPhotos.length} photos. Cannot add ${uploadedCount} more.`
        });
      }

      // Append new photos to existing ones
      const newPhotos = req.files.map(file => file.path);
      const allPhotos = [...currentPhotos, ...newPhotos];
      
      // Update user enrollment
      user.faceEnrollment.referencePhotos = allPhotos;
      user.faceEnrollment.photoCount = allPhotos.length;
      user.faceEnrollment.lastUpdated = new Date();
      
      // Reset training status if adding new photos
      if (user.faceEnrollment.trainingStatus === 'completed') {
        user.faceEnrollment.trainingStatus = 'pending';
      }
      
      await user.save();

      res.status(200).json({
        status: 'success',
        message: `Successfully uploaded ${uploadedCount} photo(s). Total photos: ${allPhotos.length}/10`,
        data: {
          photoCount: user.faceEnrollment.photoCount,
          referencePhotos: user.faceEnrollment.referencePhotos,
          trainingStatus: user.faceEnrollment.trainingStatus
        }
      });
    } catch (error) {
      // Cleanup uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
};

/**
 * Get Enrollment Status
 * @route GET /api/enrollment/status
 * @access Private
 */
export const getEnrollmentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('faceEnrollment');
    res.status(200).json({
      status: 'success',
      data: {
        enrollment: user.faceEnrollment
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Remove a Face Photo
 * @route DELETE /api/enrollment/photo/:photoIndex
 * @access Private/Student
 */
export const removePhoto = async (req, res) => {
  try {
    const { photoIndex } = req.params;
    const index = parseInt(photoIndex);

    const user = await User.findById(req.user.id);
    const photos = user.faceEnrollment.referencePhotos;

    if (index < 0 || index >= photos.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid photo index'
      });
    }

    // Delete file from filesystem
    const photoPath = photos[index];
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Remove from database
    photos.splice(index, 1);
    user.faceEnrollment.photoCount = photos.length;
    user.faceEnrollment.referencePhotos = photos;
    
    // Reset training status
    if (user.faceEnrollment.trainingStatus === 'completed') {
      user.faceEnrollment.trainingStatus = 'pending';
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Photo removed successfully',
      data: {
        photoCount: user.faceEnrollment.photoCount,
        referencePhotos: user.faceEnrollment.referencePhotos
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Train Face Recognition Model (Generate Embeddings)
 * @route POST /api/enrollment/train
 * @access Private/Student
 */
export const trainFaceModel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const photos = user.faceEnrollment.referencePhotos;

    // Validate minimum photos
    if (!photos || photos.length < 3) {
      return res.status(400).json({
        status: 'fail',
        message: `Minimum 3 photos required for training. You have ${photos?.length || 0} photos.`
      });
    }

    // Check if already training
    if (user.faceEnrollment.trainingStatus === 'training') {
      return res.status(400).json({
        status: 'fail',
        message: 'Training is already in progress. Please wait.'
      });
    }

    // Update training status
    user.faceEnrollment.trainingStatus = 'training';
    user.faceEnrollment.trainingError = null;
    await user.save();

    // Start async training
    trainEmbeddings(user._id, photos).catch(console.error);

    res.status(200).json({
      status: 'success',
      message: 'Face training started. This may take a few minutes.',
      data: {
        trainingStatus: user.faceEnrollment.trainingStatus
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Generate embeddings from photos (Async)
 */
async function trainEmbeddings(userId, photoPaths) {
  try {
    console.log(`[Training] Starting face embedding training for user ${userId}`);
    
    const embeddings = [];

    // Process each photo
    for (const photoPath of photoPaths) {
      if (!fs.existsSync(photoPath)) {
        console.warn(`[Training] Photo not found: ${photoPath}`);
        continue;
      }

      try {
        // Send to ML server for embedding generation
        const formData = new FormData();
        formData.append('photo', fs.createReadStream(photoPath));

        console.log(`[Training] Processing: ${path.basename(photoPath)}`);
        const response = await fetch(`${ML_SERVER_URL}/extract-embedding`, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders(),
          timeout: 30000
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`ML Server error (${response.status}): ${errText}`);
        }

        const result = await response.json();
        
        if (result.status === 'success' && result.embedding) {
          embeddings.push(result.embedding);
          console.log(`[Training] ✓ Embedding extracted from photo`);
        } else {
          console.warn(`[Training] Failed to extract embedding:`, result.message);
        }
      } catch (error) {
        console.error(`[Training] Error processing photo:`, error.message);
      }
    }

    // Update user with embeddings
    const user = await User.findById(userId);
    
    if (embeddings.length === 0) {
      user.faceEnrollment.trainingStatus = 'failed';
      user.faceEnrollment.trainingError = 'No valid embeddings could be generated from the photos.';
      await user.save();
      console.log(`[Training] ❌ Failed - No embeddings generated`);
      return;
    }

    user.faceEnrollment.embeddings = embeddings;
    user.faceEnrollment.isEnrolled = true;
    user.faceEnrollment.trainingStatus = 'completed';
    user.faceEnrollment.trainingError = null;
    user.faceEnrollment.lastUpdated = new Date();
    
    await user.save();
    
    console.log(`[Training] ✅ Successfully trained ${embeddings.length} embeddings for user ${userId}`);
  } catch (error) {
    console.error(`[Training] Critical error:`, error);
    
    const user = await User.findById(userId);
    user.faceEnrollment.trainingStatus = 'failed';
    user.faceEnrollment.trainingError = error.message;
    await user.save();
  }
}
