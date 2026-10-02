import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionApi } from '../../../api/revision.api';
import { Card, Badge, Spinner, EmptyState, Button } from '../../../components/ui';
import { Calendar, Clock, AlertTriangle, CheckCircle2, RotateCcw, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { DueRevisionItem, RevisionWithProblem } from '../../../types';

export default function RevisionsPage() {
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useQuery({
    queryKey: ['revisions', 'queue'],
    queryFn: revisionApi.getQueue,
  });

  const { mutate: completeSlot, isPending: completing } = useMutation({
    mutationFn: ({ revisionId, slot }: { revisionId: string; slot: 1 | 2 | 3 }) =>
      revisionApi.completeSlot(revisionId, slot),
    onSuccess: () => {
      toast.success('Revision completed! XP awarded.');
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to complete revision.'),
  });

  const { mutate: resetRevision } = useMutation({
    mutationFn: (problemId: string) => revisionApi.reset(problemId),
    onSuccess: () => {
      toast.success('Revision rescheduled from today.');
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
    },
    onError: () => toast.error('Failed to reschedule.'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const overdue = queue?.overdue || [];
  const due = queue?.due || [];
  const upcoming = queue?.upcoming || [];

  const totalDue = overdue.length + due.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Spaced Revisions</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Review problems at optimal intervals to strengthen retention
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
            <span className="text-xs text-[var(--text-secondary)]">Due Today: </span>
            <span className="text-sm font-bold text-[var(--text-primary)]">{totalDue}</span>
          </div>
        </div>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">
              Overdue ({overdue.length})
            </h2>
          </div>
          <div className="grid gap-3">
            {overdue.map((item) => (
              <RevisionCard
                key={`${item._id}-${item.revisionSlot}`}
                item={item}
                variant="overdue"
                onComplete={(slot) => completeSlot({ revisionId: item._id, slot })}
                onReschedule={() => resetRevision(item.problem._id)}
                completing={completing}
              />
            ))}
          </div>
        </section>
      )}

      {/* Due Today */}
      {due.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Due Today ({due.length})
            </h2>
          </div>
          <div className="grid gap-3">
            {due.map((item) => (
              <RevisionCard
                key={`${item._id}-${item.revisionSlot}`}
                item={item}
                variant="due"
                onComplete={(slot) => completeSlot({ revisionId: item._id, slot })}
                onReschedule={() => resetRevision(item.problem._id)}
                completing={completing}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {totalDue === 0 && upcoming.length === 0 && (
        <EmptyState
          icon="📚"
          title="No Revisions Yet"
          description="Start solving problems to build your revision queue."
        />
      )}

      {totalDue === 0 && upcoming.length > 0 && (
        <Card className="p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-lg font-semibold text-[var(--text-primary)]">All caught up!</p>
          <p className="text-sm text-[var(--text-secondary)]">No revisions due right now.</p>
        </Card>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">
              Upcoming ({upcoming.length})
            </h2>
          </div>
          <div className="grid gap-3">
            {upcoming.map((rev) => (
              <UpcomingCard key={rev._id} revision={rev} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Revision Card ──────────────────────────────────────────

function RevisionCard({
  item,
  variant,
  onComplete,
  onReschedule,
  completing,
}: {
  item: DueRevisionItem;
  variant: 'overdue' | 'due';
  onComplete: (slot: 1 | 2 | 3) => void;
  onReschedule: () => void;
  completing: boolean;
}) {
  const borderColor = variant === 'overdue' ? 'border-rose-500/30' : 'border-amber-500/30';
  const bgColor = variant === 'overdue' ? 'bg-rose-500/5' : 'bg-amber-500/5';

  return (
    <Card className={`p-4 ${bgColor} border ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <Link
              to={`/app/problems/${item.problem._id}`}
              className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--gradient-start)] transition-colors truncate block"
            >
              {item.problem.title}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={item.problem.difficulty === 'Easy' ? 'success' : item.problem.difficulty === 'Medium' ? 'warning' : 'error'}
              >
                {item.problem.difficulty}
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)]">{item.problem.topic}</span>
              <Badge variant="info">Rev {item.revisionSlot}</Badge>
              <span className="text-xs text-[var(--text-tertiary)]">
                Due: {new Date(item.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={onReschedule}
            className="gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reschedule
          </Button>
          <Button
            size="sm"
            onClick={() => onComplete(item.revisionSlot)}
            disabled={completing}
            className="gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Reviewed
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Upcoming Card ──────────────────────────────────────────

function UpcomingCard({ revision }: { revision: RevisionWithProblem }) {
  const nextDate = getNextRevisionDate(revision);

  return (
    <Card className="p-4 border border-sky-500/10">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Link
            to={`/app/problems/${revision.problem._id}`}
            className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--gradient-start)] transition-colors truncate block"
          >
            {revision.problem.title}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={revision.problem.difficulty === 'Easy' ? 'success' : revision.problem.difficulty === 'Medium' ? 'warning' : 'error'}
            >
              {revision.problem.difficulty}
            </Badge>
            <span className="text-xs text-[var(--text-tertiary)]">{revision.problem.topic}</span>
            {nextDate && (
              <span className="text-xs text-sky-400">
                Next: {new Date(nextDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Link to={`/app/problems/${revision.problem._id}`}>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        </Link>
      </div>
    </Card>
  );
}

function getNextRevisionDate(rev: RevisionWithProblem): string | null {
  if (!rev.revision1Done) return rev.revision1Date;
  if (!rev.revision2Done) return rev.revision2Date;
  if (!rev.revision3Done) return rev.revision3Date;
  return null;
}
