import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function OrganizationSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState({
    name: '',
    description: ''
  });
  const [invitations, setInvitations] = useState([
    { email: '', role: 'STAFF' }
  ]);
  const [createdOrg, setCreatedOrg] = useState(null);

  const handleOrgChange = (e) => {
    const { name, value } = e.target;
    setOrganizationData(prev => ({ ...prev, [name]: value }));
  };

  const handleInvitationChange = (index, field, value) => {
    const newInvitations = [...invitations];
    newInvitations[index][field] = value;
    setInvitations(newInvitations);
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
      alert('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitations = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validInvitations = invitations.filter(inv => inv.email.trim() !== '');
      
      if (validInvitations.length > 0) {
        await api.post(`/organizations/${createdOrg.id}/invite/`, {
          invitations: validInvitations
        });
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const skipInvitations = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#00164e] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-[#00236f] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-[#00236f]' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-[#00236f] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        {step === 1 ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Organization</h2>
              <p className="text-gray-600">Set up your business workspace</p>
            </div>

            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  name="name"
                  type="text"
                  placeholder="Enter your organization name"
                  value={organizationData.name}
                  onChange={handleOrgChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  name="description"
                  rows="3"
                  placeholder="Brief description of your organization"
                  value={organizationData.description}
                  onChange={handleOrgChange}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00236f] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Invite Team Members</h2>
              <p className="text-gray-600">Add people to your organization (optional)</p>
            </div>

            <form onSubmit={handleSendInvitations} className="space-y-6">
              {invitations.map((invitation, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="email"
                    placeholder="Email address"
                    value={invitation.email}
                    onChange={(e) => handleInvitationChange(index, 'email', e.target.value)}
                  />
                  <select
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={invitation.role}
                    onChange={(e) => handleInvitationChange(index, 'role', e.target.value)}
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="OWNER">Owner</option>
                  </select>
                  {invitations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInvitation(index)}
                      className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addInvitation}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-semibold hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + Add Another
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={skipInvitations}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#00236f] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invitations'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizationSetup;
