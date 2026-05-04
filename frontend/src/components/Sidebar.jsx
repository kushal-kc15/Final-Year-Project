import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const mainNav = [
  { key: 'dashboard', to: '/dashboard', icon: 'grid_view',       label: 'Dashboard'  },
  { key: 'expenses',  to: '/expenses',  icon: 'receipt_long',    label: 'Expenses'   },
  { key: 'approvals', to: '/approvals', icon: 'task_alt',        label: 'Approvals', ownerOnly: true },
  { key: 'reports',   to: '/reports',   icon: 'bar_chart',       label: 'Reports',   ownerOnly: true },
  { key: 'budgets',   to: '/budgets',   icon: 'account_balance', label: 'Budgets',   ownerOnly: true },
  { key: 'vendors',   to: '/vendors',   icon: 'storefront',      label: 'Vendors',   ownerOnly: true },
  { key: 'activity',  to: '/activity',  icon: 'notifications',   label: 'Activity'   },
];

const settingsNav = [
  { key: 'team', to: '/team', icon: 'group', label: 'Team' },
  { key: 'settings', to: '/settings', icon: 'settings', label: 'Settings' },
];

export default function Sidebar({ currentPage }) {
  const { user, role, logout } = useAuth();
  const isOwner = role === 'OWNER';

  const roleConfig = {
    OWNER:   { label: 'Owner',   color: 'text-blue-300',    dot: 'bg-blue-400'    },
    STAFF:   { label: 'Staff',   color: 'text-slate-400',   dot: 'bg-slate-500'   },
  };
  const rc = roleConfig[role] || roleConfig.STAFF;

  const NavItem = ({ item }) => {
    const isActive = currentPage === item.key;
    return (
      <Link
        to={item.to}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className={`material-icons text-[19px] transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {isActive && <span className="w-1 h-5 rounded-full bg-blue-400 shrink-0" />}
      </Link>
    );
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{ background: 'linear-gradient(180deg, #0f1c3f 0%, #0c1730 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-3 border-b border-white/5 shrink-0">
        <Logo className="w-10 h-10 shrink-0" />
        <div>
          <p className="font-display text-[14px] font-700 text-white leading-tight">Vyapar</p>
          <p className="text-[10px] text-slate-500 leading-tight">Margadarshan</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">Menu</p>
          <div className="space-y-0.5">
            {mainNav
              .filter(item => !item.ownerOnly || isOwner)
              .map(item => <NavItem key={item.key} item={item} />)
            }
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">Settings</p>
          <div className="space-y-0.5">
            {settingsNav.map(item => <NavItem key={item.key} item={item} />)}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/5 shrink-0 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5">
          <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {user?.username || 'User'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
              <span className={`text-[11px] font-medium ${rc.color}`}>{rc.label}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <span className="material-icons text-[19px] group-hover:text-red-400 transition-colors">logout</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}