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
        collapsed ? 'w-16' : 'w-[var(--sidebar-width)]',
        'hidden lg:flex'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-[var(--border-secondary)]">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-[var(--text-primary)] whitespace-nowrap">
              PrepForge
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={clsx(
            'ml-auto p-1 rounded-md hover:bg-[var(--sidebar-hover)] text-[var(--text-tertiary)]',
            'transition-transform duration-300',
            collapsed && 'rotate-180'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-[var(--border-secondary)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span className="flex items-center gap-0.5">
                  <Zap className="h-3 w-3 text-[var(--accent-primary)]" />
                  Lv.{user.currentLevel}
                </span>
                <span className="flex items-center gap-0.5">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {user.currentStreak}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-150',
                isActive
                  ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)] shadow-sm'
                  : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[var(--border-secondary)]">
        <button
          onClick={logout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium',
            'text-[var(--sidebar-text)] hover:bg-[var(--accent-error)]/10 hover:text-[var(--accent-error)]',
            'transition-colors duration-150',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
