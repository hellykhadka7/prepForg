import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Code2, RefreshCw, BarChart3, Target,
  Map, ArrowUpDown, Settings, LogOut, X, Trophy,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../../config/constants';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Code2, RefreshCw, BarChart3, Target,
  Map, ArrowUpDown, Settings, Trophy,
};

const GROUP_BREAKS_AFTER = ['/app/revisions', '/app/achievements'];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-[260px] z-50 flex flex-col',
          'bg-[var(--sidebar-bg)] border-r border-[var(--border-secondary)]',
          'transition-transform duration-300 ease-in-out lg:hidden'
        )}
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-[var(--border-secondary)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[var(--accent-primary)] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 10L5 4L7 8L9 5.5L12 10" stroke="var(--accent-primary-text,#0B0D12)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">PrepForge</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 rounded-md hover:bg-[var(--sidebar-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* User */}
        {user && (
          <div className="px-3 py-2.5 border-b border-[var(--border-secondary)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-[var(--accent-primary-text,#0B0D12)] text-sm font-semibold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Level {user.currentLevel} · <span className="tabular">{user.totalXP}</span> XP</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const showDivider = GROUP_BREAKS_AFTER.includes(item.path);

            return (
              <div key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 mb-0.5',
                    isActive
                      ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]'
                      : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-[var(--accent-primary)]" aria-hidden="true" />
                  )}
                  {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                  <span>{item.label}</span>
                </NavLink>

                {showDivider && (
                  <div className="mx-2 my-1.5 border-t border-[var(--border-secondary)]" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-2.5 border-t border-[var(--border-secondary)] shrink-0">
          <button
            onClick={() => { logout(); onClose(); }}
            aria-label="Log out"
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm font-medium text-[var(--sidebar-text)] hover:bg-[var(--accent-error)]/10 hover:text-[var(--accent-error)] transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
