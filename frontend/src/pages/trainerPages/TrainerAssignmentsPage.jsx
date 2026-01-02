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
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyAssignment);
  const [grading, setGrading] = useState(null);
  const [gradeValues, setGradeValues] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =========================
     LOAD ASSIGNMENTS
  ========================= */
  const loadAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/learner/assignments");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.assignments || [];
      setAssignments(data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOAD BATCHES (DROPDOWN)
  ========================= */
const loadBatches = async () => {
  try {
    const res = await api.get("/batch");
    setBatches(res.data.batches || []);
  } catch (err) {
    console.error("Failed to load batches", err);
  }
};


  useEffect(() => {
    loadAssignments();
    loadBatches();
  }, []);

  /* =========================
     FORM HANDLERS
  ========================= */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.week || !form.batchId || !form.title || !form.description) {
      setError("All fields marked with * are mandatory.");
      return;
    }

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

  /* =========================
     GRADING
  ========================= */
  const startGrade = useCallback((assignmentId, submission) => {
    setGrading({ assignmentId, submissionId: submission._id });
    setGradeValues((prev) => ({
      ...prev,
      [`${assignmentId}-${submission._id}`]: {
        grade: submission.trainerGrade?.toString() || "",
        comment: submission.trainerComments || "",
      },
    }));
  }, []);

  const closeGrade = () => setGrading(null);

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!grading) return;

    const current =
      gradeValues[`${grading.assignmentId}-${grading.submissionId}`];

    try {
      const res = await api.put(
        `/learner/assignment/${grading.assignmentId}/grade/${grading.submissionId}`,
        {
          trainerGrade: Number(current.grade),
          trainerComments: current.comment,
        }
      );
      setMessage(res.data.msg || "Review submitted.");
      closeGrade();
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to submit review");
    }
  };

  const updateGradeValue = (assignmentId, submissionId, field, value) => {
    setGradeValues((prev) => ({
      ...prev,
      [`${assignmentId}-${submissionId}`]: {
        ...prev[`${assignmentId}-${submissionId}`],
        [field]: value,
      },
    }));
  };

  /* =========================
     SORT: Pending first
  ========================= */
  const sortSubmissions = (subs = []) =>
    [...subs].sort((a, b) => {
      const aReviewed = a.trainerGrade != null;
      const bReviewed = b.trainerGrade != null;
      if (aReviewed !== bReviewed) return aReviewed ? 1 : -1;
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* CREATE ASSIGNMENT */}
      <Card title="Create Assignment" subtitle="Publish a new task for interns">
        <form onSubmit={handleCreate} className="grid gap-6 md:grid-cols-2">
          {/* WEEK */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Week <span className="text-red-500">*</span>
            </label>
            <input
              name="week"
              type="number"
              value={form.week}
              onChange={handleChange}
              required
              className="w-full rounded-lg border px-4 py-3"
              placeholder="Week number"
            />
          </div>

          {/* BATCH DROPDOWN */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} ({batch.batchId})
                </option>
              ))}
            </select>
          </div>

          {/* TITLE */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border px-4 py-3"
              placeholder="Assignment title"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              required
              className="w-full rounded-lg border px-4 py-3"
              placeholder="Assignment description"
            />
          </div>

          {error && (
            <p className="md:col-span-2 text-red-500 text-sm">{error}</p>
          )}

          {message && (
            <p className="md:col-span-2 text-green-600 text-sm">{message}</p>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-xl"
            >
              Create Assignment
            </button>
          </div>
        </form>
      </Card>

      {/* ASSIGNMENTS LIST */}
      <section className="space-y-6">
        {assignments.map((assignment) => {
          const total = assignment.submissions?.length || 0;
          const pending =
            assignment.submissions?.filter(
              (s) => s.trainerGrade == null
            ).length || 0;

          return (
            <Card key={assignment._id} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">
                  Week {assignment.week}: {assignment.title}
                </h3>
                <span className="text-sm text-slate-500">
                  Pending: {pending} | Reviewed: {total - pending}
                </span>
              </div>

              {sortSubmissions(assignment.submissions).map((submission) => {
                const key = `${assignment._id}-${submission._id}`;
                const isOpen =
                  grading &&
                  grading.assignmentId === assignment._id &&
                  grading.submissionId === submission._id;

                return (
                  <div key={submission._id} className="border rounded-xl p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {submission.internId?.name || "Unknown Intern"}
                        </p>

                        <a
                          href={submission.githubRepo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate-500 break-all hover:underline"
                        >
                          {submission.githubRepo}
                        </a>

                        <span
                          className={`ml-2 text-xs font-semibold px-2 py-1 rounded-full ${
                            submission.trainerGrade == null
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {submission.trainerGrade == null
                            ? "Pending Review"
                            : "Reviewed"}
                        </span>
                      </div>

                      {!isOpen && (
                        <button
                          onClick={() =>
                            startGrade(assignment._id, submission)
                          }
                          className="px-4 py-1 bg-primary text-white rounded"
                        >
                          {submission.trainerGrade != null
                            ? "Edit Review"
                            : "Review"}
                        </button>
                      )}
                    </div>

                    {isOpen && (
                      <form onSubmit={handleGrade} className="mt-4 space-y-3">
                        <input
                          type="number"
                          required
                          placeholder="Score (0–100)"
                          value={gradeValues[key]?.grade || ""}
                          onChange={(e) =>
                            updateGradeValue(
                              assignment._id,
                              submission._id,
                              "grade",
                              e.target.value
                            )
                          }
                          className="w-full border rounded px-4 py-2"
                        />
                        <textarea
                          placeholder="Feedback comments"
                          value={gradeValues[key]?.comment || ""}
                          onChange={(e) =>
                            updateGradeValue(
                              assignment._id,
                              submission._id,
                              "comment",
                              e.target.value
                            )
                          }
                          className="w-full border rounded px-4 py-2"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={closeGrade}
                            className="px-4 py-2 border rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded"
                          >
                            Submit Review
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </Card>
          );
        })}
      </section>
    </div>
  );
};

export default TrainerAssignmentsPage;
