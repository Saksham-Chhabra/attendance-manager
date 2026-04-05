import AttendanceRecord from '../models/AttendanceRecord.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

/**
 * Get comprehensive Analytics Dashboard data for a class
 * @route GET /api/analytics/class/:classId
 * @access Private/Teacher/Admin
 */
export const getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const { dateFrom, dateTo } = req.query;

    // Verify user has access to this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ status: 'fail', message: 'Class not found' });
    }

    // Check authorization (teacher or admin)
    if (req.user.role === 'teacher' && classDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    // Build date filter
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    // Get all attendance sessions for this class
    const sessions = await AttendanceSession.find({
      class: classId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    }).sort({ date: -1 });

    if (sessions.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          classId,
          className: classDoc.name,
          totalSessions: 0,
          totalStudents: 0,
          overallAttendanceRate: 0,
          studentStats: [],
          sessionTrend: []
        }
      });
    }

    // Get all students in class
    const students = classDoc.students || [];
    
    // Fetch all attendance records for these sessions
    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds }
    });

    // Calculate statistics per student
    const studentStats = [];
    for (const studentId of students) {
      const student = await User.findById(studentId);
      const studentRecords = records.filter(r => r.student.toString() === studentId);
      
      if (studentRecords.length > 0) {
        const presentCount = studentRecords.filter(r => r.status === 'present').length;
        const attendanceRate = presentCount / sessions.length;

        studentStats.push({
          studentId: student._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          presentCount: presentCount,
          absentCount: sessions.length - presentCount,
          attendanceRate: attendanceRate,
          attendancePercentage: (attendanceRate * 100).toFixed(2)
        });
      }
    }

    // Sort by attendance rate
    studentStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Calculate session trend
    const sessionTrend = sessions.map(session => {
      const sessionRecords = records.filter(r => r.session.toString() === session._id);
      const presentCount = sessionRecords.filter(r => r.status === 'present').length;
      const attendanceRate = sessionRecords.length > 0 ? presentCount / sessionRecords.length : 0;

      return {
        date: session.date.toISOString().split('T')[0],
        presentCount,
        totalStudents: sessionRecords.length,
        attendanceRate: attendanceRate,
        attendancePercentage: (attendanceRate * 100).toFixed(2)
      };
    });

    // Overall statistics
    const totalPresent = studentStats.reduce((sum, s) => sum + s.presentCount, 0);
    const totalEntries = sessions.length * students.length;
    const overallAttendanceRate = totalEntries > 0 ? totalPresent / totalEntries : 0;

    res.status(200).json({
      status: 'success',
      data: {
        classId,
        className: classDoc.name,
        totalSessions: sessions.length,
        totalStudents: students.length,
        overallAttendanceRate: overallAttendanceRate,
        overallAttendancePercentage: (overallAttendanceRate * 100).toFixed(2),
        studentStats,
        sessionTrend
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get At-Risk Student Predictions
 * @route POST /api/analytics/predict-at-risk
 * @access Private/Teacher/Admin
 */
export const getAtRiskPredictions = async (req, res) => {
  try {
    const { classId, threshold = 0.5 } = req.body;

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ status: 'fail', message: 'Class not found' });
    }

    if (req.user.role === 'teacher' && classDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    // Get all attendance data for this class
    const sessions = await AttendanceSession.find({ class: classId });
    if (sessions.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: { predictions: [], message: 'No attendance data available' }
      });
    }

    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds }
    });

    // Transform data for ML model
    const attendanceData = records.map(r => ({
      student_id: r.student.toString(),
      date: r.createdAt,
      status: r.status
    }));

    // Call Python analytics service (using simple heuristic for now)
    // In production, call a Python ML service
    const predictions = calculateAtRiskStudents(attendanceData, classDoc.students, threshold);

    res.status(200).json({
      status: 'success',
      data: {
        classId,
        threshold,
        totalStudents: classDoc.students.length,
        atRiskCount: predictions.filter(p => p.is_at_risk).length,
        predictions
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get Student Clustering Results
 * @route POST /api/analytics/clustering
 * @access Private/Teacher/Admin
 */
export const getStudentClusters = async (req, res) => {
  try {
    const { classId, numClusters = 3 } = req.body;

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ status: 'fail', message: 'Class not found' });
    }

    if (req.user.role === 'teacher' && classDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    // Get attendance data
    const sessions = await AttendanceSession.find({ class: classId });
    if (sessions.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: { clusters: [], message: 'No attendance data available' }
      });
    }

    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds }
    });

    // Calculate clusters using heuristic approach
    const clusters = calculateStudentClusters(
      records,
      classDoc.students,
      numClusters
    );

    res.status(200).json({
      status: 'success',
      data: {
        classId,
        numClusters,
        clusters
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get Anomaly Detection Results
 * @route POST /api/analytics/anomalies
 * @access Private/Teacher/Admin
 */
export const detectAnomalies = async (req, res) => {
  try {
    const { classId, sensitivity = 'normal' } = req.body;

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ status: 'fail', message: 'Class not found' });
    }

    if (req.user.role === 'teacher' && classDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    // Get attendance data
    const sessions = await AttendanceSession.find({ class: classId });
    if (sessions.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: { anomalies: [], message: 'No attendance data available' }
      });
    }

    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds }
    });

    // Detect anomalies
    const anomalies = detectAnomalousPatterns(
      records,
      classDoc.students,
      sensitivity
    );

    res.status(200).json({
      status: 'success',
      data: {
        classId,
        sensitivity,
        anomalyCount: anomalies.length,
        anomalies
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get Analytics Config (Anomaly Detection Settings)
 * @route GET /api/analytics/config
 * @access Private/Admin
 */
export const getAnalyticsConfig = async (req, res) => {
  try {
    // For now, return default config
    // In future, fetch from database
    const config = {
      anomalyDetection: {
        enabled: true,
        sensitivity: 'normal', // low, normal, high
        threshold: 0.5
      },
      predictions: {
        enabled: true,
        riskThreshold: 0.5
      },
      clustering: {
        enabled: true,
        numClusters: 3
      }
    };

    res.status(200).json({ status: 'success', data: config });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Update Analytics Config
 * @route PUT /api/analytics/config
 * @access Private/Admin
 */
export const updateAnalyticsConfig = async (req, res) => {
  try {
    const { anomalyDetection, predictions, clustering } = req.body;

    // In future, save to database
    // For now, just return updated config
    const config = {
      anomalyDetection: anomalyDetection || {},
      predictions: predictions || {},
      clustering: clustering || {}
    };

    res.status(200).json({ status: 'success', data: config });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============ HELPER FUNCTIONS ============

function calculateAtRiskStudents(attendanceData, studentIds, threshold) {
  const studentStats = {};

  // Initialize
  studentIds.forEach(id => {
    studentStats[id] = { present: 0, total: 0 };
  });

  // Count attendance
  attendanceData.forEach(record => {
    if (studentStats[record.student_id]) {
      studentStats[record.student_id].total++;
      if (record.status === 'present') {
        studentStats[record.student_id].present++;
      }
    }
  });

  // Calculate risk scores
  const predictions = [];
  for (const [studentId, stats] of Object.entries(studentStats)) {
    const attendanceRate = stats.total > 0 ? stats.present / stats.total : 0;
    const riskScore = 1 - attendanceRate;

    predictions.push({
      student_id: studentId,
      attendance_rate: attendanceRate,
      attendance_percentage: (attendanceRate * 100).toFixed(2),
      risk_score: riskScore,
      is_at_risk: riskScore >= threshold,
      reasoning: generateRiskReason(attendanceRate)
    });
  }

  predictions.sort((a, b) => b.risk_score - a.risk_score);
  return predictions;
}

function generateRiskReason(attendanceRate) {
  if (attendanceRate < 0.5) return 'Poor attendance - immediate attention needed';
  if (attendanceRate < 0.75) return 'Below 75% threshold - at risk';
  if (attendanceRate < 0.85) return 'Monitor closely';
  return 'Good attendance';
}

function calculateStudentClusters(records, studentIds, numClusters) {
  const studentStats = {};

  // Initialize
  studentIds.forEach(id => {
    studentStats[id.toString()] = { present: 0, total: 0 };
  });

  // Count attendance
  records.forEach(record => {
    const studentId = record.student.toString();
    if (studentStats[studentId]) {
      studentStats[studentId].total++;
      if (record.status === 'present') {
        studentStats[studentId].present++;
      }
    }
  });

  // Classify students
  const clusters = {
    0: { name: 'Consistent Attenders', students: [] },
    1: { name: 'Regular Attenders', students: [] },
    2: { name: 'Irregular Attenders', students: [] }
  };

  for (const [studentId, stats] of Object.entries(studentStats)) {
    const attendanceRate = stats.total > 0 ? stats.present / stats.total : 0;
    let clusterId = 1;

    if (attendanceRate >= 0.85) clusterId = 0;
    else if (attendanceRate < 0.6) clusterId = 2;

    clusters[clusterId].students.push({
      student_id: studentId,
      attendance_rate: attendanceRate
    });
  }

  // Format response
  return Object.values(clusters).map((c, idx) => ({
    cluster_id: idx,
    name: c.name,
    size: c.students.length,
    students: c.students
  }));
}

function detectAnomalousPatterns(records, studentIds, sensitivity = 'normal') {
  const studentStats = {};
  const thresholds = {
    low: { perfectAttendance: 0.95, zeroAttendance: 0.05 },
    normal: { perfectAttendance: 0.98, zeroAttendance: 0.02 },
    high: { perfectAttendance: 1.0, zeroAttendance: 0.0 }
  };

  const threshold = thresholds[sensitivity] || thresholds.normal;

  // Initialize
  studentIds.forEach(id => {
    studentStats[id.toString()] = { present: 0, total: 0 };
  });

  // Count attendance
  records.forEach(record => {
    const studentId = record.student.toString();
    if (studentStats[studentId]) {
      studentStats[studentId].total++;
      if (record.status === 'present') {
        studentStats[studentId].present++;
      }
    }
  });

  // Detect anomalies
  const anomalies = [];
  for (const [studentId, stats] of Object.entries(studentStats)) {
    if (stats.total === 0) continue;

    const attendanceRate = stats.present / stats.total;

    if (attendanceRate >= threshold.perfectAttendance) {
      anomalies.push({
        student_id: studentId,
        attendance_rate: attendanceRate,
        type: 'PERFECT_ATTENDANCE',
        severity: 'medium',
        description: 'Suspiciously perfect attendance - possible proxy fraud?'
      });
    } else if (attendanceRate <= threshold.zeroAttendance) {
      anomalies.push({
        student_id: studentId,
        attendance_rate: attendanceRate,
        type: 'ZERO_ATTENDANCE',
        severity: 'high',
        description: 'Zero or near-zero attendance - possible withdrawal'
      });
    }
  }

  return anomalies;
}
