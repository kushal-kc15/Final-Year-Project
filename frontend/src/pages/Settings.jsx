import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ProfileDropdown from '../components/ProfileDropdown';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const inputClass = 'w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5';

const SETTINGS_TABS = [
  { id: 'profile',        label: 'Profile',         icon: 'person',           desc: 'Personal information' },
  { id: 'organization',   label: 'Organization',    icon: 'business',         desc: 'Company details' },
  { id: 'notifications',  label: 'Notifications',   icon: 'notifications',    desc: 'Email & alerts' },
  { id: 'preferences',    label: 'Preferences',     icon: 'tune',             desc: 'Display & language' },
  { id: 'integrations',   label: 'Integrations',    icon: 'extension',        desc: 'API & webhooks' },
  { id: 'billing',        label: 'Billing & Usage', icon: 'credit_card',      desc: 'Plan & usage' },
  { id: 'security',       label: 'Security',        icon: 'shield',           desc: 'Password & 2FA' },
  { id: 'data',           label: 'Data & Privacy',  icon: 'privacy_tip',      desc: 'Export & delete' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState(null);
  const [organization, setOrganization] = useState(null);

  // Profile form
  const [profileData, setProfileData] = useState({
    first_name: '', last_name: '', email: '', username: '',
    business_name: '', phone_number: ''
  });

  // Organization form
  const [orgData, setOrgData] = useState({
    name: '', industry: '', size: '', website: '', address: ''
  });

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_expense_approved: true,
    email_expense_rejected: true,
    email_budget_alert: true,
    email_team_updates: true,
    email_weekly_summary: false,
    push_expense_updates: true,
    push_budget_alerts: true,
  });

  // Preferences form
  const [preferencesData, setPreferencesData] = useState({
    default_currency: 'NPR',
    items_per_page: 10,
    theme_preference: 'system',
    language: 'en',
    date_format: 'MM/DD/YYYY',
    number_format: 'comma'
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    old_password: '', new_password: '', confirm_password: ''
  });

  // API Key state
  const [apiKeys, setApiKeys] = useState([]);
  const [showApiKey, setShowApiKey] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    if (user) fetchOrganization();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name:    user.first_name || '',
        last_name:     user.last_name || '',
        email:         user.email || '',
        username:      user.username || '',
        business_name: user.business_name || '',
        phone_number:  user.phone_number || ''
      });
      setPreferencesData({
        default_currency: user.default_currency || 'NPR',
        items_per_page:   user.items_per_page || 10,
        theme_preference: user.theme_preference || 'system',
        language: user.language || 'en',
        date_format: user.date_format || 'MM/DD/YYYY',
        number_format: user.number_format || 'comma'
      });
    }
  }, [user]);

  const fetchOrganization = async () => {
    try {
      const res = await api.get('/organizations/');
      const orgs = res.data.results || res.data;
      if (orgs.length > 0) {
        setOrganization(orgs[0]);
        setOrgData({
          name: orgs[0].name || '',
          industry: orgs[0].industry || '',
          size: orgs[0].size || '',
          website: orgs[0].website || '',
          address: orgs[0].address || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch organization:', err);
    }
  };

  const showToast = (message, type = 'error') => setToast({ message, type });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/profile/', {
        first_name:    profileData.first_name,
        last_name:     profileData.last_name,
        email:         profileData.email,
        business_name: profileData.business_name,
        phone_number:  profileData.phone_number
      });
      showToast('Profile updated successfully!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/preferences/', preferencesData);
      showToast('Preferences updated successfully!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 8) {
      showToast('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      showToast('Password changed successfully!', 'success');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/export-data/');
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Data exported successfully!', 'success');
    } catch (error) {
      showToast('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-body" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <Sidebar currentPage="settings" />
      
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-20 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your account settings and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-px h-8 bg-gray-200" />
            <ProfileDropdown />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto flex gap-8">
            
            {/* Left Sidebar Navigation */}
            <aside className="w-72 shrink-0 sticky top-8 self-start">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                <nav className="space-y-1">
                  {SETTINGS_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        activeTab === tab.id
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="material-icons text-[20px] mt-0.5">{tab.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{tab.label}</div>
                        <div className={`text-xs mt-0.5 ${activeTab === tab.id ? 'text-gray-300' : 'text-gray-400'}`}>
                          {tab.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Right Content Area */}
            <div className="flex-1 min-w-0">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your personal information and profile details</p>
                  </div>

                  {/* Profile Picture */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Profile Picture</h3>
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-3">Upload a profile picture to personalize your account</p>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                            Upload Photo
                          </button>
                          <button className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Personal Information</h3>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>First Name</label>
                          <input
                            type="text"
                            value={profileData.first_name}
                            onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                            className={inputClass}
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Last Name</label>
                          <input
                            type="text"
                            value={profileData.last_name}
                            onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                            className={inputClass}
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Email Address</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className={inputClass}
                          placeholder="john@example.com"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">This email is used for login and notifications</p>
                      </div>

                      <div>
                        <label className={labelClass}>Username</label>
                        <input
                          type="text"
                          value={profileData.username}
                          disabled
                          className={`${inputClass} opacity-60 cursor-not-allowed`}
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Username cannot be changed</p>
                      </div>

                      <div>
                        <label className={labelClass}>Phone Number</label>
                        <input
                          type="tel"
                          value={profileData.phone_number}
                          onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                          className={inputClass}
                          placeholder="+977 9812345678"
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Organization Tab */}
              {activeTab === 'organization' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your company information and details</p>
                  </div>

                  {role !== 'OWNER' ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-3">
                      <span className="material-icons text-amber-600">info</span>
                      <div>
                        <p className="font-semibold text-amber-900">Limited Access</p>
                        <p className="text-sm text-amber-700 mt-1">Only owners can modify organization settings</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Company Details</h3>
                    <form className="space-y-4">
                      <div>
                        <label className={labelClass}>Organization Name</label>
                        <input
                          type="text"
                          value={orgData.name}
                          onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                          className={inputClass}
                          placeholder="Acme Corporation"
                          disabled={role !== 'OWNER'}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Industry</label>
                          <select
                            value={orgData.industry}
                            onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                            className={inputClass}
                            disabled={role !== 'OWNER'}
                          >
                            <option value="">Select industry</option>
                            <option value="technology">Technology</option>
                            <option value="retail">Retail</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="education">Education</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Company Size</label>
                          <select
                            value={orgData.size}
                            onChange={(e) => setOrgData({ ...orgData, size: e.target.value })}
                            className={inputClass}
                            disabled={role !== 'OWNER'}
                          >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Website</label>
                        <input
                          type="url"
                          value={orgData.website}
                          onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                          className={inputClass}
                          placeholder="https://example.com"
                          disabled={role !== 'OWNER'}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Address</label>
                        <textarea
                          value={orgData.address}
                          onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                          className={inputClass}
                          rows={3}
                          placeholder="123 Main St, Kathmandu, Nepal"
                          disabled={role !== 'OWNER'}
                        />
                      </div>

                      {(role === 'OWNER') && (
                        <div className="pt-4 flex justify-end">
                          <button
                            type="button"
                            disabled={loading}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
                    <p className="text-sm text-gray-500 mt-1">Choose how you want to be notified about updates</p>
                  </div>

                  {/* Email Notifications */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-blue-600">email</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Email Notifications</h3>
                        <p className="text-xs text-gray-500">Receive updates via email</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { key: 'email_expense_approved', label: 'Expense Approved', desc: 'When your expense is approved' },
                        { key: 'email_expense_rejected', label: 'Expense Rejected', desc: 'When your expense is rejected' },
                        { key: 'email_budget_alert', label: 'Budget Alerts', desc: 'When budgets reach thresholds' },
                        { key: 'email_team_updates', label: 'Team Updates', desc: 'New members, role changes' },
                        { key: 'email_weekly_summary', label: 'Weekly Summary', desc: 'Weekly expense report digest' },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs[item.key]}
                              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [item.key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-purple-600">notifications_active</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">In-App Notifications</h3>
                        <p className="text-xs text-gray-500">Real-time alerts in the application</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { key: 'push_expense_updates', label: 'Expense Updates', desc: 'Status changes on your expenses' },
                        { key: 'push_budget_alerts', label: 'Budget Alerts', desc: 'Real-time budget notifications' },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs[item.key]}
                              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [item.key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      disabled={loading}
                      className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Display Preferences</h2>
                    <p className="text-sm text-gray-500 mt-1">Customize how information is displayed across the app</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <form onSubmit={handlePreferencesUpdate} className="space-y-6">
                      
                      {/* Currency */}
                      <div className="pb-6 border-b border-gray-100">
                        <label className={labelClass}>Default Currency</label>
                        <p className="text-xs text-gray-400 mb-3">Choose how amounts are displayed across the app</p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'NPR', label: 'रू', desc: 'Nepali Rupee' },
                            { value: 'USD', label: '$', desc: 'US Dollar' },
                            { value: 'EUR', label: '€', desc: 'Euro' }
                          ].map(currency => (
                            <button
                              key={currency.value}
                              type="button"
                              onClick={() => setPreferencesData({ ...preferencesData, default_currency: currency.value })}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                preferencesData.default_currency === currency.value
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl font-bold mb-1">{currency.label}</div>
                              <div className="text-xs text-gray-600">{currency.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language */}
                      <div className="pb-6 border-b border-gray-100">
                        <label className={labelClass}>Language</label>
                        <p className="text-xs text-gray-400 mb-3">Select your preferred language</p>
                        <select
                          value={preferencesData.language}
                          onChange={(e) => setPreferencesData({ ...preferencesData, language: e.target.value })}
                          className={inputClass}
                        >
                          <option value="en">English</option>
                          <option value="ne">नेपाली (Nepali)</option>
                          <option value="hi">हिन्दी (Hindi)</option>
                        </select>
                        <p className="text-[11px] text-gray-400 mt-2">More languages coming soon</p>
                      </div>

                      {/* Date & Number Format */}
                      <div className="pb-6 border-b border-gray-100">
                        <label className={labelClass}>Date & Number Format</label>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-2 block">Date Format</label>
                            <select
                              value={preferencesData.date_format}
                              onChange={(e) => setPreferencesData({ ...preferencesData, date_format: e.target.value })}
                              className={inputClass}
                            >
                              <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                              <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-2 block">Number Format</label>
                            <select
                              value={preferencesData.number_format}
                              onChange={(e) => setPreferencesData({ ...preferencesData, number_format: e.target.value })}
                              className={inputClass}
                            >
                              <option value="comma">1,234.56 (Comma)</option>
                              <option value="space">1 234.56 (Space)</option>
                              <option value="period">1.234,56 (Period)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Theme */}
                      <div className="pb-6 border-b border-gray-100">
                        <label className={labelClass}>Appearance</label>
                        <p className="text-xs text-gray-400 mb-3">Select your preferred theme</p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'light', icon: 'light_mode', label: 'Light' },
                            { value: 'dark', icon: 'dark_mode', label: 'Dark' },
                            { value: 'system', icon: 'computer', label: 'System' }
                          ].map(theme => (
                            <button
                              key={theme.value}
                              type="button"
                              onClick={() => setPreferencesData({ ...preferencesData, theme_preference: theme.value })}
                              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                preferencesData.theme_preference === theme.value
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="material-icons text-[28px]">{theme.icon}</span>
                              <div className="text-sm font-semibold">{theme.label}</div>
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">Dark mode coming soon</p>
                      </div>

                      {/* Items per page */}
                      <div>
                        <label className={labelClass}>Items Per Page</label>
                        <p className="text-xs text-gray-400 mb-3">Number of rows displayed in tables</p>
                        <select
                          value={preferencesData.items_per_page}
                          onChange={(e) => setPreferencesData({ ...preferencesData, items_per_page: parseInt(e.target.value) })}
                          className={inputClass}
                        >
                          <option value={10}>10 items</option>
                          <option value={20}>20 items</option>
                          <option value={50}>50 items</option>
                          <option value={100}>100 items</option>
                        </select>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
                        >
                          {loading ? 'Saving...' : 'Save Preferences'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Integrations & API</h2>
                    <p className="text-sm text-gray-500 mt-1">Connect external services and manage API access</p>
                  </div>

                  {/* API Keys */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">API Keys</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Manage API keys for programmatic access</p>
                      </div>
                      <button className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <span className="material-icons text-sm">add</span>
                        Create Key
                      </button>
                    </div>

                    <div className="space-y-3">
                      {apiKeys.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="material-icons text-4xl text-gray-300 mb-2 block">vpn_key</span>
                          <p className="text-sm text-gray-500">No API keys created yet</p>
                          <p className="text-xs text-gray-400 mt-1">Create a key to access the API</p>
                        </div>
                      ) : (
                        apiKeys.map(key => (
                          <div key={key.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">{key.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 font-mono">
                                {showApiKey === key.id ? key.key : '••••••••••••••••••••••••••••••••'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors">
                                <span className="material-icons text-sm">visibility</span>
                              </button>
                              <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors">
                                <span className="material-icons text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Webhooks */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Webhooks</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Receive real-time notifications for events</p>
                      </div>
                      <button className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <span className="material-icons text-sm">add</span>
                        Add Webhook
                      </button>
                    </div>

                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="material-icons text-4xl text-gray-300 mb-2 block">webhook</span>
                      <p className="text-sm text-gray-500">No webhooks configured</p>
                      <p className="text-xs text-gray-400 mt-1">Get notified when events occur</p>
                    </div>
                  </div>

                  {/* Connected Apps */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Connected Applications</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Slack', icon: '💬', desc: 'Get expense notifications in Slack', connected: false },
                        { name: 'Google Sheets', icon: '📊', desc: 'Export expenses to Google Sheets', connected: false },
                        { name: 'QuickBooks', icon: '📚', desc: 'Sync with QuickBooks accounting', connected: false },
                      ].map(app => (
                        <div key={app.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-xl">
                              {app.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{app.name}</p>
                              <p className="text-xs text-gray-500">{app.desc}</p>
                            </div>
                          </div>
                          <button className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            app.connected
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                          }`}>
                            {app.connected ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Billing & Usage</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your subscription and view usage statistics</p>
                  </div>

                  {/* Current Plan */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold mb-3">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          ACTIVE
                        </div>
                        <h3 className="text-2xl font-bold">Professional Plan</h3>
                        <p className="text-gray-300 text-sm mt-1">Perfect for growing teams</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">रू 2,999</div>
                        <div className="text-gray-300 text-sm">/month</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-2xl font-bold">50</div>
                        <div className="text-xs text-gray-300">Team Members</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-2xl font-bold">∞</div>
                        <div className="text-xs text-gray-300">Expenses</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-2xl font-bold">24/7</div>
                        <div className="text-xs text-gray-300">Support</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 bg-white text-gray-900 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm">
                        Upgrade Plan
                      </button>
                      <button className="px-4 py-2.5 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm">
                        View Plans
                      </button>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Current Usage</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Team Members', current: 8, limit: 50, unit: 'members' },
                        { label: 'Expenses This Month', current: 234, limit: null, unit: 'expenses' },
                        { label: 'Storage Used', current: 2.4, limit: 10, unit: 'GB' },
                      ].map(stat => (
                        <div key={stat.label}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">{stat.label}</span>
                            <span className="text-sm text-gray-500">
                              {stat.current} {stat.limit ? `/ ${stat.limit}` : ''} {stat.unit}
                            </span>
                          </div>
                          {stat.limit && (
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-900 rounded-full transition-all"
                                style={{ width: `${(stat.current / stat.limit) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Payment Method</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                          VISA
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">•••• •••• •••• 4242</p>
                          <p className="text-xs text-gray-500">Expires 12/2027</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                        Update
                      </button>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Billing History</h3>
                    <div className="space-y-2">
                      {[
                        { date: 'Apr 1, 2026', amount: 2999, status: 'Paid', invoice: 'INV-2026-04' },
                        { date: 'Mar 1, 2026', amount: 2999, status: 'Paid', invoice: 'INV-2026-03' },
                        { date: 'Feb 1, 2026', amount: 2999, status: 'Paid', invoice: 'INV-2026-02' },
                      ].map(bill => (
                        <div key={bill.invoice} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="material-icons text-gray-400 text-sm">receipt</span>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{bill.invoice}</p>
                              <p className="text-xs text-gray-500">{bill.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-gray-900">रू {bill.amount.toLocaleString()}</span>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{bill.status}</span>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                              <span className="material-icons text-sm">download</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your account security and authentication</p>
                  </div>

                  {/* Password Change */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-blue-600">lock</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Change Password</h3>
                        <p className="text-xs text-gray-500">Update your password regularly to keep your account secure</p>
                      </div>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className={labelClass}>Current Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.old_password}
                          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                          className={inputClass}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>New Password</label>
                        <input
                          type="password"
                          required minLength={8}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          className={inputClass}
                          placeholder="Enter new password"
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5">Must be at least 8 characters with letters and numbers</p>
                      </div>

                      <div>
                        <label className={labelClass}>Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                          className={inputClass}
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="material-icons text-green-600">verified_user</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">COMING SOON</span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <span className="material-icons text-gray-400 text-lg">info</span>
                        <div>
                          <p className="text-sm text-gray-600">
                            Two-factor authentication (2FA) adds an extra layer of security by requiring a second form of verification when you sign in.
                          </p>
                          <button disabled className="mt-3 px-4 py-2 bg-gray-200 text-gray-400 text-sm font-semibold rounded-lg cursor-not-allowed">
                            Enable 2FA
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Active Sessions</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Manage devices where you're currently logged in</p>
                      </div>
                      <button className="text-sm font-semibold text-red-600 hover:text-red-700">
                        Sign out all
                      </button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { device: 'Chrome on Windows', location: 'Kathmandu, Nepal', current: true, lastActive: 'Active now' },
                        { device: 'Safari on iPhone', location: 'Kathmandu, Nepal', current: false, lastActive: '2 hours ago' },
                      ].map((session, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="material-icons text-gray-600 text-lg">
                                {session.device.includes('iPhone') ? 'phone_iphone' : 'computer'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-gray-900">{session.device}</p>
                                {session.current && (
                                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Current</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{session.location} • {session.lastActive}</p>
                            </div>
                          </div>
                          {!session.current && (
                            <button className="text-sm font-semibold text-red-600 hover:text-red-700">
                              Sign out
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Login History */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Recent Login Activity</h3>
                    <div className="space-y-2">
                      {[
                        { date: 'Apr 30, 2026 10:24 AM', location: 'Kathmandu, Nepal', status: 'success' },
                        { date: 'Apr 29, 2026 09:15 AM', location: 'Kathmandu, Nepal', status: 'success' },
                        { date: 'Apr 28, 2026 02:45 PM', location: 'Pokhara, Nepal', status: 'success' },
                        { date: 'Apr 27, 2026 11:30 AM', location: 'Unknown Location', status: 'failed' },
                      ].map((login, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className={`material-icons text-sm ${login.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                              {login.status === 'success' ? 'check_circle' : 'cancel'}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{login.date}</p>
                              <p className="text-xs text-gray-500">{login.location}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            login.status === 'success' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                          }`}>
                            {login.status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Data & Privacy Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Data & Privacy</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your data and privacy settings</p>
                  </div>

                  {/* Export Data */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-blue-600">download</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Export Your Data</h3>
                        <p className="text-xs text-gray-500">Download a copy of all your data</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                      <p className="text-sm text-gray-600 mb-3">
                        You can download all your expense data, receipts, and account information in JSON format. This includes:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          All expense records and receipts
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Budget and category information
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Team and organization details
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Account settings and preferences
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={handleExportData}
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <span className="material-icons text-[18px]">download</span>
                      {loading ? 'Exporting...' : 'Download Data'}
                    </button>
                  </div>

                  {/* Privacy Settings */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-purple-600">privacy_tip</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Privacy Settings</h3>
                        <p className="text-xs text-gray-500">Control how your data is used</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: 'Profile Visibility', desc: 'Allow team members to see your profile', checked: true },
                        { label: 'Activity Status', desc: 'Show when you\'re active in the app', checked: true },
                        { label: 'Analytics', desc: 'Help improve the app with usage data', checked: false },
                      ].map(setting => (
                        <div key={setting.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{setting.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{setting.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={setting.checked} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-red-600">warning</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-red-600">Danger Zone</h3>
                        <p className="text-xs text-gray-500">Irreversible actions</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Deactivate Account */}
                      <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Deactivate Account</p>
                          <p className="text-xs text-gray-500 mt-0.5">Temporarily disable your account</p>
                        </div>
                        <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors">
                          Deactivate
                        </button>
                      </div>

                      {/* Delete Account */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Delete Account</p>
                          <p className="text-xs text-gray-500 mt-0.5">Permanently remove your account and all data</p>
                        </div>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                      <span className="material-icons text-amber-600 text-sm mt-0.5">info</span>
                      <p className="text-xs text-amber-800">
                        <strong>Warning:</strong> Deleting your account is permanent and cannot be undone. All your data, including expenses, receipts, and reports will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
