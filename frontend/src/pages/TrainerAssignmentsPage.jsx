import React, { useEffect, useState } from 'react';
import api from '../api';
import Card from '../components/Card';

const emptyAssignment = {
  week: '',
  batchId: '',
  title: '',
  description: ''
};

const TrainerAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyAssignment);
  const [grading, setGrading] = useState(null); // { assignmentId, submission }
  const [gradeValue, setGradeValue] = useState('');
  const [gradeComment, setGradeComment] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/learner/assignments');
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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await api.post('/learner/assignments', {
        ...form,
        week: Number(form.week)
      });
      setMessage(res.data.msg || 'Assignment created.');
      setForm(emptyAssignment);
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create assignment');
    }
  };

  const startGrade = (assignmentId, submission) => {
    setGrading({ assignmentId, submission });
    setGradeValue(
      submission.trainerGrade != null ? submission.trainerGrade : ''
    );
    setGradeComment(submission.trainerComments || '');
    setMessage('');
    setError('');
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!grading) return;
    setMessage('');
    setError('');
    try {
      const res = await api.put(
        `/learner/assignment/${grading.assignmentId}/grade`,
        {
          trainerGrade: Number(gradeValue),
          trainerComments: gradeComment
        }
      );
      setMessage(res.data.msg || 'Grade submitted.');
      setGrading(null);
      setGradeValue('');
      setGradeComment('');
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit grade');
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Assignments"
        subtitle="Create assignments and review intern submissions."
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No assignments created yet.
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a._id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Week {a.week}: {a.title}
                    </p>
                    <p className="mt-1 text-slate-600">{a.description}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Batch: {a.batchId?.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Submissions: {a.submissions?.length || 0}
                  </p>
                </div>

                {a.submissions?.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                    {a.submissions.map((s) => (
                      <div
                        key={s._id}
                        className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2"
                      >
                        <div className="text-[11px] text-slate-700">
                          <p>
                            Intern:{' '}
                            <span className="font-semibold">
                              {s.internId?.name || s.internId}
                            </span>
                          </p>
                          <p className="truncate">
                            Repo:{' '}
                            <a
                              href={s.githubRepo}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent underline"
                            >
                              {s.githubRepo}
                            </a>
                          </p>
                          {s.aiReport && (
                            <p className="mt-1 text-slate-500">
                              AI: {s.aiReport}
                            </p>
                          )}
                          {s.trainerGrade != null && (
                            <p className="mt-1 text-slate-600">
                              Grade: {s.trainerGrade} – {s.trainerComments}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => startGrade(a._id, s)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                        >
                          Grade
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
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

      <Card
        title="Create assignment"
        subtitle="Publish a new task for a specific batch and week."
      >
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Week
            </label>
            <input
              name="week"
              type="number"
              min="1"
              value={form.week}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Batch ID (ObjectId)
            </label>
            <input
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="Paste Batch _id"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Create assignment
            </button>
          </div>
        </form>
      </Card>

      {grading && (
        <Card
          title="Grade submission"
          subtitle={`Assignment grade for ${grading.submission.internId?.name || ''}`}
        >
          <form onSubmit={handleGrade} className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Grade (0–100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                required
                className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Trainer comments
              </label>
              <textarea
                rows={3}
                value={gradeComment}
                onChange={(e) => setGradeComment(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Submit grade
            </button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default TrainerAssignmentsPage;
