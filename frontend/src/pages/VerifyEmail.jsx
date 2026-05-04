import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../services/authService';
import Logo from '../components/Logo';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      
      <div className="absolute top-8 left-8">
        <Link to="/">
          <Logo className="w-12 h-12" />
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your email...
            </h1>
            <p className="text-sm text-gray-600">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-green-600 text-3xl">check_circle</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email verified!
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              {message}
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
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-red-600 text-3xl">error_outline</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification failed
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              {message}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
              >
                Go to Login
                <span className="material-icons text-sm">arrow_forward</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
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
