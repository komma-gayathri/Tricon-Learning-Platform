import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
 
const HrInterns = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
 
  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
 
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
 
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    batchId: "",
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
 
  /* ---------------- Fetch Batches ---------------- */
 
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get("/batches");
        setBatches(res.data.batches || res.data || []);
      } catch (err) {
        console.error("Error fetching batches:", err);
        setBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };
 
    fetchBatches();
  }, []);
 
  /* ---------------- Filtering ---------------- */
 
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInterns(interns);
    } else {
      const filtered = interns.filter(
        (intern) =>
          intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          intern.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInterns(filtered);
    }
  }, [interns, searchTerm]);
 
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
      setForm({ name: "", email: "", password: "", batchId: "" });
      fetchInterns();
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
 
        <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>
 
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch
              </label>
              <select
                name="batchId"
                required
                value={form.batchId}
                onChange={handleChange}
                disabled={loadingBatches}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                <option value="">Select a batch...</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name} ({batch.batchId})
                  </option>
                ))}
              </select>
            </div>
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
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
      </section>
 
      {/* Intern Cards */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Interns ({filteredInterns.length})
        </h2>
 
        {filteredInterns.length === 0 ? (
          <p className="text-slate-600">No interns found</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredInterns.map((intern) => {
              const batchLabel =
                intern.batchId?.name ||
                (intern.batchId
                  ? `Batch ${String(intern.batchId).slice(-6)}`
                  : "No Batch");
 
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
 