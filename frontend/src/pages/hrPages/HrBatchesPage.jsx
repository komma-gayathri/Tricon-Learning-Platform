import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';

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
      toast.error("Please fill in all mandatory fields (*)");
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
      toast.success(res.data.msg || "Batch created successfully!");
      setForm({ batchId: "", name: "", startDate: "", endDate: "" });
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create batch");
    }
  };

  /* =========================
     FETCH BATCHES
  ========================= */
  const fetchBatches = async () => {
    try {
      const res = await api.get("/batches");
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
        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Batch Identifier <span className="text-red-500">*</span>
            </label>
            <input
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-slate-400"
              placeholder="e.g. BATCH-2025-01"
            />
            <p className="text-[11px] text-slate-500">Unique identifier for system tracking (e.g. BATCH-YYYY-MM)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Program / Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-slate-400"
              placeholder="e.g. Full Stack Development - Jan 2025"
            />
            <p className="text-[11px] text-slate-500">Descriptive name visible to interns (e.g. Course Name - Month Year)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-[11px] text-slate-500">Must be today or a future date</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              required
              min={form.startDate || new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-[11px] text-slate-500">Must be after the start date</p>
          </div>

          <div className="md:col-span-2 flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-all transform active:scale-95"
            >
              Create New Batch
            </button>
          </div>
        </form>


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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

