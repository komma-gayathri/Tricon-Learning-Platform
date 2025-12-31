import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Read query param (?view=interns | trainers)
  const query = new URLSearchParams(location.search);
  const view = query.get("view");

  // Common links (Courses hidden for HR)
  const commonLinks = [
    { to: "/dashboard", label: "Overview" },
    ...(user?.role !== "HR"
      ? [{ to: "/courses", label: "Courses" }]
      : []),
  ];

  const internLinks = [
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
    { to: "/dashboard?view=interns", label: "Interns" },
    { to: "/dashboard?view=trainers", label: "Trainers" },
    { to: "/hr/batches", label: "Batches" },
    { to: "/hr/schedule", label: "Schedules" },
    { to: "/hr/performance", label: "Performance" },
  ];

  const linkClasses = (active) =>
    `block rounded-md px-3 py-2 text-sm font-medium ${
      active
        ? "bg-primary/10 text-primary"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white px-3 py-4">
      <nav className="space-y-1 text-sm">
        {/* Common Links */}
        {commonLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => linkClasses(isActive)}
          >
            {link.label}
          </NavLink>
        ))}

        <div className="mt-4 border-t pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {user?.role} Area
        </div>

        {/* HR LINKS WITH MANUAL ACTIVE STATE */}
        {user?.role === "HR" &&
          hrLinks.map((link) => {
            const isActive =
              (link.label === "Interns" && view === "interns") ||
              (link.label === "Trainers" && view === "trainers") ||
              (link.label === "Batches" &&
                location.pathname === "/hr/batches") ||
              (link.label === "Schedules" &&
                location.pathname === "/hr/schedule") ||
              (link.label === "Performance" &&
                location.pathname === "/hr/performance");

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={() => linkClasses(isActive)}
              >
                {link.label}
              </NavLink>
            );
          })}

        {/* Intern Links */}
        {user?.role === "Intern" &&
          internLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => linkClasses(isActive)}
            >
              {link.label}
            </NavLink>
          ))}

        {/* Trainer Links */}
        {user?.role === "TRAINER" &&
          trainerLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => linkClasses(isActive)}
            >
              {link.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
