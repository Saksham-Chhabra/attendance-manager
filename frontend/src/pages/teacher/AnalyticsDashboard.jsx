import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Activity, Download, Heart, Brain, TrendingDown } from 'lucide-react';
import api from '../../lib/axios';

const AnalyticsDashboard = () => {
  const { id: classId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [friendships, setFriendships] = useState(null);
  const [wellnessRisks, setWellnessRisks] = useState(null);
  const [performanceRisks, setPerformanceRisks] = useState(null);
  const [engagementScores, setEngagementScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [classId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch class analytics
      const analyticsRes = await api.get(`/analytics/class/${classId}`);
      if (analyticsRes.data.status === 'success') {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictAtRisk = async () => {
    try {
      const res = await api.post('/analytics/predict-at-risk', {
        classId,
        threshold: 0.5
      });
      if (res.data.status === 'success') {
        setPredictions(res.data.data);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to get predictions'));
    }
  };

  const handleGetClusters = async () => {
    try {
      const res = await api.post('/analytics/clustering', {
        classId,
        numClusters: 3
      });
      if (res.data.status === 'success') {
        setClusters(res.data.data);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to get clusters'));
    }
  };

  const handleDetectAnomalies = async () => {
    try {
      const res = await api.post('/analytics/anomalies', {
        classId,
        sensitivity: 'normal'
      });
      if (res.data.status === 'success') {
        setAnomalies(res.data.data);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to detect anomalies'));
    }
  };

  const handleAnalyzeFriendships = async () => {
    try {
      const res = await api.post('/analytics/friendships', { classId });
      if (res.data.status === 'success') {
        setFriendships(res.data.data);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to analyze friendships'));
    }
  };

  const handleAssessWellnessRisk = async () => {
    try {
      const res = await api.post('/analytics/wellness-risk', { classId });
      if (res.data.status === 'success') {
        setWellnessRisks(res.data.data);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to assess wellness risk'));
    }
  };

  const handlePredictPerformers = async () => {
    try {
      const res = await api.post('/analytics/performance-risk', { classId });
      if (res.data.status === 'success') {
        setPerformanceRisks(res.data.data);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to predict performance'));
    }
  };

  const handleCalculateEngagement = async () => {
    try {
      const res = await api.post('/analytics/engagement', { classId });
      if (res.data.status === 'success') {
        setEngagementScores(res.data.data);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to calculate engagement'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark mb-4"></div>
          <p className="text-text-dark-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-red-400">
        {error}
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<Activity size={24} />}
          label="Total Sessions"
          value={analytics?.totalSessions || 0}
          bgColor="bg-blue-500/10"
          textColor="text-blue-400"
        />
        <StatCard
          icon={<Users size={24} />}
          label="Total Students"
          value={analytics?.totalStudents || 0}
          bgColor="bg-green-500/10"
          textColor="text-green-400"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Avg Attendance"
          value={`${((analytics?.overallAttendanceRate || 0) * 100).toFixed(1)}%`}
          bgColor="bg-purple-500/10"
          textColor="text-purple-400"
        />
        <StatCard
          icon={<AlertTriangle size={24} />}
          label="At-Risk Students"
          value={predictions?.atRiskCount || '-'}
          bgColor="bg-red-500/10"
          textColor="text-red-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-primary-dark border-b-2 border-primary-dark'
              : 'text-text-dark-secondary hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'predictions'
              ? 'text-primary-dark border-b-2 border-primary-dark'
              : 'text-text-dark-secondary hover:text-white'
          }`}
        >
          At-Risk
        </button>
        <button
          onClick={() => setActiveTab('clustering')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'clustering'
              ? 'text-primary-dark border-b-2 border-primary-dark'
              : 'text-text-dark-secondary hover:text-white'
          }`}
        >
          Clusters
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'anomalies'
              ? 'text-primary-dark border-b-2 border-primary-dark'
              : 'text-text-dark-secondary hover:text-white'
          }`}
        >
          Anomalies
        </button>
        <button
          onClick={() => setActiveTab('friendships')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'friendships'
              ? 'text-primary-dark border-b-2 border-primary-dark'
              : 'text-text-dark-secondary hover:text-white'
          }`}
        >
          Friendships
        </button>
        <button
          onClick={() => setActiveTab('wellness')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'wellness'
              ? 'text-primary-dark border-b-2 border-primary-dark'
              : 'text-text-dark-secondary hover:text-white'
          }`}
        >
          Wellness
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'performance'
              ? 'text-primary-dark border-b-2 border-primary-dark'
              : 'text-text-dark-secondary hover:text-white'
          }`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab('engagement')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'engagement'
              ? 'text-primary-dark border-b-2 border-primary-dark'
              : 'text-text-dark-secondary hover:text-white'
          }`}
        >
          Engagement
        </button>
      </div>

      {/* Tab Content */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Attendance Trend */}
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(analytics?.sessionTrend || []).map(item => ({
                ...item,
                displayAttendance: item.attendancePercentage > 1 ? item.attendancePercentage : item.attendancePercentage * 100
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="displayAttendance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Attendance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Student Attendance Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Top Performers</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(analytics?.studentStats || []).slice(0, 10).map((student, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-bold text-white">{student.name}</p>
                      <p className="text-xs text-text-dark-secondary">{student.rollNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{student.attendanceRate > 1 ? student.attendanceRate : (student.attendanceRate * 100).toFixed(1)}%</p>
                      <p className="text-xs text-text-dark-secondary">{student.attended} present</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Bottom Performers</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(analytics?.studentStats || []).slice(-10).reverse().map((student, idx) => {
                  const attendancePercent = student.attendanceRate > 1 ? student.attendanceRate : (student.attendanceRate * 100).toFixed(1);
                  return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-bold text-white">{student.name}</p>
                      <p className="text-xs text-text-dark-secondary">{student.rollNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${attendancePercent < 75 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {attendancePercent}%
                      </p>
                      <p className="text-xs text-text-dark-secondary">{student.attended} present</p>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREDICTIONS TAB */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <button
            onClick={handlePredictAtRisk}
            className="bg-primary-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark/90 transition-colors"
          >
            🔮 Generate Predictions
          </button>

          {predictions && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">
                At-Risk Students: {predictions.atRiskCount}/{predictions.totalStudents}
              </h3>

              {predictions.atRiskCount === 0 ? (
                <p className="text-text-dark-secondary text-center py-8">✓ All students are in good standing!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {predictions.predictions
                    .filter(p => p.is_at_risk)
                    .map((pred, idx) => (
                      <div key={idx} className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-white">Student: {pred.student_id}</p>
                            <p className="text-sm text-text-dark-secondary">{pred.reasoning}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-400 font-bold">{pred.attendance_percentage}% Attendance</p>
                            <p className="text-xs text-red-300">Risk: {(pred.risk_score * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-red-900/20 rounded-full h-2">
                          <div
                            className="bg-red-500 h-full rounded-full"
                            style={{ width: `${pred.risk_score * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CLUSTERING TAB */}
      {activeTab === 'clustering' && (
        <div className="space-y-6">
          <button
            onClick={handleGetClusters}
            className="bg-primary-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark/90 transition-colors"
          >
            📊 Analyze Clusters
          </button>

          {clusters && clusters.clusters && clusters.clusters.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {clusters.clusters.map((cluster, idx) => (
                <div key={idx} className="bg-card-dark border border-white/5 rounded-2xl p-6">
                  <h4 className="text-lg font-bold mb-2" style={{ color: COLORS[idx % COLORS.length] }}>
                    {cluster.name}
                  </h4>
                  <div className="mb-4">
                    <p className="text-3xl font-black" style={{ color: COLORS[idx % COLORS.length] }}>
                      {cluster.size}
                    </p>
                    <p className="text-sm text-text-dark-secondary">{(cluster.percentage || 0).toFixed(1)}% of class</p>
                  </div>
                  <div className="text-sm text-text-dark-secondary">
                    <p>📚 Students in this cluster</p>
                  </div>
                </div>
              ))}
            </div>
          ) : clusters ? (
            <p className="text-text-dark-secondary text-center py-8">No cluster data available</p>
          ) : null}
        </div>
      )}

      {/* ANOMALIES TAB */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <button
            onClick={handleDetectAnomalies}
            className="bg-primary-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark/90 transition-colors"
          >
            🔍 Scan for Anomalies
          </button>

          {anomalies && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">
                Anomalies Detected: {anomalies.anomalyCount}
              </h3>

              {anomalies.anomalyCount === 0 ? (
                <p className="text-text-dark-secondary text-center py-8">✓ No anomalies detected - attendance patterns look normal!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {anomalies.anomalies.map((anomaly, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        anomaly.type === 'ZERO_ATTENDANCE'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-yellow-500/10 border-yellow-500/30'
                      }`}
                    >
                      <div className="flex gap-4">
                        <AlertTriangle
                          size={20}
                          className={
                            anomaly.type === 'ZERO_ATTENDANCE'
                              ? 'text-red-400 flex-shrink-0 mt-1'
                              : 'text-yellow-400 flex-shrink-0 mt-1'
                          }
                        />
                        <div>
                          <p className="font-bold text-white">Student: {anomaly.student_id}</p>
                          <p className="text-sm text-text-dark-secondary mb-2">{anomaly.description}</p>
                          <p className="text-sm font-bold">{anomaly.attendance_rate.toFixed(1)}% Attendance</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FRIENDSHIPS TAB */}
      {activeTab === 'friendships' && (
        <div className="space-y-6">
          <button
            onClick={handleAnalyzeFriendships}
            className="bg-primary-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark/90 transition-colors"
          >
            👥 Analyze Student Friendships
          </button>

          {friendships && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">
                🤝 Student Friendships & Closeness
              </h3>
              <p className="text-text-dark-secondary text-sm mb-6">
                Students who attend classes together frequently are likely to be friends or study partners.
              </p>

              {friendships.total_friendships === 0 ? (
                <p className="text-text-dark-secondary text-center py-8">No strong friendship connections detected yet.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {friendships.friendships.map((friend, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      friend.friendship_strength === 'CLOSE' ? 'bg-purple-500/10 border-purple-500/30' :
                      friend.friendship_strength === 'MODERATE' ? 'bg-blue-500/10 border-blue-500/30' :
                      'bg-cyan-500/10 border-cyan-500/30'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white">
                            {friend.student1_id.slice(0, 8)}... ↔ {friend.student2_id.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-text-dark-secondary">
                            Attended {friend.sessions_together} classes together
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${
                            friend.friendship_strength === 'CLOSE' ? 'text-purple-400' :
                            friend.friendship_strength === 'MODERATE' ? 'text-blue-400' :
                            'text-cyan-400'
                          }`}>
                            {friend.friendship_strength}
                          </p>
                          <p className="text-xs text-text-dark-secondary">
                            {(friend.similarity_score * 100).toFixed(0)}% match
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full"
                          style={{ width: `${friend.similarity_score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* WELLNESS RISK TAB */}
      {activeTab === 'wellness' && (
        <div className="space-y-6">
          <button
            onClick={handleAssessWellnessRisk}
            className="bg-primary-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark/90 transition-colors"
          >
            <Heart size={18} className="inline mr-2" />
            Assess Wellness Risk
          </button>

          {wellnessRisks && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">
                💪 Wellness & Health Risk Assessment
              </h3>
              <p className="text-text-dark-secondary text-sm mb-6">
                Students with sudden absences or frequent absences may need wellness check-ins for health or personal issues.
              </p>

              {wellnessRisks.total_at_risk === 0 ? (
                <p className="text-text-dark-secondary text-center py-8">✓ All students appear to be in good health!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {wellnessRisks.at_wellness_risk.map((risk, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      risk.risk_level === 'HIGH' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-white">Student: {risk.student_id.slice(0, 12)}...</p>
                          <div className="text-xs text-text-dark-secondary mt-1 space-y-0.5">
                            {risk.risk_factors.map((factor, i) => (
                              <p key={i}>⚠ {factor}</p>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${risk.risk_level === 'HIGH' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {risk.risk_level}
                          </p>
                          <p className="text-xs text-text-dark-secondary mt-1">
                            {(risk.wellness_risk_score * 100).toFixed(0)}% risk
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-text-dark-secondary bg-black/30 p-2 rounded mt-2">
                        → {risk.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PERFORMANCE RISK TAB */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <button
            onClick={handlePredictPerformers}
            className="bg-primary-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark/90 transition-colors"
          >
            <TrendingDown size={18} className="inline mr-2" />
            Predict Performance Risk
          </button>

          {performanceRisks && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">
                📊 Performance Risk Prediction
              </h3>
              <p className="text-text-dark-secondary text-sm mb-6">
                Students with inconsistent or low attendance are at risk of performing poorly academically.
              </p>

              {performanceRisks.total_at_risk === 0 ? (
                <p className="text-text-dark-secondary text-center py-8">✓ No students at performance risk!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {performanceRisks.poor_performers.map((performer, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      performer.risk_level === 'CRITICAL' ? 'bg-red-600/20 border-red-500' :
                      performer.risk_level === 'HIGH' ? 'bg-red-500/10 border-red-500/30' :
                      'bg-orange-500/10 border-orange-500/30'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-white">Student: {performer.student_id.slice(0, 12)}...</p>
                          <p className="text-sm text-text-dark-secondary">Attendance: {(performer.attendance_rate * 100).toFixed(1)}%</p>
                          <div className="text-xs text-text-dark-secondary mt-2 space-y-0.5">
                            {performer.risk_reasons.map((reason, i) => (
                              <p key={i}>• {reason}</p>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${
                            performer.risk_level === 'CRITICAL' ? 'text-red-300' :
                            performer.risk_level === 'HIGH' ? 'text-red-400' :
                            'text-orange-400'
                          }`}>
                            {performer.risk_level}
                          </p>
                          <p className="text-xs text-text-dark-secondary mt-1">
                            {(performer.performance_risk_score * 100).toFixed(0)}% risk
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs font-bold text-text-dark-secondary mb-1">Actions needed:</p>
                        <ul className="text-xs text-text-dark-secondary space-y-0.5">
                          {performer.action_items.map((item, i) => (
                            <li key={i}>✓ {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ENGAGEMENT TAB */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <button
            onClick={handleCalculateEngagement}
            className="bg-primary-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-dark/90 transition-colors"
          >
            <Brain size={18} className="inline mr-2" />
            Calculate Engagement Scores
          </button>

          {engagementScores && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">
                🎯 Student Engagement Profiles
              </h3>
              <p className="text-text-dark-secondary text-sm mb-6">
                Engagement score combines attendance frequency (60%) and consistency (40%) to measure overall student engagement.
              </p>

              {engagementScores.engagement_profiles.length === 0 ? (
                <p className="text-text-dark-secondary text-center py-8">No engagement data available.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {engagementScores.engagement_profiles.slice(0, 20).map((profile, idx) => {
                    let colorClass = 'bg-gray-500/10 border-gray-500/30';
                    let textColor = 'text-gray-400';
                    
                    if (profile.engagement_level === 'EXCELLENT') {
                      colorClass = 'bg-emerald-500/10 border-emerald-500/30';
                      textColor = 'text-emerald-400';
                    } else if (profile.engagement_level === 'GOOD') {
                      colorClass = 'bg-blue-500/10 border-blue-500/30';
                      textColor = 'text-blue-400';
                    } else if (profile.engagement_level === 'FAIR') {
                      colorClass = 'bg-yellow-500/10 border-yellow-500/30';
                      textColor = 'text-yellow-400';
                    } else if (profile.engagement_level === 'LOW') {
                      colorClass = 'bg-orange-500/10 border-orange-500/30';
                      textColor = 'text-orange-400';
                    } else {
                      colorClass = 'bg-red-500/10 border-red-500/30';
                      textColor = 'text-red-400';
                    }
                    
                    return (
                      <div key={idx} className={`p-4 rounded-lg border ${colorClass}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-white">Student: {profile.student_id.slice(0, 12)}...</p>
                            <p className="text-sm text-text-dark-secondary mt-1">
                              Attended: {profile.present_count}/{profile.total_sessions} sessions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${textColor}`}>
                              {(profile.engagement_score * 100).toFixed(0)}%
                            </p>
                            <p className={`text-xs font-bold ${textColor}`}>
                              {profile.engagement_level}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={textColor.replace('text-', 'bg-')}
                            style={{ width: `${profile.engagement_score * 100}%`, height: '100%', borderRadius: '4px' }}
                          ></div>
                        </div>
                        <p className="text-xs text-text-dark-secondary mt-2">💡 {profile.insight}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function StatCard({ icon, label, value, bgColor, textColor }) {
  return (
    <div className={`${bgColor} border border-white/5 rounded-2xl p-6`}>
      <div className={`${textColor} mb-3`}>{icon}</div>
      <p className="text-text-dark-secondary text-sm mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default AnalyticsDashboard;
