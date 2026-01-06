import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";

const HrInterns = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);

  // Batch logic removed
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  // const [loadingBatches, setLoadingBatches] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    // batchId removed
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- Fetch Interns ---------------- */

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const res = await api.get("/hr/interns");
      const users = res.data.users || [];
      setInterns(users);
      setFilteredInterns(users);
    } catch (err) {
      console.error("Error fetching interns:", err);
      setError("Failed to load interns");
    }
  };

  // Batch fetching removed
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get("/batches");
        setBatches(res.data.batches || res.data || []);
      } catch (err) {
        console.error("Error fetching batches:", err);
      }
    };
    fetchBatches();
  }, []);

  /* ---------------- Filtering ---------------- */

  useEffect(() => {
    let result = interns;

    // Filter by Batch
    if (selectedBatch) {
      result = result.filter(
        (intern) =>
          intern.batches &&
          intern.batches.some(
            (b) => b._id === selectedBatch || b === selectedBatch
          )
      );
    }

    // Filter by Search
    if (searchTerm.trim()) {
      result = result.filter(
        (intern) =>
          intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          intern.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInterns(result);
  }, [interns, searchTerm, selectedBatch]);

  /* ---------------- Handlers ---------------- */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/hr/interns", form);
      setForm({ name: "", email: "", password: "" });
      fetchInterns();
      alert("✅ Intern created successfully!");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create intern");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manage Interns</h1>
        <p className="mt-2 text-slate-600">
          Create and manage intern profiles
        </p>
      </div>

      {/* Create Intern */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Create New Intern
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intern Name
              </label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="Enter intern name"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="intern@company.com"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
            </div>

            {/* Batch selection removed */}
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create Intern"}
          </button>
        </form>
      </section>

      {/* Search */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Search Interns
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="w-full md:w-64">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Filter by Batch
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Intern Cards */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Interns ({filteredInterns.length})
        </h2>

        {filteredInterns.length === 0 ? (
          <p className="text-slate-600">No interns found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInterns.map((intern) => {
              const batchLabel = intern.batches?.[0]?.name || "Not Allocated";

              return (
                <div
                  key={intern._id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <span className="text-xs font-semibold text-primary">
                    {batchLabel}
                  </span>
                  <h3 className="mt-1 font-semibold text-slate-900">
                    {intern.name}
                  </h3>
                  <p className="text-xs text-slate-600">{intern.email}</p>

                  <button
                    onClick={() =>
                      navigate(`/hr/interns/${String(intern._id)}`)
                    }
                    className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    View Profile
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HrInterns;
