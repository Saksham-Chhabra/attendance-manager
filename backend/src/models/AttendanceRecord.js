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
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;
