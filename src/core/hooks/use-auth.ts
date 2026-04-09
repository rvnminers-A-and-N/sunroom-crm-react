import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@core/api/client';
import { useAuthStore } from '@core/stores/auth-store';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@core/models/user';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => setAuth(data.user, data.token),
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),
    onSuccess: (data) => setAuth(data.user, data.token),
  });
}

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<User>('/auth/me');
      setUser(res.data);
      return res.data;
    },
    enabled: isAuthenticated,
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSettled: () => logout(),
  });
}
