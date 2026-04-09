import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@core/api/client';
import type {
  Deal,
  DealDetail,
  DealFilterParams,
  CreateDealRequest,
  UpdateDealRequest,
  Pipeline,
} from '@core/models/deal';
import type { PaginatedResponse } from '@core/models/pagination';

export function useDeals(params: DealFilterParams) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Deal>>('/deals', { params })
        .then((r) => r.data),
  });
}

export function useDeal(id: number) {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: () =>
      apiClient.get<DealDetail>(`/deals/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePipeline() {
  return useQuery({
    queryKey: ['deals', 'pipeline'],
    queryFn: () =>
      apiClient.get<Pipeline>('/deals/pipeline').then((r) => r.data),
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDealRequest) =>
      apiClient.post<Deal>('/deals', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateDeal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDealRequest) =>
      apiClient.put<Deal>(`/deals/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['deals', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/deals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
