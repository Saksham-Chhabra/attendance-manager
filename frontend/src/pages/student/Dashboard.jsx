import React from 'react';

const StudentDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Student Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Attendance Rate</h3>
          <p className="text-3xl font-bold text-indigo-600">85%</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Classes</h3>
          <p className="text-3xl font-bold text-indigo-600">12</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Pending Tasks</h3>
          <p className="text-3xl font-bold text-indigo-600">2</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
