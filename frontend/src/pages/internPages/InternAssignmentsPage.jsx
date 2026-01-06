import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";

const InternAssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =========================
     LOAD ASSIGNMENTS
  ========================= */
  const loadAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/learner/assignments/my");
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

  /* =========================
     SUBMIT ASSIGNMENT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !repoUrl) return;

    setMessage("");
    setError("");

    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-.]+(\/.*)?$/;
    if (!githubRegex.test(repoUrl)) {
      setError("Invalid URL. Please submit a valid GitHub repository link.");
      return;
    }

    try {
      const res = await api.post("/learner/assignment/submit", {
        assignmentId: selectedAssignment._id,
        githubRepo: repoUrl,
      });

      setMessage(res.data.msg || "Assignment submitted successfully");
      setRepoUrl("");
      setSelectedAssignment(null);
      loadAssignments();
    } catch (err) {
      setError(err.response?.data?.msg || "Submission failed");
    }
  };

  const closeModal = () => {
    setSelectedAssignment(null);
    setRepoUrl("");
    setMessage("");
    setError("");
  };

  /* =========================
     HELPERS
  ========================= */
  const getMySubmission = (assignment) => {
    if (!assignment?.submissions || !user?._id) return null;
    return assignment.submissions.find(s =>
      (s.internId?._id || s.internId) === user._id
    ) || null;
  };

  const getStatusText = (submission) => {
    if (!submission) return "Not Submitted";
    if (submission.trainerGrade != null) return "Reviewed";
    return "Submitted – Awaiting Review";
  };

  const getStatusColor = (submission) => {
    if (!submission) return "bg-slate-200 text-slate-700";
    if (submission.trainerGrade != null)
      return "bg-emerald-100 text-emerald-800";
    return "bg-amber-100 text-amber-800";
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
          <p className="mt-1 text-slate-600">
            Track your assignment submissions
          </p>
        </div>
        <button
          onClick={loadAssignments}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold hover:bg-slate-200"
        >
          Refresh
        </button>
      </div>

      {/* MESSAGES */}
      {message && (
        <div className="rounded-lg bg-emerald-100 border border-emerald-300 p-3 text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-100 border border-red-300 p-3 text-red-800">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <Card>
          <div className="text-center py-10">Loading assignments…</div>
        </Card>
      ) : assignments.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-slate-600">
            No assignments yet
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment) => {
            const mySubmission = getMySubmission(assignment);

            return (
              <Card key={assignment._id}>
                <div className="space-y-4">
                  {/* HEADER */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-primary">
                        Week {assignment.week}
                      </span>
                      <h3 className="text-xl font-bold">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {assignment.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                        mySubmission
                      )}`}
                    >
                      {getStatusText(mySubmission)}
                    </span>
                  </div>

                  {/* SUBMISSION INFO */}
                  {mySubmission ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700">
                        Submitted Repo:
                        <a
                          href={mySubmission.githubRepo}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-primary underline"
                        >
                          View
                        </a>
                      </div>

                      {/* AI REPORT HIDDEN FOR INTERN */}

                      {/* TRAINER REMARKS (Visible) */}
                      {mySubmission.trainerComments && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                          <span className="font-semibold">Trainer Remarks:</span> {mySubmission.trainerComments}
                        </div>
                      )}

                      {/* GRADE HIDDEN (As requested) */}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="rounded-lg bg-primary px-6 py-3 text-white font-semibold hover:bg-primary/90"
                    >
                      Submit Assignment
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* SUBMIT MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-3">
              Submit Assignment
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              {selectedAssignment.title}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="GitHub Repository URL"
                required
                className="w-full rounded-lg border px-4 py-3"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-white"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternAssignmentsPage;
