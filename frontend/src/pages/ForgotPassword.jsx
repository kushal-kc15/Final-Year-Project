import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen font-body flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden bg-slate-50">
        
        {/* Background */}
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-700 rounded-md flex items-center justify-center">
              <span className="material-icons text-white text-xs">account_balance_wallet</span>
            </div>
            <span className="font-display font-700 text-slate-800 text-sm tracking-tight">
              Vyapar <span className="text-brand-700">Margadarshan</span>
            </span>
          </Link>
        </div>

        {/* Success Card */}
        <div className="relative w-full max-w-[440px] bg-white rounded-2xl border border-slate-200 shadow-float p-8 z-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-green-600 text-3xl">mark_email_read</span>
          </div>
          <h1 className="font-display text-2xl font-700 text-slate-900 mb-2">
            Check your email
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            If an account exists with <strong>{email}</strong>, we've sent a password reset link. 
            Please check your inbox.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-blue-900 font-semibold mb-2">📧 Didn't receive the email?</p>
            <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Back to Login
            <span className="material-icons text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-50">
      
      {/* Background */}
      <div className="absolute inset-0 dot-grid opacity-50" />
      <div className="absolute top-[-80px] right-[-80px] w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-8">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-700 rounded-md flex items-center justify-center">
            <span className="material-icons text-white text-xs">account_balance_wallet</span>
          </div>
          <span className="font-display font-700 text-slate-800 text-sm tracking-tight">
            Vyapar <span className="text-brand-700">Margadarshan</span>
          </span>
        </Link>
        <p className="text-sm text-slate-500">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-float p-8 z-10">
        
        <div className="mb-8">
          <h1 className="font-display text-2xl font-700 text-slate-900 mb-1.5">
            Forgot password?
          </h1>
          <p className="text-sm text-slate-500">
            No worries, we'll send you reset instructions.
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
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium mt-6 transition-colors"
        >
          <span className="material-icons text-sm">arrow_back</span>
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
