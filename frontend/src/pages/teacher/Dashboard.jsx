import React from 'react';

const TeacherDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Active Classes</h3>
          <p className="text-3xl font-bold text-emerald-600">4</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
          <p className="text-3xl font-bold text-emerald-600">120</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Attendance Sessions</h3>
          <p className="text-3xl font-bold text-emerald-600">24</p>
        </div>
      </div>
      <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
        Start New Session
      </button>
    </div>
  );
};

export default TeacherDashboard;
