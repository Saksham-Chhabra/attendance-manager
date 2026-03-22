import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Link as LinkIcon, Loader2, Play, Activity, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ClassDetail = () => {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Add Student State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('roll'); // 'roll' or 'email'
  const [newStudent, setNewStudent] = useState({ rollNumber: '', email: '', name: '' });
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchClassData();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const [classRes, analyticsRes] = await Promise.all([
         fetch(`http://localhost:5000/api/classes/${id}`),
         fetch(`http://localhost:5000/api/classes/${id}/analytics`)
      ]);

      const classData = await classRes.json();
      const analyticsData = await analyticsRes.json();

      if (classData.status === 'success') {
        setCls(classData.data.class);
      }
      if (analyticsData.status === 'success') {
        setAnalytics(analyticsData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAdding(true);
    setErrorMsg('');

    const payload = {};
    if (addMode === 'roll') {
        if (!newStudent.rollNumber) { setErrorMsg("Roll number required"); setAdding(false); return; }
        payload.rollNumber = newStudent.rollNumber;
        payload.name = newStudent.name || `Student ${newStudent.rollNumber}`; // Fallback if creating new stub
        payload.email = newStudent.email || `student${newStudent.rollNumber}@college.edu`;
    } else {
        if (!newStudent.email) { setErrorMsg("Email required"); setAdding(false); return; }
        payload.email = newStudent.email;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/classes/${id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setShowAddModal(false);
        setNewStudent({ rollNumber: '', email: '', name: '' });
        fetchClassData(); // refresh roster and analytics
      } else {
        setErrorMsg(data.message || 'Failed to add student');
      }
    } catch (err) {
      setErrorMsg('Server error. Please try again.');
    } finally {
      setAdding(false);
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

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
       <Link to="/faculty/classes" className="inline-flex items-center gap-2 text-text-dark-secondary hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Back to Dashboard
       </Link>

       <div className="bg-card-dark border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-dark/5 blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 relative z-10">
             <div>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-12 h-12 bg-primary-dark/10 rounded-2xl flex items-center justify-center text-primary-dark border border-primary-dark/20">
                      <Users size={24} />
                   </div>
                   <span className="bg-white/5 text-text-dark-secondary text-xs uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border border-white/5">
                      Class ID: {cls._id}
                   </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-poppins font-black text-white">{cls.name}</h1>
                <p className="text-text-dark-secondary font-medium mt-2">Manage roster and view attendance analytics.</p>
             </div>

             <div className="flex gap-4">
                <button 
                   onClick={() => setShowAddModal(true)}
                   className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-xl border border-white/10 transition-colors flex items-center gap-2"
                >
                   <UserPlus size={20} /> Enroll
                </button>
                <Link 
                   to={`/faculty/class/${cls._id}/attendance`}
                   className="bg-primary-dark hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary-dark/20 transition-colors flex items-center gap-2 group"
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
             <p className="mt-6 text-sm text-blue-200 font-medium relative z-10 max-w-xs">Across all {analytics.metrics.totalSessions} sessions conducted in this classroom.</p>
          </div>
       </div>
       )}

       {/* STUDENTS ROSTER & INDIVIDUAL METRICS */}
       <div>
          <h2 className="text-2xl font-poppins font-black mb-6 flex items-center gap-3">
             <LinkIcon size={24} className="text-primary-dark" />
             Enrolled Roster <span className="text-text-dark-secondary text-lg">({cls.students?.length || 0})</span>
          </h2>

          {cls.students?.length === 0 ? (
             <div className="text-center py-12 bg-bg-dark border border-white/5 rounded-3xl mt-4">
                <p className="text-text-dark-secondary">No students enrolled yet.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {analytics && analytics.studentStats.map((student) => (
                   <div key={student._id} className="bg-card-dark border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:border-primary-dark/30 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                      
                      {/* Radial Progress Ring */}
                      <CircularProgress value={student.attendanceRate} />

                      <div className="flex-1 min-w-0">
                         <h4 className="font-poppins font-bold text-white truncate group-hover:text-primary-dark transition-colors">{student.name}</h4>
                         <p className="text-xs text-text-dark-secondary -mt-0.5 truncate">{student.email}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] uppercase tracking-widest text-text-dark-secondary font-bold">Roll</p>
                         <p className="text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded-md mt-0.5">{student.rollNumber || 'N/A'}</p>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>

       {/* ADD STUDENT MODAL */}
       {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
             <div className="bg-card-dark border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-2xl font-poppins font-black mb-2">Enroll Student</h3>
                <p className="text-text-dark-secondary text-sm mb-6">Add an existing student or create a new profile linked to their ML embeddings.</p>

                <div className="flex bg-bg-dark p-1 rounded-xl mb-6">
                   <button 
                     onClick={() => { setAddMode('roll'); setErrorMsg(''); }}
                     className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${addMode==='roll' ? 'bg-card-dark text-white shadow' : 'text-text-dark-secondary hover:text-white'}`}
                   >
                      By Roll Number (ML)
                   </button>
                   <button 
                     onClick={() => { setAddMode('email'); setErrorMsg(''); }}
                     className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${addMode==='email' ? 'bg-card-dark text-white shadow' : 'text-text-dark-secondary hover:text-white'}`}
                   >
                      By Email
                   </button>
                </div>

                {errorMsg && (
                   <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center">
                      {errorMsg}
                   </div>
                )}

                <form onSubmit={handleAddStudent} className="space-y-6">
                   {addMode === 'roll' ? (
                      <>
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-2">ML Roll Number *</label>
                           <input 
                             type="text" required
                             value={newStudent.rollNumber} onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
                             placeholder="e.g. 1042"
                             className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-dark"
                           />
                           <p className="text-[10px] text-text-dark-secondary mt-2">This exactly matches the `roll_number` in embeddings.json</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-2">Name (Optional)</label>
                              <input 
                                type="text"
                                value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                                placeholder="Student Name"
                                className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-dark"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-2">Email (Optional)</label>
                              <input 
                                type="email"
                                value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                                placeholder="Email"
                                className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-dark"
                              />
                           </div>
                        </div>
                      </>
                   ) : (
                      <div>
                         <label className="block text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-2">Student Email Account *</label>
                         <input 
                           type="email" required
                           value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                           placeholder="student@college.edu"
                           className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-dark"
                         />
                      </div>
                   )}

                   <div className="flex gap-4 pt-4 border-t border-white/5">
                      <button 
                        type="button" 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={adding}
                        className="flex-1 bg-primary-dark text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus size={18}/> Add Student</>}
                      </button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
};

export default ClassDetail;
