import Class from '../models/Class.js';
import User from '../models/User.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';

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
    let query = {};
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      query.students = req.user._id;
    }

    const classes = await Class.find(query).populate('teacher', 'name');

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
    const cls = await Class.findById(req.params.id).populate('students', '_id name email rollNumber faceEnrollment role');
    if (!cls) return res.status(404).json({ status: 'fail', message: 'Class not found' });
    res.status(200).json({ status: 'success', data: { class: cls } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

/**
 * @desc    Delete a class completely (cascading deletes for orphans)
 * @route   DELETE /api/classes/:id
 * @access  Private (Teacher/Admin)
 */
export const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({ status: 'fail', message: 'Class not found' });
    }

    if (classData.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to delete this class' });
    }

    // Identify sessions to orchestrate cascade deletes
    const sessions = await AttendanceSession.find({ class: classId });
    const sessionIds = sessions.map(s => s._id);

    // Cascade 1: Wipe all records from those sessions
    if (sessionIds.length > 0) {
       await AttendanceRecord.deleteMany({ session: { $in: sessionIds } });
    }
    
    // Cascade 2: Wipe all matching Sessions
    await AttendanceSession.deleteMany({ class: classId });

    // Cascade 3: Delete the Core Class document
    await Class.findByIdAndDelete(classId);

    res.status(200).json({ status: 'success', message: 'Classroom globally deleted alongside all associated analytics' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Regenerate Class Join string
 * @route   POST /api/classes/:id/generate-code
 * @access  Private (Teacher/Admin)
 */
export const generateJoinCode = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    
    if (!classData) return res.status(404).json({ status: 'fail', message: 'Class not found' });

    if (classData.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    // Force cryptographic-like pseudorandom collision resolution
    let newCode;
    let isUnique = false;
    while (!isUnique) {
       newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
       const existing = await Class.findOne({ joinCode: newCode });
       if (!existing) isUnique = true;
    }

    classData.joinCode = newCode;
    await classData.save();

    res.status(200).json({ status: 'success', data: { joinCode: newCode } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const joinClass = async (req, res) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ status: 'fail', message: 'Please provide a joining code' });

    const cls = await Class.findOne({ joinCode: joinCode.toUpperCase() });
    if (!cls) return res.status(404).json({ status: 'fail', message: 'Invalid join code' });

    // Check if student is already in the class
    if (cls.students.some(studentId => studentId.equals(req.user._id))) {
      return res.status(400).json({ status: 'fail', message: 'You are already enrolled in this class' });
    }

    cls.students.push(req.user._id);
    await cls.save();
    
    await cls.populate('teacher', 'name');

    res.status(200).json({ status: 'success', data: { class: cls } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
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

/**
 * @desc    Remove student from class
 * @route   DELETE /api/classes/:id/students/:studentId
 * @access  Private (Teacher/Admin)
 */
export const removeStudentFromClass = async (req, res) => {
  try {
    const { id: classId, studentId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ status: 'fail', message: 'Class not found' });

    if (classData.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    classData.students = classData.students.filter(student => !student.equals(studentId));
    await classData.save();

    res.status(200).json({ status: 'success', message: 'Student removed from class' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

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

    // Filter out any orphaned document IDs that failed population (i.e deleted accounts)
    const activeStudents = classData.students.filter(s => s != null);

    // 1. Fetch all sessions for this class (chronological)
    const sessions = await AttendanceSession.find({ class: classId }).sort('startTime');
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          metrics: { totalSessions: 0, averageAttendance: 0 },
          timeline: [],
          studentStats: activeStudents.map(s => ({
             _id: s._id, name: s.name, rollNumber: s.rollNumber, email: s.email, attendanceRate: 0, attended: 0, total: 0
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
    const studentStats = activeStudents.map(student => {
       const studentRecords = records.filter(r => r.student.toString() === student._id.toString());
       const attended = studentRecords.filter(r => r.status === 'present').length;
       const rate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

       return {
         _id: student._id,
         name: student.name,
         email: student.email,
         rollNumber: student.rollNumber,
         attendanceRate: rate,
         attended,
         total: totalSessions
       };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);

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
 * @desc    Get isolated class analytics for a specific student
 * @route   GET /api/classes/:id/student-analytics
 * @access  Private (Student)
 */
export const getStudentClassAnalytics = async (req, res) => {
  try {
    const classId = req.params.id;
    const studentId = req.user._id;

    const classData = await Class.findById(classId).populate('teacher', 'name');
    if (!classData) return res.status(404).json({ status: 'fail', message: 'Class not found' });

    // Validate enrollment boundary
    if (!classData.students.includes(studentId)) {
       return res.status(403).json({ status: 'fail', message: 'You are not enrolled in this classroom computing scope.'});
    }

    // 1. Fetch chronologically sorted sessions
    const sessions = await AttendanceSession.find({ class: classId }).sort('-startTime');
    const totalSessions = sessions.length;

    // 2. Fetch specific records tied *only* to this student across these sessions
    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({ 
       session: { $in: sessionIds },
       student: studentId 
    });

    // 3. Assemble mathematical layout
    let attended = 0;
    const history = sessions.map(sess => {
       const record = records.find(r => r.session.toString() === sess._id.toString());
       const status = record ? record.status : 'absent'; // Assume absent if no record exists for a locked session
       
       if (status === 'present') attended++;

       return {
          sessionId: sess._id,
          date: sess.startTime,
          method: sess.method,
          status: status
       };
    });

    const rate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        classDetails: {
           id: classData._id,
           name: classData.name,
           teacher: classData.teacher?.name || 'Faculty',
           joinCode: classData.joinCode
        },
        metrics: {
           totalSessions,
           attendedSessions: attended,
           attendanceRate: rate
        },
        history // Most recent first (descending mapped above)
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
    // records should be an array: [{ studentId: '...', status: 'present'|'absent', facePosition: {...} }]

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No attendance records provided' });
    }

    // Debug logging
    console.log('Attendance Records Received:', records.slice(0, 3)); // Log first 3 records
    console.log('Total records:', records.length);
    const presentCount = records.filter(r => r.status === 'present').length;
    console.log('Present count:', presentCount, 'Absent count:', records.length - presentCount);

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
    // Include face position data if available for friendship analysis
    const attendanceRecords = records.map(record => {
      const recordObj = {
        student: record.studentId,
        session: session._id,
        status: record.status || 'absent', // Default to absent if not provided
        timestamp: new Date()
      };
      
      // Include face position data for seating-based friendship analysis
      if (record.facePosition) {
        recordObj.facePosition = {
          x: record.facePosition.x,
          y: record.facePosition.y,
          width: record.facePosition.width || 0,
          height: record.facePosition.height || 0,
          left: record.facePosition.left || 0,
          top: record.facePosition.top || 0,
          right: record.facePosition.right || 0,
          bottom: record.facePosition.bottom || 0,
          confidence: record.facePosition.confidence || 0.95
        };
      }
      
      if (record.imageUrl) {
        recordObj.imageUrl = record.imageUrl;
      }
      
      return recordObj;
    });

    // 3. Insert Many
    await AttendanceRecord.insertMany(attendanceRecords);

    res.status(201).json({
      status: 'success',
      message: 'Attendance submitted successfully',
      data: {
        sessionId: session._id,
        recordsCreated: attendanceRecords.length,
        presentCount: attendanceRecords.filter(r => r.status === 'present').length
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
