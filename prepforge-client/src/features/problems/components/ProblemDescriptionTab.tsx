import type { ProblemWithStatus } from '../../../types';

export default function ProblemDescriptionTab({ problem }: { problem: ProblemWithStatus }) {
  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Patterns */}
      {problem.patterns.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Patterns</h3>
          <div className="flex flex-wrap gap-2">
            {problem.patterns.map((pattern) => (
              <span key={pattern} className="px-2 py-1 text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded border border-[var(--border-secondary)]">
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
