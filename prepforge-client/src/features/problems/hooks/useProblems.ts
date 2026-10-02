import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { problemApi } from '../../../api/problem.api';
import { queryKeys } from '../../../config/queryKeys';
import type { ProblemFilters } from '../../../types';

export function useProblems(filters: ProblemFilters) {
  return useQuery({
    queryKey: queryKeys.problems.list(filters as any),
    queryFn: () => problemApi.getAll(filters),
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (problemId: string) => problemApi.toggleBookmark(problemId),
    onSuccess: (_, problemId) => {
      // Invalidate the problem list so bookmark status updates
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.status(problemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.detail(problemId) });
    },
  });
}
