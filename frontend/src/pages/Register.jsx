import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import Logo from '../components/Logo';

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
  const [step, setStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Join thousands of businesses",
      description: "Get started with Vyapar Margadarshan and take control of your business expenses. Free for 30 days, no credit card required.",
      icon: "groups"
    },
    {
      title: "Powerful Expense Tracking",
      description: "Track all your business expenses in one place. Categorize, tag, and organize expenses effortlessly.",
      icon: "trending_up"
    },
    {
      title: "Team Collaboration",
      description: "Invite team members, set approval workflows, and manage expenses together seamlessly.",
      icon: "workspace_premium"
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'email') {
      const username = value.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({ ...prev, email: value, username }));
    }
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

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-green-600 text-3xl">mark_email_read</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-sm text-gray-600 mb-6">
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
            className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
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
      
      {/* Main Card Container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex">
        
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          
          {/* Logo */}
          <div className="mb-8">
            <Link to="/">
              <Logo className="w-12 h-12" />
            </Link>
          </div>

          {inviteToken && (
            <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <span className="material-icons text-blue-600 text-lg mt-0.5">mail</span>
              <div>
                <p className="text-sm font-semibold text-blue-900">You've been invited to join an organization!</p>
                <p className="text-xs text-blue-700 mt-1">
                  Create your account to accept the invitation.
                </p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sign up
            </h1>
            <p className="text-base text-gray-600">
              to access Vyapar Margadarshan
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > 1 ? <span className="material-icons text-[10px]">check</span> : '1'}
              </div>
              Your info
            </div>
            <div className={`flex-1 h-px ${step > 1 ? 'bg-green-300' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                2
              </div>
              {inviteToken ? 'Password' : 'Business & password'}
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <span className="material-icons text-red-500 text-lg mt-0.5">error_outline</span>
              <p className="text-sm text-red-700 whitespace-pre-line flex-1">{error}</p>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <input
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1.5">You'll use this email to sign in</p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!inviteToken && (
                <>
                  <div>
                    <input
                      name="business_name"
                      type="text"
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder="Business name (optional)"
                      className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <input
                      name="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="Phone number (optional)"
                      className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                </>
              )}

              <div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
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
                <div className="relative">
                  <input
                    name="password2"
                    type={showPassword2 ? 'text' : 'password'}
                    required
                    value={formData.password2}
                    onChange={handleChange}
                    placeholder="Confirm password"
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          <p className="text-xs text-gray-600 mt-6">
            Already have a Vyapar Margadarshan account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8 border-l border-gray-100">
          
          <div className="max-w-sm text-center">
            <div className="mb-6">
              <div className="w-full h-56 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center relative overflow-hidden mb-6">
                <div className="absolute top-3 left-3 right-3 h-6 bg-white/60 backdrop-blur-sm rounded-lg flex items-center px-2 gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
                    <span className="material-icons text-white text-4xl">check_circle</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-400 rounded-full"></div>
                    <div className="w-8 h-8 bg-indigo-400 rounded-full"></div>
                    <div className="w-8 h-8 bg-purple-400 rounded-full"></div>
                  </div>
                  <div className="w-32 h-2 bg-green-200 rounded-full"></div>
                </div>
                
                <div className="absolute top-12 left-6 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <span className="material-icons text-green-500 text-base">groups</span>
                </div>
                <div className="absolute top-12 right-6 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <span className="material-icons text-blue-500 text-base">trending_up</span>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <span className="material-icons text-indigo-500 text-base">workspace_premium</span>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {slides[currentSlide].title}
            </h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed px-4">
              {slides[currentSlide].description}
            </p>
            <button className="text-blue-600 font-semibold hover:text-blue-700 text-sm inline-flex items-center gap-1">
              Learn more
            </button>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    currentSlide === index ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
