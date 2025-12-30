import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
const InternAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/learner/assignments/my");
      console.log("Backend response:", res.data);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAssignments();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !repoUrl) return;
    setMessage("");
    setError("");
    try {
      const res = await api.post("/learner/assignment/submit", {
        assignmentId: selectedAssignment._id,
        githubRepo: repoUrl,
      });
      setMessage(
        res.data.msg || "Assignment submitted and AI analysis is complete."
      );
      setRepoUrl("");
      setSelectedAssignment(null);
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to submit assignment");
    }
  };
  const closeModal = () => {
    setSelectedAssignment(null);
    setRepoUrl("");
    setMessage("");
    setError("");
  };
  const getStatusColor = (submission) => {
    if (!submission) return "bg-primary/20 text-primary border-primary/40";
    if (submission.trainerGrade != null)
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    return "bg-amber-100 text-amber-900 border-amber-300";
  };

  const getStatusText = (submission) => {
    if (!submission) return "Not Submitted";
    if (submission.trainerGrade != null) return "Graded";
    return "Submitted - Awaiting Grade";
  };

  // FIXED: Backend already filters for current intern's submissions
  // Just use first submission (it's guaranteed to be current intern's)
  const getMySubmission = (assignment) => {
    // Backend sends only assignments where current intern has submission
    // submissions array contains only current intern's submission
    return assignment.submissions?.[0] || null;
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header Section - Matches Trainer layout */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Assignments
          </h1>
          <p className="mt-2 text-slate-600">
            {loading
              ? "Loading..."
              : assignments.length === 0
              ? "No assignments yet"
              : `Track ${assignments.length} assignment${
                  assignments.length !== 1 ? "s" : ""
                }`}
          </p>
        </div>
        <button
          onClick={loadAssignments}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-200 disabled:opacity-50 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Messages - Matches Trainer layout */}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">{message}</p>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-4 shadow-sm">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* ASSIGNMENTS SECTION - Trainer layout structure */}
      <section>
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-sm text-slate-600">
                Loading assignments...
              </span>
            </div>
          </Card>
        ) : assignments.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="mx-auto h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No assignments yet
              </h3>
              <p className="text-sm text-slate-600">
                Assignments will appear here when trainers create them
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => {
              // FIXED: Backend already filters - just take first submission
              const mySubmission = getMySubmission(assignment);

              return (
                <Card key={assignment._id} className="overflow-hidden">
                  <div className="p-6 pb-4">
                    {/* Assignment Header - Matches Trainer layout */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Week {assignment.week}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">
                          {assignment.title}
                        </h3>
                        <p className="text-slate-600 mb-2">
                          {assignment.description}
                        </p>
                        <p className="text-sm text-slate-500">
                          Batch:{" "}
                          {assignment.batchId?.name ||
                            assignment.batchId ||
                            "All"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                          {mySubmission ? 1 : 0}
                        </div>
                        <p className="text-xs text-slate-500">
                          Your Submission
                        </p>
                      </div>
                    </div>

                    {/* Intern Compact Cards - Keep intact */}
                    <div className="space-y-4">
                      <div
                        className={`relative rounded-xl border-2 p-5 shadow-sm bg-primary/5 border-primary/20 hover:border-primary hover:shadow-md w-full ${
                          selectedAssignment?._id === assignment._id
                            ? "ring-2 ring-primary border-primary bg-primary/10"
                            : ""
                        }`}
                      >
                        {/* Status Badge */}
                        <div
                          className={`absolute -top-3 left-3 px-3 py-1 rounded-full text-xs font-black border-2 shadow-sm z-10 whitespace-nowrap ${getStatusColor(
                            mySubmission
                          )}`}
                        >
                          {getStatusText(mySubmission)}
                        </div>

                        {/* Week Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-black mb-3">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Week {assignment.week}
                        </div>

                        <h3 className="text-lg font-black text-primary mb-2 line-clamp-2 leading-tight">
                          {assignment.title}
                        </h3>

                        <p className="text-sm font-black text-primary/90 mb-3 line-clamp-2">
                          {assignment.description}
                        </p>

                        <p className="text-xs font-bold text-primary/80 mb-4">
                          {assignment.batchId?.name || "Batch"}
                        </p>

                        {/* Submission & Grade Info */}
                        <div className="space-y-3 mb-5">
                          {mySubmission ? (
                            <>
                              <div className="flex items-center gap-2 text-xs bg-primary/10 px-3 py-2 rounded-lg border border-primary/30">
                                <svg
                                  className="w-4 h-4 text-primary"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="font-normal">
                                  Submitted: {mySubmission.githubRepo}
                                </span>
                              </div>

                              {mySubmission.trainerGrade != null ? (
                                <div className="p-4 bg-emerald-100 border-2 border-emerald-300 rounded-lg">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="text-2xl font-black text-emerald-900 bg-emerald-300 px-4 py-2 rounded-lg">
                                      {mySubmission.trainerGrade}
                                    </div>
                                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                                      Trainer Grade
                                    </span>
                                  </div>
                                  <div className="bg-white border border-emerald-200 rounded-lg p-3">
                                    <p className="text-sm font-semibold text-emerald-900 line-clamp-3">
                                      "{mySubmission.trainerComments}"
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 bg-amber-100 border-2 border-amber-300 rounded-lg">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    </div>
                                    <span className="text-sm font-bold text-amber-900">
                                      Pending Trainer Review
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-amber-800">
                                    {mySubmission.aiReport ||
                                      "AI analysis complete. Waiting for trainer grade..."}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-6 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5">
                              <svg
                                className="mx-auto h-10 w-10 text-primary/70 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              <p className="text-sm font-black text-primary">
                                Submit Assignment
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        {!mySubmission && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setMessage("");
                              setError("");
                            }}
                            className="w-full rounded-xl bg-primary text-white px-6 py-3 text-sm font-black border-2 border-primary hover:bg-primary/90 hover:border-primary"
                          >
                            Submit Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {/* FIXED SUBMIT MODAL - Clean, solid white background */}
        {selectedAssignment &&
          !assignments.find(
            (a) =>
              a.submissions && a.submissions.length > 0 && a._id === selectedAssignment._id
          )?.submissions && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Cross Close Button */}
              <div className="absolute top-6 right-6 z-20">
                <button
                  onClick={closeModal}
                  className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all shadow-lg hover:shadow-xl flex items-center justify-center font-semibold text-xl hover:scale-110"
                >
                  ×
                </button>
              </div>

              <div className="pt-20 pb-12 px-8 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white text-lg font-semibold mb-6 shadow-xl">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Week {selectedAssignment.week}
                </div>
                <h2 className="text-3xl font-semibold text-slate-900 mb-4">
                  {selectedAssignment.title}
                </h2>
                <p className="text-lg font-medium text-slate-700 max-w-md mx-auto leading-relaxed">
                  {selectedAssignment.description}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 pb-12 space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-slate-900 mb-4">
                    GitHub Repository URL
                  </label>
                  <input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    required
                    className="w-full rounded-2xl border-2 border-slate-300 bg-white px-6 py-4 text-lg font-medium shadow-lg focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all hover:shadow-xl"
                    placeholder="https://github.com/username/your-assignment-repo"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary/90 px-10 py-5 text-xl font-semibold text-white shadow-2xl hover:shadow-3xl hover:from-primary/90 hover:to-primary transition-all hover:-translate-y-1"
                >
                  Submit Assignment
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default InternAssignmentsPage;
