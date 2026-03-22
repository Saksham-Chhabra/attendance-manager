import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  User,
  ScanEye
} from 'lucide-react';

const RootLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'ML Vision', icon: ScanEye, path: '/ml/demo' },
    { name: 'Classes', icon: Calendar, path: '/faculty/classes' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-text-dark font-sans flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-card-dark border-r border-white/5 
        transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary-dark/20">
               <div className="w-5 h-5 border-2 border-white rounded-sm rotate-45" />
            </div>
            <div>
              <h1 className="text-xl font-poppins font-black tracking-tight">Attendify</h1>
              <p className="text-[10px] text-text-dark-secondary font-bold uppercase tracking-widest leading-none">Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300
                    ${active 
                      ? 'bg-primary-dark text-white font-bold shadow-lg shadow-primary-dark/20' 
                      : 'text-text-dark-secondary hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <item.icon size={20} className={active ? 'animate-pulse' : ''} />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Mini */}
          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="flex items-center gap-4 p-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-dark to-purple-500 p-0.5">
                   <div className="w-full h-full rounded-full bg-card-dark flex items-center justify-center">
                      <User size={18} className="text-text-dark-secondary" />
                   </div>
                </div>
                <div>
                   <p className="text-xs font-black text-white">Prof. Saksham</p>
                   <p className="text-[9px] text-text-dark-secondary font-bold uppercase tracking-widest">Administrator</p>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVBAR */}
        <header className="h-20 bg-card-dark/40 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-40">
           <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-text-dark-secondary"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
           
           <div className="hidden lg:flex items-center gap-2 text-text-dark-secondary font-bold text-xs uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Portal Online · Academic Year 2024-25
           </div>

           <div className="flex items-center gap-6">
              <button className="relative p-2 text-text-dark-secondary hover:text-white transition-colors">
                 <Bell size={22} />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-primary-dark rounded-full border-2 border-card-dark" />
              </button>
              <div className="h-8 w-[1px] bg-white/5 mx-2" />
              <button className="flex items-center gap-3 group">
                 <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-dark group-hover:text-white transition-all duration-300">
                    <User size={18} />
                 </div>
              </button>
           </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
