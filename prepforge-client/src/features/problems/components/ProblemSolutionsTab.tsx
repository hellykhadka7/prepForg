import { useProblemSolutions } from '../hooks/useProblemDetail';
import { Spinner, ErrorState, Badge } from '../../../components/ui';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function ProblemSolutionsTab({ problemId }: { problemId: string }) {
  const { data: solutions, isLoading, isError, refetch } = useProblemSolutions(problemId);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!solutions || solutions.length === 0) {
    return (
      <div className="text-center p-8 text-[var(--text-tertiary)]">
        No solutions submitted yet. Write your first solution in the workspace!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {solutions.map((solution) => (
        <div key={solution._id} className="p-4 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {solution.isAccepted ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--accent-success)]" />
              ) : (
                <XCircle className="w-5 h-5 text-[var(--accent-error)]" />
              )}
              <span className="font-medium text-[var(--text-primary)]">
                {new Date(solution.submittedAt).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex gap-2">
              <Badge variant="default">
                <Clock className="w-3 h-3 mr-1 inline" /> {Math.round(solution.solveDuration / 60)} min
              </Badge>
              <Badge variant={
                solution.confidence >= 4 ? 'success' : 
                solution.confidence >= 3 ? 'warning' : 'error'
              }>
                {solution.confidence >= 4 ? 'High' : solution.confidence >= 3 ? 'Medium' : 'Low'}
              </Badge>
            </div>
          </div>
          
          <div className="text-sm font-mono p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] overflow-x-auto text-[var(--text-primary)]">
            <pre>{solution.code}</pre>
          </div>

          {solution.mistakes && solution.mistakes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              <span className="text-xs text-[var(--text-tertiary)] uppercase mr-1 flex items-center">Mistakes:</span>
              {solution.mistakes.map(tag => (
                <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/10 text-red-500 border border-red-500/20">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
