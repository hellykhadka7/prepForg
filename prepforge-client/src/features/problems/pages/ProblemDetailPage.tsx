import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProblemDetail } from '../hooks/useProblemDetail';
import { Spinner, ErrorState, Badge, Button, Card } from '../../../components/ui';
import {
  ArrowLeft, CheckCircle2, Circle, PauseCircle, SkipForward,
  Bookmark, AlertCircle, ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../config/routes';
import { useToggleBookmark, useSetProblemStatus } from '../hooks/useProblems';
import ProblemWorkspace from '../components/ProblemWorkspace';
import ProblemDescriptionTab from '../components/ProblemDescriptionTab';
import ProblemSolutionsTab from '../components/ProblemSolutionsTab';
import ProblemNotesTab from '../components/ProblemNotesTab';
import ProblemRevisionsTab from '../components/ProblemRevisionsTab';
import type { ProblemStatus } from '../../../types';

// ── Constants ─────────────────────────────────────────────

type Tab = 'description' | 'solutions' | 'notes' | 'revisions';

const TAB_LABELS: { value: Tab; label: string }[] = [
  { value: 'description', label: 'Description' },
  { value: 'solutions', label: 'Solutions' },
  { value: 'notes', label: 'Notes' },
  { value: 'revisions', label: 'Revisions' },
];

const STATUS_OPTIONS: { value: ProblemStatus; icon: React.ReactNode; label: string; className: string }[] = [
  {
    value: 'not_started',
    icon: <Circle className="w-3.5 h-3.5" />,
    label: 'Not Started',
    className: 'text-[var(--text-tertiary)]',
  },
  {
    value: 'completed',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'Completed',
    className: 'text-emerald-400',
  },
  {
    value: 'on_hold',
    icon: <PauseCircle className="w-3.5 h-3.5" />,
    label: 'On Hold',
    className: 'text-amber-400',
  },
  {
    value: 'skipped',
    icon: <SkipForward className="w-3.5 h-3.5" />,
    label: 'Skipped',
    className: 'text-[var(--text-secondary)]',
  },
];

// ── StatusSelector ─────────────────────────────────────────

function StatusSelector({ problemId, currentStatus }: { problemId: string; currentStatus: ProblemStatus }) {
  const { mutate: setStatus, isPending } = useSetProblemStatus();
  const meta = STATUS_OPTIONS.find(o => o.value === currentStatus) ?? STATUS_OPTIONS[0];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as ProblemStatus;
    if (next === currentStatus) return;
    setStatus(
      { problemId, status: next },
      { onError: () => toast.error('Failed to update status') }
    );
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border',
        'border-[var(--border-primary)] bg-[var(--bg-input)]',
        isPending && 'opacity-50',
        meta.className
      )}
    >
      {meta.icon}
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className={clsx(
          'text-xs font-medium bg-transparent border-none outline-none cursor-pointer',
          meta.className
        )}
        aria-label="Problem status"
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── ProblemDetailPage ──────────────────────────────────────

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: problem, isLoading, isError, refetch } = useProblemDetail(id!);
  const { mutate: toggleBookmark, isPending: isToggling } = useToggleBookmark();

  const [activeTab, setActiveTab] = useState<Tab>('description');

  // ── Loading / error guards ─────────────────────────────

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  if (isError || !problem) {
    return <div className="flex items-center justify-center min-h-[60vh]"><ErrorState onRetry={() => refetch()} /></div>;
  }

  // Prefer sourceUrl for custom problems; fall back to leetcodeUrl for seeded ones
  const externalLink = problem.sourceUrl || problem.leetcodeUrl;
  const externalLabel = problem.isCustom ? 'Source' : 'LeetCode';

  // For custom problems, week=0 is meaningless — suppress it
  const showWeek = !problem.isCustom && problem.week > 0;

  const diffVariant = problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Medium' ? 'warning' : 'error';

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between pb-4 border-b border-[var(--border-secondary)] mb-4 gap-4 flex-wrap">

        {/* Left: back + title + meta */}
        <div className="flex items-start gap-3 min-w-0">
          <Link to={ROUTES.PROBLEMS} className="flex-shrink-0 mt-0.5">
            <Button variant="ghost" size="sm" className="px-2" aria-label="Back to problems">
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Button>
          </Link>

          <div className="min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                {problem.title}
              </h1>
              {problem.solved && (
                <span title="Solved">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                </span>
              )}
              {problem.revisionDue && (
                <span title="Revision due">
                  <AlertCircle className="w-5 h-5 text-[var(--accent-error)] flex-shrink-0" />
                </span>
              )}
              {problem.isCustom && (
                <span className="text-[10px] px-1.5 py-px rounded bg-violet-500/15 text-violet-400 border border-violet-500/30 font-medium flex-shrink-0">
                  custom
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant={diffVariant}>{problem.difficulty}</Badge>

              {problem.topic && (
                <span className="text-xs text-[var(--text-secondary)]">{problem.topic}</span>
              )}

              {showWeek && (
                <>
                  <span className="text-xs text-[var(--text-tertiary)]">•</span>
                  <span className="text-xs text-[var(--text-secondary)]">Week {problem.week}</span>
                </>
              )}

              {/* Pattern pills — max 3 */}
              {problem.patterns.slice(0, 3).map(p => (
                <span
                  key={p}
                  className="text-[10px] px-1.5 py-px rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-secondary)]"
                >
                  {p}
                </span>
              ))}
              {problem.patterns.length > 3 && (
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  +{problem.patterns.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: status + external link + bookmark */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Status selector */}
          <StatusSelector problemId={problem._id} currentStatus={problem.status} />

          {/* External link */}
          {externalLink && (
            <a href={externalLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                {externalLabel}
              </Button>
            </a>
          )}

          {/* Bookmark */}
          <Button
            variant={problem.bookmarked ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleBookmark(problem._id)}
            disabled={isToggling}
            className="gap-1.5"
            aria-label={problem.bookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark className={clsx('w-3.5 h-3.5', problem.bookmarked && 'fill-current')} />
            {problem.bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="flex flex-1 gap-4 overflow-hidden">

        {/* Left pane: info tabs */}
        <Card className="w-1/2 flex flex-col p-0 overflow-hidden border border-[var(--border-secondary)]">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--border-secondary)] overflow-x-auto flex-shrink-0">
            {TAB_LABELS.map(({ value, label }) => (
              <button
                key={value}
                id={`tab-${value}`}
                onClick={() => setActiveTab(value)}
                className={clsx(
                  'px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === value
                    ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                )}
                aria-selected={activeTab === value}
                role="tab"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-primary)]">
            {activeTab === 'description' && <ProblemDescriptionTab problem={problem} />}
            {activeTab === 'solutions' && <ProblemSolutionsTab problemId={problem._id} />}
            {activeTab === 'notes' && <ProblemNotesTab problemId={problem._id} />}
            {activeTab === 'revisions' && <ProblemRevisionsTab problemId={problem._id} />}
          </div>
        </Card>

        {/* Right pane: code workspace (unchanged) */}
        <Card className="w-1/2 flex flex-col p-0 overflow-hidden border border-[var(--border-secondary)]">
          <ProblemWorkspace problem={problem} />
        </Card>
      </div>
    </div>
  );
}
