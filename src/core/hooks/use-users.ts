import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@core/api/client';
import type { User, UpdateUserRequest } from '@core/models/user';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get<User[]>('/users').then((r) => r.data),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiClient.get<User>(`/users/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserRequest) =>
      apiClient.put<User>(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
