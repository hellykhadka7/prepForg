import { ExternalLink, FileText } from 'lucide-react';
import type { ProblemWithStatus } from '../../../types';

export default function ProblemDescriptionTab({ problem }: { problem: ProblemWithStatus }) {
  const sourceLink = problem.sourceUrl || problem.leetcodeUrl;
  const hasDescription = Boolean(problem.description?.trim());

  return (
    <div className="space-y-5 text-[var(--text-primary)]">

      {/* Description / Problem Statement */}
      {hasDescription ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
            Description
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {problem.description}
          </p>
        </div>
      ) : (
        /* No local description — point to source */
        <div className="flex flex-col items-start gap-3 py-2">
          <div className="flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--text-secondary)]">
              {problem.isCustom
                ? 'No description added. Edit this problem to add one.'
                : 'The full problem statement is available on the source platform.'}
            </p>
          </div>
          {sourceLink && (
            <a
              href={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary)] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {problem.isCustom ? 'Open source link' : 'View on LeetCode'}
            </a>
          )}
        </div>
      )}

      {/* Patterns */}
      {problem.patterns.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
            Patterns
          </h3>
          <div className="flex flex-wrap gap-2">
            {problem.patterns.map((pattern) => (
              <span
                key={pattern}
                className="px-2 py-1 text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded border border-[var(--border-secondary)]"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source link (shown when description IS present, as a secondary reference) */}
      {hasDescription && sourceLink && (
        <div className="pt-1 border-t border-[var(--border-secondary)]">
          <a
            href={sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {problem.isCustom ? 'Open source link' : 'View on LeetCode'}
          </a>
        </div>
      )}

    </div>
  );
}

