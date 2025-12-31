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

  useEffect(() => {
    loadAssignments();
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
     SORT: Pending first, newest first
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
          <input
            name="week"
            type="number"
            value={form.week}
            onChange={handleChange}
            placeholder="Week"
            required
            className="w-full rounded-lg border px-4 py-3"
          />
          <input
            name="batchId"
            value={form.batchId}
            onChange={handleChange}
            placeholder="Batch ID"
            required
            className="w-full rounded-lg border px-4 py-3"
          />
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            required
            className="md:col-span-2 w-full rounded-lg border px-4 py-3"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Description"
            className="md:col-span-2 w-full rounded-lg border px-4 py-3"
          />
          <div className="md:col-span-2 flex justify-end">
            <button className="px-6 py-2 bg-primary text-white rounded-xl">
              Create Assignment
            </button>
          </div>
        </form>
      </Card>

      {/* ASSIGNMENTS */}
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
                      <form
                        onSubmit={handleGrade}
                        className="mt-4 space-y-3"
                      >
                        <input
                          type="number"
                          value={gradeValues[key]?.grade || ""}
                          onChange={(e) =>
                            updateGradeValue(
                              assignment._id,
                              submission._id,
                              "grade",
                              e.target.value
                            )
                          }
                          placeholder="Score (0–100)"
                          className="w-full border rounded px-4 py-2"
                          required
                        />
                        <textarea
                          value={gradeValues[key]?.comment || ""}
                          onChange={(e) =>
                            updateGradeValue(
                              assignment._id,
                              submission._id,
                              "comment",
                              e.target.value
                            )
                          }
                          placeholder="Feedback comments"
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
