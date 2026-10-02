import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Bookmark, Clock, Code, X, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../../api/search.api';
import { Spinner } from './index';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard shortcuts (Cmd+K / Ctrl+K to open, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // The parent component should handle opening, but we can prevent default here
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const hasResults =
    results &&
    (results.problems.length > 0 ||
      results.notes.length > 0 ||
      results.bookmarks.length > 0 ||
      results.revisions.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-[var(--border-primary)]">
          <Search className="w-5 h-5 text-[var(--text-tertiary)] mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-lg placeholder-[var(--text-tertiary)]"
            placeholder="Search problems, notes, bookmarks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-[var(--bg-tertiary)] rounded-md text-[var(--text-tertiary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 ml-3 text-[10px] text-[var(--text-tertiary)] font-mono">
            <span className="px-1.5 py-0.5 rounded border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">ESC</span>
            <span>to close</span>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading && (
            <div className="py-12 flex justify-center">
              <Spinner size="md" />
            </div>
          )}

          {!isLoading && debouncedQuery.length > 1 && !hasResults && (
            <div className="py-12 text-center text-[var(--text-secondary)]">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {!isLoading && debouncedQuery.length <= 1 && (
            <div className="py-8 text-center text-[var(--text-tertiary)] text-sm">
              Type at least 2 characters to search
            </div>
          )}

          {!isLoading && hasResults && (
            <div className="space-y-4 p-2">
              {/* Problems */}
              {results.problems.length > 0 && (
                <ResultSection title="Problems" icon={<Code className="w-4 h-4" />}>
                  {results.problems.map((prob) => (
                    <ResultItem
                      key={prob._id}
                      icon={<Code className="w-4 h-4 text-emerald-400" />}
                      title={prob.title}
                      subtitle={`${prob.difficulty} • ${prob.topic}`}
                      onClick={() => handleSelect(`/app/problems/${prob._id}`)}
                    />
                  ))}
                </ResultSection>
              )}

              {/* Notes */}
              {results.notes.length > 0 && (
                <ResultSection title="Notes" icon={<FileText className="w-4 h-4" />}>
                  {results.notes.map((note) => (
                    <ResultItem
                      key={note._id}
                      icon={<FileText className="w-4 h-4 text-sky-400" />}
                      title={`Note for ${note.problemId?.title || 'Problem'}`}
                      subtitle="View your notes and learnings"
                      onClick={() => handleSelect(`/app/problems/${note.problemId?._id}`)}
                    />
                  ))}
                </ResultSection>
              )}

              {/* Bookmarks */}
              {results.bookmarks.length > 0 && (
                <ResultSection title="Bookmarks" icon={<Bookmark className="w-4 h-4" />}>
                  {results.bookmarks.map((bm) => (
                    <ResultItem
                      key={bm._id}
                      icon={<Bookmark className="w-4 h-4 text-amber-400" />}
                      title={bm.problemId?.title || 'Bookmarked Problem'}
                      subtitle="Saved for later"
                      onClick={() => handleSelect(`/app/problems/${bm.problemId?._id}`)}
                    />
                  ))}
                </ResultSection>
              )}

              {/* Revisions */}
              {results.revisions.length > 0 && (
                <ResultSection title="Revisions" icon={<Clock className="w-4 h-4" />}>
                  {results.revisions.map((rev: any) => (
                    <ResultItem
                      key={rev._id}
                      icon={<Clock className="w-4 h-4 text-purple-400" />}
                      title={rev.problemId?.title || 'Scheduled Revision'}
                      subtitle={`Priority Score: ${rev.priorityScore}`}
                      onClick={() => handleSelect(`/app/problems/${rev.problemId?._id}`)}
                    />
                  ))}
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-3 mb-2 text-xs font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
        {icon}
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ResultItem({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group text-left"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border-primary)] group-hover:border-[var(--border-hover)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)] truncate">{title}</div>
        <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{subtitle}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
