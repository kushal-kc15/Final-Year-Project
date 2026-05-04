import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../services/authService';
import Logo from '../components/Logo';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
        
        <div className="absolute top-8 left-8">
          <Link to="/">
            <Logo className="w-12 h-12" />
          </Link>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-green-600 text-3xl">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Password reset successful!
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Redirecting to login page in 3 seconds...
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm w-full"
          >
            Go to Login
            <span className="material-icons text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      
      <div className="absolute top-8 left-8">
        <Link to="/">
          <Logo className="w-12 h-12" />
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset your password
          </h1>
          <p className="text-base text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span className="material-icons text-red-500 text-lg mt-0.5">error_outline</span>
            <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1.5">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.score
                          ? strengthColors[passwordStrength.score]
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-semibold ${
                  passwordStrength.score < 2 ? 'text-red-600' :
                  passwordStrength.score === 2 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {strengthLabels[passwordStrength.score]}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons text-lg">
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
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium mt-6 transition-colors"
        >
          <span className="material-icons text-sm">arrow_back</span>
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ResetPassword;
