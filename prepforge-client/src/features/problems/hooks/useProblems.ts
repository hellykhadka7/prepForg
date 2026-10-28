import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { problemApi } from '../../../api/problem.api';
import { queryKeys } from '../../../config/queryKeys';
import type {
  ProblemFilters,
  ProblemStatus,
  CreateCustomProblemPayload,
  UpdateCustomProblemPayload,
} from '../../../types';

// ──────────────────────────────────────────────────────────
//  Existing hooks — preserved with identical signatures
// ──────────────────────────────────────────────────────────

export function useProblems(filters: ProblemFilters) {
  return useQuery({
    queryKey: queryKeys.problems.list(filters as Record<string, string | number | undefined>),
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

// ──────────────────────────────────────────────────────────
//  New hooks added in redesign
// ──────────────────────────────────────────────────────────

/**
 * Set per-user tracking status for a problem.
 * Invalidates the problem list and detail so status badges refresh immediately.
 */
export function useSetProblemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ problemId, status }: { problemId: string; status: ProblemStatus }) =>
      problemApi.setMyStatus(problemId, status),
    onSuccess: (_, { problemId }) => {
      // Refresh list (status column), detail page, and the status sub-query
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.detail(problemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.status(problemId) });
    },
  });
}

/**
 * Create a new custom problem.
 * Invalidates the full problem list so the new row appears immediately.
 */
export function useCreateProblem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomProblemPayload) => problemApi.createCustom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
    },
  });
}

/**
 * Update an existing custom problem.
 * Invalidates the list and the specific detail query.
 */
export function useUpdateProblem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomProblemPayload }) =>
      problemApi.updateCustom(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.detail(id) });
    },
  });
}

/**
 * Soft-delete a custom problem.
 * Invalidates the problem list so the deleted row disappears immediately.
 * Does NOT invalidate solution/note/revision queries — historical data is preserved.
 */
export function useDeleteProblem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (problemId: string) => problemApi.deleteCustom(problemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
    },
  });
}
