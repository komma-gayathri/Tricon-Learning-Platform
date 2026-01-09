import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();

  const commonLinks = [
    { to: "/dashboard", label: "Overview" },
  ];

  const internLinks = [
    { to: "/intern/courses", label: "My Courses" },
    { to: "/intern/schedule", label: "Schedule" },
    { to: "/intern/assignments", label: "Assignments" },
    { to: "/intern/doubts", label: "Doubts" },
  ];

  const trainerLinks = [
    { to: "/trainer/courses", label: "My Courses" },
    { to: "/trainer/assignments", label: "Assignments" },
    { to: "/trainer/doubts", label: "Doubts" },
    { to: "/trainer/schedule", label: "Schedules" },
  ];

  const hrLinks = [
    { to: "/courses", label: "Courses" },
    { to: "/hr/batches", label: "Batches" },
    { to: "/hr/schedule", label: "Schedules" },
    { to: "/hr/interns", label: "Interns" },
    { to: "/hr/trainers", label: "Trainers" },
    { to: "/hr/performance", label: "Performance" },
  ];

  let roleLinks = [];
  const userRole = user?.role?.toUpperCase();
  if (userRole === "INTERN") roleLinks = internLinks;
  if (userRole === "TRAINER") roleLinks = trainerLinks;
  if (userRole === "HR") roleLinks = hrLinks;

  const linkClasses = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
      ? "bg-primary/10 text-primary"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}>
      <div className="flex h-full flex-col px-3 py-4">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <span className="font-bold text-slate-800">Menu</span>
          <button onClick={closeSidebar} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-1 text-sm flex-1">
          {commonLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses} onClick={closeSidebar}>
              {link.label}
            </NavLink>
          ))}
          <div className="mt-8 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {user?.role} Administration
          </div>
          {roleLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses} onClick={closeSidebar}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
