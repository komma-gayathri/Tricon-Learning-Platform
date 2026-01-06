import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const TrainerDoubtsPage = () => {
  const [doubts, setDoubts] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [answerMap, setAnswerMap] = useState({});
  const [error, setError] = useState("");

  /* =========================
     LOAD DOUBTS
  ========================= */
  const [batches, setBatches] = useState([]);

  /* =========================
     LOAD DATA
  ========================= */
  const loadData = async () => {
    try {
      const [resDoubts, resBatches] = await Promise.all([
        api.get("/learner/doubts"),
        api.get("/batches/my")
      ]);

      setDoubts(resDoubts.data.doubts || []);
      setBatches(resBatches.data.batches || []);
    } catch {
      setError("Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     GROUP BY BATCH
  ========================= */
  const groupedByBatch = doubts.reduce((acc, d) => {
    const batchId = d.batchId?._id;
    if (!batchId) return acc;

    if (!acc[batchId]) {
      acc[batchId] = {
        batchName: d.batchId.name,
        doubts: [],
      };
    }

    acc[batchId].doubts.push(d);
    return acc;
  }, {});

  /* =========================
     HELPERS
  ========================= */
  const getCounts = (list) => {
    const pending = list.filter(d => d.answers.length === 0).length;
    return { pending, answered: list.length - pending };
  };

  const submitAnswer = async (doubtId) => {
    const answer = answerMap[doubtId];
    if (!answer) return;

    await api.post(`/learner/doubt/${doubtId}/answer`, { answer });
    setAnswerMap(p => ({ ...p, [doubtId]: "" }));
    loadData();
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-6">
      <Card
        title="Batch Doubts"
        subtitle="Select a batch to review and answer doubts"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((batch) => {
            const batchId = batch._id;
            // Get doubts for this batch from the grouped map
            const batchDoubts = groupedByBatch[batchId]?.doubts || [];
            const { pending, answered } = getCounts(batchDoubts);

            return (
              <div
                key={batchId}
                onClick={() => setSelectedBatchId(batchId)}
                className={`cursor-pointer rounded-xl border p-4 hover:shadow transition-colors ${selectedBatchId === batchId
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "bg-white"
                  }`}
              >
                <h3 className="font-semibold">{batch.name}</h3>
                <p className="text-xs text-slate-500 mb-2">
                  {batch.batchId}
                </p>
                <div className="flex gap-2 text-xs">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    {pending} pending
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {answered} answered
                  </span>
                </div>
              </div>
            );
          })}
          {batches.length === 0 && (
            <p className="text-slate-500 text-sm col-span-2">No batches assigned to you.</p>
          )}
        </div>
      </Card>

      {selectedBatchId && (
        <Card
          title={batches.find(b => b._id === selectedBatchId)?.name || 'Batch Doubts'}
          subtitle="Pending doubts first"
        >

          {groupedByBatch[selectedBatchId]?.doubts?.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              Still no doubts posted in this batch.
            </p>
          ) : (
            (groupedByBatch[selectedBatchId]?.doubts || []).map((d) => {
              const isAnswered = d.answers.length > 0;

              return (
                <div key={d._id} className="border rounded-lg p-4 mb-4 bg-slate-50">
                  <div className="flex justify-between">
                    <p className="font-semibold">{d.question}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${isAnswered
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

                  {isAnswered ? (
                    <div className="mt-3 text-sm">
                      {d.answers.map((a) => (
                        <p key={a._id}>
                          <strong>{a.answeredBy?.name}:</strong> {a.answer}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={answerMap[d._id] || ""}
                        onChange={(e) =>
                          setAnswerMap(p => ({
                            ...p,
                            [d._id]: e.target.value,
                          }))
                        }
                        placeholder="Type your answer"
                        className="flex-1 border rounded px-3 py-2 text-sm"
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
            }))
          }
        </Card>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TrainerDoubtsPage;
