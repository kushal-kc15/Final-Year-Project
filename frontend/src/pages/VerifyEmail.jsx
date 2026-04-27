import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../services/authService';

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

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

      {/* Card */}
      <div className="relative w-full max-w-[440px] bg-white rounded-2xl border border-slate-200 shadow-float p-8 z-10 text-center">
        
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-700 text-slate-900 mb-2">
              Verifying your email...
            </h1>
            <p className="text-sm text-slate-600">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-green-600 text-3xl">check_circle</span>
            </div>
            <h1 className="font-display text-2xl font-700 text-slate-900 mb-2">
              Email verified!
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              {message}
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
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-red-600 text-3xl">error_outline</span>
            </div>
            <h1 className="font-display text-2xl font-700 text-slate-900 mb-2">
              Verification failed
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              {message}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                Go to Login
                <span className="material-icons text-sm">arrow_forward</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Create New Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
