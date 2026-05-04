import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
        
        {/* Logo at top */}
        <div className="absolute top-8 left-8">
          <Link to="/">
            <Logo className="w-12 h-12" />
          </Link>
        </div>

        {/* Success Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-green-600 text-3xl">mark_email_read</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-sm text-gray-600 mb-6">
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
            className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm w-full"
          >
            Back to Login
            <span className="material-icons text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      
      {/* Logo at top */}
      <div className="absolute top-8 left-8">
        <Link to="/">
          <Logo className="w-12 h-12" />
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot password?
          </h1>
          <p className="text-base text-gray-600">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span className="material-icons text-red-500 text-lg mt-0.5">error_outline</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium mt-6 transition-colors"
        >
          <span className="material-icons text-sm">arrow_back</span>
          Back to Login
        </Link>

        <p className="text-center text-xs text-gray-500 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
