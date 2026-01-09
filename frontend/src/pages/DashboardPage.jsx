import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Card from "../components/Card";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isHR = user?.role?.toUpperCase() === "HR";
  const isTrainer = user?.role?.toUpperCase() === "TRAINER";
  const isIntern = user?.role?.toUpperCase() === "INTERN";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data.stats);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const StatItem = ({ title, value, icon, colorClass }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClass} text-xl shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Welcome, {user?.name}
        </h1>
        <p className="text-sm text-slate-500">
          Monitor your training progress and manage upcoming tasks from your {user?.role?.toLowerCase()} dashboard.
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isHR && (
          <>
            <StatItem title="Batches" value={stats?.totalBatches || 0} icon="📦" colorClass="bg-blue-50 text-blue-600" />
            <StatItem title="Trainers" value={stats?.totalTrainers || 0} icon="👨‍🏫" colorClass="bg-indigo-50 text-indigo-600" />
            <StatItem title="Interns" value={stats?.totalInterns || 0} icon="🎓" colorClass="bg-emerald-50 text-emerald-600" />
            <StatItem title="Total Courses" value={stats?.totalCourses || 0} icon="🎥" colorClass="bg-slate-50 text-slate-600" />
          </>
        )}
        {isTrainer && (
          <>
            <StatItem title="My Batches" value={stats?.assignedBatches || 0} icon="📚" colorClass="bg-violet-50 text-violet-600" />
            <StatItem title="Learners" value={stats?.totalLearners || 0} icon="👥" colorClass="bg-orange-50 text-orange-600" />
            <StatItem title="Pending" value={stats?.pendingReviews || 0} icon="✍️" colorClass="bg-rose-50 text-rose-600" />
            <StatItem title="Course Modules" value={stats?.courseCount || 0} icon="🎥" colorClass="bg-cyan-50 text-cyan-600" />
          </>
        )}
        {isIntern && (
          <>
            <StatItem title="My Courses" value={stats?.courseCount || 0} icon="🎞️" colorClass="bg-sky-50 text-sky-600" />
            <StatItem title="Quiz Avg" value={`${stats?.avgQuizScore || 0}%`} icon="🎯" colorClass="bg-emerald-50 text-emerald-600" />
            <StatItem title="Task Pending" value={stats?.pendingAssignments || 0} icon="📝" colorClass="bg-pink-50 text-pink-600" />
            <StatItem title="Active Batch" value={stats?.batchName || "N/A"} icon="🏷️" colorClass="bg-purple-50 text-purple-600" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* MAIN AREA */}
        <div className="lg:col-span-2 space-y-8">
          {isHR && (
            <Card title="Quick Overview" subtitle="Most recently created batches">
              <div className="divide-y divide-slate-100">
                {stats?.recentBatches?.map(batch => (
                  <div key={batch._id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-slate-800">{batch.name}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-tight">ID: {batch.batchId}</p>
                    </div>
                    <Link to={`/hr/batches/${batch._id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-primary hover:bg-slate-50 transition-colors">
                      Manage →
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(isTrainer || isIntern) && (
            <Card title="Action Center" subtitle="Direct access to your training modules">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link to={isTrainer ? "/trainer/courses" : "/intern/courses"}
                  className="flex items-center gap-4 rounded-xl border border-primary/10 bg-primary/5 p-4 hover:bg-primary/10 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white text-lg">🎞️</div>
                  <div>
                    <p className="font-bold text-slate-900">View Courses</p>
                    <p className="text-xs text-slate-500 italic">Watch training videos</p>
                  </div>
                </Link>
                <Link to={isTrainer ? "/trainer/assignments" : "/intern/assignments"}
                  className="flex items-center gap-4 rounded-xl border border-accent/10 bg-accent/5 p-4 hover:bg-accent/10 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white text-lg">📋</div>
                  <div>
                    <p className="font-bold text-slate-900">My Assignments</p>
                    <p className="text-xs text-slate-500 italic">{isTrainer ? "Grade intern work" : "Upload your tasks"}</p>
                  </div>
                </Link>
              </div>
            </Card>
          )}


        </div>

        {/* SIDEBAR */}
        <div className="space-y-8">
          <Card title="Quick Links" subtitle="System shortcuts">
            <div className="grid grid-cols-1 gap-2">
              {isHR && (
                <>
                  <Link to="/hr/batches" className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add New Batch</Link>
                  <Link to="/hr/trainers" className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Verify Trainers</Link>
                  <Link to="/hr/interns" className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Manage Interns</Link>
                </>
              )}
              {isTrainer && (
                <>
                  <Link to="/trainer/schedule" className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Batch Schedule</Link>
                  <Link to="/trainer/doubts" className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Live Doubts</Link>
                  <Link to="/trainer/assignments" className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Grade Tasks</Link>
                </>
              )}
              {isIntern && (
                <>
                  <Link to="/intern/schedule" className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Full Schedule</Link>
                  <Link to="/intern/doubts" className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Discussion Room</Link>
                  <Link to="/intern/courses" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 shadow-md shadow-primary/20">Start Learning</Link>
                </>
              )}
            </div>
          </Card>


        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

