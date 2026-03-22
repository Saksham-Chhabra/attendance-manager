import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <h2 className="text-4xl font-extrabold text-gray-800 text-center">
        Welcome to Attendify
      </h2>
      <p className="text-lg text-gray-600 max-w-md text-center">
        Modern attendance management system. Select your portal to get started.
      </p>
      <div className="flex gap-4">
        <Link to="/student/dashboard" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Student Portal
        </Link>
        <Link to="/teacher/dashboard" className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
          Teacher Portal
        </Link>
        <Link to="/admin/dashboard" className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
          Admin Portal
        </Link>
        <Link to="/ml/demo" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          ML Demo
        </Link>
      </div>
    </div>
  );
};

export default Home;
