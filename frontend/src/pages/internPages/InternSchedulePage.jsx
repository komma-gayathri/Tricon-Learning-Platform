import React, { useState } from 'react';
import api from '../../api';
import Card from '../../components/Card';

const InternSchedulePage = () => {
  const [batchId, setBatchId] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');

  const loadSchedule = async () => {
    setError('');
    setSchedule(null);

    if (!batchId) {
      setError('BatchId is required.');
      return;
    }

    try {
      const res = await api.get(`/schedule/batch/${batchId}`);
      const all = res.data.schedules || []; // backend sends `schedules` array [web:65]
      const latest = all[0] || null;

      if (!latest) {
        setError('No schedule found for this batch.');
        return;
      }

      setSchedule(latest);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'No schedule found for this batch.'
          : err.response?.data?.msg || 'Failed to load schedule'
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="My schedule"
        subtitle="Daily plan for your batch sessions."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Batch ID
            </label>
            <input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="Enter your batch code"
            />
          </div>
          <button
            type="button"
            onClick={loadSchedule}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            Load schedule
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {schedule && (
          <div className="mt-4 space-y-3">
            {!Array.isArray(schedule.timetable) || schedule.timetable.length === 0 ? (
              <p className="text-xs text-slate-500">
                No timetable entries for this batch.
              </p>
            ) : (
              schedule.timetable.map((slot, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.2fr,1fr,1.4fr]"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {slot.topic || 'Session'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {slot.courseId?.title}
                    </p>
                  </div>
                  <div className="text-xs text-slate-600">
                    <p>{slot.date ? String(slot.date).slice(0, 10) : ''}</p>
                    <p>{slot.timeSlot}</p>
                  </div>
                  <div className="text-xs text-slate-600">
                    <p>
                      Trainer:{' '}
                      <span className="font-medium">
                        {slot.trainerId?.name || 'TBA'}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!schedule && !error && (
          <p className="mt-4 text-xs text-slate-500">
            Enter your batch ID and load your schedule.
          </p>
        )}
      </Card>
    </div>
  );
};

export default InternSchedulePage;
