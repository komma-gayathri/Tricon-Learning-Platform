import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
 
const HrTrainers = () => {
  const navigate = useNavigate();
 
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
 
  const [searchTerm, setSearchTerm] = useState('');
 
  useEffect(() => {
    fetchTrainers();
  }, []);
 
 
  const fetchTrainers = async () => {
    try {
      const res = await api.get('/hr/trainers');
      const users = Array.isArray(res.data)
        ? res.data
        : res.data.users || [];
      setTrainers(users);
      setFilteredTrainers(users);
    } catch (err) {
      setError('Failed to load trainers');
    }
  };
 
 
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTrainers(trainers);
    } else {
      const filtered = trainers.filter(
        (trainer) =>
          trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trainer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTrainers(filtered);
    }
  }, [trainers, searchTerm]);
 
 
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };
 
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
 
    try {
      await api.post('/hr/trainers', form);
      setForm({ name: '', email: '', password: '' });
      fetchTrainers();
      alert("✅ Trainer created successfully!");
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create trainer');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manage Trainers</h1>
        <p className="mt-2 text-slate-600">Create trainers (assign batches from profile)</p>
      </div>
 
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Create New Trainer
        </h2>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trainer Name
              </label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
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
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>
 
            <div className="md:col-span-2">
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
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
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
            className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white"
          >
            {loading ? 'Creating...' : 'Create Trainer'}
          </button>
        </form>
      </section>
 
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Search Trainers
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by name or email..."
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </section>
 
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Trainers ({filteredTrainers.length})
        </h2>
 
        {filteredTrainers.length === 0 ? (
          <p className="text-slate-600">No trainers found</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrainers.map((trainer) => (
              <div
                key={trainer._id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-xs font-semibold text-primary">
                  {trainer.trainerBatches?.length || 0} Batches
                </p>
                <h3 className="font-semibold text-slate-900">{trainer.name}</h3>
                <p className="text-xs text-slate-600">{trainer.email}</p>
 
                <button
                  onClick={() => navigate(`/hr/trainers/${trainer._id}`)}
                  className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  Manage Profile →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
 
export default HrTrainers;
 
 