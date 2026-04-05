import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function OrganizationSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState({ name: '', description: '' });
  const [invitations, setInvitations] = useState([{ email: '', role: 'STAFF' }]);
  const [createdOrg, setCreatedOrg] = useState(null);

  const handleOrgChange = (e) => {
    const { name, value } = e.target;
    setOrganizationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInvitationChange = (index, field, value) => {
    const updated = [...invitations];
    updated[index][field] = value;
    setInvitations(updated);
  };

  const addInvitation = () => {
    setInvitations([...invitations, { email: '', role: 'STAFF' }]);
  };

  const removeInvitation = (index) => {
    setInvitations(invitations.filter((_, i) => i !== index));
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/organizations/', organizationData);
      setCreatedOrg(response.data);
      setStep(2);
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitations = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const valid = invitations.filter((inv) => inv.email.trim() !== '');
      if (valid.length > 0) {
        await api.post(`/organizations/${createdOrg.id}/invite/`, { invitations: valid });
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error sending invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all text-slate-900 placeholder:text-slate-400';
  const labelClass = 'block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5';

  const roleColors = {
    STAFF: 'bg-slate-100 text-slate-600',
    MANAGER: 'bg-blue-50 text-brand-700',
    OWNER: 'bg-brand-50 text-brand-800',
  };

  return (
    <div className="min-h-screen font-body flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden bg-slate-50">

      {/* Background */}
      <div className="absolute inset-0 dot-grid opacity-50" />
      <div className="absolute top-[-80px] right-[-80px] w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center px-8">
        <div className="inline-flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-700 rounded-md flex items-center justify-center">
            <span className="material-icons text-white text-xs">account_balance_wallet</span>
          </div>
          <span className="font-display font-700 text-slate-800 text-sm tracking-tight">
            Vyapar <span className="text-brand-700">Margadarshan</span>
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl border border-slate-200 shadow-float z-10 overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-brand-700 transition-all duration-500"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { n: 1, label: 'Organisation' },
              { n: 2, label: 'Invite team' },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    step > s.n
                      ? 'bg-emerald-500 text-white'
                      : step === s.n
                      ? 'bg-brand-700 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step > s.n
                      ? <span className="material-icons text-[11px]">check</span>
                      : s.n}
                  </div>
                  <span className={`text-xs font-semibold ${step === s.n ? 'text-slate-800' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < 1 && <div className={`w-10 h-px ${step > 1 ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Create org ── */}
          {step === 1 && (
            <>
              <div className="mb-7">
                <h1 className="font-display text-2xl font-700 text-slate-900 mb-1.5">
                  Set up your organisation
                </h1>
                <p className="text-sm text-slate-500">
                  This is your shared workspace for managing expenses.
                </p>
              </div>

              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <label className={labelClass}>Organisation name *</label>
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                      business
                    </span>
                    <input
                      name="name"
                      type="text"
                      required
                      value={organizationData.name}
                      onChange={handleOrgChange}
                      placeholder="e.g. Sharma Traders Pvt. Ltd."
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Description <span className="normal-case text-slate-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-3 text-slate-400 text-[18px]">
                      notes
                    </span>
                    <textarea
                      name="description"
                      rows="3"
                      value={organizationData.description}
                      onChange={handleOrgChange}
                      placeholder="Brief description of your business..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60 shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue
                      <span className="material-icons text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Invite team ── */}
          {step === 2 && (
            <>
              <div className="mb-7">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <span className="material-icons text-emerald-600 text-sm">check_circle</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {createdOrg?.name} created!
                  </span>
                </div>
                <h1 className="font-display text-2xl font-700 text-slate-900 mb-1.5">
                  Invite your team
                </h1>
                <p className="text-sm text-slate-500">
                  Add team members now or skip and do it later from settings.
                </p>
              </div>

              <form onSubmit={handleSendInvitations} className="space-y-3">
                {invitations.map((inv, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                        mail_outline
                      </span>
                      <input
                        type="email"
                        placeholder="colleague@email.com"
                        value={inv.email}
                        onChange={(e) => handleInvitationChange(index, 'email', e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <select
                      value={inv.role}
                      onChange={(e) => handleInvitationChange(index, 'role', e.target.value)}
                      className={`px-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 bg-slate-50 transition-all cursor-pointer ${roleColors[inv.role]}`}
                    >
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="OWNER">Owner</option>
                    </select>

                    {invitations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvitation(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <span className="material-icons text-sm">close</span>
                      </button>
                    )}
                  </div>
                ))}

                {/* Add more */}
                <button
                  type="button"
                  onClick={addInvitation}
                  className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-icons text-sm">add</span>
                  Add another
                </button>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                  >
                    Skip for now
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send invites
                        <span className="material-icons text-sm">send</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Bottom */}
      <p className="relative z-10 mt-6 text-xs text-slate-400 text-center">
        You can always manage your team from Settings later.
      </p>
    </div>
  );
}

export default OrganizationSetup;