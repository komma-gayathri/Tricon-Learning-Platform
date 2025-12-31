// src/pages/HRInternProfile.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api";

export default function HRInternProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [intern, setIntern] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInternProfile();
  }, [id]);

  const fetchInternProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/hr/interns/${id}`);
      
      setIntern(res.data.intern);
      setAssignments(res.data.assignments || []);  // ✅ Uses backend data!
      
    } catch (err) {
      console.error("Fetch intern profile error:", err);
      setError(err.response?.data?.msg || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Loading intern profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-600 text-2xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/hr/interns")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700"
          >
            Back to Interns
          </button>
        </div>
      </div>
    );
  }

  if (!intern) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Intern Not Found
          </h2>
          <button
            onClick={() => navigate("/hr/interns")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700"
          >
            Back to Interns
          </button>
        </div>
      </div>
    );
  }

  // FIXED: Safe ID comparison (String conversion)
  const completedAssignments = assignments.filter((a) =>
    a.submissions?.some((s) => 
      String(s.internId?._id || s.internId) === String(id)
    )
  ).length;
  const totalAssignments = assignments.length;
  const completionRate = totalAssignments > 0
    ? Math.round((completedAssignments / totalAssignments) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{intern.name}</h1>
                <p className="text-lg text-slate-600 mt-1">{intern.email}</p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-1 mt-3 text-sm font-medium text-blue-700">
                  Intern • {intern.batchId?.name || "No batch"}
                </span>
              </div>
              <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
                Active
              </span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Assignments</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {completedAssignments}/{totalAssignments}
                </p>
                <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      completionRate >= 80 ? "bg-green-500" 
                      : completionRate >= 50 ? "bg-blue-500" 
                      : "bg-yellow-500"
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600 mt-1">{completionRate}% Complete</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Batch</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {intern.batchId?.name || "N/A"}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {intern.batchId ? "Assigned" : "Not assigned"}
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Joined</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {new Date(intern.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {new Date(intern.createdAt).toLocaleDateString("en-US", { weekday: "short" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Assignments</h2>

          {totalAssignments === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No assignments yet</h3>
              <p className="text-slate-600">This intern hasn't been assigned any work yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Assignment</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Week</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Grade</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assignments.map((assignment) => {
                    const submission = assignment.submissions?.find((s) => 
                      String(s.internId?._id || s.internId) === String(id)
                    );
                    const isSubmitted = !!submission?.submittedAt;

                    return (
                      <tr key={String(assignment._id)} className="hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">
                            {assignment.title || `Week ${assignment.week}`}
                          </div>
                          {assignment.description && (
                            <div className="text-sm text-slate-600 mt-1">{assignment.description}</div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Week {assignment.week}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isSubmitted
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {isSubmitted ? "Submitted" : "Pending"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {submission?.trainerGrade ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              submission.trainerGrade >= 70
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {submission.trainerGrade}%
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {submission?.submittedAt ? (
                            <span className="text-sm text-slate-900">
                              {new Date(submission.submittedAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
