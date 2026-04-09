import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@core/api/client';
import type {
  Contact,
  ContactDetail,
  ContactFilterParams,
  CreateContactRequest,
  UpdateContactRequest,
} from '@core/models/contact';
import type { PaginatedResponse } from '@core/models/pagination';

export function useContacts(params: ContactFilterParams) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Contact>>('/contacts', { params })
        .then((r) => r.data),
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () =>
      apiClient.get<ContactDetail>(`/contacts/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactRequest) =>
      apiClient.post<Contact>('/contacts', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useUpdateContact(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateContactRequest) =>
      apiClient.put<Contact>(`/contacts/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contacts', id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useSyncContactTags(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagIds: number[]) =>
      apiClient.post(`/contacts/${id}/tags`, { tagIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', id] }),
  });
}
