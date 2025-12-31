import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const TrainerDoubtsPage = () => {
  const [doubts, setDoubts] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [answerMap, setAnswerMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     LOAD ALL DOUBTS
  ========================= */
  const loadDoubts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/learner/doubts");
      setDoubts(res.data.doubts || []);
    } catch (err) {
      setError("Failed to load doubts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubts();
  }, []);

  /* =========================
     GROUP BY BATCH
  ========================= */
  const groupedByBatch = doubts.reduce((acc, d) => {
    const batchName = d.batchId?.name || "Unknown Batch";
    if (!acc[batchName]) acc[batchName] = [];
    acc[batchName].push(d);
    return acc;
  }, {});

  /* =========================
     ANSWER HANDLER
  ========================= */
  const submitAnswer = async (doubtId) => {
    const answer = answerMap[doubtId];
    if (!answer) return;

    try {
      await api.post(`/learner/doubt/${doubtId}/answer`, { answer });
      setAnswerMap((p) => ({ ...p, [doubtId]: "" }));
      loadDoubts();
    } catch {
      setError("Failed to submit answer");
    }
  };

  /* =========================
     UI HELPERS
  ========================= */
  const getCounts = (batchDoubts) => {
    const pending = batchDoubts.filter(d => d.answers.length === 0).length;
    const answered = batchDoubts.length - pending;
    return { pending, answered };
  };

  const sortDoubts = (list) =>
    [...list].sort((a, b) => {
      const aAnswered = a.answers.length > 0;
      const bAnswered = b.answers.length > 0;
      if (aAnswered !== bAnswered) return aAnswered ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-6">
      <Card
        title="Batch Doubts"
        subtitle="Select a batch to review and answer doubts"
      >
        {Object.keys(groupedByBatch).length === 0 && (
          <p className="text-sm text-slate-500">No doubts available.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groupedByBatch).map(([batchName, batchDoubts]) => {
            const { pending, answered } = getCounts(batchDoubts);
            return (
              <div
                key={batchName}
                onClick={() => setSelectedBatch(batchName)}
                className="cursor-pointer rounded-xl border p-4 hover:shadow"
              >
                <h3 className="font-semibold">{batchName}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {pending} pending · {answered} answered
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* =========================
         DOUBTS LIST
      ========================= */}
      {selectedBatch && (
        <Card title={selectedBatch} subtitle="Pending doubts first">
          {sortDoubts(groupedByBatch[selectedBatch]).map((d) => {
            const isAnswered = d.answers.length > 0;

            return (
              <div
                key={d._id}
                className="rounded-lg border p-4 mb-4 bg-slate-50"
              >
                <div className="flex justify-between">
                  <p className="font-semibold">{d.question}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      isAnswered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {isAnswered ? "Answered" : "Pending"}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Asked by {d.askedBy?.name}
                </p>

                {/* EXISTING ANSWERS */}
                {isAnswered && (
                  <div className="mt-3 text-sm text-slate-700">
                    {d.answers.map((a) => (
                      <p key={a._id}>
                        <strong>{a.answeredBy?.name}:</strong> {a.answer}
                      </p>
                    ))}
                  </div>
                )}

                {/* REPLY ONLY IF PENDING */}
                {!isAnswered && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={answerMap[d._id] || ""}
                      onChange={(e) =>
                        setAnswerMap((p) => ({
                          ...p,
                          [d._id]: e.target.value,
                        }))
                      }
                      placeholder="Type your answer"
                      className="flex-1 rounded border px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => submitAnswer(d._id)}
                      className="bg-primary text-white px-4 rounded"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {error && (
        <p className="text-sm text-red-600 border border-red-200 p-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
};

export default TrainerDoubtsPage;
