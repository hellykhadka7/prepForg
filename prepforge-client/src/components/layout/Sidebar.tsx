import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Code2, RefreshCw, BarChart3, Target,
  Map, ArrowUpDown, Settings, LogOut, Flame, Zap, ChevronLeft, Trophy,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../../config/constants';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Code2, RefreshCw, BarChart3, Target,
  Map, ArrowUpDown, Settings, Trophy,
};

// Nav item groupings for subtle section separators
const GROUP_BREAKS_AFTER = ['/app/revisions', '/app/achievements'];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 h-full z-40 flex flex-col',
        'bg-[var(--sidebar-bg)] border-r border-[var(--border-secondary)]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-[var(--sidebar-width,240px)]',
        'hidden lg:flex'
      )}
    >
      {/* ── Logo ──────────────────────────────────────── */}
      <div className="flex items-center h-14 px-3 border-b border-[var(--border-secondary)] shrink-0">
        <div className={clsx('flex items-center gap-2.5 overflow-hidden', collapsed && 'w-full justify-center')}>
          {/* Geometric logo mark — solid indigo square, no gradient blob */}
          <div className="flex-shrink-0 w-7 h-7 rounded-[6px] bg-[var(--accent-primary)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 10L5 4L7 8L9 5.5L12 10" stroke="var(--accent-primary-text,#0B0D12)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap tracking-tight">
              PrepForge
            </span>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="ml-auto p-1 rounded-md hover:bg-[var(--sidebar-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Collapsed toggle ──────────────────────────── */}
      {collapsed && (
        <button
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="flex items-center justify-center h-10 mt-1 mx-2 rounded-md hover:bg-[var(--sidebar-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      {/* ── User card ─────────────────────────────────── */}
      {!collapsed && user && (
        <div className="px-3 py-2.5 border-b border-[var(--border-secondary)] shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Solid initial avatar — no gradient */}
            <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-[var(--accent-primary-text,#0B0D12)] text-xs font-semibold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate leading-tight">{user.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-0.5 text-[11px] text-[var(--text-tertiary)]">
                  <Zap className="h-3 w-3 text-[var(--accent-primary)]" aria-hidden="true" />
                  Lv.{user.currentLevel}
                </span>
                <span className="flex items-center gap-0.5 text-[11px] text-[var(--text-tertiary)]">
                  <Flame className="h-3 w-3 text-orange-400" aria-hidden="true" />
                  {user.currentStreak}d
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const showDivider = GROUP_BREAKS_AFTER.includes(item.path);

          return (
            <div key={item.path}>
              <NavLink
                to={item.path}
                aria-label={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'relative flex items-center gap-2.5 py-1.5 rounded-md text-sm transition-colors duration-150 mb-0.5',
                  collapsed ? 'justify-center px-2' : 'px-2.5',
                  isActive
                    ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
                )}
                title={collapsed ? item.label : undefined}
              >
                {/* Left accent bar for active item */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-[var(--accent-primary)]"
                    aria-hidden="true"
                  />
                )}
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>

              {/* Section separator */}
              {showDivider && !collapsed && (
                <div className="mx-2 my-1.5 border-t border-[var(--border-secondary)]" aria-hidden="true" />
              )}
              {showDivider && collapsed && (
                <div className="mx-3 my-1.5 border-t border-[var(--border-secondary)]" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer / Logout ───────────────────────────── */}
      <div className="px-2 py-2.5 border-t border-[var(--border-secondary)] shrink-0">
        <button
          onClick={logout}
          aria-label="Log out"
          className={clsx(
            'flex items-center gap-2.5 w-full py-1.5 rounded-md text-sm font-medium',
            'text-[var(--sidebar-text)] hover:bg-[var(--accent-error)]/10 hover:text-[var(--accent-error)]',
            'transition-colors duration-150',
            collapsed ? 'justify-center px-2' : 'px-2.5'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
