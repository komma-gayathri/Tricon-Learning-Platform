import React, { useEffect, useState } from 'react';
import api from '../api';
import Card from '../components/Card';

const TrainerDoubtsPage = () => {
  const [batchId, setBatchId] = useState('');
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answerMap, setAnswerMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDoubts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = batchId ? { batchId } : {};
      const res = await api.get('/learner/doubts', { params });
      setDoubts(res.data.doubts || []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load doubts');
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
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/learner/doubt/${doubtId}/answer`, {
        answer: ans
      });
      setMessage(res.data.msg || 'Answer posted.');
      setAnswerMap((prev) => ({ ...prev, [doubtId]: '' }));
      await loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to post answer');
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
                      Asked by {d.askedBy?.name} ·{' '}
                      {new Date(d.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {d.answers.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                    {d.answers.map((a, idx) => (
                      <p
                        key={idx}
                        className="text-[11px] text-slate-700"
                      >
                        <span className="font-semibold">
                          {a.answeredBy?.name}:
                        </span>{' '}
                        {a.answer}
                      </p>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={answerMap[d._id] || ''}
                    onChange={(e) =>
                      handleAnswerChange(d._id, e.target.value)
                    }
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
