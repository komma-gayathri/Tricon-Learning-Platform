import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6 shadow-sm sticky top-0 z-30">
      {/* LEFT: TOGGLE + LOGO */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu - Only visible on mobile/tablet */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Learn Pathway"
            className="h-8 w-8 object-contain"
          />
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-slate-800">
              Learn Pathway
            </p>
            <p className="text-xs text-slate-500">
              Learn • Practice • Perform
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: USER DROPDOWN */}
      {user && (
        <div className="relative" ref={dropdownRef}>
          {/* AVATAR */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {initial}
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-xl z-50">
              {/* USER INFO */}
              <div className="flex items-center gap-3 px-4 py-4 border-b">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-base font-semibold text-slate-700">
                  {initial}
                </div>

                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-[180px]">
                    {user.email}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="py-1">
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
