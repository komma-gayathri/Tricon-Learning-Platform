import { NavLink } from "react-router-dom";

export default function HrSidebar() {
  return (
    <div className="hr-sidebar">
      <h2 className="title">HR Panel</h2>

      <NavLink to="/hr/overview">Overview</NavLink>
      <NavLink to="/hr/batches">Batches</NavLink>
      <NavLink to="/hr/reports">Reports</NavLink>
      <NavLink to="/hr/schedule">Schedule</NavLink>

      <style>{`
        .hr-sidebar {
          width: 220px;
          background: #111827;
          color: white;
          padding: 20px;
          min-height: 100vh;
        }

        .title {
          margin-bottom: 30px;
        }

        a {
          display: block;
          margin: 12px 0;
          color: #9ca3af;
          text-decoration: none;
          font-size: 15px;
        }

        a.active {
          color: white;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
