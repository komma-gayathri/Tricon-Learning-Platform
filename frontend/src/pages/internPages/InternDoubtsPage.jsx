import React, { useEffect, useState } from 'react';
import api from '../../api';
import Card from '../../components/Card';

const InternDoubtsPage = () => {
  const [batchId, setBatchId] = useState('');
  const [question, setQuestion] = useState('');
  const [doubts, setDoubts] = useState([]);
  const [userId, setUserId] = useState(null); // To check ownership
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [deletingId, setDeletingId] = useState(null);

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
    const init = async () => {
      // 1. Fetch user's assigned batch to auto-fill
      try {
        const res = await api.get('/batches/my');
        console.log("InternDoubtsPage /batches/my response:", res.data);
        if (res.data.batches && res.data.batches.length > 0) {
          // Use the 'batchId' string (e.g. Batch01) OR fallback to _id for legacy batches
          console.log("Found batch for auto-fill:", res.data.batches[0]);
          setBatchId(res.data.batches[0].batchId || res.data.batches[0]._id || '');
        } else {
          console.log("No batches found for this intern.");
        }
      } catch (err) {
        console.error("Failed to auto-fetch batch", err);
      }
      // 2. Load existing doubts
      loadDoubts();
      try {
        const res = await api.get('/auth/me'); // Assuming this endpoint exists to get current user ID
        setUserId(res.data.user?._id || res.data._id);
      } catch (e) { console.error("Failed to get me", e); }

    };
    init();
  }, []);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question) {
      setError('Please enter your question before posting.');
      return;
    }
    if (!batchId) {
      setError('System Error: Batch ID missing. Please refresh the page.');
      return;
    }
    setMessage('');
    setError('');
    try {
      const res = await api.post('/learner/doubt/ask', {
        question,
        batchId
      });
      setMessage(res.data.msg || 'Doubt posted.');
      setQuestion('');
      await loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to post doubt');
    }
  };

  const handleEditDoubt = async () => {
    if (!editQuestion.trim()) {
      setError('Question cannot be empty');
      return;
    }
    setMessage('');
    setError('');
    try {
      const res = await api.put(`/learner/doubt/${editId}`, {
        question: editQuestion
      });
      setMessage(res.data.msg || 'Doubt updated.');
      setEditId(null);
      setEditQuestion('');
      await loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update doubt');
    }
  };

  const handleDeleteDoubt = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doubt?')) return;
    setDeletingId(id);
    setMessage('');
    setError('');
    try {
      const res = await api.delete(`/learner/doubt/${id}`);
      setMessage(res.data.msg || 'Doubt deleted.');
      await loadDoubts();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete doubt');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Doubt forum"
        subtitle="Ask questions to your trainers and peers."
      >
        <form onSubmit={handleAsk} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[0.5fr,1.5fr]">
            {/* Batch ID Hidden Input */}
            <input type="hidden" value={batchId} />
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Your question
              </label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
                placeholder="Describe your doubt clearly"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            Post doubt
          </button>
        </form>

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
              No doubts yet. Be the first to ask.
            </p>
          ) : (
            doubts.map((d) => (
              <div
                key={d._id}
                className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {editId === d._id ? (
                      <div className="space-y-2">
                        <input
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                          placeholder="Edit your question"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleEditDoubt}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditId(null);
                              setEditQuestion('');
                            }}
                            className="rounded-lg bg-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-800">
                          {d.question}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Asked by {d.askedBy?.name} · {' '}
                          {new Date(d.createdAt).toLocaleString()}
                        </p>
                      </>
                    )}
                  </div>
                  {!editId && d.askedBy?._id === userId && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditId(d._id);
                          setEditQuestion(d.question);
                        }}
                        className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteDoubt(d._id)}
                        disabled={deletingId === d._id}
                        className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
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
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default InternDoubtsPage;
