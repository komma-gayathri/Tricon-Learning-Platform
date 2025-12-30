import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const TrainerDoubtsPage = () => {
  const [batchId, setBatchId] = useState("");
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answerMap, setAnswerMap] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editAnswerId, setEditAnswerId] = useState(null);
  const [editAnswerText, setEditAnswerText] = useState("");
  const [deletingAnswerId, setDeletingAnswerId] = useState(null);

  const loadDoubts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = batchId ? { batchId } : {};
      const res = await api.get("/learner/doubts", { params });
      setDoubts(res.data.doubts || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load doubts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubts();
  }, []);

  const handleAnswerChange = (id, value) => {
    setAnswerMap((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitAnswer = async (doubtId) => {
    const ans = answerMap[doubtId];
    if (!ans) return;
    setMessage("");
    setError("");
    try {
      // ✅ FIXED: Match backend route
      const res = await api.post(`/learner/doubt/${doubtId}/answer`, {
        answer: ans,
      });
      setMessage(res.data.msg || "Answer posted.");
      setAnswerMap((prev) => ({ ...prev, [doubtId]: "" }));
      await loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to post answer");
    }
  };

  const handleEditAnswer = async () => {
    if (!editAnswerText.trim()) {
      setError("Answer cannot be empty");
      return;
    }
    setMessage("");
    setError("");
    try {
      // ✅ FIXED URL
      const res = await api.put(`/learner/doubt/answer/${editAnswerId}`, {
        answer: editAnswerText,
      });
      setMessage(res.data.msg || "Answer updated.");
      setEditAnswerId(null);
      setEditAnswerText("");
      await loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update answer");
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm("Are you sure you want to delete this answer?")) return;
    setDeletingAnswerId(answerId);
    setMessage("");
    setError("");
    try {
      // ✅ FIXED URL
      const res = await api.delete(`/learner/doubt/answer/${answerId}`);
      setMessage(res.data.msg || "Answer deleted.");
      await loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete answer");
    } finally {
      setDeletingAnswerId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Batch doubts"
        subtitle="Review and answer questions from interns."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Filter by Batch ID (code)
            </label>
            <input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="e.g. Batch01"
            />
          </div>
          <button
            type="button"
            onClick={loadDoubts}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            Load doubts
          </button>
        </div>

        {message && (
          <p className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-xs text-slate-500">Loading doubts…</p>
          ) : doubts.length === 0 ? (
            <p className="text-xs text-slate-500">
              No doubts to show for this filter.
            </p>
          ) : (
            doubts.map((d) => (
              <div
                key={d._id}
                className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {d.question}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Asked by {d.askedBy?.name} ·{" "}
                      {new Date(d.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {d.answers.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
                    {d.answers.map(
                      (
                        a // ✅ FIXED: Removed idx, use a._id
                      ) => (
                        <div key={a._id} className="space-y-1">
                          {" "}
                          {/* ✅ FIXED: key={a._id} */}
                          {editAnswerId === a._id ? (
                            <div className="space-y-1">
                              <input
                                value={editAnswerText}
                                onChange={(e) =>
                                  setEditAnswerText(e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                                placeholder="Edit your answer"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={handleEditAnswer}
                                  className="rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditAnswerId(null);
                                    setEditAnswerText("");
                                  }}
                                  className="rounded-lg bg-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[11px] text-slate-700 flex-1">
                                <span className="font-semibold">
                                  {a.answeredBy?.name}:
                                </span>{" "}
                                {a.answer}
                              </p>
                              <div className="flex gap-0.5">
                                <button
                                  onClick={() => {
                                    setEditAnswerId(a._id);
                                    setEditAnswerText(a.answer);
                                  }}
                                  className="rounded-lg bg-blue-50 p-1 text-blue-600 hover:bg-blue-100"
                                  title="Edit"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteAnswer(a._id)}
                                  disabled={deletingAnswerId === a._id}
                                  className="rounded-lg bg-red-50 p-1 text-red-600 hover:bg-red-100 disabled:opacity-50"
                                  title="Delete"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={answerMap[d._id] || ""}
                    onChange={(e) => handleAnswerChange(d._id, e.target.value)}
                    placeholder="Type your answer"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleSubmitAnswer(d._id)}
                    className="rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-white hover:bg-primary/90"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default TrainerDoubtsPage;
