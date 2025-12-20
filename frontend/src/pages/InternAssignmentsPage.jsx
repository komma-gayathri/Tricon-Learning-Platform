import React, { useEffect, useState } from 'react';
import api from '../api';
import Card from '../components/Card';

const InternAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/learner/assignments/my');
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !repoUrl) return;
    setMessage('');
    setError('');
    try {
      const res = await api.post('/learner/assignment/submit', {
        assignmentId: selectedAssignment._id,
        githubRepo: repoUrl
      });
      setMessage(res.data.msg || 'Assignment submitted and AI analysis is complete.');
      setRepoUrl('');
      setSelectedAssignment(null);
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit assignment');
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="My assignments"
        subtitle="Submit your GitHub repository for each assignment."
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No assignments found for you yet.
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => {
                  setSelectedAssignment(a);
                  setMessage('');
                  setError('');
                }}
                className={`flex w-full flex-col rounded-lg border px-3 py-2 text-left text-xs ${
                  selectedAssignment?._id === a._id
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 bg-slate-50 hover:border-primary/40'
                }`}
              >
                <span className="font-semibold text-slate-800">
                  Week {a.week}: {a.title}
                </span>
                <span className="mt-1 text-slate-600">{a.description}</span>
                <span className="mt-1 text-[11px] text-slate-500">
                  Batch: {a.batchId?.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedAssignment && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700">
              Submit for: Week {selectedAssignment.week} –{' '}
              {selectedAssignment.title}
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                GitHub repository URL
              </label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                placeholder="https://github.com/username/repo"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Submit assignment
            </button>
          </form>
        )}

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
      </Card>
    </div>
  );
};

export default InternAssignmentsPage;
