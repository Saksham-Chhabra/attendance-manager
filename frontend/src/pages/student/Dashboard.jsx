import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, LayoutDashboard, Loader2, LogIn } from 'lucide-react';
import api from '../../lib/axios';

const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.status === 'success') {
        setClasses(res.data.data.classes);
      }
    } catch (err) {
      console.error('Failed to fetch classes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    setJoining(true);
    setErrorMsg('');
    try {
      const res = await api.post('/classes/join', { joinCode });
      if (res.data.status === 'success') {
        setClasses([...classes, res.data.data.class]);
        setShowModal(false);
        setJoinCode('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to join class. Invalid code.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-6 sm:gap-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-poppins font-black tracking-tight mb-2">Student Dashboard</h2>
          <p className="text-text-dark-secondary">View your enrolled classes and track your attendance.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <LogIn size={20} /> Join Class
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-dark animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-card-dark border border-white/5 rounded-3xl p-12 text-center text-text-dark-secondary flex flex-col items-center shadow-xl">
           <LayoutDashboard className="w-16 h-16 opacity-20 mb-4" />
           <p className="text-lg font-medium text-white mb-2">Not Enrolled</p>
           <p className="max-w-md mx-auto">You aren't enrolled in any classes yet. Click "Join Class" and enter the 6-digit code provided by your professor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Link 
              to={`/student/class/${cls._id}`}
              key={cls._id} 
              className="group bg-card-dark p-6 rounded-[2rem] shadow-xl border border-white/5 hover:border-primary-dark/50 hover:bg-white/[0.02] transition-all cursor-pointer block"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-primary-dark/10 rounded-2xl flex items-center justify-center text-primary-dark">
                    <Users size={24} />
                 </div>
                 <span className="bg-white/5 text-text-dark-secondary text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-white/5">
                    Professor: {cls.teacher?.name ? cls.teacher.name.split(' ')[0] : 'Faculty'}
                 </span>
              </div>
              <h3 className="text-xl font-poppins font-black mb-1 text-white">{cls.name}</h3>
              <p className="text-text-dark-secondary text-sm font-medium mb-6">Enrolled via Code: {cls.joinCode}</p>
              
              <div className="w-full bg-primary-dark/10 text-center text-primary-dark text-xs font-bold py-3 rounded-xl border border-primary-dark/10 group-hover:bg-primary-dark group-hover:text-white transition-colors">
                 View Analytics &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* JOIN CLASS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4 sm:p-0">
          <div className="fixed inset-0 z-40" onClick={() => setShowModal(false)} />
          <div className="bg-card-dark border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-50 max-h-[90vh] overflow-y-auto">
             <h3 className="text-2xl font-poppins font-black mb-2">Join a Classroom</h3>
             <p className="text-text-dark-secondary text-sm mb-6">Enter the 6-character unique join code displayed on your professor's smartboard.</p>
             
             {errorMsg && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center">
                   {errorMsg}
                </div>
             )}

             <form onSubmit={handleJoinClass} className="space-y-6">
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-2">6-Digit Code</label>
                   <input 
                     type="text" 
                     autoFocus
                     required
                     maxLength={6}
                     value={joinCode}
                     onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                     placeholder="e.g. A1B2C3"
                     className="w-full text-center tracking-[1em] text-2xl font-black bg-bg-dark border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors uppercase placeholder:text-white/10 placeholder:tracking-normal placeholder:font-medium placeholder:text-left"
                   />
                </div>
                
                <div className="flex gap-4">
                   <button 
                     type="button" 
                     onClick={() => {setShowModal(false); setErrorMsg('');}}
                     className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     disabled={joining}
                     className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                   >
                     {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn size={18}/> Join</>}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
