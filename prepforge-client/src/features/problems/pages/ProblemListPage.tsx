import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProblems, useToggleBookmark } from '../hooks/useProblems';
import { Card, Input, Button, Badge, Spinner, ErrorState } from '../../../components/ui';
import { Search, Bookmark, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { ROUTES } from '../../../config/routes';
import type { ProblemFilters, ProblemWithStatus } from '../../../types';

export default function ProblemListPage() {
  const [filters, setFilters] = useState<ProblemFilters>({});
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const { data: response, isLoading, isError, refetch } = useProblems(filters);
  const { mutate: toggleBookmark, isPending: isToggling } = useToggleBookmark();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, q: e.target.value }));
    setPage(1);
  };

  const handleFilterChange = (key: keyof ProblemFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const problems = response?.problems || [];
  const totalPages = Math.ceil(problems.length / itemsPerPage);
  
  // Client-side pagination
  const paginatedProblems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return problems.slice(startIndex, startIndex + itemsPerPage);
  }, [problems, page]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !response) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Problem List</h1>
        <p className="text-[var(--text-secondary)]">
          {response.filtered} {response.filtered === 1 ? 'problem' : 'problems'} found
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search problems, topics, patterns..."
              leftIcon={<Search className="w-4 h-4" />}
              value={filters.q || ''}
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <select
              className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              value={filters.difficulty || ''}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
              className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>
          </div>
        </div>

        {/* Problem Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border-secondary)]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-secondary)]">
              <tr>
                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider w-12">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Title</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Difficulty</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Topic</th>
                <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-secondary)] bg-[var(--bg-primary)]">
              {paginatedProblems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                    No problems match your filters.
                  </td>
                </tr>
              ) : (
                paginatedProblems.map((problem: ProblemWithStatus) => (
                  <tr key={problem._id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {problem.solved && (
                          <div title="Solved"><CheckCircle2 className="w-5 h-5 text-[var(--accent-success)]" /></div>
                        )}
                        {problem.revisionDue && (
                          <div title="Revision Due"><AlertCircle className="w-5 h-5 text-[var(--accent-error)]" /></div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Link
                        to={ROUTES.PROBLEM_DETAIL(problem._id)}
                        className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                      >
                        {problem.title}
                      </Link>
                      <div className="flex gap-1 mt-1">
                        {problem.patterns.slice(0, 2).map((pattern: string) => (
                          <span key={pattern} className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded">
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Medium' ? 'warning' : 'error'}
                      >
                        {problem.difficulty}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {problem.topic} (Week {problem.week})
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() => toggleBookmark(problem._id)}
                          disabled={isToggling}
                          title={problem.bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                        >
                          <Bookmark className={`w-4 h-4 ${problem.bookmarked ? 'fill-[var(--accent-primary)] text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}`} />
                        </Button>
                        {problem.leetcodeUrl && (
                          <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" title="View on LeetCode">
                            <Button variant="ghost" size="sm" className="px-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-secondary)]">
            <span className="text-sm text-[var(--text-secondary)]">
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, problems.length)} of {problems.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
