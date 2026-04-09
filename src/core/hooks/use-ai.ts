import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@core/api/client';
import type {
  SummarizeRequest,
  SummarizeResponse,
  SmartSearchRequest,
  SmartSearchResponse,
} from '@core/models/ai';

export function useSummarize() {
  return useMutation({
    mutationFn: (data: SummarizeRequest) =>
      apiClient
        .post<SummarizeResponse>('/ai/summarize', data)
        .then((r) => r.data),
  });
}

export function useDealInsights(dealId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient
        .post<{ insight: string }>(`/ai/deal-insights/${dealId}`)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['deals', dealId] }),
  });
}

export function useSmartSearch() {
  return useMutation({
    mutationFn: (data: SmartSearchRequest) =>
      apiClient
        .post<SmartSearchResponse>('/ai/search', data)
        .then((r) => r.data),
  });
}
