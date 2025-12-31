import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";

const DashboardPage = () => {
  const { user } = useAuth();
  const isIntern = user?.role === "Intern";

  return (
    <div className="space-y-6">
      <Card
        title={`Good ${new Date().getHours() < 12 ? "morning" : "day"}, ${
          user?.name || ""
        }`}
        subtitle="Here is a quick snapshot of your dashboard."
        className="shadow-xl border-primary/20"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ROLE CARD */}
          <div className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-200/50 px-2 py-1 rounded-full">
                Role
              </p>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <span className="text-primary text-lg">👤</span>
              </div>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
              {user?.role}
            </p>
            <p className="text-xs text-slate-500 mt-1">Your account type</p>
          </div>

          {/* NEXT ACTION - ONLY INTERN */}
          {isIntern && (
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-200/50 px-2 py-1 rounded-full">
                  Next Action
                </p>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <span className="text-emerald-500 text-lg">🚀</span>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800 mb-2">
                Check Courses
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                Review your weekly schedule and complete pending courses.
              </p>
            </div>
          )}

          {/* QUICK TIPS - ONLY INTERN */}
          {isIntern && (
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 bg-amber-200/50 px-2 py-1 rounded-full">
                  Quick Tips
                </p>
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <span className="text-amber-500 text-lg">💡</span>
                </div>
              </div>
              <ul className="text-sm space-y-1 text-slate-700">
                <li>• Submit assignments on time</li>
                <li>• Keep GitHub repo clean</li>
                <li>• Complete quizzes daily</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
