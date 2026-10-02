import { useProblemRevision } from '../hooks/useProblemDetail';
import { Spinner, ErrorState, Button, Badge } from '../../../components/ui';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionApi } from '../../../api/revision.api';
import toast from 'react-hot-toast';

export default function ProblemRevisionsTab({ problemId }: { problemId: string }) {
  const { data: revision, isLoading, isError, refetch } = useProblemRevision(problemId);
  const queryClient = useQueryClient();

  const { mutate: completeSlot, isPending } = useMutation({
    mutationFn: (slotNumber: 1 | 2 | 3) => revisionApi.completeSlot(revision!._id, slotNumber),
    onSuccess: () => {
      toast.success('Revision marked as completed');
      queryClient.invalidateQueries({ queryKey: ['revisions', 'problem', problemId] });
      queryClient.invalidateQueries({ queryKey: ['problems', 'status', problemId] });
      queryClient.invalidateQueries({ queryKey: ['problems', 'detail', problemId] });
    },
    onError: () => toast.error('Failed to complete revision'),
  });

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (!revision) {
    return (
      <div className="text-center p-8 text-[var(--text-tertiary)]">
        No revision schedule yet. Solve this problem to automatically start the spaced repetition schedule.
      </div>
    );
  }

  const renderSlot = (date: string, done: boolean, slotNum: 1 | 2 | 3, label: string) => {
    const isDue = !done && new Date(date) <= new Date();
    return (
      <div className={`p-4 rounded-xl border flex items-center justify-between ${done ? 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)]' : isDue ? 'bg-red-500/10 border-red-500/30' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)]'}`}>
        <div className="flex items-center gap-3">
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-[var(--accent-success)]" />
          ) : (
            <Circle className={`w-5 h-5 ${isDue ? 'text-red-500' : 'text-[var(--text-tertiary)]'}`} />
          )}
          <div>
            <p className="font-medium text-[var(--text-primary)]">{label}</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-[var(--text-secondary)]">
              <Calendar className="w-3 h-3" />
              {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
        {isDue && (
          <Button size="sm" onClick={() => completeSlot(slotNum)} disabled={isPending}>
            Mark Done
          </Button>
        )}
        {done && <Badge variant="success">Completed</Badge>}
        {!done && !isDue && <Badge variant="default">Upcoming</Badge>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">Spaced Repetition</h3>
      <div className="space-y-3">
        {renderSlot(revision.revision1Date, revision.revision1Done, 1, '1st Revision (1 day)')}
        {renderSlot(revision.revision2Date, revision.revision2Done, 2, '2nd Revision (3 days)')}
        {renderSlot(revision.revision3Date, revision.revision3Done, 3, '3rd Revision (7 days)')}
      </div>
    </div>
  );
}
