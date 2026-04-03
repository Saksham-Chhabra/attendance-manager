import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScanEye, Loader2, UserPlus } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', rollNumber: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/student/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
       // Force role to student explicitly
      await register({ ...formData, role: 'student' });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full point-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full point-events-none" />

      <div className="bg-card-dark border border-white/5 w-full max-w-md rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10 animate-in slide-in-from-bottom-8 duration-700">
         <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)] mb-6">
               <UserPlus size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-poppins font-black tracking-tight text-white uppercase">Student Signup</h1>
            <p className="text-text-dark-secondary mt-2 font-medium text-sm">Create your attendee account</p>
         </div>

         {errorMsg && (
           <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium text-center">
             {errorMsg}
           </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-1 pl-1">Full Name</label>
               <input 
                 type="text" required autoFocus
                 value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                 placeholder="e.g. John Doe"
                 className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-white/10"
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-1 pl-1">University Email</label>
               <input 
                 type="email" required 
                 value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                 placeholder="student@university.edu"
                 className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-white/10"
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-1 pl-1">Roll Number</label>
               <input 
                 type="text" required 
                 value={formData.rollNumber} onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                 placeholder="e.g. 23BCS123"
                 className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-white/10"
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-1 pl-1">Secure Password</label>
               <input 
                 type="password" required minLength={6}
                 value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                 placeholder="••••••••"
                 className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-white/10"
               />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2 tracking-widest uppercase text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
         </form>

         <div className="mt-8 text-center pt-2">
            <p className="text-sm text-text-dark-secondary font-medium">
               Already have an account? <Link to="/login" className="text-emerald-400 font-bold hover:underline">Log In here</Link>.
            </p>
         </div>
      </div>
    </div>
  );
};

export default Register;
