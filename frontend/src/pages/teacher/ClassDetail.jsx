import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Link as LinkIcon, Loader2, Play, Activity, TrendingUp, RefreshCw, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/axios';
import ErrorBoundary from '../../components/ErrorBoundary';

const ClassDetail = () => {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [removingStudent, setRemovingStudent] = useState(null);
  const [refreshingCode, setRefreshingCode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [filterMode, setFilterMode] = useState('all');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassData();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const [classRes, analyticsRes] = await Promise.all([
         api.get(`/classes/${id}`),
         api.get(`/classes/${id}/analytics`)
      ]);

      if (classRes.data.status === 'success') {
        setCls(classRes.data.data.class);
      }
      if (analyticsRes.data.status === 'success') {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
     if (!window.confirm("Are you sure you want to remove this student from the class?")) return;
     
     setRemovingStudent(studentId);
     try {
       const res = await api.delete(`/classes/${id}/students/${studentId}`);
       if (res.data.status === 'success') {
          fetchClassData();
       }
     } catch (err) {
       console.error("Failed to remove student", err);
       alert(err.response?.data?.message || "Failed to remove student");
     } finally {
       setRemovingStudent(null);
     }
  };

  const handleRefreshCode = async () => {
    if (!window.confirm("Are you sure? Old joining codes will instantly stop working.")) return;
    setRefreshingCode(true);
    try {
      const res = await api.post(`/classes/${id}/generate-code`);
      if (res.data.status === 'success') {
         setCls({ ...cls, joinCode: res.data.data.joinCode });
      }
    } catch (err) {
      console.error("Failed to refresh code", err);
    } finally {
      setRefreshingCode(false);
    }
  };

  const handleDeleteClass = async () => {
    setDeleting(true);
    try {
       const res = await api.delete(`/classes/${id}`);
       if (res.data.status === 'success') {
          setShowDeleteModal(false);
          navigate('/faculty/dashboard');
       }
    } catch (err) {
       console.error("Failed to delete class", err);
       alert(err.response?.data?.message || err.message);
       setDeleting(false);
    }
  };

  const CircularProgress = ({ value }) => {
     const radius = 16;
     const circumference = 2 * Math.PI * radius;
     const strokeDashoffset = circumference - (value / 100) * circumference;
     const colorClass = value >= 75 ? 'text-emerald-400' : value >= 50 ? 'text-yellow-400' : 'text-red-400';
     
     return (
        <div className="relative flex items-center justify-center w-12 h-12">
           <svg className="transform -rotate-90 w-12 h-12">
              <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/10" />
              <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" 
                 strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                 className={`${colorClass} transition-all duration-1000 ease-out`} 
              />
           </svg>
           <span className="absolute text-[10px] font-black">{value}%</span>
        </div>
     );
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-dark border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-white font-bold text-sm mb-1">{label}</p>
          <p className="text-text-dark-secondary text-xs mb-2">{payload[0].payload.date}</p>
          <div className="flex items-center gap-2">
             <span className="w-3 h-3 rounded-full bg-primary-dark shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
             <p className="text-white font-bold">{payload[0].value}% Attendance</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
     return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary-dark" /></div>;
  }

  if (!cls) {
     return <div className="p-8 text-white">Class not found</div>;
  }

  const filteredStudents = analytics?.studentStats.filter(s => {
    if (filterMode === 'all') return true;
    if (filterMode === 'excel') return s.attendanceRate >= 90;
    if (filterMode === 'pass') return s.attendanceRate >= 75;
    if (filterMode === 'warn') return s.attendanceRate < 75 && s.attendanceRate >= 50;
    if (filterMode === 'fail') return s.attendanceRate < 50;
    return true;
  }) || [];

  return (
     <ErrorBoundary>
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
       <Link to="/faculty/dashboard" className="inline-flex items-center gap-2 text-text-dark-secondary hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Back to Dashboard
       </Link>

        <div className="bg-card-dark border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-dark/5 blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 relative z-10 w-full">
             <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                   <div className="w-12 h-12 bg-primary-dark/10 rounded-2xl flex items-center justify-center text-primary-dark border border-primary-dark/20">
                      <Users size={24} />
                   </div>
                   <span className="bg-white/5 text-text-dark-secondary text-xs uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border border-white/5">
                      Class ID: {cls._id.substring(cls._id.length - 6)}
                   </span>
                   <span className="bg-emerald-500/10 text-emerald-400 text-xs uppercase font-black tracking-widest px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
                      <span>JOIN CODE: {cls.joinCode}</span>
                      <button 
                         onClick={handleRefreshCode} 
                         disabled={refreshingCode}
                         className="hover:text-emerald-200 transition-colors bg-black/20 p-1 rounded-md"
                         title="Generate new standard join code"
                      >
                         <RefreshCw size={12} className={refreshingCode ? "animate-spin" : ""} />
                      </button>
                   </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-poppins font-black text-white">{cls.name}</h1>
                <p className="text-text-dark-secondary font-medium mt-2">Manage roster and view attendance analytics.</p>
             </div>

             <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                <button
                   onClick={() => setShowDeleteModal(true)}
                   className="w-full sm:w-auto bg-transparent hover:bg-red-500/10 text-text-dark-secondary hover:text-red-400 font-bold py-3 px-6 rounded-xl border border-transparent hover:border-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                   <Trash2 size={18} /> Delete Server
                </button>
                <Link 
                   to={`/faculty/class/${cls._id}/attendance`}
                   className="w-full sm:w-auto justify-center bg-primary-dark hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary-dark/20 transition-colors flex items-center gap-2 group"
                >
                   <Play size={20} className="fill-current group-hover:scale-110 transition-transform" /> Take Attendance
                </Link>
             </div>
          </div>
       </div>

       {/* ANALYTICS DASHBOARD */}
       {analytics && (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline Chart */}
          <div className="lg:col-span-2 bg-card-dark border border-white/5 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-poppins font-black flex items-center gap-2">
                   <Activity className="text-primary-dark" size={24}/> Class Attendance Timeline
                </h2>
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-xs font-bold text-text-dark-secondary tracking-widest uppercase">
                   {analytics.metrics.totalSessions} Sessions Let
                </div>
             </div>
             
             {analytics.timeline.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-text-dark-secondary border-2 border-dashed border-white/10 rounded-2xl">
                   <TrendingUp size={32} className="opacity-20 mb-3" />
                   <p className="font-bold">No attendance sessions recorded yet.</p>
                   <p className="text-sm">Click 'Take Attendance' to start your first timeline.</p>
                </div>
             ) : (
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                         <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                         <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                         <Area type="monotone" dataKey="attendanceRate" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             )}
          </div>

          {/* Hero Metrics Card */}
          <div className="bg-gradient-to-br from-primary-dark/20 to-purple-600/20 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
             <p className="text-text-dark-secondary font-bold uppercase tracking-widest text-sm mb-4 relative z-10">Average Attendance</p>
             <div className="relative z-10 w-40 h-40 rounded-full border-4 border-white/10 flex items-center justify-center shadow-2xl group-hover:border-primary-dark/50 transition-colors duration-500">
                <span className="text-6xl font-black font-poppins text-white">{analytics.metrics.averageAttendance}%</span>
             </div>
             <p className="mt-6 text-xs sm:text-sm text-blue-200 font-medium relative z-10 max-w-xs px-4">Across all {analytics.metrics.totalSessions} sessions conducted in this classroom.</p>
          </div>
       </div>
       )}

       {/* STUDENTS ROSTER & INDIVIDUAL METRICS */}
       <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
             <h2 className="text-2xl font-poppins font-black flex items-center gap-3">
                <LinkIcon size={24} className="text-primary-dark" />
                Enrolled Roster <span className="text-text-dark-secondary text-lg">({cls.students?.length || 0})</span>
             </h2>

             {/* Roster Filters */}
             <div className="flex flex-wrap items-center gap-2 bg-black/20 p-2 rounded-2xl border border-white/5">
                {[
                   { id: 'all', label: 'All Students' },
                   { id: 'excel', label: '≥ 90%' },
                   { id: 'pass', label: '≥ 75%' },
                   { id: 'warn', label: '< 75%' },
                   { id: 'fail', label: '< 50%' },
                ].map(f => (
                   <button
                     key={f.id}
                     onClick={() => setFilterMode(f.id)}
                     className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                        filterMode === f.id 
                        ? 'bg-primary-dark text-white shadow-lg shadow-primary-dark/20' 
                        : 'text-text-dark-secondary hover:text-white hover:bg-white/5'
                     }`}
                   >
                     {f.label}
                   </button>
                ))}
             </div>
          </div>

          {cls.students?.length === 0 ? (
             <div className="text-center py-12 bg-bg-dark border border-white/5 rounded-3xl mt-4">
                <p className="text-text-dark-secondary">No students enrolled yet.</p>
             </div>
          ) : filteredStudents.length === 0 ? (
             <div className="text-center py-12 bg-bg-dark border border-white/5 rounded-3xl mt-4">
                <p className="text-text-dark-secondary font-medium">No students found matching this attendance filter.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {filteredStudents.map((student) => (
                   <div key={student._id} className="bg-card-dark border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:border-primary-dark/30 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                      
                      {/* Radial Progress Ring */}
                      <CircularProgress value={student.attendanceRate} />

                      <div className="flex-1 min-w-0">
                         <h4 className="font-poppins font-bold text-white truncate group-hover:text-primary-dark transition-colors">{student.name}</h4>
                         <p className="text-xs text-text-dark-secondary -mt-0.5 truncate">{student.email}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                         <button 
                            onClick={(e) => { e.preventDefault(); handleRemoveStudent(student._id); }}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded transition-colors"
                            disabled={removingStudent === student._id}
                         >
                            {removingStudent === student._id ? 'Removing...' : 'Remove'}
                         </button>
                         <p className="text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded-md mt-0.5">{student.rollNumber || 'N/A'}</p>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>

        {/* DELETE CLASS MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4 sm:p-0">
             <div className="fixed inset-0 z-40" onClick={() => setShowDeleteModal(false)} />
             <div className="bg-card-dark border border-red-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative z-50 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                   <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-poppins font-black mb-2 text-white">Delete Classroom</h3>
                <p className="text-text-dark-secondary text-sm mb-8">This action cannot be undone. This will permanently destruct the <strong className="text-white">{cls.name}</strong> environment along with all associated analytics data and securely disconnect enrolled students.</p>
                
                <div className="flex gap-4">
                   <button 
                     type="button" 
                     onClick={() => setShowDeleteModal(false)}
                     className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleDeleteClass} 
                     disabled={deleting}
                     className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                   >
                     {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                   </button>
                </div>
             </div>
          </div>
        )}
     </div>
     </ErrorBoundary>
  );
};

export default ClassDetail;
