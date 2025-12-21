import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="logo">Intern Panel</h2>
        <nav>
          <button onClick={() => navigate("/dashboard")}>Overview</button>
          <button onClick={() => navigate("/intern/schedule")}>Schedule</button>
          <button onClick={() => navigate("/intern/assignments")}>Assignments</button>
          <button onClick={() => navigate("/intern/quiz")}>Quizzes</button>
          <button onClick={() => navigate("/intern/doubts")}>Doubts</button>
        </nav>
      </aside>
      {/* MAIN CONTENT */}
      <main className="content">
        <h1>Welcome {user?.name}</h1>
        <p className="subtitle">
          Track your progress, schedule, assignments and quizzes
        </p>

        <div className="grid">
          <div className="card" onClick={() => navigate("/intern/schedule")}>
            <h3>Schedule</h3>
            <p>View your daily training sessions</p>
          </div>
          <div className="card" onClick={() => navigate("/intern/assignments")}>
            <h3>Assignments</h3>
            <p>View and submit assignments</p>
          </div>
          <div className="card" onClick={() => navigate("/intern/quiz")}>
            <h3>Quizzes</h3>
            <p>Attempt quizzes assigned by trainer</p>
          </div>
          <div className="card" onClick={() => navigate("/intern/doubts")}>
            <h3>Doubts</h3>
            <p>Ask questions and track responses</p>
          </div>
        </div>
      </main>
      {/* STYLES */}
      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
          background: #f9fafb;
        }

        /* SIDEBAR */
        .sidebar {
          width: 230px;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          padding: 24px 16px;
        }

        .logo {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 30px;
        }

        .sidebar nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sidebar button {
          text-align: left;
          padding: 10px 14px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .sidebar button:hover {
          background: #fdf2f8;
        }

        /* MAIN CONTENT */
        .content {
          flex: 1;
          padding: 32px;
        }

        .subtitle {
          color: #6b7280;
          margin-bottom: 30px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .card:hover {
          background: #fdf2f8;
          transform: translateY(-2px);
        }

        .card h3 {
          font-size: 18px;
          margin-bottom: 6px;
        }

        .card p {
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
