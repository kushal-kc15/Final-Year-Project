import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    business_name: '',
    phone_number: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [step, setStep] = useState(1); // 2-step form
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Auto-generate username from email
    if (name === 'email') {
      const username = value.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({ ...prev, email: value, username }));
    }
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

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.username || !formData.email) return;
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
      const response = await authService.register(formData);
      setRegistrationSuccess(true);
      // Don't auto-login, user needs to verify email first
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        if (errorData.error && errorData.feedback) {
          setError(`${errorData.error}\n${errorData.feedback.join('\n')}`);
        } else {
          const msg = Object.entries(errorData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
          setError(msg);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Shared input style
  const inputClass = "w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all text-slate-900 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

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

  // If registration successful, show success message
  if (registrationSuccess) {
    return (
      <div className="min-h-screen font-body flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="relative w-full max-w-[440px] bg-white rounded-2xl border border-slate-200 shadow-float p-8 z-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-green-600 text-3xl">mark_email_read</span>
          </div>
          <h1 className="font-display text-2xl font-700 text-slate-900 mb-2">
            Check your email
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            We've sent a verification link to <strong>{formData.email}</strong>. 
            Please check your inbox and click the link to verify your account.
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
            Go to Login
            <span className="material-icons text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

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
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[440px] bg-white rounded-2xl border border-slate-200 shadow-float p-8 z-10">

        {inviteToken && (
          <div className="mb-6 flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
            <span className="material-icons text-brand-600 text-sm mt-0.5">mail</span>
            <div>
              <p className="text-sm font-bold text-brand-900">You've been invited to join an organization!</p>
              <p className="text-xs text-brand-700 mt-0.5">
                Create your account to accept the invitation.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-700 text-slate-900 mb-1.5">
            Create your account
          </h1>
          <p className="text-sm text-slate-500">
            Get your business finances under control in minutes.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-7">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 1 ? 'text-brand-700' : 'text-slate-400'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-brand-700 text-white' : step > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {step > 1 ? <span className="material-icons text-[10px]">check</span> : '1'}
            </div>
            Your info
          </div>
          <div className={`flex-1 h-px ${step > 1 ? 'bg-emerald-300' : 'bg-slate-200'}`} />
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 2 ? 'text-brand-700' : 'text-slate-400'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
              2
            </div>
            {inviteToken ? 'Password' : 'Business & password'}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="material-icons text-red-500 text-sm mt-0.5">error_outline</span>
            <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>First name</label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">badge</span>
                  <input
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Ram"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">badge</span>
                  <input
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Sharma"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Email address</label>
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail_outline</span>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ram@business.com"
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">You'll use this email to sign in</p>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-sm"
            >
              Continue
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
          </form>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Only show business fields if NOT joining via invitation */}
            {!inviteToken && (
              <>
                <div>
                  <label className={labelClass}>Business name</label>
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">storefront</span>
                    <input
                      name="business_name"
                      type="text"
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder="Sharma Traders Pvt. Ltd."
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Phone number</label>
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">phone</span>
                    <input
                      name="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="+977 98XXXXXXXX"
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock_outline</span>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-icons text-[18px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
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
              <label className={labelClass}>Confirm password</label>
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock_outline</span>
                <input
                  name="password2"
                  type={showPassword2 ? 'text' : 'password'}
                  required
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-icons text-[18px]">
                    {showPassword2 ? 'visibility' : 'visibility_off'}
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

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                <span className="material-icons text-sm">arrow_back</span>
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create account
                    <span className="material-icons text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Sign in link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Bottom */}
      <p className="relative z-10 mt-6 text-xs text-slate-400 text-center">
        Free for 30 days · No credit card required
      </p>
    </div>
  );
}

export default Register;