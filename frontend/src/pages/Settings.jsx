import React from 'react';
import { User, Settings as SettingsIcon, Shield, Bell, Moon, LogOut } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Settings = () => {
   const { user, logout } = useAuthStore();

   return (
      <div className="p-4 sm:p-8 space-y-8 animate-in fade-in max-w-4xl mx-auto">
         <div>
            <h2 className="text-2xl sm:text-3xl font-poppins font-black tracking-tight mb-2">Account Settings</h2>
            <p className="text-text-dark-secondary">Manage your user profile and active security constraints.</p>
         </div>

         <div className="bg-card-dark border border-white/5 rounded-3xl p-8 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-dark-secondary flex items-center gap-2 mb-6">
               <User size={16} /> Public Profile
            </h3>
            
            <div className="flex items-center gap-6 mb-8">
               <div className="w-20 h-20 bg-primary-dark/20 text-primary-dark rounded-full flex items-center justify-center text-2xl font-black border-2 border-primary-dark/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-4 ring-bg-dark">
                  {user?.name?.charAt(0).toUpperCase()}
               </div>
               <div>
                  <p className="text-xl font-bold text-white mb-1">{user?.name}</p>
                  <p className="text-sm text-text-dark-secondary">{user?.email}</p>
                  <div className="mt-2 text-[10px] uppercase font-black tracking-widest bg-white/10 text-white px-3 py-1 rounded-md inline-block">
                     {user?.role} ROLE
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-1 block">Full Name</label>
                  <input type="text" readOnly className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white opacity-60 cursor-not-allowed" value={user?.name || ''} />
               </div>
               <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-1 block">Email Address</label>
                  <input type="email" readOnly className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white opacity-60 cursor-not-allowed" value={user?.email || ''} />
               </div>
               {user?.role === 'student' && (
               <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-1 block">Roll Number (ML ID)</label>
                  <input type="text" readOnly className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white opacity-60 cursor-not-allowed" value={user?.rollNumber || ''} />
               </div>
               )}
            </div>
         </div>

         <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2 mb-6">
               <Shield size={16} /> Danger Zone
            </h3>
            <p className="text-sm text-text-dark-secondary mb-4">You are currently operating from an end-to-end encrypted session framework.</p>
            <button 
               onClick={() => logout()}
               className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20"
            >
               <LogOut size={18} /> Sign Out
            </button>
         </div>

      </div>
   );
};

export default Settings;
