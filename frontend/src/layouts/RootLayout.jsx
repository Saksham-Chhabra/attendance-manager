import React from 'react';
import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full flex flex-col">
      <header className="bg-white shadow-sm h-16 flex items-center px-6">
        <h1 className="text-xl font-bold text-indigo-600">Attendify</h1>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
      <footer className="bg-white border-t p-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Attendify. All rights reserved.
      </footer>
    </div>
  );
};

export default RootLayout;
