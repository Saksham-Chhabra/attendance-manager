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
      ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
    }).sort({ startTime: -1 });

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
      
      const presentCount = studentRecords.filter(r => r.status === 'present').length;
      const absentCount = sessions.length - presentCount;
      const attendanceRate = sessions.length > 0 ? presentCount / sessions.length : 0;

      studentStats.push({
        _id: student._id,
        studentId: student._id,
        name: student.name,
        studentName: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        presentCount: presentCount,
        absentCount: absentCount,
        attendanceRate: attendanceRate,
        attendancePercentage: (attendanceRate * 100).toFixed(2)
      });
    }

    // Sort by attendance rate
    studentStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Calculate session trend
    const sessionTrend = sessions.map(session => {
      const sessionRecords = records.filter(r => r.session.toString() === session._id);
      const presentCount = sessionRecords.filter(r => r.status === 'present').length;
      const attendanceRate = sessionRecords.length > 0 ? presentCount / sessionRecords.length : 0;

      return {
        date: session.startTime ? session.startTime.toISOString().split('T')[0] : 'Unknown',
        presentCount,
        totalStudents: sessionRecords.length,
        attendanceRate: attendanceRate,
        attendancePercentage: (attendanceRate * 100).toFixed(2)
      };
    }).reverse(); // Reverse to show chronological order

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

/**
 * Get Student Friendships/Closeness Analysis
 * @route POST /api/analytics/friendships
 * @access Private/Teacher/Admin
 */
export const analyzeStudentFriendships = async (req, res) => {
  try {
    const { classId } = req.body;

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ status: 'fail', message: 'Class not found' });
    }

    if (req.user.role === 'teacher' && classDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    // Get all attendance data
    const sessions = await AttendanceSession.find({ class: classId });
    if (sessions.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: { friendships: [], friend_networks: [] }
      });
    }

    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds }
    });

    // Calculate friendships
    const friendships = calculateStudentFriendships(
      records,
      classDoc.students,
      sessions.length
    );

    res.status(200).json({
      status: 'success',
      data: {
        classId,
        totalFriendships: friendships.count,
        friendships: friendships.pairs,
        friend_networks: friendships.networks
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Get Wellness Risk Assessment
 * @route POST /api/analytics/wellness-risk
 * @access Private/Teacher/Admin
 */
export const assessWellnessRisk = async (req, res) => {
  try {
    const { classId } = req.body;

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
        data: { wellness_risks: [], total_at_risk: 0 }
      });
    }

    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds }
    });

    // Calculate wellness risks
    const wellnessRisks = calculateWellnessRisks(
      records,
      classDoc.students,
      sessions.length
    );

    res.status(200).json({
      status: 'success',
      data: {
        classId,
        total_at_risk: wellnessRisks.length,
        wellness_risks: wellnessRisks
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Predict Poor Performers
 * @route POST /api/analytics/performance-risk
 * @access Private/Teacher/Admin
 */
export const predictPoorPerformers = async (req, res) => {
  try {
    const { classId } = req.body;

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
        data: { poor_performers: [], total_at_risk: 0 }
      });
    }

    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds }
    });

    // Calculate performance risks
    const performanceRisks = calculatePerformanceRisks(
      records,
      classDoc.students,
      sessions.length
    );

    res.status(200).json({
      status: 'success',
      data: {
        classId,
        total_at_risk: performanceRisks.length,
        poor_performers: performanceRisks
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Calculate Engagement Scores
 * @route POST /api/analytics/engagement
 * @access Private/Teacher/Admin
 */
export const calculateEngagementScores = async (req, res) => {
  try {
    const { classId } = req.body;

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
        data: { engagement_profiles: [], total_students: 0 }
      });
    }

    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds }
    });

    // Calculate engagement scores
    const engagementScores = calculateEngagementProfiles(
      records,
      classDoc.students,
      sessions.length
    );

    res.status(200).json({
      status: 'success',
      data: {
        classId,
        total_students: classDoc.students.length,
        engagement_profiles: engagementScores
      }
    });
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
  const totalStudents = Object.keys(studentStats).length;
  return Object.values(clusters).map((c, idx) => ({
    cluster_id: idx,
    name: c.name,
    size: c.students.length,
    percentage: totalStudents > 0 ? (c.students.length / totalStudents) * 100 : 0,
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

// ============ NEW ADVANCED ANALYTICS HELPERS ============

function calculateStudentFriendships(records, studentIds, totalSessions) {
  // Group records by session to analyze seating positions
  const sessionMap = {};
  
  records.forEach(record => {
    const sessionId = record.session.toString();
    if (!sessionMap[sessionId]) {
      sessionMap[sessionId] = [];
    }
    
    // Only include students with face position data and present status
    if (record.status === 'present' && record.facePosition) {
      sessionMap[sessionId].push({
        studentId: record.student.toString(),
        facePosition: record.facePosition
      });
    }
  });

  // Calculate pairwise distances
  const pairwiseDistances = {};  // (student1|student2) -> { distances: [], positions: [] }
  
  Object.values(sessionMap).forEach(sessionStudents => {
    // For each pair of students in this session
    for (let i = 0; i < sessionStudents.length; i++) {
      for (let j = i + 1; j < sessionStudents.length; j++) {
        const s1 = sessionStudents[i];
        const s2 = sessionStudents[j];
        
        const pos1 = s1.facePosition;
        const pos2 = s2.facePosition;
        
        if (!pos1 || !pos2) continue;
        
        // Calculate Euclidean distance between face centers
        const x1 = pos1.x || 0;
        const y1 = pos1.y || 0;
        const x2 = pos2.x || 0;
        const y2 = pos2.y || 0;
        
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        // Store with consistent key (student IDs sorted)
        const key = [s1.studentId, s2.studentId].sort().join('|');
        
        if (!pairwiseDistances[key]) {
          pairwiseDistances[key] = { distances: [], count: 0 };
        }
        pairwiseDistances[key].distances.push(distance);
        pairwiseDistances[key].count++;
      }
    }
  });

  // Calculate friendship strength based on seating distance
  const friendships = [];
  const MAX_DISTANCE = 300;  // Maximum pixel distance to consider "sitting together"
  
  Object.entries(pairwiseDistances).forEach(([key, data]) => {
    if (data.count < 2) return;  // Need at least 2 sessions together
    
    const [student1Id, student2Id] = key.split('|');
    const distances = data.distances;
    
    // Calculate average distance
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    
    // Proximity score: inverse of distance (normalized)
    const proximityScore = Math.max(0, Math.min(1, 1.0 - (avgDistance / MAX_DISTANCE)));
    
    // Consistency: how close are they usually? (proportion of "close" sittings)
    const closeSessions = distances.filter(d => d < MAX_DISTANCE * 0.7).length;
    const closeRatio = closeSessions / distances.length;
    
    // Calculate variance for consistency
    const mean = avgDistance;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = 1.0 / (1.0 + stdDev / 100);  // Normalize
    
    // Final friendship score
    const friendshipScore = (proximityScore * 0.4) + (consistencyScore * 0.3) + (closeRatio * 0.3);
    
    // Determine friendship strength
    let strength = 'CASUAL';
    let reason = `Occasional nearby seating (${avgDistance.toFixed(0)}px avg)`;
    
    if (friendshipScore >= 0.75 && distances.length >= 5) {
      strength = 'CLOSE';
      reason = `Consistently sit very close (${avgDistance.toFixed(0)}px avg)`;
    } else if (friendshipScore >= 0.60 && distances.length >= 3) {
      strength = 'MODERATE';
      reason = `Regular close seating (${avgDistance.toFixed(0)}px avg)`;
    } else if (friendshipScore < 0.45) {
      return;  // Don't report weak friendships
    }
    
    friendships.push({
      student1_id: student1Id,
      student2_id: student2Id,
      sessions_together: distances.length,
      avg_seating_distance: parseFloat(avgDistance.toFixed(1)),
      proximity_score: parseFloat(proximityScore.toFixed(3)),
      consistency_score: parseFloat(consistencyScore.toFixed(3)),
      friendship_score: parseFloat(friendshipScore.toFixed(3)),
      friendship_strength: strength,
      reason,
      close_sessions_count: closeSessions
    });
  });

  // Sort by friendship score
  friendships.sort((a, b) => b.friendship_score - a.friendship_score);

  return {
    count: friendships.length,
    pairs: friendships.slice(0, 25),
    networks: identifyFriendNetworks(friendships)
  };
}

function identifyFriendNetworks(friendships) {
  // Build adjacency for friend groups
  const adj = {};
  
  friendships.forEach(fs => {
    if (fs.friendship_strength === 'CLOSE' || fs.friendship_strength === 'MODERATE') {
      if (!adj[fs.student1_id]) adj[fs.student1_id] = new Set();
      if (!adj[fs.student2_id]) adj[fs.student2_id] = new Set();
      
      adj[fs.student1_id].add(fs.student2_id);
      adj[fs.student2_id].add(fs.student1_id);
    }
  });
  
  // Find connected components (friend groups)
  const visited = new Set();
  const groups = [];
  
  const dfs = (student) => {
    visited.add(student);
    const group = new Set([student]);
    
    if (adj[student]) {
      for (const neighbor of adj[student]) {
        if (!visited.has(neighbor)) {
          dfs(neighbor).forEach(member => group.add(member));
        }
      }
    }
    
    return group;
  };
  
  for (const student in adj) {
    if (!visited.has(student)) {
      const group = dfs(student);
      if (group.size >= 2) {
        groups.push({
          members: Array.from(group),
          group_size: group.size,
          cohesion: group.size >= 4 ? 'VERY_HIGH' : group.size === 3 ? 'HIGH' : 'MEDIUM',
          type: group.size >= 3 ? 'STUDY_GROUP' : 'FRIEND_PAIR'
        });
      }
    }
  }
  
  return groups;
}

function calculateWellnessRisks(records, studentIds, totalSessions) {
  const studentStats = {};

  // Initialize
  studentIds.forEach(id => {
    studentStats[id.toString()] = { present: 0, absent: 0, consecutive_absences: 0 };
  });

  // Count attendance
  records.forEach(record => {
    const studentId = record.student.toString();
    if (studentStats[studentId]) {
      if (record.status === 'present') {
        studentStats[studentId].present++;
        studentStats[studentId].consecutive_absences = 0; // Reset counter
      } else {
        studentStats[studentId].absent++;
        studentStats[studentId].consecutive_absences++;
      }
    }
  });

  // Identify wellness risks
  const risks = [];
  for (const [studentId, stats] of Object.entries(studentStats)) {
    let riskScore = 0;
    const riskFactors = [];

    // Factor 1: Frequent absences (>30%)
    const absentRate = stats.absent / totalSessions;
    if (absentRate >= 0.3) {
      riskScore += 25;
      riskFactors.push(`Frequent absences: ${(absentRate * 100).toFixed(1)}%`);
    }

    // Factor 2: Consecutive absences
    if (stats.consecutive_absences >= 3) {
      riskScore += 30;
      riskFactors.push(`${stats.consecutive_absences}+ consecutive absences detected`);
    }

    if (riskScore >= 50) {
      risks.push({
        student_id: studentId,
        wellness_risk_score: riskScore / 100,
        risk_level: riskScore >= 75 ? 'HIGH' : 'MEDIUM',
        risk_factors: riskFactors,
        recommendation: riskScore >= 75 ? 'Urgent: Schedule meeting with student & counselor' : 'Important: Follow-up needed',
        attendance_rate: (stats.present / totalSessions)
      });
    }
  }

  return risks.sort((a, b) => b.wellness_risk_score - a.wellness_risk_score);
}

function calculatePerformanceRisks(records, studentIds, totalSessions) {
  const studentStats = {};

  // Initialize
  studentIds.forEach(id => {
    studentStats[id.toString()] = { present: 0, absent: 0 };
  });

  // Count attendance
  records.forEach(record => {
    const studentId = record.student.toString();
    if (studentStats[studentId]) {
      if (record.status === 'present') {
        studentStats[studentId].present++;
      } else {
        studentStats[studentId].absent++;
      }
    }
  });

  // Identify poor performers
  const risks = [];
  for (const [studentId, stats] of Object.entries(studentStats)) {
    const attendanceRate = stats.present / totalSessions;
    let riskScore = 0;
    const riskReasons = [];

    // Low attendance = poor performance
    if (attendanceRate < 0.70) {
      riskScore += 30;
      riskReasons.push(`Low attendance: ${(attendanceRate * 100).toFixed(1)}%`);
    } else if (attendanceRate < 0.80) {
      riskScore += 15;
      riskReasons.push(`Below average: ${(attendanceRate * 100).toFixed(1)}%`);
    }

    // Multiple absences
    if (stats.absent >= totalSessions * 0.4) {
      riskScore += 25;
      riskReasons.push('High absence count');
    }

    if (riskScore >= 40) {
      risks.push({
        student_id: studentId,
        performance_risk_score: riskScore / 100,
        risk_level: riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'MODERATE',
        risk_reasons: riskReasons,
        attendance_rate: attendanceRate,
        action_items: riskScore >= 80 ? ['Mandatory tutoring', 'Teacher-parent conference'] : 
                     riskScore >= 60 ? ['Weekly check-ins', 'Offer peer mentoring'] : 
                     ['Monitor trends']
      });
    }
  }

  return risks.sort((a, b) => b.performance_risk_score - a.performance_risk_score);
}

function calculateEngagementProfiles(records, studentIds, totalSessions) {
  const studentStats = {};

  // Initialize
  studentIds.forEach(id => {
    studentStats[id.toString()] = { present: 0, absent: 0 };
  });

  // Count attendance
  records.forEach(record => {
    const studentId = record.student.toString();
    if (studentStats[studentId]) {
      if (record.status === 'present') {
        studentStats[studentId].present++;
      } else {
        studentStats[studentId].absent++;
      }
    }
  });

  // Calculate engagement scores
  const profiles = [];
  for (const [studentId, stats] of Object.entries(studentStats)) {
    const attendanceComponent = stats.present / totalSessions;
    // Consistency: inverse of variation (simplified as ratio of present to sessions)
    const consistencyComponent = Math.min(1, stats.present / (totalSessions / 2)); // Normalized
    
    // Engagement = 60% attendance + 40% consistency
    const engagementScore = (attendanceComponent * 0.6) + (Math.min(consistencyComponent, 1) * 0.4);

    let level = 'EXCELLENT';
    if (engagementScore >= 0.85) level = 'EXCELLENT';
    else if (engagementScore >= 0.70) level = 'GOOD';
    else if (engagementScore >= 0.50) level = 'FAIR';
    else if (engagementScore >= 0.30) level = 'LOW';
    else level = 'VERY_LOW';

    profiles.push({
      student_id: studentId,
      engagement_score: engagementScore,
      engagement_level: level,
      attendance_component: attendanceComponent,
      consistency_component: Math.min(consistencyComponent, 1),
      total_sessions: totalSessions,
      present_count: stats.present,
      insight: level === 'EXCELLENT' ? 'Highly engaged student' : 
              level === 'GOOD' ? 'Consistently engaged' :
              level === 'FAIR' && attendanceComponent >= 0.5 ? 'Improving engagement' :
              level === 'VERY_LOW' ? 'Needs intervention' : 'Monitor closely'
    });
  }

  return profiles.sort((a, b) => b.engagement_score - a.engagement_score);
}
