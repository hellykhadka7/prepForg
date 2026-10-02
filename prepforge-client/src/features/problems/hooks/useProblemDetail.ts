import { useQuery } from '@tanstack/react-query';
import { problemApi } from '../../../api/problem.api';
import { solutionApi } from '../../../api/solution.api';
import { noteApi } from '../../../api/note.api';
import { revisionApi } from '../../../api/revision.api';
import { queryKeys } from '../../../config/queryKeys';

export function useProblemDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.problems.detail(id),
    queryFn: () => problemApi.getById(id),
    enabled: !!id,
  });
}

export function useProblemSolutions(id: string) {
  return useQuery({
    queryKey: queryKeys.solutions.forProblem(id),
    queryFn: () => solutionApi.getForProblem(id),
    enabled: !!id,
  });
}

export function useProblemNote(id: string) {
  return useQuery({
    queryKey: queryKeys.notes.forProblem(id),
    queryFn: () => noteApi.getForProblem(id),
    enabled: !!id,
  });
}

export function useProblemRevision(id: string) {
  return useQuery({
    queryKey: queryKeys.revisions.forProblem(id),
    queryFn: () => revisionApi.getForProblem(id),
    enabled: !!id,
  });
}
