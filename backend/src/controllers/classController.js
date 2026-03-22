import Class from '../models/Class.js';
import User from '../models/User.js';

/**
 * @desc    Create a new class
 * @route   POST /api/classes
 * @access  Private (Teacher/Admin)
 */
export const createClass = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ status: 'fail', message: 'Class name is required' });
    }

    const newClass = await Class.create({
      name,
      teacher: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { class: newClass }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get all classes for logged in user (teacher or student)
 * @route   GET /api/classes
 * @access  Private
 */
export const getClasses = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'teacher') {
      query = { teacher: req.user.id };
    } else if (req.user.role === 'student') {
      query = { students: req.user.id };
    } else {
      query = {}; // admin sees all
    }

    const classes = await Class.find(query).populate('teacher', 'name email');

    res.status(200).json({
      status: 'success',
      results: classes.length,
      data: { classes }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get class by ID
 * @route   GET /api/classes/:id
 * @access  Private
 */
export const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email rollNumber');

    if (!classData) {
      return res.status(404).json({ status: 'fail', message: 'Class not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { class: classData }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Add student to class
 * @route   POST /api/classes/:id/students
 * @access  Private (Teacher/Admin)
 */
export const addStudentToClass = async (req, res) => {
  try {
    const { email, rollNumber, name } = req.body;
    const classId = req.params.id;

    if (!email && !rollNumber) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email or rollNumber' });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ status: 'fail', message: 'Class not found' });
    }

    // Ensure only the teacher of this class can add students
    if (classData.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to manage this class' });
    }

    // Find or create student
    let student;
    if (email) {
      student = await User.findOne({ email });
    } else if (rollNumber) {
      student = await User.findOne({ rollNumber });
    }

    // If student doesn't exist, create a stub account that they can claim later
    if (!student) {
      if (!name || !email) {
         return res.status(400).json({ status: 'fail', message: 'Student not found. To create a new record, please provide name and email.' });
      }
      student = await User.create({
        name,
        email,
        rollNumber: rollNumber || `TEMP-${Date.now()}`,
        password: 'studentPassword123', // Default password
        role: 'student'
      });
    }

    // Check if student is already in class
    if (classData.students.includes(student._id)) {
      return res.status(400).json({ status: 'fail', message: 'Student is already enrolled in this class' });
    }

    classData.students.push(student._id);
    await classData.save();

    res.status(200).json({
      status: 'success',
      message: 'Student added to class',
      data: { student: { name: student.name, email: student.email, rollNumber: student.rollNumber } }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';

/**
 * @desc    Get class analytics (Recharts payload)
 * @route   GET /api/classes/:id/analytics
 * @access  Private
 */
export const getClassAnalytics = async (req, res) => {
  try {
    const classId = req.params.id;
    const classData = await Class.findById(classId).populate('students', 'name rollNumber email');
    
    if (!classData) return res.status(404).json({ status: 'fail', message: 'Class not found' });

    // 1. Fetch all sessions for this class (chronological)
    const sessions = await AttendanceSession.find({ class: classId }).sort('startTime');
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          metrics: { totalSessions: 0, averageAttendance: 0 },
          timeline: [],
          studentStats: classData.students.map(s => ({
             _id: s._id, name: s.name, rollNumber: s.rollNumber, attendanceRate: 0, attended: 0, total: 0
          }))
        }
      });
    }

    // 2. Fetch all records across these sessions
    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({ session: { $in: sessionIds } });

    // 3. Build Timeline (Class Average per Session)
    let totalPresentsGlobal = 0;
    let totalRecordsGlobal = 0;
    
    const timeline = sessions.map((sess, index) => {
       const sessRecords = records.filter(r => r.session.toString() === sess._id.toString());
       const presents = sessRecords.filter(r => r.status === 'present').length;
       const total = sessRecords.length;
       
       totalPresentsGlobal += presents;
       totalRecordsGlobal += total;

       const rate = total > 0 ? Math.round((presents / total) * 100) : 0;
       
       return {
         name: `Session ${index + 1}`,
         date: sess.startTime.toLocaleDateString(),
         attendanceRate: rate,
         presents,
         total
       };
    });

    const averageAttendance = totalRecordsGlobal > 0 ? Math.round((totalPresentsGlobal / totalRecordsGlobal) * 100) : 0;

    // 4. Build Student Stats (Individual % across all sessions)
    const studentStats = classData.students.map(student => {
       const studentRecords = records.filter(r => r.student.toString() === student._id.toString());
       const attended = studentRecords.filter(r => r.status === 'present').length;
       const total = studentRecords.length; // Can also just use totalSessions if we assume records are forcefully generated

       const absTotal = total > 0 ? total : totalSessions; // Fallback if no records exist
       const rate = absTotal > 0 ? Math.round((attended / absTotal) * 100) : 0;

       return {
         _id: student._id,
         name: student.name,
         rollNumber: student.rollNumber,
         attendanceRate: rate,
         attended,
         total: absTotal
       };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate); // Sort highest attendance first

    res.status(200).json({
      status: 'success',
      data: {
        metrics: { totalSessions, averageAttendance },
        timeline,
        studentStats
      }
    });

  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Submit final verified attendance
 * @route   POST /api/classes/:id/attendance
 * @access  Private
 */
export const submitClassAttendance = async (req, res) => {
  try {
    const classId = req.params.id;
    const { records, method } = req.body; 
    // records should be an array: [{ studentId: '...', status: 'present'|'absent' }]

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No attendance records provided' });
    }

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ status: 'fail', message: 'Class not found' });

    // 1. Create a new Attendance Session
    const session = await AttendanceSession.create({
      class: classId,
      method: method || 'face_detection',
      startTime: new Date(),
      endTime: new Date()
    });

    // 2. Prepare Attendance Records mappings to bulk inject (save DB overhead)
    const attendanceRecords = records.map(record => ({
      student: record.studentId,
      session: session._id,
      status: record.status,
      timestamp: new Date()
    }));

    // 3. Insert Many
    await AttendanceRecord.insertMany(attendanceRecords);

    res.status(201).json({
      status: 'success',
      message: 'Attendance submitted successfully',
      data: {
        sessionId: session._id,
        recordsCreated: attendanceRecords.length
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
