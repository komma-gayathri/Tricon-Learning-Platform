import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";

const InternDoubtsPage = () => {
  const { user } = useAuth(); // ✅ logged-in intern
  const [question, setQuestion] = useState("");
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  /* =========================
     LOAD DOUBTS (LATEST FIRST)
  ========================= */
  const loadDoubts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/learner/doubts");
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

  /* =========================
     POST DOUBT
  ========================= */
  const handleAsk = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      setError("Please enter your question");
      return;
    }

    setMessage("");
    setError("");

    try {
      const res = await api.post("/learner/doubt/ask", { question });
      setMessage("Doubt posted successfully");
      setQuestion("");
      loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to post doubt");
    }
  };

  /* =========================
     EDIT DOUBT (OWNER ONLY)
  ========================= */
  const handleEditDoubt = async () => {
    if (!editQuestion.trim()) {
      setError("Question cannot be empty");
      return;
    }

    try {
      await api.put(`/learner/doubt/${editId}`, {
        question: editQuestion,
      });
      setEditId(null);
      setEditQuestion("");
      loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update doubt");
    }
  };

  /* =========================
     DELETE DOUBT (OWNER ONLY)
  ========================= */
  const handleDeleteDoubt = async (id) => {
    if (!window.confirm("Delete this doubt?")) return;

    setDeletingId(id);
    setError("");

    try {
      await api.delete(`/learner/doubt/${id}`);
      loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete doubt");
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-4">
      <Card title="Doubt forum" subtitle="Ask questions to your trainers">
        {/* POST DOUBT */}
        <form onSubmit={handleAsk} className="space-y-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Describe your doubt clearly"
          />
          <button className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">
            Post doubt
          </button>
        </form>

        {message && <p className="mt-3 text-xs text-emerald-700">{message}</p>}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        {/* DOUBTS LIST */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-xs text-slate-500">Loading doubts…</p>
          ) : doubts.length === 0 ? (
            <p className="text-xs text-slate-500">No doubts yet.</p>
          ) : (
            doubts.map((d) => {
              const isOwner = d.askedBy?._id === user?._id;

              return (
                <div
                  key={d._id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  {editId === d._id ? (
                    <>
                      <input
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        className="w-full rounded border px-2 py-1 text-xs"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={handleEditDoubt}
                          className="text-xs text-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold">{d.question}</p>
                      <p className="text-[11px] text-slate-500">
                        Asked by {d.askedBy?.name} ·{" "}
                        {new Date(d.createdAt).toLocaleString()}
                      </p>

                      {/* EDIT / DELETE → OWNER ONLY */}
                      {isOwner && (
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() => {
                              setEditId(d._id);
                              setEditQuestion(d.question);
                            }}
                            className="text-xs text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDoubt(d._id)}
                            disabled={deletingId === d._id}
                            className="text-xs text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* ANSWERS */}
                  {d.answers?.length > 0 && (
                    <div className="mt-2 border-t pt-2 text-[11px]">
                      {d.answers.map((a, i) => (
                        <p key={i}>
                          <b>{a.answeredBy?.name}:</b> {a.answer}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

export default InternDoubtsPage;
