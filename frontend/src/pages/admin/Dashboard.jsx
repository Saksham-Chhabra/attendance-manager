import React, { useState, useEffect } from 'react';
import { Users, UserPlus, GraduationCap, ShieldAlert, Loader2, Network } from 'lucide-react';
import api from '../../lib/axios';

const AdminDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [teacherForm, setTeacherForm] = useState({
     name: '',
     email: '',
     password: ''
  });

  const [domainData, setDomainData] = useState({ 
     domain: '', 
     teachers: [],
     stats: { totalStudents: 0, totalClasses: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDomainTeachers();
  }, []);

  const fetchDomainTeachers = async () => {
     try {
       const res = await api.get('/admin/teachers');
       if (res.data.status === 'success') {
          setDomainData({
            domain: res.data.data.domain,
            teachers: res.data.data.teachers,
            stats: res.data.data.stats
          });
       }
     } catch (err) {
       console.error("Failed to fetch domain faculty", err);
     } finally {
       setLoading(false);
     }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const res = await api.post('/auth/register', {
         ...teacherForm,
         role: 'teacher'
      });
      
      if (res.data.status === 'success') {
         setSuccessMsg(`Successfully provisioned faculty account for ${teacherForm.name}.`);
         setTeacherForm({ name: '', email: '', password: '' });
         fetchDomainTeachers();
         setTimeout(() => setShowModal(false), 2000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create faculty account.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-6 sm:gap-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-poppins font-black tracking-tight mb-2">Admin Control Center</h2>
          <p className="text-text-dark-secondary">Monitor system integrity and provision faculty accounts.</p>
        </div>
        <button 
          onClick={() => {setShowModal(true); setSuccessMsg(''); setErrorMsg('');}}
          className="w-full sm:w-auto bg-amber-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
        >
          <UserPlus size={20} /> Provision Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-card-dark p-6 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-emerald-500/10"><Users size={120} /></div>
            <h3 className="text-text-dark-secondary text-[10px] uppercase font-bold tracking-widest mb-1 relative z-10">Total Enrolled Students</h3>
            <p className="text-5xl font-black text-white font-poppins relative z-10">{loading ? '--' : domainData.stats.totalStudents}</p>
         </div>
         <div className="bg-card-dark p-6 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-primary-dark/10"><GraduationCap size={120} /></div>
            <h3 className="text-text-dark-secondary text-[10px] uppercase font-bold tracking-widest mb-1 relative z-10">Active Classrooms</h3>
            <p className="text-5xl font-black text-white font-poppins relative z-10">{loading ? '--' : domainData.stats.totalClasses}</p>
         </div>
         <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 p-6 rounded-[2rem] shadow-xl border border-amber-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-amber-500/10"><ShieldAlert size={120} /></div>
            <h3 className="text-amber-500/80 text-[10px] uppercase font-bold tracking-widest mb-1 relative z-10">System Status</h3>
            <p className="text-3xl font-black text-white font-poppins relative z-10 mt-2">Operational</p>
            <p className="text-xs font-bold text-amber-200/50 mt-1 relative z-10">All cluster shards optimal.</p>
         </div>
      </div>

      {/* DOMAIN BOUND FACULTY ROSTER */}
      <div className="pt-4">
         <h2 className="text-2xl font-poppins font-black mb-6 flex items-center gap-3">
            <Network size={24} className="text-amber-500" />
            Domain Faculty <span className="bg-white/5 border border-white/5 px-3 py-1 rounded-lg text-sm text-text-dark-secondary uppercase tracking-widest font-bold">@{domainData.domain || '...'}</span>
         </h2>
         
         {loading ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
         ) : domainData.teachers.length === 0 ? (
            <div className="bg-bg-dark border border-white/5 rounded-3xl py-12 text-center text-text-dark-secondary">
               <p className="font-semibold">No faculty members found registered under this domain.</p>
               <p className="text-sm mt-1">Use the Provision button above to assign authorization.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {domainData.teachers.map((t) => (
                  <div key={t._id} className="bg-card-dark border border-white/5 p-5 rounded-2xl flex items-center gap-4 hover:border-amber-500/30 transition-colors group">
                     <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-xl group-hover:scale-110 transition-transform">
                        {t.name.charAt(0)}
                     </div>
                     <div>
                        <h4 className="font-poppins font-bold text-white group-hover:text-amber-500 transition-colors">{t.name}</h4>
                        <p className="text-xs text-text-dark-secondary">{t.email}</p>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>

      {/* CREATE TEACHER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4 sm:p-0">
          <div className="bg-card-dark border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-50">
             <h3 className="text-2xl font-poppins font-black mb-2">Provision Faculty</h3>
             <p className="text-text-dark-secondary text-sm mb-6">Create an authoritative Teacher account with full write-access to the ML Engine.</p>
             
             {errorMsg && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center">
                   {errorMsg}
                </div>
             )}
             {successMsg && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium text-center animate-in zoom-in">
                   {successMsg}
                </div>
             )}

             <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-1.5 pl-1">Faculty Name</label>
                   <input 
                     type="text" required autoFocus
                     value={teacherForm.name} onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                     placeholder="e.g. Dr. Alan Turing"
                     className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-1.5 pl-1">University Email</label>
                   <input 
                     type="email" required
                     value={teacherForm.email} onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                     placeholder="alan@university.edu"
                     className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                   />
                </div>
                <div className="pb-4">
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-1.5 pl-1">Initial Password</label>
                   <input 
                     type="text" required minLength={6}
                     value={teacherForm.password} onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})}
                     placeholder="Temporary secure password"
                     className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                   />
                </div>
                
                <div className="flex gap-4">
                   <button 
                     type="button" 
                     onClick={() => setShowModal(false)}
                     className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     disabled={creating || successMsg}
                     className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                   >
                     {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Provision'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
