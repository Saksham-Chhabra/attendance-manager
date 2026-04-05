import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
  },
  rollNumber: {
    type: String,
    unique: true,
    sparse: true, // Only unique if it exists
    trim: true
  },
  refreshToken: {
    type: String,
    select: false,
  },
  faceEnrollment: {
    isEnrolled: {
      type: Boolean,
      default: false
    },
    trainingStatus: {
      type: String,
      enum: ['pending', 'training', 'completed', 'failed'],
      default: 'pending'
    },
    photoCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    embeddings: {
      type: [[Number]], // Array of 512D vectors
      default: []
    },
    referencePhotos: [{
      type: String // File paths to stored photos
    }],
    trainingError: {
      type: String,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
});

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
export default User;
