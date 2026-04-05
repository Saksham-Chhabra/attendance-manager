/**
 * Friendship Analysis Controller
 * Handles API endpoints for analyzing and managing student friendships
 * based on seating patterns and proximity data
 */

import * as friendshipService from '../services/friendshipAnalysis.js';
import StudentFriendship from '../models/StudentFriendship.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';

/**
 * Analyze a single attendance session for friendship patterns
 * POST /api/friendships/analyze-session/:sessionId
 */
export const analyzeSessionFriendships = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists
    const session = await AttendanceSession.findById(sessionId).populate('class');
    if (!session) {
      return res.status(404).json({ status: 'fail', message: 'Session not found' });
    }

    // Perform friendship analysis
    const analysis = await friendshipService.analyzeSingleSession(sessionId);

    // Check if any friendships were found
    if (analysis.friendshipEdges.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Session analyzed but no nearby seating pairs found',
        data: analysis
      });
    }

    // Store the friendship relationships in database
    // Use findOrCreateFriendship to handle upserts
    const storedFriendships = [];
    for (const edge of analysis.friendshipEdges) {
      const friendship = await StudentFriendship.findOrCreateFriendship(
        edge.student1,
        edge.student2,
        {
          strength: edge.proximityScore,
          proximityPattern: {
            averageDistance: edge.distance,
            minDistance: edge.distance,
            maxDistance: edge.distance
          }
        }
      );
      storedFriendships.push(friendship._id);
    }

    res.status(200).json({
      status: 'success',
      message: 'Session analyzed and friendships recorded',
      data: {
        sessionId: analysis.sessionId,
        className: session.class.name,
        studentsAnalyzed: analysis.totalStudentsAnalyzed,
        friendshipPairsFound: analysis.foundFriendshipPairs,
        friendshipsStored: storedFriendships.length
      }
    });
  } catch (error) {
    console.error('Error analyzing session friendships:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze session friendships',
      error: error.message
    });
  }
};

/**
 * Analyze multiple sessions for friendship patterns
 * POST /api/friendships/analyze-sessions
 * Body: { sessionIds: [...], classId?: '...' }
 */
export const analyzeMultipleSessions = async (req, res) => {
  try {
    const { sessionIds, classId } = req.body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of session IDs'
      });
    }

    // Perform multi-session analysis
    const analysis = await friendshipService.analyzeMultipleSessions(sessionIds);

    // Store all friendships
    const storedCount = {};
    for (const friendship of analysis.friendships) {
      const stored = await StudentFriendship.findOrCreateFriendship(
        friendship.student1,
        friendship.student2,
        {
          strength: friendship.averageProximityScore,
          frequency: friendship.cooccurrences,
          proximityPattern: {
            averageDistance: friendship.averageDistance
          }
        }
      );
      storedCount[stored._id] = 1;
    }

    res.status(200).json({
      status: 'success',
      message: 'Multiple sessions analyzed for friendship patterns',
      data: {
        sessionsAnalyzed: analysis.totalSessionsAnalyzed,
        uniqueFriendshipPairs: analysis.totalFriendshipPairs,
        topFriendships: analysis.friendships.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error analyzing multiple sessions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze multiple sessions',
      error: error.message
    });
  }
};

/**
 * Get friendship metrics for a specific student
 * GET /api/friendships/student/:studentId/metrics
 * Query: { sessionIds?: [...] }
 */
export const getStudentFriendshipMetrics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { sessionIds } = req.query;

    const sessionIdArray = sessionIds ? JSON.parse(sessionIds) : null;

    const metrics = await friendshipService.getStudentFriendshipMetrics(
      studentId,
      sessionIdArray
    );

    // Also get stored friendships from database for this student
    const dbFriendships = await StudentFriendship.getStudentFriends(studentId, 20);

    res.status(200).json({
      status: 'success',
      data: {
        metrics,
        recordedFriendships: dbFriendships
      }
    });
  } catch (error) {
    console.error('Error getting student friendship metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve friendship metrics',
      error: error.message
    });
  }
};

/**
 * Get friends of a student
 * GET /api/friendships/student/:studentId/friends
 * Query: { limit?: 10 }
 */
export const getStudentFriends = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 10 } = req.query;

    const friends = await StudentFriendship.getStudentFriends(studentId, parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        studentId,
        friendCount: friends.length,
        friends: friends.map(f => ({
          friend: f.student1._id === studentId ? f.student2 : f.student1,
          strength: f.strength,
          frequency: f.frequency,
          lastMet: f.lastAnalyzed
        }))
      }
    });
  } catch (error) {
    console.error('Error getting student friends:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve friends',
      error: error.message
    });
  }
};

/**
 * Detect friend groups in a class
 * GET /api/friendships/groups
 * Query: { classId?: '...', minGroupSize?: 3 }
 */
export const detectFriendGroups = async (req, res) => {
  try {
    const { classId, minGroupSize = 3 } = req.query;

    // If classId provided, first get all friendships for that class
    let friendships;
    if (classId) {
      // Get all sessions for the class
      const sessions = await AttendanceSession.find({ class: classId }).lean();
      const sessionIds = sessions.map(s => s._id);

      // Get friendships from those sessions
      friendships = await AttendanceRecord.aggregate([
        { $match: { session: { $in: sessionIds }, status: 'present' } },
        { $group: { _id: '$student' } }
      ]);
    }

    const groups = await StudentFriendship.detectFriendGroups(parseInt(minGroupSize));

    res.status(200).json({
      status: 'success',
      data: {
        totalGroups: groups.length,
        minGroupSize: parseInt(minGroupSize),
        groups: groups.slice(0, 20)
      }
    });
  } catch (error) {
    console.error('Error detecting friend groups:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to detect friend groups',
      error: error.message
    });
  }
};

/**
 * Get friendship strength progression for a pair of students
 * GET /api/friendships/pair/:student1Id/:student2Id
 */
export const getFriendshipDetails = async (req, res) => {
  try {
    const { student1Id, student2Id } = req.params;

    const friendship = await StudentFriendship.findOne({
      $or: [
        { student1: student1Id, student2: student2Id },
        { student1: student2Id, student2: student1Id }
      ]
    })
    .populate('student1', '_id name rollNumber email')
    .populate('student2', '_id name rollNumber email');

    if (!friendship) {
      return res.status(404).json({
        status: 'fail',
        message: 'No friendship record found for this pair'
      });
    }

    // Get all proximity records for this pair
    const proximityHistory = await AttendanceRecord.aggregate([
      {
        $match: {
          student: student1Id,
          status: 'present',
          'facePosition.x': { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'attendancerecords',
          let: { session_id: '$session' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$session', '$$session_id'] },
                student: student2Id,
                status: 'present',
                'facePosition.x': { $exists: true }
              }
            }
          ],
          as: 'pairRecord'
        }
      },
      { $match: { pairRecord: { $ne: [] } } },
      { $limit: 20 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        friendship: {
          student1: friendship.student1,
          student2: friendship.student2,
          strength: friendship.strength,
          frequency: friendship.frequency,
          confidenceScore: friendship.confidence,
          lastMet: friendship.lastAnalyzed
        },
        proximityHistory: proximityHistory.length,
        totalMeetings: friendship.frequency
      }
    });
  } catch (error) {
    console.error('Error getting friendship details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve friendship details',
      error: error.message
    });
  }
};

/**
 * Update friendship metadata
 * PATCH /api/friendships/:friendshipId
 */
export const updateFriendship = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { isActive, notes, confidence } = req.body;

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes) updateData.notes = notes;
    if (confidence !== undefined) updateData.confidence = Math.min(1, Math.max(0, confidence));

    const updated = await StudentFriendship.findByIdAndUpdate(
      friendshipId,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ status: 'fail', message: 'Friendship record not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Friendship updated',
      data: updated
    });
  } catch (error) {
    console.error('Error updating friendship:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update friendship',
      error: error.message
    });
  }
};

export default {
  analyzeSessionFriendships,
  analyzeMultipleSessions,
  getStudentFriendshipMetrics,
  getStudentFriends,
  detectFriendGroups,
  getFriendshipDetails,
  updateFriendship
};
