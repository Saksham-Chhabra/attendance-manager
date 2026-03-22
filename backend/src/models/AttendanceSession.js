import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class',
    required: [true, 'Session must belong to a class'],
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  method: {
    type: String,
    enum: ['manual', 'qr', 'face_detection'],
    default: 'manual',
  },
}, {
  timestamps: true,
});

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
export default AttendanceSession;
