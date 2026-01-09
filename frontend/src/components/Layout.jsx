import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
