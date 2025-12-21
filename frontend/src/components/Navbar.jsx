import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary"></div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-800">
            LMS Training Portal
          </p>
          <p className="text-xs text-slate-500">Learn • Practice • Perform</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {user.role}
            </p>
          </div>
        )}
        {user && (
          <button
            onClick={logout}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};
export default Navbar;