import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
 
const Sidebar = () => {
  const { user } = useAuth();
 
  const commonLinks = [
    { to: "/dashboard", label: "Overview" },
  ];
 
  const internLinks = [
    { to: "/intern/courses", label: "Courses" },  
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
  if (user?.role === "Intern") roleLinks = internLinks;
  if (user?.role === "TRAINER") roleLinks = trainerLinks;
  if (user?.role === "HR") roleLinks = hrLinks;
 
  const linkClasses = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm font-medium ${
      isActive
        ? "bg-primary/10 text-primary"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
 
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white px-3 py-4">
      <nav className="space-y-1 text-sm">
        {commonLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClasses}>
            {link.label}
          </NavLink>
        ))}
        <div className="mt-4 border-t pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {user?.role} Adminstrations
        </div>
        {roleLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClasses}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
 
export default Sidebar;
 
 