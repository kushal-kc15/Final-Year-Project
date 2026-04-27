import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../services/authService';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    password2: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [success, setSuccess] = useState(false);

  // Password strength colors
  const strengthColors = {
    0: 'bg-red-500',
    1: 'bg-orange-500',
    2: 'bg-yellow-500',
    3: 'bg-lime-500',
    4: 'bg-green-500'
  };

  const strengthLabels = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong'
  };

  // Check password strength in real-time
  useEffect(() => {
    if (formData.password && formData.password.length > 0) {
      const checkStrength = async () => {
        try {
          const result = await authService.checkPasswordStrength(formData.password);
          setPasswordStrength(result);
        } catch (err) {
          console.error('Failed to check password strength:', err);
        }
      };
      const timer = setTimeout(checkStrength, 300);
      return () => clearTimeout(timer);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. No token provided.');
      return;
    }

    if (formData.password !== formData.password2) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength && passwordStrength.score < 2) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.error && errorData?.feedback) {
        setError(`${errorData.error}\n${errorData.feedback.join('\n')}`);
      } else {
        setError(errorData?.error || 'Failed to reset password. The link may be invalid or expired.');
      }
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
            <span className="material-icons text-green-600 text-3xl">check_circle</span>
          </div>
          <h1 className="font-display text-2xl font-700 text-slate-900 mb-2">
            Password reset successful!
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            Redirecting to login page in 3 seconds...
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Go to Login
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
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-float p-8 z-10">
        
        <div className="mb-8">
          <h1 className="font-display text-2xl font-700 text-slate-900 mb-1.5">
            Reset your password
          </h1>
          <p className="text-sm text-slate-500">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="material-icons text-red-500 text-sm mt-0.5">error_outline</span>
            <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
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
            
            {/* Password strength indicator */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1.5">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.score
                          ? strengthColors[passwordStrength.score]
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${
                    passwordStrength.score < 2 ? 'text-red-600' :
                    passwordStrength.score === 2 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {strengthLabels[passwordStrength.score]}
                  </span>
                </div>
                {passwordStrength.feedback && passwordStrength.feedback.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {passwordStrength.feedback.map((tip, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="material-icons text-[12px] text-slate-400 mt-0.5">info</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                name="password2"
                type={showPassword2 ? 'text' : 'password'}
                required
                value={formData.password2}
                onChange={handleChange}
                placeholder="Repeat your password"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-icons text-[18px]">
                  {showPassword2 ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {formData.password2 && formData.password !== formData.password2 && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <span className="material-icons text-[12px]">error</span>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
