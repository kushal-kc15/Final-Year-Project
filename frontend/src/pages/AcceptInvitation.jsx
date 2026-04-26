import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/authService';

function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Check if user is logged in
    if (!authService.isAuthenticated()) {
      // Redirect to register with return URL (prefer register for new users)
      navigate(`/register?invite=${token}`);
      return;
    }

    // User is logged in, ready to accept
    setLoading(false);
  }, [token, navigate]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);

    try {
      await api.post('/invitations/accept/', { token });
      // Success - force reload to update auth context and redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-red-500 text-3xl">error_outline</span>
          </div>
          <h2 className="font-display text-xl font-700 text-slate-900 mb-2">Invalid Invitation</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-2.5 bg-brand-700 text-white font-semibold rounded-xl hover:bg-brand-800 transition-colors text-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-brand-700 text-3xl">mail</span>
          </div>
          <h2 className="font-display text-2xl font-700 text-slate-900 mb-2">
            You've been invited!
          </h2>
          <p className="text-sm text-slate-500">
            Accept this invitation to join the organization and start collaborating.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Invitation Details</p>
          <p className="text-sm text-slate-600">
            You'll be added as a team member and can start managing expenses.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <span className="material-icons text-red-500 text-sm mt-0.5">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={accepting}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 py-2.5 bg-brand-700 text-white font-semibold rounded-xl hover:bg-brand-800 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <span className="material-icons text-sm">check</span>
                Accept Invitation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitation;
