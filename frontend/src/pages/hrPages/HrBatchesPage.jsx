import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
import { Link } from "react-router-dom";
 
const HrBatchesPage = () => {
  const [form, setForm] = useState({
    batchId: "",
    name: "",
    startDate: "",
    endDate: ""
  });
 
  const [batches, setBatches] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
 
  /* =========================
     HANDLE FORM
  ========================= */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
 
    // Validate dates before submission
    if (!form.batchId || !form.name || !form.startDate || !form.endDate) {
      setError("All fields are required");
      return;
    }
 
    // Parse dates in local timezone (input type="date" returns YYYY-MM-DD)
    const [startYear, startMonth, startDay] = form.startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = form.endDate.split('-').map(Number);
 
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
 
    if (start < today) {
      setError("Start date cannot be in the past. Please select a future date.");
      return;
    }
 
    if (start >= end) {
      setError("End date must be after start date. Please select a later date for end date.");
      return;
    }
 
    const durationMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (durationMonths > 24) {
      setError("Batch duration cannot exceed 24 months");
      return;
    }
 
    try {
      const res = await api.post("/batches/create", form);
      setMessage(res.data.msg || "Batch created successfully");
      setForm({ batchId: "", name: "", startDate: "", endDate: "" });
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create batch");
    }
  };
 
  /* =========================
     FETCH BATCHES
  ========================= */
  const fetchBatches = async () => {
    try {
      const res = await api.get("/batches/");
      const batchList = Array.isArray(res.data)
        ? res.data
        : res.data?.batches || [];
      setBatches(batchList);
    } catch (err) {
      console.error("Fetch batches error:", err);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    fetchBatches();
  }, []);
 
  return (
    <div className="space-y-6">
      {/* ================= CREATE BATCH ================= */}
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
            <p className="text-[11px] text-slate-500">Use a consistent pattern like BATCH-YYYY-XX for easy management</p>
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
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
            <p className="text-[11px] text-slate-500">Must be today or a future date</p>
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
              min={form.startDate || new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
            <p className="text-[11px] text-slate-500">Must be after start date</p>
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
 
      {/* ================= BATCH CARDS ================= */}
      <div>
        <h3 className="mb-6 text-lg font-bold text-slate-900">
          Existing Batches ({batches.length})
        </h3>
 
        {loading && <p className="text-sm text-slate-500">Loading batches…</p>}
        {!loading && batches.length === 0 && (
          <p className="text-sm text-slate-500">No batches created yet</p>
        )}
 
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => {
            const startDate = new Date(batch.startDate);
            const endDate = new Date(batch.endDate);
            const internCount = batch.interns?.length || 0;
            const trainerCount = batch.trainers?.length || 0;
 
            return (
              <Link
                key={batch._id}
                to={`/hr/batches/${batch._id}`}
                className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
              >
                {/* Header Section */}
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
                      {batch.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 font-mono">
                      {batch.batchId}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {batch.averageRating > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
                        ★ {batch.averageRating.toFixed(1)}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Active
                    </span>
                  </div>
                </div>
 
                {/* Date Section */}
                <div className="mb-4 flex items-center gap-2 text-xs text-slate-600">
                  <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
 
                {/* Stats Section */}
                <div className="mb-4 space-y-2">
                  {/* Interns */}
                  <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3">
                    <svg className="w-4 h-4 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600">Interns</p>
                      <p className="text-xl font-bold text-slate-900">{internCount}</p>
                    </div>
                  </div>
 
                  {/* Trainers */}
                  <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3">
                    <svg className="w-4 h-4 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600">Trainers</p>
                      <p className="text-xl font-bold text-slate-900">{trainerCount}</p>
                    </div>
                  </div>
                </div>
 
                {/* Footer Button */}
                <div className="mt-auto border-t border-slate-100 pt-4">
                  <button className="w-full flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary/90">
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
 
    </div>
  );
};
 
export default HrBatchesPage;
 
 