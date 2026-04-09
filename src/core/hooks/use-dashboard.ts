import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@core/api/client';
import type { DashboardData } from '@core/models/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () =>
      apiClient.get<DashboardData>('/dashboard').then((r) => r.data),
  });
}
