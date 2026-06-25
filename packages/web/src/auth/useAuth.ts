import type { LoginInput, PublicUser, RegisterInput } from '@bv/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '../lib/apiClient';

export const AUTH_KEY = ['auth', 'me'] as const;

interface MeResponse {
  user: PublicUser;
}

/** Resuelve la sesión actual (null si no hay) y expone login/register/logout. */
export function useAuth() {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery<PublicUser | null>({
    queryKey: AUTH_KEY,
    queryFn: async () => {
      try {
        const { user } = await api.get<MeResponse>('/auth/me');
        return user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: AUTH_KEY });

  const login = useMutation({
    mutationFn: (input: LoginInput) => api.post<MeResponse>('/auth/login', input),
    onSuccess: ({ user }) => {
      qc.setQueryData(AUTH_KEY, user);
    },
  });

  const register = useMutation({
    mutationFn: (input: RegisterInput) => api.post<MeResponse>('/auth/register', input),
    onSuccess: ({ user }) => {
      qc.setQueryData(AUTH_KEY, user);
    },
  });

  const logout = useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSuccess: () => {
      qc.setQueryData(AUTH_KEY, null);
      invalidate();
    },
  });

  return { user: user ?? null, isLoading, login, register, logout };
}
