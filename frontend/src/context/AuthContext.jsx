import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,         setUser]         = useState(null);
  const [role,         setRole]         = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const navigate    = useNavigate();
  const location    = useLocation();
  const initialized = useRef(false);

  const publicPaths = ['/', '/login', '/register', '/setup', '/invite'];

  const logout = () => {
    authService.logout();
    setUser(null);
    setRole(null);
    setOrganization(null);
    navigate('/login');
  };

  // Listen for forced logout triggered by api.js interceptor
  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, []);

  // Init auth ONCE on mount using a ref guard
  // Do NOT use location.pathname as a dependency — it re-runs on every
  // navigation and causes the loading flash you see between pages
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Skip auth fetch on public pages
    if (publicPaths.includes(location.pathname)) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        const userData = await authService.getCurrentUser();
        setUser(userData);

        const orgsResponse = await api.get('/organizations/');
        const organizations = orgsResponse.data.results || orgsResponse.data;

        if (organizations.length > 0) {
          const org = organizations[0];
          setOrganization(org);

          const membersResponse = await api.get(`/organizations/${org.id}/members/`);
          const userMember = membersResponse.data.find(
            (m) => m.user.id === userData.id
          );
          setRole(userMember?.role || null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (error.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // ← empty: runs once only

  const value = {
    user,
    role,
    organization,
    loading,
    logout,
    isAuthenticated: !!user,
    currency: user?.default_currency || 'NPR',
    itemsPerPage: user?.items_per_page || 10,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};