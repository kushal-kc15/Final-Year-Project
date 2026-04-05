import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const inputClass = 'w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all text-slate-900';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5';

const SETTINGS_TABS = [
  { id: 'profile',      label: 'Profile Info',  icon: 'person' },
  { id: 'preferences',  label: 'Preferences',   icon: 'tune' },
  { id: 'security',     label: 'Security',      icon: 'lock' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState(null);

  // Profile form
  const [profileData, setProfileData] = useState({
    first_name: '', last_name: '', email: '', username: '',
    business_name: '', phone_number: ''
  });

  // Preferences form
  const [preferencesData, setPreferencesData] = useState({
    default_currency: 'NPR',
    items_per_page: 10,
    theme_preference: 'system'
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    old_password: '', new_password: '', confirm_password: ''
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
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
        theme_preference: user.theme_preference || 'system'
      });
    }
  }, [user]);

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
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-700 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-body">
      <Sidebar currentPage="settings" />
      
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shrink-0">
          <h1 className="font-display text-lg font-700 text-slate-900">Settings</h1>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 flex items-start justify-center">
          <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
            
            {/* Left Nav */}
            <aside className="w-full md:w-64 shrink-0">
              <nav className="flex flex-col space-y-1">
                {SETTINGS_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-icons text-[20px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Right Form Content */}
            <div className="flex-1">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-700 text-slate-900">Profile Information</h2>
                    <p className="text-sm text-slate-500 mt-1">Update your personal details and public profile.</p>
                  </div>

                  {/* Avatar section */}
                  <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-100">
                    <div className="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-display text-3xl font-bold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                        Change Avatar
                      </button>
                      <p className="text-xs text-slate-400 mt-2">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>First Name</label>
                        <input
                          type="text"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name</label>
                        <input
                          type="text"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                          className={inputClass}
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
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Business Name</label>
                      <input
                        type="text"
                        value={profileData.business_name}
                        onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                        placeholder="Your company or business name"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone_number}
                        onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                        placeholder="+977 98XXXXXXXX"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Username</label>
                      <div className="relative">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                        <input
                          type="text"
                          value={profileData.username}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">Usernames are unique identifiers and cannot be changed.</p>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-brand-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-700 text-slate-900">Preferences</h2>
                    <p className="text-sm text-slate-500 mt-1">Customize your app experience and display settings.</p>
                  </div>

                  <form onSubmit={handlePreferencesUpdate} className="space-y-6">
                    
                    {/* Currency */}
                    <div className="pb-6 border-b border-slate-100">
                      <label className={labelClass}>Default Currency</label>
                      <p className="text-xs text-slate-400 mb-3">Choose how amounts are displayed across the app. Changes apply immediately after saving.</p>
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
                                ? 'border-brand-700 bg-brand-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-2xl font-bold mb-1">{currency.label}</div>
                            <div className="text-xs text-slate-600">{currency.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme */}
                    <div className="pb-6 border-b border-slate-100">
                      <label className={labelClass}>Appearance</label>
                      <p className="text-xs text-slate-400 mb-3">Select your preferred theme.</p>
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
                                ? 'border-brand-700 bg-brand-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="material-icons text-[28px]">{theme.icon}</span>
                            <div className="text-sm font-semibold">{theme.label}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">Dark mode coming soon! Theme preference is saved.</p>
                    </div>

                    {/* Items per page */}
                    <div>
                      <label className={labelClass}>Items Per Page</label>
                      <p className="text-xs text-slate-400 mb-3">Number of rows displayed in tables (saved for future use).</p>
                      <select
                        value={preferencesData.items_per_page}
                        onChange={(e) => setPreferencesData({ ...preferencesData, items_per_page: parseInt(e.target.value) })}
                        className={inputClass}
                      >
                        <option value={10}>10 items</option>
                        <option value={20}>20 items</option>
                        <option value={50}>50 items</option>
                      </select>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-brand-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
                      >
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Password Change */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
                    <div className="mb-8 border-b border-slate-100 pb-8">
                      <h2 className="font-display text-2xl font-700 text-slate-900">Change Password</h2>
                      <p className="text-sm text-slate-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-5">
                      <div>
                        <label className={labelClass}>Current Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.old_password}
                          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                          className={inputClass}
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
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">Must be at least 8 characters.</p>
                      </div>

                      <div>
                        <label className={labelClass}>Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                          className={inputClass}
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-brand-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 text-sm shadow-sm"
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Data Export */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
                    <div className="mb-6">
                      <h3 className="font-display text-lg font-700 text-slate-900">Export Your Data</h3>
                      <p className="text-sm text-slate-500 mt-1">Download all your expense data in JSON format.</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      <span className="material-icons text-[18px]">download</span>
                      {loading ? 'Exporting...' : 'Download Data'}
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-2xl border border-red-200 shadow-card p-8">
                    <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4">Danger Zone</h3>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Delete Account</p>
                        <p className="text-xs text-slate-500 mt-0.5">Permanently remove your account and all its data.</p>
                      </div>
                      <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors">
                        Delete
                      </button>
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
