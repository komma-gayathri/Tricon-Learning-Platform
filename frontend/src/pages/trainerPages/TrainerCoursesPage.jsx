import React, { useEffect, useState } from 'react';
import api from '../../api';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

const emptyCourse = {
  title: '',
  description: '',
  content: '',
  week: '',
  batchId: '',
  difficulty: ''
};

const TrainerCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCourse);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [videoFile, setVideoFile] = useState(null);

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/courses');
      const mine = (res.data.courses || []).filter(
        (c) => c.instructor?._id === user?.id || c.trainerId?._id === user?.id
      );
      setCourses(mine);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const res = await api.get('/batch'); // GET /api/batch
      setBatches(res.data.batches || []);
    } catch (err) {
      console.error('Failed to load batches', err);
    }
  };

  useEffect(() => {
    loadBatches();
    loadCourses();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const startCreate = () => {
    setEditing(null);
    setForm(emptyCourse);
    setMessage('');
    setError('');
    setVideoFile(null);
  };

  const startEdit = (course) => {
    setEditing(course);
    setForm({
      title: course.title || '',
      description: course.description || '',
      content: course.content || '',
      week: course.week || '',
      batchId: course.batchId?._id || course.batchId || '',
      difficulty: course.difficulty || ''
    });
    setMessage('');
    setError('');
    setVideoFile(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      let courseId;

      if (editing) {
        const res = await api.put(`/courses/${editing._id}`, {
          ...form,
          week: Number(form.week)
        });
        courseId = res.data.course._id;
        setMessage(res.data.msg || 'Course updated.');
      } else {
        const res = await api.post('/courses/create', {
          ...form,
          week: Number(form.week)
        });
        courseId = res.data.course._id;
        setMessage(res.data.msg || 'Course created.');
      }

      // Upload video if selected
      if (videoFile && courseId) {
        const fd = new FormData();
        fd.append('video', videoFile);
        await api.post(`/courses/${courseId}/upload-video`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await loadCourses();
      setEditing(null);
      setForm(emptyCourse);
      setVideoFile(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save course');
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course and its quizzes?')) return;
    setMessage('');
    setError('');
    try {
      const res = await api.delete(`/courses/${courseId}`);
      setMessage(res.data.msg || 'Course deleted.');
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete course');
    }
  };

  const handleGenerateQuiz = async (courseId) => {
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/courses/${courseId}/generate-quiz`);
      setMessage(res.data.msg || 'AI quiz generated.');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to generate quiz');
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="My courses"
        subtitle="Create and manage courses, videos, and AI quizzes."
        actions={
          <button
            type="button"
            onClick={startCreate}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            + New course
          </button>
        }
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading courses…</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-500">
            No courses yet. Click “New course” to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <div
                key={c._id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {c.title}{' '}
                      <span className="text-[11px] text-slate-500">
                        (Week {c.week})
                      </span>
                    </p>
                    <p className="mt-1 text-slate-600 line-clamp-2">
                      {c.description}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Batch: {c.batchId?.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c._id)}
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateQuiz(c._id)}
                      className="mt-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white hover:bg-primary/90"
                    >
                      AI Quiz
                    </button>
                  </div>
                </div>
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
        title={editing ? 'Edit course' : 'Create course'}
        subtitle="Provide core details and link to the correct batch."
      >
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
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

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              rows={2}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">
              Content overview
            </label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              rows={3}
            />
          </div>

          {/* Batch dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Batch
            </label>
            <select
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            >
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Difficulty
            </label>
            <input
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="Beginner / Intermediate / Advanced"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">
              Upload video (optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              {editing ? 'Save changes' : 'Create course'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TrainerCoursesPage;
