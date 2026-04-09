import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@core/api/client';
import type {
  Activity,
  ActivityFilterParams,
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@core/models/activity';
import type { PaginatedResponse } from '@core/models/pagination';

export function useActivities(params: ActivityFilterParams) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Activity>>('/activities', { params })
        .then((r) => r.data),
  });
}

export function useActivity(id: number) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: () =>
      apiClient.get<Activity>(`/activities/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityRequest) =>
      apiClient.post<Activity>('/activities', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateActivity(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateActivityRequest) =>
      apiClient.put<Activity>(`/activities/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['activities', id] });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/activities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
