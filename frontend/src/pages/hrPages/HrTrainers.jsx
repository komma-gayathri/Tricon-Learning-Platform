import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const HrTrainers = () => {
  const navigate = useNavigate();

  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  /* ================= FETCH TRAINERS ================= */
  const fetchTrainers = async () => {
    try {
      const res = await api.get("/hr/trainers");
     const list = Array.isArray(res.data?.trainers) ? res.data.trainers : [];



const sorted = [...list].sort(
  (a, b) => b._id.localeCompare(a._id)
);

setTrainers(sorted);
setFilteredTrainers(sorted);

    } catch (err) {
      console.error("Failed to fetch trainers", err);
      setError("Failed to load trainers");
      setTrainers([]);
      setFilteredTrainers([]);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTrainers(trainers);
    } else {
      setFilteredTrainers(
        trainers.filter(
          (t) =>
            t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, trainers]);

  /* ================= FORM ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        ...form,
        role: "TRAINER", 
      });

      setForm({ name: "", email: "", password: "" });
      fetchTrainers();
      alert("Trainer created successfully!");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create trainer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manage Trainers</h1>
        <p className="mt-2 text-slate-600">
          Create trainers (assign batches from profile)
        </p>
      </div>

      {/* CREATE TRAINER */}
      <section className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold">Create New Trainer</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Trainer Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
  type="submit"
  disabled={loading}
  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded transition disabled:opacity-50"
>
  {loading ? "Creating..." : "Create Trainer"}
</button>

        </form>
      </section>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border px-4 py-2 rounded"
      />

      {/* LIST */}
      <h2 className="text-xl font-semibold">
        Trainers ({filteredTrainers.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredTrainers.map((trainer) => (
          <div key={trainer._id} className="border p-4 rounded shadow">
            <p className="text-xs font-bold">
              {trainer.batchCount ?? 0} Batches
            </p>
            <h3 className="font-semibold">{trainer.name}</h3>
            <p className="text-sm text-gray-600">{trainer.email}</p>

            <button
  type="button"
  onClick={() => navigate(`/hr/trainers/${trainer._id}`)}
  className="mt-3 w-full bg-pink-500 hover:bg-pink-600 text-white py-1 rounded text-sm transition"
>
  Manage Profile →
</button>

          </div>
        ))}
      </div>
    </div>
  );
};

export default HrTrainers;
