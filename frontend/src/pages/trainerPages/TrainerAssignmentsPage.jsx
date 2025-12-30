import React, { useEffect, useState, useCallback } from "react";
import api from "../../api";
import Card from "../../components/Card";

const emptyAssignment = {
  week: "",
  batchId: "",
  title: "",
  description: "",
};

const TrainerAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyAssignment);
  const [grading, setGrading] = useState(null); // { assignmentId, submissionId }
  const [gradeValues, setGradeValues] = useState({}); // Inline grade form states
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [batches, setBatches] = useState([]);


  const loadAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("🔍 Loading assignments...");
      const res = await api.get("/learner/assignments");

      console.log("FULL API RESPONSE:", JSON.stringify(res.data, null, 2));

      const assignmentsData = Array.isArray(res.data)
        ? res.data
        : res.data.assignments || res.data || [];

      console.log("SETTING assignments:", assignmentsData.length);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error("LOAD ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };
  const loadBatches = async () => {
    try {
      const res = await api.get("/hr/batches"); // HR batches API
      setBatches(res.data || []);
    } catch (err) {
      console.error("Failed to load batches");
    }
  };

  useEffect(() => {
    loadAssignments();
    loadBatches();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await api.post("/learner/assignments", {
        ...form,
        week: Number(form.week),
      });
      setMessage(res.data.msg || "Assignment created.");
      setForm(emptyAssignment);
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create assignment");
    }
  };

  const startGrade = useCallback((assignmentId, submission) => {
    console.log("startGrade:", { assignmentId, submission });
    setGrading({ assignmentId, submissionId: submission._id });
    // Pre-fill grade form
    setGradeValues(prev => ({
      ...prev,
      [`${assignmentId}-${submission._id}`]: {
        grade: submission.trainerGrade?.toString() || "",
        comment: submission.trainerComments || ""
      }
    }));
    setMessage("");
    setError("");
  }, []);

  const closeGrade = () => {
    setGrading(null);
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!grading) return;
    setMessage("");
    setError("");

    try {
      const currentGradeData = gradeValues[`${grading.assignmentId}-${grading.submissionId}`];
      console.log("📤 Submitting grade:", {
        assignmentId: grading.assignmentId,
        submissionId: grading.submissionId,
        grade: currentGradeData.grade,
      });

      const res = await api.put(
        `/learner/assignment/${grading.assignmentId}/grade/${grading.submissionId}`,
        {
          trainerGrade: Number(currentGradeData.grade),
          trainerComments: currentGradeData.comment,
        }
      );
      setMessage(res.data.msg || "Grade submitted.");
      closeGrade();
      await loadAssignments();
    } catch (err) {
      console.error("Grade error:", err.response?.data);
      setError(err.response?.data?.msg || "Failed to submit grade");
    }
  };

  const updateGradeValue = (assignmentId, submissionId, field, value) => {
    setGradeValues(prev => ({
      ...prev,
      [`${assignmentId}-${submissionId}`]: {
        ...prev[`${assignmentId}-${submissionId}`],
        [field]: value
      }
    }));
  };

  const getColorClass = (index) => {
    const colors = [
      "bg-gradient-to-r from-emerald-400/20 to-teal-500/20 border-emerald-200 ring-emerald-100/50",
      "bg-gradient-to-r from-blue-400/20 to-indigo-500/20 border-blue-200 ring-blue-100/50",
      "bg-gradient-to-r from-purple-400/20 to-violet-500/20 border-purple-200 ring-purple-100/50",
      "bg-gradient-to-r from-orange-400/20 to-amber-500/20 border-orange-200 ring-orange-100/50",
      "bg-gradient-to-r from-pink-400/20 to-rose-500/20 border-pink-200 ring-pink-100/50",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* CREATE FORM - TOP */}
      <Card title="Create Assignment" subtitle="Publish a new task for interns">
        <form onSubmit={handleCreate} className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Week</label>
            <input
              name="week"
              type="number"
              min="1"
              max="52"
              value={form.week}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Select Batch
            </label>
            <select
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">-- Select Batch --</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} ({batch.batchId})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Week 1: Introduction to React"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-vertical"
              placeholder="Detailed instructions for interns..."
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-primary to-primary/80 px-8 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:from-primary/90 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Create Assignment
            </button>
          </div>
        </form>
      </Card>

      {/* Messages */}
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

      {/* ASSIGNMENTS SECTION */}
      <section>
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
                  : `Manage ${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={loadAssignments}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-200 disabled:opacity-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-sm text-slate-600">Loading assignments...</span>
            </div>
          </Card>
        ) : assignments.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="mx-auto h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No assignments yet</h3>
              <p className="text-sm text-slate-600">Create your first assignment above to get started</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment, assignmentIndex) => (
              <Card key={assignment._id} className="overflow-hidden">
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        Week {assignment.week}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{assignment.title}</h3>
                      <p className="text-slate-600 mb-2">{assignment.description}</p>
                      <p className="text-sm text-slate-500">
                        Batch: {assignment.batchId?.name || assignment.batchId || "All"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        {assignment.submissions?.length || 0}
                      </div>
                      <p className="text-xs text-slate-500">Submissions</p>
                    </div>
                  </div>

                  {assignment.submissions?.length > 0 ? (
                    <div className="space-y-4">
                      {assignment.submissions.map((submission, subIndex) => {
                        const key = `${assignment._id}-${submission._id}`;
                        const currentGradeData = gradeValues[key];
                        const isOpen = grading && grading.assignmentId === assignment._id && grading.submissionId === submission._id;

                        return (
                          <div key={submission._id} className="space-y-3">
                            {/* Submission Card */}
                            <div
                              className={`group relative rounded-xl border-2 p-6 pr-14 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${getColorClass(
                                (assignmentIndex * 5 + subIndex) % 5
                              )}`}
                            >
                              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-teal-500 group-hover:from-primary group-hover:to-primary/80 transition-colors" />

                              <div className="flex items-start justify-between">
                                <div className="space-y-3 flex-1 min-w-0">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-800 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm">
                                      {submission.internId?.name?.charAt(0)?.toUpperCase() || "I"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-base text-slate-900 group-hover:text-primary truncate">
                                        {submission.internId?.name || "Unknown Intern"}
                                      </p>
                                      <p className="text-sm text-slate-500 truncate">{submission.githubRepo}</p>
                                    </div>
                                  </div>

                                  {submission.aiReport && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/80 backdrop-blur-sm rounded-xl text-xs text-slate-600 border border-slate-100 shadow-sm">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8.307 8.307 0 1111.728 0z" />
                                        <path d="M10 11a1 1 0 11-2 0 1 1 0 012 0z" />
                                      </svg>
                                      <span>{submission.aiReport}</span>
                                    </div>
                                  )}

                                  {/* FIXED FULL GRADE DISPLAY */}
                                  {submission.trainerGrade != null && !isOpen && (
                                    <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 shadow-sm">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="text-lg font-black text-emerald-800 bg-emerald-200 px-4 py-2 rounded-full shadow-md">
                                          {submission.trainerGrade}
                                        </div>
                                        <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Graded</span>
                                      </div>
                                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
                                        <p className="text-sm text-emerald-800 leading-relaxed break-words max-w-none line-clamp-3 hyphens-auto">
                                          "{submission.trainerComments}"
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {!isOpen ? (
                                  <button
                                    type="button"
                                    onClick={() => startGrade(assignment._id, submission)}
                                    className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-5 py-2.5 text-sm font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 whitespace-nowrap border-2 border-transparent hover:border-white/30"
                                  >
                                    {submission.trainerGrade != null ? "Edit Grade" : "Grade Now"}
                                  </button>
                                ) : (
                                  <div className="absolute right-4 top-4 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={closeGrade}
                                      className="h-10 w-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center transform hover:scale-105"
                                      title="Close"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* INLINE GRADE FORM */}
                            {isOpen && (
                              <div className="bg-gradient-to-br from-slate-50 to-white/80 backdrop-blur-sm border-2 border-primary/30 rounded-3xl p-8 shadow-2xl ring-2 ring-primary/20 -mt-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-50 -skew-x-1 -translate-x-4 w-32 h-full"></div>
                                <div className="relative z-10">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary text-white flex items-center justify-center text-lg font-bold shadow-lg">
                                      {submission.internId?.name?.charAt(0)?.toUpperCase() || "I"}
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-slate-900">
                                        Grade Submission
                                      </h3>
                                      <p className="text-sm text-slate-600 truncate max-w-md">{submission.githubRepo}</p>
                                    </div>
                                  </div>

                                  <form onSubmit={handleGrade} className="space-y-6">
                                    <div>
                                      <label className="block text-sm font-bold text-slate-800 mb-3">Grade (0-100)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={currentGradeData?.grade || ""}
                                        onChange={(e) => updateGradeValue(assignment._id, submission._id, "grade", e.target.value)}
                                        required
                                        className="w-full max-w-md rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-xl font-bold shadow-lg focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all hover:shadow-xl"
                                        placeholder="Enter grade..."
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-slate-800 mb-3">Feedback Comments</label>
                                      <textarea
                                        rows={5}
                                        value={currentGradeData?.comment || ""}
                                        onChange={(e) => updateGradeValue(assignment._id, submission._id, "comment", e.target.value)}
                                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-base shadow-lg focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all hover:shadow-xl resize-vertical min-h-[120px]"
                                        placeholder="Write detailed feedback for the intern..."
                                      />
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                      <button
                                        type="button"
                                        onClick={closeGrade}
                                        className="flex-1 rounded-2xl border-2 border-slate-300 bg-white/80 px-8 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-xl transition-all transform hover:-translate-y-0.5 shadow-lg"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-primary/90 px-8 py-4 text-lg font-bold text-white shadow-2xl hover:shadow-3xl hover:from-primary/90 hover:to-primary transition-all transform hover:-translate-y-1 hover:scale-[1.02] ring-2 ring-primary/30"
                                      >
                                        {submission.trainerGrade != null ? "Update Grade" : "Submit Grade"}
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-600">No submissions yet</p>
                      <p className="text-xs text-slate-500 mt-1">Interns will submit here after assignment is created</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TrainerAssignmentsPage;
