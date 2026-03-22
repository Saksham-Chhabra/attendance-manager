import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeMatch = allowedTypes.test(file.mimetype);
    if (extMatch && mimeMatch) {
      return cb(null, true);
    }
    cb(new Error('Only JPG and PNG images are allowed'));
  }
}).array('photos', 3); // Limit to 3 photos

/**
 * Enroll Student's Face
 * @route POST /api/enrollment/face
 * @access Private/Student
 */
export const enrollFace = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'fail', message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Please upload at least one photo' });
    }

    try {
      const photos = req.files.map(file => file.path);
      
      // Update student enrollment
      const user = await User.findById(req.user.id);
      user.faceEnrollment.referencePhotos = photos;
      user.faceEnrollment.isEnrolled = true;
      user.faceEnrollment.lastUpdated = Date.now();
      
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Face photos uploaded successfully. ML processing will follow.',
        data: {
          referencePhotos: user.faceEnrollment.referencePhotos,
          isEnrolled: user.faceEnrollment.isEnrolled
        }
      });
    } catch (error) {
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
