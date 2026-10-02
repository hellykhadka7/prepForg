import { Search, Bell, Menu, Flame, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopNavProps {
  onMenuClick: () => void;
  onSearchOpen: () => void;
}

export default function TopNav({ onMenuClick, onSearchOpen }: TopNavProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--border-secondary)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-tertiary)] hover:border-[var(--accent-primary)] transition-colors text-sm"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search problems...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{user.currentStreak}</span>
              </span>
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <Zap className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="font-medium">{user.totalXP} XP</span>
              </span>
            </div>

            <button className="relative p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-error)]" />
            </button>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
