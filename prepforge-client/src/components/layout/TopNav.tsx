import { Search, Menu, Flame, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopNavProps {
  onMenuClick: () => void;
  onSearchOpen: () => void;
}

export default function TopNav({ onMenuClick, onSearchOpen }: TopNavProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-5 border-b border-[var(--border-secondary)] bg-[var(--bg-primary)]/90 backdrop-blur-xl">
      {/* ── Left ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Search trigger */}
        <button
          onClick={onSearchOpen}
          aria-label="Search (Ctrl+K)"
          className="flex items-center gap-2 px-3 h-8 rounded-md border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-tertiary)] hover:border-[var(--border-active)] hover:text-[var(--text-secondary)] transition-colors text-sm"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline text-[13px]">Search…</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-px rounded bg-[var(--bg-elevated)] text-[var(--text-tertiary)] text-[10px] font-mono border border-[var(--border-primary)]">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* ── Right ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {user && (
          <>
            {/* Stats pills — compact, no bell */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-xs text-[var(--text-secondary)]">
                <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
                <span className="tabular font-medium">{user.currentStreak}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-xs text-[var(--text-secondary)]">
                <Zap className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
                <span className="tabular font-medium">{user.totalXP}</span>
                <span className="text-[var(--text-tertiary)]">XP</span>
              </span>
            </div>

            {/* Avatar — solid initial, no gradient */}
            <div
              className="w-7 h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-[var(--accent-primary-text,#0B0D12)] text-xs font-semibold"
              aria-label={`Logged in as ${user.name}`}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
