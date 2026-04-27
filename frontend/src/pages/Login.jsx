import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  const [formData, setFormData] = useState({ email: '', password: '', remember_me: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleResendVerification = async () => {
    try {
      await authService.resendVerification(formData.email);
      setError('');
      alert('Verification email sent! Please check your inbox.');
    } catch (err) {
      console.error('Failed to resend verification:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setEmailNotVerified(false);
    setAttemptsLeft(null);
    setLoading(true);

    try {
      await authService.login(formData);

      // If there's an invitation token, redirect to accept page
      if (inviteToken) {
        window.location.href = `/invite?token=${inviteToken}`;
      } else {
        // ✅ FORCE RELOAD so auth state updates
        window.location.href = '/dashboard';
      }

    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData?.email_not_verified) {
        setEmailNotVerified(true);
        setError(errorData.error || 'Please verify your email before logging in.');
      } else if (errorData?.attempts_left !== undefined) {
        setAttemptsLeft(errorData.attempts_left);
        setError(errorData.error || 'Invalid email or password.');
      } else {
        setError(errorData?.error || errorData?.detail || 'Invalid email or password.');
      }
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

      <div className="relative w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-float p-8 z-10">

        {inviteToken && (
          <div className="mb-6 flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
            <span className="material-icons text-brand-600 text-sm mt-0.5">mail</span>
            <div>
              <p className="text-sm font-bold text-brand-900">You've been invited!</p>
              <p className="text-xs text-brand-700 mt-0.5">
                Don't have an account?{' '}
                <Link to={`/register?invite=${inviteToken}`} className="font-semibold underline">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        )}

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
            <div className="flex-1">
              <p className="text-sm text-red-600">{error}</p>
              {attemptsLeft !== null && attemptsLeft > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining before account lockout
                </p>
              )}
              {emailNotVerified && (
                <button
                  onClick={handleResendVerification}
                  className="text-xs text-red-700 font-semibold underline mt-2"
                >
                  Resend verification email
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-brand-700 font-semibold hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-icons text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="remember_me"
              id="remember_me"
              checked={formData.remember_me}
              onChange={handleChange}
              className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="remember_me" className="ml-2 text-sm text-slate-600">
              Remember me for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-700 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;