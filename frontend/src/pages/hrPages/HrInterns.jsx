import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";

const HrInterns = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    batchId: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInterns();
  }, []);

  // Filter interns based on search term
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

  const fetchInterns = async () => {
    try {
      const res = await api.get("/hr/interns");
      setInterns(res.data.users || []);
      setFilteredInterns(res.data.users || []);
    } catch (err) {
      console.error("Error fetching interns:", err);
      setError("Failed to load interns");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setError("");
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manage Interns</h1>
        <p className="mt-2 text-slate-600">Create and manage intern profiles</p>
      </div>

      {/* Create Intern Section - Compact */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Create New Intern</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Intern Name</label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="john@company.com"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch ID</label>
              <input
                name="batchId"
                required
                value={form.batchId}
                onChange={handleChange}
                placeholder="64fabc1234567890"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
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
            className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create Intern"}
          </button>
        </form>
      </section>

      {/* Search Intern Section */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Search Interns</label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 pl-11 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 pr-4"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchTerm && (
          <p className="mt-2 text-xs text-slate-500">
            Showing {filteredInterns.length} of {interns.length} interns
          </p>
        )}
      </section>

      {/* Interns Grid */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Interns ({filteredInterns.length})
          </h2>
          <button
            onClick={fetchInterns}
            className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {filteredInterns.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            {searchTerm ? (
              <>
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="mt-4 text-slate-600">No interns found matching "{searchTerm}"</p>
                <p className="mt-1 text-sm text-slate-500">
                  Try searching by name or email
                </p>
              </>
            ) : (
              <p className="mt-4 text-slate-600">No interns found. Create one to get started!</p>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredInterns.map((intern) => {
              const batchAssigned =
                intern.batchId?.name || (intern.batchId ? `Batch ${String(intern.batchId).slice(-6)}` : null);

              return (
                <div
                  key={String(intern._id)}
                  className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
                >
                  {/* Thumbnail/Avatar Header */}
                  <div className="relative h-28 bg-slate-50 border-b border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                    <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    {/* Batch Badge */}
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {batchAssigned || "No Batch"}
                    </span>

                    {/* Name */}
                    <h3 className="mt-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-primary line-clamp-2">
                      {intern.name}
                    </h3>

                    {/* Email */}
                    <p className="mt-1 flex-1 text-xs text-slate-600 line-clamp-2">{intern.email}</p>

                    {/* CTA Button */}
                    <button
                      onClick={() => navigate(`/hr/interns/${String(intern._id)}`)}
                      className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      View Profile
                    </button>
                  </div>
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
