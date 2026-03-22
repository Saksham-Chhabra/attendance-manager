import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, LayoutDashboard, Loader2 } from 'lucide-react';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/classes');
      const data = await res.json();
      if (data.status === 'success') {
        setClasses(data.data.classes);
      }
    } catch (err) {
      console.error('Failed to fetch classes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetch('http://localhost:5000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setClasses([...classes, data.data.class]);
        setShowModal(false);
        setNewClassName('');
      }
    } catch (err) {
      console.error('Failed to create class', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-poppins font-black tracking-tight mb-2">Faculty Dashboard</h2>
          <p className="text-text-dark-secondary">Manage your classrooms and student rosters.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary-dark text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-primary-dark/20"
        >
          <Plus size={20} /> New Class
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-dark animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-card-dark border border-white/5 rounded-3xl p-12 text-center text-text-dark-secondary flex flex-col items-center">
           <LayoutDashboard className="w-16 h-16 opacity-20 mb-4" />
           <p className="text-lg font-medium text-white mb-2">No active classes found</p>
           <p className="max-w-md mx-auto">You haven't created any classrooms yet. Click the "New Class" button above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Link 
              key={cls._id} 
              to={`/faculty/class/${cls._id}`}
              className="group bg-card-dark p-6 rounded-[2rem] shadow-sm border border-white/5 hover:border-primary-dark/50 hover:bg-white/[0.02] transition-all cursor-pointer block"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-primary-dark/10 rounded-2xl flex items-center justify-center text-primary-dark group-hover:bg-primary-dark group-hover:text-white transition-colors">
                    <Users size={24} />
                 </div>
                 <span className="bg-white/5 text-text-dark-secondary text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-white/5">
                    ID: {cls._id.substring(cls._id.length - 6)}
                 </span>
              </div>
              <h3 className="text-xl font-poppins font-black mb-1 group-hover:text-primary-dark transition-colors">{cls.name}</h3>
              <p className="text-text-dark-secondary text-sm font-medium mb-6">{cls.students?.length || 0} Enrolled Students</p>
              
              <div className="w-full bg-white/5 text-center text-white text-xs font-bold py-3 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                 Manage Classroom &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-card-dark border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-poppins font-black mb-2">Create New Class</h3>
              <p className="text-text-dark-secondary text-sm mb-8">Enter a descriptive name for your new classroom to generate a space for students.</p>
              
              <form onSubmit={handleCreateClass} className="space-y-6">
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-dark-secondary mb-2">Class Name</label>
                    <input 
                      type="text" 
                      autoFocus
                      required
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="e.g. CS101: Introduction to Computer Science"
                      className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-dark transition-colors"
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
                      disabled={creating}
                      className="flex-1 bg-primary-dark text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
