import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@core/api/client';
import type {
  Company,
  CompanyDetail,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from '@core/models/company';
import type { PaginatedResponse } from '@core/models/pagination';

interface CompanyFilterParams {
  page: number;
  perPage: number;
  search?: string;
  sort?: string;
  direction?: string;
}

export function useCompanies(params: CompanyFilterParams) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Company>>('/companies', { params })
        .then((r) => r.data),
  });
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () =>
      apiClient.get<CompanyDetail>(`/companies/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyRequest) =>
      apiClient.post<Company>('/companies', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useUpdateCompany(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCompanyRequest) =>
      apiClient.put<Company>(`/companies/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['companies', id] });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/companies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}
