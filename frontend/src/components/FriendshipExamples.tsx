/**
 * Friendship Analysis Components - Usage Examples
 * 
 * This file demonstrates how to use the friendship analysis components
 * in your React application
 */

import React from 'react';
import StudentFriendsCard, { 
  FriendGroupsCard, 
  FriendshipStrengthChart 
} from './StudentFriendsCard';

/**
 * Example 1: Simple Student Friends Display
 * Show all friends of a single student
 */
export const StudentProfileExample = ({ studentId }: { studentId: string }) => {
  return (
    <div className="max-w-md">
      <StudentFriendsCard 
        studentId={studentId}
        limit={10}
        showMetrics={true}
      />
    </div>
  );
};

/**
 * Example 2: Class Friend Groups Analysis
 * Display all detected friend groups in a class
 */
export const ClassAnalysisExample = ({ classId }: { classId: string }) => {
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Left: Friend Groups */}
      <div>
        <FriendGroupsCard 
          classId={classId}
          minGroupSize={3}
        />
      </div>

      {/* Right: Selected Student Details */}
      <div>
        {selectedStudent ? (
          <StudentFriendsCard studentId={selectedStudent} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Select a student to view their friendship details</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Example 3: Comprehensive Dashboard
 * Complete dashboard with all friendship analytics
 */
export const FriendshipAnalyticsDashboard = ({ classId }: { classId: string }) => {
  const [students, setStudents] = React.useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Fetch students from your API or props
    // setStudents(classStudents);
    if (students.length > 0) {
      setSelectedStudent(students[0]._id);
    }
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Class Friendship Analytics
          </h1>
          <p className="text-gray-600">
            Analyze student social dynamics and seating patterns
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Student Selection and Groups */}
          <div className="space-y-6">
            {/* Student List */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Select Student</h3>
              <div className="space-y-2">
                {students.slice(0, 8).map(student => (
                  <button
                    key={student._id}
                    onClick={() => setSelectedStudent(student._id)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedStudent === student._id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-xs opacity-75">{student.rollNumber}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Friend Groups */}
            <div className="bg-white rounded-lg shadow p-4">
              <FriendGroupsCard classId={classId} minGroupSize={3} />
            </div>
          </div>

          {/* Main Content: Selected Student Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStudent && (
              <>
                {/* Friends Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <StudentFriendsCard 
                    studentId={selectedStudent}
                    limit={15}
                    showMetrics={true}
                  />
                </div>

                {/* Strength Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <FriendshipStrengthChart />
                </div>
              </>
            )}

            {!selectedStudent && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">
                  Select a student from the list to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 4: Friendship Strength Visualization
 * Show friendship strength between two specific students
 */
export const FriendshipDetailsExample = ({ 
  student1Id, 
  student2Id 
}: { 
  student1Id: string; 
  student2Id: string;
}) => {
  const [friendship, setFriendship] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFriendship = async () => {
      try {
        // await api.get(`/api/friendships/pair/${student1Id}/${student2Id}`);
        // setFriendship(response.data.data.friendship);
      } catch (error) {
        console.error('Failed to load friendship:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendship();
  }, [student1Id, student2Id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md">
      {friendship && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{friendship.student1.name}</h3>
              <p className="text-sm text-gray-600">{friendship.student1.rollNumber}</p>
            </div>
            <div className="text-center font-semibold text-xl text-blue-600">
              ↔
            </div>
            <div className="text-right">
              <h3 className="font-semibold">{friendship.student2.name}</h3>
              <p className="text-sm text-gray-600">{friendship.student2.rollNumber}</p>
            </div>
          </div>

          {/* Friendship Metrics */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700">Friendship Strength</span>
                <span className="font-semibold text-blue-600">
                  {(friendship.strength * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${friendship.strength * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Times Together</p>
                <p className="text-lg font-semibold">{friendship.frequency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Confidence</p>
                <p className="text-lg font-semibold">
                  {(friendship.confidenceScore * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Last met: {new Date(friendship.lastMet).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Example 5: Minimal Integration in Existing Page
 * Add friendship info to a student profile page
 */
export const StudentProfileWithFriends = ({ studentId }: { studentId: string }) => {
  return (
    <div className="space-y-6">
      {/* Existing student info section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Student Profile</h2>
        {/* Your existing profile content */}
      </div>

      {/* Add friendship section */}
      <div className="bg-white rounded-lg shadow p-6">
        <StudentFriendsCard 
          studentId={studentId}
          limit={8}
          showMetrics={true}
        />
      </div>
    </div>
  );
};

export default {
  StudentProfileExample,
  ClassAnalysisExample,
  FriendshipAnalyticsDashboard,
  FriendshipDetailsExample,
  StudentProfileWithFriends
};
