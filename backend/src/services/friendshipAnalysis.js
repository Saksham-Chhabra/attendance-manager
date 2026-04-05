/**
 * Friendship Analysis Service
 * Analyzes seating patterns and creates friendship connections based on student proximity
 * 
 * This service helps identify which students frequently sit near each other,
 * indicating potential friendship groups or study circles.
 */

import AttendanceRecord from '../models/AttendanceRecord.js';
import StudentFriendship from '../models/StudentFriendship.js';

/**
 * Calculate Euclidean distance between two points in image space
 * @param {Object} pos1 - First position {x, y}
 * @param {Object} pos2 - Second position {x, y}
 * @returns {number} Distance between two positions
 */
const calculateDistance = (pos1, pos2) => {
  if (!pos1 || !pos2 || !pos1.x || !pos1.y || !pos2.x || !pos2.y) {
    return Infinity;
  }
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Find nearby students based on image coordinates
 * @param {Object} studentPos - Student face position
 * @param {Array} allPositions - Array of all student positions
 * @param {number} proximityThreshold - Maximum distance to consider "nearby" (in pixels)
 * @returns {Array} IDs of nearby students
 */
const findNearbyStudents = (studentPos, allPositions, proximityThreshold = 150) => {
  return allPositions
    .filter(pos => {
      const distance = calculateDistance(studentPos, pos.facePosition);
      return distance < proximityThreshold && distance > 0; // Exclude self
    })
    .map(pos => pos.studentId);
};

/**
 * Analyze a single attendance session for friendship patterns
 * @param {string} sessionId - Attendance session ID
 * @returns {Object} Analysis results with friendship edges
 */
export const analyzeSingleSession = async (sessionId) => {
  try {
    // Fetch all attendance records for this session WITH face positions
    const records = await AttendanceRecord.find({
      session: sessionId,
      status: 'present',
      'facePosition.x': { $exists: true }
    })
    .select('student facePosition')
    .populate('student', '_id name rollNumber');

    if (records.length < 2) {
      return { 
        sessionId, 
        friendshipEdges: [], 
        message: 'Not enough students with face positions for analysis' 
      };
    }

    // Build a map of studentId -> facePosition for easy lookup
    const positionMap = new Map();
    records.forEach(record => {
      positionMap.set(record.student._id.toString(), {
        studentId: record.student._id,
        facePosition: record.facePosition,
        name: record.student.name
      });
    });

    // Find proximity pairs
    const friendshipEdges = [];
    const processedPairs = new Set();

    for (const [studentId, data] of positionMap) {
      const nearbyStudents = findNearbyStudents(data.facePosition, Array.from(positionMap.values()));
      
      for (const nearbyId of nearbyStudents) {
        // Create unique pair identifier (smaller ID first to avoid duplicates)
        const pairKey = [studentId, nearbyId.toString()].sort().join('-');
        
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          
          // Calculate proximity score (inverse of distance: closer = higher score)
          const distance = calculateDistance(
            data.facePosition,
            positionMap.get(nearbyId.toString()).facePosition
          );
          const proximityScore = Math.max(0, 1 - distance / 300); // Normalize to 0-1
          
          friendshipEdges.push({
            student1: studentId,
            student2: nearbyId,
            session: sessionId,
            distance: parseFloat(distance.toFixed(2)),
            proximityScore: parseFloat(proximityScore.toFixed(3)),
            timestamp: new Date()
          });
        }
      }
    }

    return {
      sessionId,
      friendshipEdges,
      totalStudentsAnalyzed: records.length,
      foundFriendshipPairs: friendshipEdges.length
    };
  } catch (error) {
    console.error('Error analyzing session for friendships:', error);
    throw new Error(`Friendship analysis failed: ${error.message}`);
  }
};

/**
 * Analyze multiple sessions to build comprehensive friendship graph
 * Aggregates proximity data across sessions
 * @param {Array} sessionIds - Array of session IDs to analyze
 * @returns {Object} Aggregated friendship analysis
 */
export const analyzeMultipleSessions = async (sessionIds) => {
  try {
    // Fetch all records across sessions with face positions
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds },
      status: 'present',
      'facePosition.x': { $exists: true }
    })
    .select('student session facePosition')
    .populate('student', '_id name');

    // Group by student pair and aggregate proximity scores
    const friendshipMap = new Map();
    
    for (const sessionId of sessionIds) {
      const sessionRecords = records.filter(r => r.session.toString() === sessionId.toString());
      
      if (sessionRecords.length < 2) continue;

      // Position map for this session
      const posMap = new Map();
      sessionRecords.forEach(record => {
        posMap.set(record.student._id.toString(), record.facePosition);
      });

      // Analyze session
      for (const [sid1, pos1] of posMap) {
        for (const [sid2, pos2] of posMap) {
          if (sid1 >= sid2) continue; // Avoid self and duplicates
          
          const distance = calculateDistance(pos1, pos2);
          if (distance < 150) {
            const pairKey = [sid1, sid2].sort().join('-');
            
            if (!friendshipMap.has(pairKey)) {
              friendshipMap.set(pairKey, {
                student1: sid1,
                student2: sid2,
                cooccurrences: 0,
                totalProximityScore: 0,
                distances: []
              });
            }
            
            const pair = friendshipMap.get(pairKey);
            pair.cooccurrences++;
            pair.proximityScore = Math.max(0, 1 - distance / 300);
            pair.totalProximityScore += pair.proximityScore;
            pair.distances.push(distance);
          }
        }
      }
    }

    // Calculate aggregated metrics
    const friendships = Array.from(friendshipMap.values()).map(pair => {
      const avgDistance = pair.distances.reduce((a, b) => a + b, 0) / pair.distances.length;
      const avgProximityScore = pair.totalProximityScore / pair.cooccurrences;
      
      return {
        student1: pair.student1,
        student2: pair.student2,
        cooccurrences: pair.cooccurrences,
        averageProximityScore: parseFloat(avgProximityScore.toFixed(3)),
        averageDistance: parseFloat(avgDistance.toFixed(2)),
        consistencyScore: pair.cooccurrences / sessionIds.length // How often they sit together
      };
    });

    // Sort by consistency (how often they sit together)
    friendships.sort((a, b) => b.consistencyScore - a.consistencyScore);

    return {
      totalSessionsAnalyzed: sessionIds.length,
      totalFriendshipPairs: friendships.length,
      friendships: friendships.slice(0, 50) // Top 50 friendship pairs
    };
  } catch (error) {
    console.error('Error analyzing multiple sessions:', error);
    throw new Error(`Multi-session analysis failed: ${error.message}`);
  }
};

/**
 * Store friendship analysis results in database
 * @param {Object} analysis - Friendship analysis data
 * @returns {Promise} Database operation result
 */
export const storeFriendshipData = async (analysis) => {
  try {
    // This would store the analysis results in StudentFriendship collection
    // Implementation depends on your StudentFriendship schema
    
    if (analysis.friendships && Array.isArray(analysis.friendships)) {
      // Batch insert or update friendship records
      const friendshipRecords = analysis.friendships.map(f => ({
        student1: f.student1,
        student2: f.student2,
        strength: f.averageProximityScore,
        frequency: f.cooccurrences,
        lastAnalyzed: new Date()
      }));
      
      // Use updateOne with upsert to avoid duplicates
      const operations = friendshipRecords.map(record => ({
        updateOne: {
          filter: {
            $or: [
              { student1: record.student1, student2: record.student2 },
              { student1: record.student2, student2: record.student1 }
            ]
          },
          update: { $set: record },
          upsert: true
        }
      }));
      
      if (StudentFriendship && operations.length > 0) {
        await StudentFriendship.bulkWrite(operations);
      }
    }
    
    return { status: 'success', message: 'Friendship data stored' };
  } catch (error) {
    console.error('Error storing friendship data:', error);
    throw error;
  }
};

/**
 * Calculate proximity-based metrics for a student
 * @param {string} studentId - Student ID
 * @param {Array} sessionIds - Optional: specific sessions to analyze
 * @returns {Object} Student's friendship metrics
 */
export const getStudentFriendshipMetrics = async (studentId, sessionIds = null) => {
  try {
    const query = {
      status: 'present',
      'facePosition.x': { $exists: true },
      student: studentId
    };

    if (sessionIds) {
      query.session = { $in: sessionIds };
    }

    const records = await AttendanceRecord.find(query)
      .select('student facePosition session')
      .populate('student', '_id name')
      .lean();

    if (records.length === 0) {
      return { studentId, message: 'No attendance records with face positions' };
    }

    // Find which students this student sat near
    const nearbyStudentFrequency = {};

    for (const record of records) {
      // Get all other students in the same session
      const sessionRecords = await AttendanceRecord.find({
        session: record.session,
        status: 'present',
        'facePosition.x': { $exists: true },
        student: { $ne: studentId }
      })
      .select('student facePosition')
      .lean();

      for (const other of sessionRecords) {
        const distance = calculateDistance(record.facePosition, other.facePosition);
        
        if (distance < 150) { // Proximity threshold
          const otherId = other.student.toString();
          nearbyStudentFrequency[otherId] = (nearbyStudentFrequency[otherId] || 0) + 1;
        }
      }
    }

    // Sort by frequency
    const frequentCompanions = Object.entries(nearbyStudentFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ studentId: id, frequency: count }));

    return {
      studentId,
      totalSessions: records.length,
      frequentCompanions,
      companionCount: Object.keys(nearbyStudentFrequency).length
    };
  } catch (error) {
    console.error('Error calculating student friendship metrics:', error);
    throw error;
  }
};

export default {
  analyzeSingleSession,
  analyzeMultipleSessions,
  storeFriendshipData,
  getStudentFriendshipMetrics,
  calculateDistance,
  findNearbyStudents
};
