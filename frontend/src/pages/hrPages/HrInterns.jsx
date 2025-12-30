import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api'; 

const HrInterns = () => {
  const { token } = useAuth();
  const [interns, setInterns] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', batchId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch interns
  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const res = await api.get('/hr/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterns(res.data.users || []);
    } catch (err) {
      console.error('Error fetching interns:', err);
      setError('Failed to load interns');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/hr/interns', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ name: '', email: '', password: '', batchId: '' });
      fetchInterns(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create intern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Interns</h1>
      
      {/* Create Intern Section */}
      <section className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Intern</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Batch ID</label>
              <input
                name="batchId"
                required
                value={form.batchId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Enter batch ID (e.g., 64fabc123...)"
              />
            </div>
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Intern'}
          </button>
        </form>
      </section>

      {/* Interns List Section */}
      <section className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Interns List ({interns.length})</h2>
          <button
            onClick={fetchInterns}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Batch</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {interns.map((intern) => (
                <tr key={intern._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{intern.name}</td>
                  <td className="py-3 px-4">{intern.email}</td>
                  <td className="py-3 px-4">
                    {/* FIXED: Proper batch display */}
                    {intern.batchId?.name || (intern.batchId ? `Batch ${intern.batchId}` : 'No batch')}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {new Date(intern.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {interns.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500">
                    No interns found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
export default HrInterns;