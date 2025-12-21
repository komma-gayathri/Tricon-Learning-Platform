import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Intern',
    batchId : ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-800">
          Create your account
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Join your batch and start learning.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Name</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Role (for testing)
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
            >
              <option value="Intern">Intern</option>
              <option value="TRAINER">Trainer</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Batch ID (given by HR)
            </label>
            <input
              name="batchId"
              required
              value={form.batchId}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="Paste batch id from HR"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
