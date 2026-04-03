import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, ShieldCheck, ShieldAlert, Loader2, Calendar } from 'lucide-react';
import api from '../../lib/axios';
import ErrorBoundary from '../../components/ErrorBoundary';

const StudentClassDetail = () => {
   const { id } = useParams();
   const [data, setData] = useState(null);
   const [loading, setLoading] = useState(true);
   const [errorMsg, setErrorMsg] = useState('');

   useEffect(() => {
     fetchAnalytics();
   }, [id]);

   const fetchAnalytics = async () => {
      try {
         const res = await api.get(`/classes/${id}/student-analytics`);
         if (res.data.status === 'success') {
            setData(res.data.data);
         }
      } catch (err) {
         setErrorMsg(err.response?.data?.message || 'Failed to initialize class layout.');
      } finally {
         setLoading(false);
      }
   };

   // Radial Progression Arc Component
   const MainProgressRadial = ({ rate }) => {
      const radius = 60;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (rate / 100) * circumference;
      
      const isGood = rate >= 75;
      const isWarn = rate >= 50 && rate < 75;
      const color = isGood ? 'text-emerald-500' : isWarn ? 'text-yellow-500' : 'text-red-500';

      return (
         <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
            <svg className="transform -rotate-90 w-48 h-48 drop-shadow-2xl">
               <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
               <circle 
                  cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                  className={`${color} transition-all duration-[1.5s] ease-out`} 
               />
            </svg>
            <div className="absolute flex flex-col items-center">
               <span className="text-5xl font-black font-poppins text-white">{rate}%</span>
               <span className="text-[10px] text-text-dark-secondary font-bold uppercase tracking-widest mt-1">Attendance Rate</span>
            </div>
         </div>
      );
   };

   if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-primary-dark" /></div>;
   if (errorMsg || !data) return <div className="p-8 text-center text-red-400 font-bold">{errorMsg || "System Error"}</div>;

   const { classDetails, metrics, history } = data;

   return (
      <ErrorBoundary>
         <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            
            <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-text-dark-secondary hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
               <ArrowLeft size={16} /> Dashboard
            </Link>

            {/* HERO OVERVIEW */}
            <div className="bg-card-dark border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="absolute top-0 right-0 w-96 h-96 bg-primary-dark/10 blur-[100px] -mr-48 -mt-48 pointer-events-none" />
               
               <div className="relative z-10 flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-xs font-bold text-text-dark-secondary tracking-widest uppercase mb-4">
                     <Activity size={14} className="text-primary-dark" />
                     {classDetails.teacher}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-poppins font-black text-white leading-tight mb-2">
                     {classDetails.name}
                  </h1>
                  <p className="text-text-dark-secondary font-medium">
                     You have attended <strong className="text-white">{metrics.attendedSessions}</strong> out of <strong className="text-white">{metrics.totalSessions}</strong> recorded sessions.
                  </p>
               </div>

               <div className="relative z-10 w-full md:w-auto">
                  <MainProgressRadial rate={metrics.attendanceRate} />
               </div>
            </div>

            {/* CHRONOLOGICAL HISTORY LOG */}
            <div className="mt-8">
               <h2 className="text-2xl font-poppins font-black mb-6 text-white flex items-center gap-3">
                  <Calendar size={24} className="text-primary-dark" /> Session History
               </h2>
               
               {history.length === 0 ? (
                  <div className="text-center py-12 bg-bg-dark border border-white/5 rounded-3xl">
                     <p className="text-text-dark-secondary font-medium">No sessions have been recorded for this classroom yet.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {history.map((sess, i) => (
                        <div key={sess.sessionId} className="group bg-card-dark border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-white/[0.02] transition-colors relative overflow-hidden">
                           {/* Status Accent Line */}
                           <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sess.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                           
                           <div className="flex items-center gap-4 pl-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sess.status === 'present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                 {sess.status === 'present' ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                              </div>
                              <div>
                                 <h4 className="font-bold text-white text-lg">Session {history.length - i}</h4>
                                 <p className="text-xs text-text-dark-secondary uppercase tracking-widest font-bold">
                                    {new Date(sess.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'})}
                                 </p>
                              </div>
                           </div>

                           <div className="text-right flex flex-col items-end gap-1">
                              <span className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase border ${
                                 sess.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                                 {sess.status}
                              </span>
                              <span className="text-[10px] text-text-dark-secondary uppercase tracking-widest bg-white/5 px-2 rounded-md font-bold mt-1">
                                 {sess.method.replace('_', ' ')}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

         </div>
      </ErrorBoundary>
   );
};

export default StudentClassDetail;
