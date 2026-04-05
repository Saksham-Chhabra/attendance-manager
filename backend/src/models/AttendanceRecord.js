import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Record must belong to a student'],
  },
  session: {
    type: mongoose.Schema.ObjectId,
    ref: 'AttendanceSession',
    required: [true, 'Record must belong to a session'],
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'absent',
  },
  // Face position data for friendship analysis
  facePosition: {
    x: Number,        // Center X coordinate in image
    y: Number,        // Center Y coordinate in image
    width: Number,    // Face bounding box width
    height: Number,   // Face bounding box height
    left: Number,     // Left edge pixel coordinate
    top: Number,      // Top edge pixel coordinate
    right: Number,    // Right edge pixel coordinate
    bottom: Number,   // Bottom edge pixel coordinate
    confidence: Number // Face detection confidence (0-1)
  },
  imageUrl: String,  // URL to the attendance photo
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;
