import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";

const TrainerDoubtsPage = () => {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [answerMap, setAnswerMap] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =========================
     LOAD TRAINER BATCHES
     SOURCE OF TRUTH: user.trainerBatches
  ========================= */
  useEffect(() => {
    if (user?.trainerBatches?.length) {
      setBatches(user.trainerBatches);
    } else {
      setBatches([]);
    }
  }, [user]);

  /* =========================
     LOAD DOUBTS FOR BATCH
  ========================= */
  const loadDoubts = async (batchId) => {
    setSelectedBatch(batchId);
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/learner/doubts", {
        params: { batchId },
      });
      setDoubts(res.data.doubts || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load doubts");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (doubtId) => {
    const answer = answerMap[doubtId];
    if (!answer) return;

    try {
      await api.post(`/learner/doubt/${doubtId}/answer`, { answer });
      setAnswerMap((p) => ({ ...p, [doubtId]: "" }));
      loadDoubts(selectedBatch);
    } catch {
      setError("Failed to submit answer");
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================
         BATCH CARDS
      ========================= */}
      <Card
        title="Your batches"
        subtitle="Select a batch to view and answer doubts."
      >
        {batches.length === 0 ? (
          <p className="text-xs text-slate-500">
            No batches assigned to you.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {batches.map((batch) => (
              <button
                key={batch._id}
                onClick={() => loadDoubts(batch._id)}
                className={`rounded-lg border p-4 text-left transition ${
                  selectedBatch === batch._id
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="font-semibold text-sm">{batch.name}</p>
                <p className="text-xs text-slate-500">{batch.batchId}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* =========================
         DOUBTS LIST
      ========================= */}
      {selectedBatch && (
        <Card title="Batch doubts" subtitle="Questions raised by interns.">
          {message && (
            <p className="mb-3 text-xs text-emerald-700">{message}</p>
          )}
          {error && (
            <p className="mb-3 text-xs text-red-600">{error}</p>
          )}

          {loading ? (
            <p className="text-xs text-slate-500">Loading doubts…</p>
          ) : doubts.length === 0 ? (
            <p className="text-xs text-slate-500">
              No doubts posted for this batch.
            </p>
          ) : (
            <div className="space-y-3">
              {doubts.map((d) => (
                <div
                  key={d._id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="text-xs font-semibold">{d.question}</p>
                  <p className="text-[11px] text-slate-500">
                    Asked by {d.askedBy?.name}
                  </p>

                  {d.answers.map((a) => (
                    <p key={a._id} className="text-[11px]">
                      <strong>{a.answeredBy?.name}:</strong> {a.answer}
                    </p>
                  ))}

                  <div className="mt-2 flex gap-2">
                    <input
                      value={answerMap[d._id] || ""}
                      onChange={(e) =>
                        setAnswerMap((p) => ({
                          ...p,
                          [d._id]: e.target.value,
                        }))
                      }
                      className="flex-1 rounded border px-3 py-2 text-xs"
                      placeholder="Type your answer"
                    />
                    <button
                      onClick={() => submitAnswer(d._id)}
                      className="rounded bg-primary px-3 py-2 text-xs text-white"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default TrainerDoubtsPage;
