import { NotificationBell } from './NotificationBell.jsx';
import { OrgSwitcher } from './OrgSwitcher.jsx';
import { UserMenu } from './UserMenu.jsx';
import Logo from './Logo.jsx';

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-rule">
      <div className="flex items-center gap-2 h-14 px-3 sm:gap-3 sm:px-6">
        <div className="md:hidden shrink-0">
          <Logo size={26} className="[&>span]:hidden min-[420px]:[&>span]:block" withWordmark />
        </div>
        <div className="flex-1 min-w-0" />
        <OrgSwitcher />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
