import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bookmark, ExternalLink, Plus, ChevronLeft, ChevronRight, CheckCircle2, Circle, PauseCircle, SkipForward, AlertCircle, Pencil } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useProblems, useToggleBookmark, useSetProblemStatus } from '../hooks/useProblems';
import { Spinner, ErrorState, Input, Button, Badge } from '../../../components/ui';
import AddProblemModal from '../components/AddProblemModal';
import EditProblemModal from '../components/EditProblemModal';
import { ROUTES } from '../../../config/routes';
import { PATTERNS } from '../../../config/constants';
import type { ProblemFilters, ProblemWithStatus, Difficulty, ProblemStatus } from '../../../types';

// ── Constants ─────────────────────────────────────────────

const DIFFICULTY_TABS: { label: string; value: Difficulty | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Easy', value: 'Easy' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Hard', value: 'Hard' },
];

const STATUS_OPTIONS: { value: ProblemStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'skipped', label: 'Skipped' },
];

const ITEMS_PER_PAGE = 20;

// ── Helpers ───────────────────────────────────────────────

const difficultyTabStyle = (active: boolean, diff: Difficulty | 'All') => {
  if (!active) {
    return 'px-4 py-1.5 rounded-full text-sm font-medium border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer';
  }
  const colors: Record<Difficulty | 'All', string> = {
    All: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/40',
    Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };
  return `px-4 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${colors[diff]}`;
};

const difficultyBadgeVariant = (d: Difficulty) =>
  d === 'Easy' ? 'success' : d === 'Medium' ? 'warning' : 'error';

const STATUS_META: Record<ProblemStatus, { icon: React.ReactNode; label: string; className: string }> = {
  not_started: {
    icon: <Circle className="w-3.5 h-3.5" />,
    label: 'Not Started',
    className: 'text-[var(--text-tertiary)]',
  },
  completed: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'Completed',
    className: 'text-emerald-400',
  },
  on_hold: {
    icon: <PauseCircle className="w-3.5 h-3.5" />,
    label: 'On Hold',
    className: 'text-amber-400',
  },
  skipped: {
    icon: <SkipForward className="w-3.5 h-3.5" />,
    label: 'Skipped',
    className: 'text-[var(--text-secondary)]',
  },
};

// ── ProblemRow ────────────────────────────────────────────

interface ProblemRowProps {
  problem: ProblemWithStatus;
  onBookmark: (id: string) => void;
  isBookmarking: boolean;
  onEdit: (problem: ProblemWithStatus) => void;
}

function ProblemRow({ problem, onBookmark, isBookmarking, onEdit }: ProblemRowProps) {
  const { mutate: setStatus, isPending: isSettingStatus } = useSetProblemStatus();
  const statusMeta = STATUS_META[problem.status];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProblemStatus;
    if (newStatus === problem.status) return;
    setStatus(
      { problemId: problem._id, status: newStatus },
      {
        onError: () => toast.error('Failed to update status'),
      }
    );
  };

  // Use sourceUrl for custom problems, leetcodeUrl for seeded ones
  const sourceLink = problem.sourceUrl || problem.leetcodeUrl;

  return (
    <tr
      className={clsx(
        'group border-b border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] transition-colors',
        problem.status === 'completed' && 'opacity-80'
      )}
    >
      {/* Status column */}
      <td className="pl-4 pr-2 py-2.5 w-36">
        <div className={clsx('flex items-center gap-1.5', statusMeta.className, isSettingStatus && 'opacity-50')}>
          {statusMeta.icon}
          <select
            value={problem.status}
            onChange={handleStatusChange}
            disabled={isSettingStatus}
            className={clsx(
              'text-xs bg-transparent border-none outline-none cursor-pointer appearance-none',
              'pr-0 font-medium',
              statusMeta.className
            )}
            aria-label={`Status for ${problem.title}`}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="not_started" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Not Started</option>
            <option value="completed" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Completed</option>
            <option value="on_hold" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">On Hold</option>
            <option value="skipped" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Skipped</option>
          </select>
        </div>
      </td>

      {/* Title column */}
      <td className="px-3 py-2.5">
        <div className="flex flex-col gap-0.5">
          <Link
            to={ROUTES.PROBLEM_DETAIL(problem._id)}
            className={clsx(
              'text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors leading-snug',
              problem.status === 'completed' && 'line-through decoration-[var(--text-tertiary)]'
            )}
          >
            {problem.title}
          </Link>
          {/* Pattern tags — max 3 */}
          {problem.patterns.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {problem.patterns.slice(0, 3).map((p) => (
                <span key={p} className="text-[10px] px-1.5 py-px rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-secondary)]">
                  {p}
                </span>
              ))}
              {problem.patterns.length > 3 && (
                <span className="text-[10px] px-1.5 py-px rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                  +{problem.patterns.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Difficulty column */}
      <td className="px-3 py-2.5 w-24">
        <Badge variant={difficultyBadgeVariant(problem.difficulty)}>
          {problem.difficulty}
        </Badge>
      </td>

      {/* Topic column */}
      <td className="px-3 py-2.5 w-36 hidden md:table-cell">
        <span className="text-xs text-[var(--text-secondary)] truncate block max-w-[130px]">
          {problem.topic || '—'}
        </span>
      </td>

      {/* Actions column */}
      <td className="px-3 py-2.5 w-20">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Revision due indicator */}
          {problem.revisionDue && (
            <span title="Revision due">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--accent-error)]" />
            </span>
          )}
          {/* Bookmark */}
          <button
            onClick={() => onBookmark(problem._id)}
            disabled={isBookmarking}
            className="p-1 rounded hover:bg-[var(--bg-active)] transition-colors"
            title={problem.bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark
              className={clsx(
                'w-3.5 h-3.5',
                problem.bookmarked
                  ? 'fill-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'text-[var(--text-tertiary)]'
              )}
            />
          </button>
          {/* External link */}
          {sourceLink && (
            <a
              href={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Open source"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-[var(--bg-active)] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </a>
          )}
          {/* Edit / delete — only for custom problems owned by this user */}
          {problem.isCustom && (
            <>
              <button
                onClick={() => onEdit(problem)}
                className="p-1 rounded hover:bg-[var(--bg-active)] transition-colors"
                title="Edit this custom problem"
                aria-label={`Edit ${problem.title}`}
              >
                <Pencil className="w-3.5 h-3.5 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]" />
              </button>
              <span className="text-[10px] px-1 py-px rounded bg-violet-500/15 text-violet-400 border border-violet-500/30 font-medium">
                custom
              </span>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── ProblemListPage ───────────────────────────────────────

export default function ProblemListPage() {
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | 'All'>('All');
  const [filters, setFilters] = useState<ProblemFilters>({});
  const [page, setPage] = useState(1);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<ProblemWithStatus | null>(null);

  // Build the API filter from local state + difficulty tab
  const apiFilters = useMemo<ProblemFilters>(() => ({
    ...filters,
    difficulty: activeDifficulty === 'All' ? undefined : activeDifficulty,
  }), [filters, activeDifficulty]);

  const { data: response, isLoading, isError, refetch } = useProblems(apiFilters);
  const { mutate: toggleBookmark, isPending: isBookmarking } = useToggleBookmark();

  const problems = response?.problems ?? [];

  // Counts per difficulty for tab labels (from full list, ignoring difficulty filter)
  const allFiltersNoDifficulty = useMemo<ProblemFilters>(() => ({
    ...filters,
    difficulty: undefined,
  }), [filters]);
  const { data: countResponse } = useProblems(allFiltersNoDifficulty);
  const allProblems = countResponse?.problems ?? [];

  const difficultyCount = useMemo(() => ({
    All: allProblems.length,
    Easy: allProblems.filter(p => p.difficulty === 'Easy').length,
    Medium: allProblems.filter(p => p.difficulty === 'Medium').length,
    Hard: allProblems.filter(p => p.difficulty === 'Hard').length,
  }), [allProblems]);

  // Client-side pagination
  const totalPages = Math.ceil(problems.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return problems.slice(start, start + ITEMS_PER_PAGE);
  }, [problems, page]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, q: e.target.value || undefined }));
    setPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as ProblemFilters['status'] | '';
    setFilters(prev => ({ ...prev, status: val || undefined }));
    setPage(1);
  };

  const handlePatternFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, pattern: e.target.value || undefined }));
    setPage(1);
  };

  const handleDifficultyTab = (diff: Difficulty | 'All') => {
    setActiveDifficulty(diff);
    setPage(1);
  };

  // ── Render ──────────────────────────────────────────────

  if (isLoading && !response) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">My Problems</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {problems.length} problem{problems.length !== 1 ? 's' : ''} match
            {activeDifficulty !== 'All' && ` · ${activeDifficulty}`}
          </p>
        </div>
        <Button
          id="add-problem-btn"
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Add Problem
        </Button>
      </div>

      {/* ── Difficulty Tabs ─────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {DIFFICULTY_TABS.map(({ label, value }) => (
          <button
            key={value}
            id={`difficulty-tab-${value.toLowerCase()}`}
            onClick={() => handleDifficultyTab(value)}
            className={difficultyTabStyle(activeDifficulty === value, value)}
            aria-pressed={activeDifficulty === value}
          >
            {label}
            <span className={clsx(
              'ml-1.5 text-[11px] font-normal',
              activeDifficulty === value ? 'opacity-80' : 'opacity-50'
            )}>
              {difficultyCount[value]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filter Bar ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <Input
            id="problem-search"
            placeholder="Search problems, topics, patterns…"
            leftIcon={<Search className="w-4 h-4" />}
            value={filters.q ?? ''}
            onChange={handleSearch}
          />
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {/* Status filter */}
          <select
            id="status-filter"
            value={filters.status ?? ''}
            onChange={handleStatusFilter}
            className={clsx(
              'px-3 py-2.5 rounded-lg border text-sm',
              'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]',
              'focus:outline-none focus:border-[var(--accent-primary)]',
              'cursor-pointer'
            )}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-[var(--bg-secondary)]">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Pattern filter */}
          <select
            id="pattern-filter"
            value={filters.pattern ?? ''}
            onChange={handlePatternFilter}
            className={clsx(
              'px-3 py-2.5 rounded-lg border text-sm hidden sm:block',
              'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]',
              'focus:outline-none focus:border-[var(--accent-primary)]',
              'cursor-pointer'
            )}
          >
            <option value="" className="bg-[var(--bg-secondary)]">All Patterns</option>
            {PATTERNS.map(p => (
              <option key={p} value={p} className="bg-[var(--bg-secondary)]">{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Problem Table ────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-secondary)] overflow-hidden bg-[var(--bg-secondary)]">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)] font-medium">No problems match your filters</p>
            <p className="text-xs text-[var(--text-tertiary)]">Try adjusting the difficulty tab, status, or search query</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                <th className="pl-4 pr-2 py-2 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider w-36">Status</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Problem</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider w-24">Difficulty</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider w-36 hidden md:table-cell">Topic</th>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((problem: ProblemWithStatus) => (
                <ProblemRow
                  key={problem._id}
                  problem={problem}
                  onBookmark={toggleBookmark}
                  isBookmarking={isBookmarking}
                  onEdit={setEditingProblem}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-[var(--text-tertiary)]">
            {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, problems.length)} of {problems.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="flex items-center px-2 text-xs text-[var(--text-secondary)]">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      <AddProblemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      <EditProblemModal
        problem={editingProblem}
        onClose={() => setEditingProblem(null)}
      />
    </div>
  );
}
