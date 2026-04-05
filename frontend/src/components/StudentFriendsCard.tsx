/**
 * StudentFriendsCard Component
 * Displays a student's friendship connections in a visual format
 * 
 * Usage:
 * <StudentFriendsCard studentId="507f1f77bcf86cd799439001" />
 */

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Loader2, Alert } from 'lucide-react';
import api from '../../lib/axios';

interface Friend {
  friend: {
    _id: string;
    name: string;
    rollNumber: string;
  };
  strength: number;
  frequency: number;
  lastMet: string;
}

interface StudentFriendsCardProps {
  studentId: string;
  limit?: number;
  showMetrics?: boolean;
}

const StudentFriendsCard: React.FC<StudentFriendsCardProps> = ({
  studentId,
  limit = 10,
  showMetrics = true
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchFriends();
    if (showMetrics) {
      fetchMetrics();
    }
  }, [studentId]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/friendships/student/${studentId}/friends?limit=${limit}`
      );
      
      if (response.data.status === 'success') {
        setFriends(response.data.data.friends);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load friends');
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await api.get(
        `/api/friendships/student/${studentId}/metrics`
      );
      
      if (response.data.status === 'success') {
        setMetrics(response.data.data.metrics);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const getStrengthColor = (strength: number): string => {
    if (strength >= 0.8) return 'text-red-500'; // Close friends
    if (strength >= 0.6) return 'text-orange-500'; // Good friends
    if (strength >= 0.4) return 'text-yellow-500'; // Casual friends
    return 'text-gray-500'; // Acquaintances
  };

  const getStrengthBgColor = (strength: number): string => {
    if (strength >= 0.8) return 'bg-red-100 border-red-300';
    if (strength >= 0.6) return 'bg-orange-100 border-orange-300';
    if (strength >= 0.4) return 'bg-yellow-100 border-yellow-300';
    return 'bg-gray-100 border-gray-300';
  };

  const getStrengthLabel = (strength: number): string => {
    if (strength >= 0.8) return 'Very Close';
    if (strength >= 0.6) return 'Close Friend';
    if (strength >= 0.4) return 'Friend';
    return 'Acquaintance';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">Friends & Classmates</h3>
        </div>
        {friends.length > 0 && (
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
          </span>
        )}
      </div>

      {/* Metrics section */}
      {showMetrics && metrics && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{metrics.totalSessions}</p>
            <p className="text-xs text-gray-600">Sessions Attended</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{metrics.companionCount}</p>
            <p className="text-xs text-gray-600">Unique Companions</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Alert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!error && friends.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No friends detected yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Friendships will appear after multiple attendance sessions
          </p>
        </div>
      )}

      {/* Friends list */}
      {friends.length > 0 && (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.friend._id}
              className={`p-3 border rounded-lg transition-all hover:shadow-md ${getStrengthBgColor(friend.strength)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{friend.friend.name}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Roll: {friend.friend.rollNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold ${getStrengthColor(friend.strength)}`}>
                    {getStrengthLabel(friend.strength)}
                  </span>
                </div>
              </div>

              {/* Strength bar */}
              <div className="mt-2 w-full bg-gray-300 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${getStrengthColor(friend.strength)}`}
                  style={{ 
                    width: `${friend.strength * 100}%`,
                    backgroundColor: friend.strength >= 0.8 ? '#ef4444' : 
                                    friend.strength >= 0.6 ? '#f97316' :
                                    friend.strength >= 0.4 ? '#eab308' : '#9ca3af'
                  }}
                />
              </div>

              {/* Metrics */}
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {friend.frequency}x together
                </span>
                <span>Last met: {new Date(friend.lastMet).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentFriendsCard;

/**
 * FriendGroupsCard Component
 * Displays detected friend groups/cliques in a class
 */

interface FriendGroup {
  members: string[];
  size: number;
  averageStrength: number;
}

interface FriendGroupsCardProps {
  classId?: string;
  minGroupSize?: number;
}

export const FriendGroupsCard: React.FC<FriendGroupsCardProps> = ({
  classId,
  minGroupSize = 3
}) => {
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [classId]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (classId) params.append('classId', classId);
      params.append('minGroupSize', String(minGroupSize));

      const response = await api.get(
        `/api/friendships/groups?${params.toString()}`
      );

      if (response.data.status === 'success') {
        setGroups(response.data.data.groups);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-gray-800">Friend Groups</h3>
        {groups.length > 0 && (
          <span className="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            {groups.length} groups
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Alert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {groups.length === 0 && !error && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No friend groups detected</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group, idx) => (
            <div
              key={idx}
              className="p-4 border border-green-200 bg-green-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Group {idx + 1}</h4>
                <span className="px-2 py-1 text-xs font-semibold bg-green-200 text-green-800 rounded">
                  {group.size} members
                </span>
              </div>

              {/* Strength indicator */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Group Strength</span>
                  <span className="text-xs font-semibold text-green-600">
                    {(group.averageStrength * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all"
                    style={{ width: `${group.averageStrength * 100}%` }}
                  />
                </div>
              </div>

              {/* Members count */}
              <p className="text-xs text-gray-600">
                {group.members.length} students with strong connections
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * FriendshipStrengthChart Component
 * Shows strength distribution of friendships
 */

export const FriendshipStrengthChart: React.FC<{
  friends?: Friend[];
}> = ({ friends = [] }) => {
  const veryClose = friends.filter(f => f.strength >= 0.8).length;
  const close = friends.filter(f => f.strength >= 0.6 && f.strength < 0.8).length;
  const casual = friends.filter(f => f.strength >= 0.4 && f.strength < 0.6).length;
  const acquaintance = friends.filter(f => f.strength < 0.4).length;

  const total = friends.length || 1;

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900 text-sm">Friendship Strength Distribution</h4>

      <div className="space-y-2">
        {/* Very Close */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-700">Very Close</span>
            <span className="text-xs font-semibold text-red-600">
              {veryClose} ({Math.round((veryClose / total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="h-2 bg-red-500 rounded-full"
              style={{ width: `${(veryClose / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Close Friends */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-700">Close Friends</span>
            <span className="text-xs font-semibold text-orange-600">
              {close} ({Math.round((close / total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="h-2 bg-orange-500 rounded-full"
              style={{ width: `${(close / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Casual Friends */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-700">Casual Friends</span>
            <span className="text-xs font-semibold text-yellow-600">
              {casual} ({Math.round((casual / total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="h-2 bg-yellow-500 rounded-full"
              style={{ width: `${(casual / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Acquaintances */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-700">Acquaintances</span>
            <span className="text-xs font-semibold text-gray-600">
              {acquaintance} ({Math.round((acquaintance / total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="h-2 bg-gray-500 rounded-full"
              style={{ width: `${(acquaintance / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
