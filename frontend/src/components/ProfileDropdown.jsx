import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Toast from './Toast';

const inputClass = 'w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5';

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    business_name: '',
    phone_number: '',
    profile_picture_url: null
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        business_name: user.business_name || '',
        phone_number: user.phone_number || '',
        profile_picture_url: user.profile_picture_url || null
      });
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const showToast = (message, type = 'error') => setToast({ message, type });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/profile/', {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        business_name: profileData.business_name,
        phone_number: profileData.phone_number
      });
      showToast('Profile updated successfully!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size too large. Maximum size is 5MB.');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await api.post('/auth/upload-avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newAvatarUrl = response.data.user.profile_picture_url;
      setProfileData({ ...profileData, profile_picture_url: newAvatarUrl });
      
      showToast('Avatar uploaded successfully!', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!profileData.profile_picture_url) return;
    
    if (!window.confirm('Are you sure you want to delete your profile picture?')) return;

    setUploadingAvatar(true);
    try {
      await api.delete('/auth/delete-avatar/');
      setProfileData({ ...profileData, profile_picture_url: null });
      showToast('Avatar deleted successfully!', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold hover:shadow-lg transition-shadow overflow-hidden"
        >
          {profileData.profile_picture_url ? (
            <img src={profileData.profile_picture_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user?.username?.charAt(0).toUpperCase() || 'U'
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-2">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="material-icons text-[18px] text-gray-400">person</span>
                View Profile
              </button>
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="material-icons text-[18px] text-gray-400">settings</span>
                Settings
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="material-icons text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Avatar section */}
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-3xl font-bold overflow-hidden">
                  {profileData.profile_picture_url ? (
                    <img src={profileData.profile_picture_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                    </button>
                    {profileData.profile_picture_url && (
                      <button
                        onClick={handleAvatarDelete}
                        disabled={uploadingAvatar}
                        className="px-4 py-1.5 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
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
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">lock</span>
                    <input
                      type="text"
                      value={profileData.username}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">Usernames cannot be changed.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
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
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}
