import React, { useState } from 'react';
import api from '../api';
import Card from '../components/Card';

const HrBatchesPage = () => {
  const [form, setForm] = useState({
    batchId: '',
    name: '',
    startDate: '',
    endDate: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await api.post('/batch/create', form);
      setMessage(res.data.msg || 'Batch created successfully');
      setForm({ batchId: '', name: '', startDate: '', endDate: '' });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create batch');
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Batch management"
        subtitle="Create training batches for interns and trainers."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Batch ID
            </label>
            <input
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="e.g. BATCH-2025-01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Batch name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="e.g. Jan 2025 Interns"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Start date
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">
              End date
            </label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-500">
              Use a consistent batch ID pattern so it is easy to manage.
            </p>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Create batch
            </button>
          </div>
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
      </Card>
    </div>
  );
};

export default HrBatchesPage;
