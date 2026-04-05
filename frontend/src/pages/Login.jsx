import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      await authService.login(formData);

      // ✅ FORCE RELOAD so auth state updates
      window.location.href = '/dashboard';

    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-body flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-50">

      <div className="absolute inset-0 dot-grid opacity-50" />

      <div className="absolute top-[-80px] right-[-80px] w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-8">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-7 h-7 bg-brand-700 rounded-md flex items-center justify-center">
            <span className="material-icons text-white text-xs">account_balance_wallet</span>
          </div>
          <span className="font-display font-700 text-slate-800 text-sm tracking-tight">
            Vyapar <span className="text-brand-700">Margadarshan</span>
          </span>
        </Link>
        <p className="text-sm text-slate-500">
          No account?{' '}
          <Link to="/register" className="text-brand-700 font-semibold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>

      <div className="relative w-full max-w-[400px] bg-white rounded-2xl border border-slate-200 shadow-float p-8 z-10">

        <div className="mb-8">
          <h1 className="font-display text-2xl font-700 text-slate-900 mb-1.5">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to your workspace to continue
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="material-icons text-red-500 text-sm mt-0.5">error_outline</span>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-700 text-white py-2.5 rounded-xl"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-700 font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;