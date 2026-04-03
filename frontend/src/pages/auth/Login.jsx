import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScanEye, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleMode, setRoleMode] = useState('student'); // 'student', 'teacher', 'admin'
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
       if (user.role === 'admin') navigate('/admin/dashboard');
       else if (user.role === 'teacher') navigate('/faculty/dashboard');
       else navigate('/student/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await login(email, password, roleMode);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-dark/10 blur-[100px] rounded-full point-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full point-events-none" />

      <div className="bg-card-dark border border-white/5 w-full max-w-md rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10 animate-in slide-in-from-bottom-8 duration-700">
         <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-primary-dark rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-6">
               <ScanEye size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-poppins font-black tracking-tight tracking-widest text-primary-dark uppercase">Attendify</h1>
            <p className="text-text-dark-secondary mt-2 font-medium text-sm">Secure biometric session portal</p>
         </div>

         {/* ROLE SELECTION TABS */}
         <div className="flex bg-bg-dark rounded-xl p-1 mb-8 border border-white/5 shadow-inner">
            {['student', 'teacher', 'admin'].map((role) => (
              <button 
                key={role}
                onClick={() => { setRoleMode(role); setErrorMsg(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
                  roleMode === role 
                   ? 'bg-primary-dark text-white shadow-lg' 
                   : 'text-text-dark-secondary hover:text-white'
                }`}
              >
                 {role === 'teacher' ? 'Faculty' : role}
              </button>
            ))}
         </div>

         {errorMsg && (
           <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium text-center">
             {errorMsg}
           </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-6">
            <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-2 pl-1">Email Address</label>
               <input 
                 type="email" 
                 required 
                 autoFocus
                 value={email} 
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="portal@university.edu"
                 className="w-full bg-bg-dark border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary-dark transition-colors placeholder:text-white/10"
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dark-secondary mb-2 pl-1">Secure Password</label>
               <input 
                 type="password" 
                 required 
                 value={password} 
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="••••••••"
                 className="w-full bg-bg-dark border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary-dark transition-colors placeholder:text-white/10"
               />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-primary-dark hover:bg-blue-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary-dark/20 flex justify-center items-center gap-2 tracking-widest uppercase text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
            </button>
         </form>

         <div className="mt-8 text-center border-t border-white/5 pt-6 space-y-2">
            {roleMode === 'student' ? (
               <p className="text-sm text-text-dark-secondary font-medium">
                  Don't have an account? <Link to="/register" className="text-primary-dark font-bold hover:underline">Sign Up</Link>
               </p>
            ) : (
               <p className="text-xs text-text-dark-secondary font-medium uppercase tracking-widest">
                  Faculty and Admin bypass via IT only
               </p>
            )}
         </div>
      </div>
    </div>
  );
};

export default Login;
