import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../../api/user.api';
import { queryKeys } from '../../../config/queryKeys';

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.users.dashboard,
    queryFn: userApi.getDashboard,
  });
}
