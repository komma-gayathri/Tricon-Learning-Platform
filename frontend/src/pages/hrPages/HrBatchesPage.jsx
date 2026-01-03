import React, { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const HrBatchesPage = () => {
  const [form, setForm] = useState({
    batchId: "",
    name: "",
    startDate: "",
    endDate: ""
  });

  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================
     HANDLE FORM
  ========================= */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.batchId || !form.name || !form.startDate || !form.endDate) {
      setError("All fields are required");
      return;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setError("Start date cannot be in the past");
      return;
    }

    if (start >= end) {
      setError("End date must be after start date");
      return;
    }

    try {
      await api.post("/batches/create", form);
      toast.success("Batch created successfully");

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
      const res = await api.get("/batches");
      setBatches(res.data?.batches || []);
    } catch (err) {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="space-y-8">

      {/* ================= CREATE BATCH ================= */}
      <Card
        title="Batch Management"
        subtitle="Create training batches for interns and trainers"
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">

          {/* Batch ID */}
          <div>
            <label className="text-sm font-medium">
              Batch ID <span className="text-pink-500">*</span>
            </label>
            <input
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              required
              placeholder="e.g. BATCH-2025-01"
              className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm"
            />
          </div>

          {/* Batch Name */}
          <div>
            <label className="text-sm font-medium">
              Batch Name <span className="text-pink-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Jan 2025 Interns"
              className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="text-sm font-medium">
              Start Date <span className="text-pink-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
              className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-sm font-medium">
              End Date <span className="text-pink-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              required
              min={form.startDate}
              className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
            >
              Create Batch
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </Card>

      {/* ================= BATCH LIST ================= */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Existing Batches ({batches.length})
        </h3>

        {loading && <p className="text-sm text-gray-500">Loading batches…</p>}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Link
              key={batch._id}
              to={`/hr/batches/${batch._id}`}
              className="rounded-lg border bg-white p-4 shadow hover:shadow-md"
            >
              <h4 className="font-semibold">{batch.name}</h4>
              <p className="text-xs text-gray-500">{batch.batchId}</p>
              <p className="mt-2 text-xs text-gray-600">
                {new Date(batch.startDate).toLocaleDateString()} →{" "}
                {new Date(batch.endDate).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrBatchesPage;
