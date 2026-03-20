import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold text-amber-600">1,240</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Active Classes</h3>
          <p className="text-3xl font-bold text-amber-600">45</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Teachers</h3>
          <p className="text-3xl font-bold text-amber-600">32</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Students</h3>
          <p className="text-3xl font-bold text-amber-600">1,208</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
