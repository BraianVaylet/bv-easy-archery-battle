import type { Avatar, AvatarCreateInput, AvatarUpdateInput } from '@bv/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';

export const AVATARS_KEY = ['avatars'] as const;
export const ARCHIVED_AVATARS_KEY = ['avatars', 'archived'] as const;

/** Avatares del usuario + mutaciones (crear, editar, archivar, restaurar). */
export function useAvatars() {
  const qc = useQueryClient();
  // Invalida tanto activos como archivados (la key 'avatars' es prefijo de ambas).
  const invalidate = () => qc.invalidateQueries({ queryKey: AVATARS_KEY });

  const { data: avatars, isLoading } = useQuery<Avatar[]>({
    queryKey: AVATARS_KEY,
    queryFn: () => api.get<Avatar[]>('/avatars'),
  });

  const create = useMutation({
    mutationFn: (input: AvatarCreateInput) => api.post<Avatar>('/avatars', input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: AvatarUpdateInput }) =>
      api.patch<Avatar>(`/avatars/${id}`, patch),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: number) => api.del<void>(`/avatars/${id}`),
    onSuccess: invalidate,
  });

  const unarchive = useMutation({
    mutationFn: (id: number) => api.post<Avatar>(`/avatars/${id}/restore`),
    onSuccess: invalidate,
  });

  return { avatars: avatars ?? [], isLoading, create, update, archive, unarchive };
}

/** Historial de avatares archivados (lazy: se puede deshabilitar). */
export function useArchivedAvatars(enabled = true) {
  const { data, isLoading } = useQuery<Avatar[]>({
    queryKey: ARCHIVED_AVATARS_KEY,
    queryFn: () => api.get<Avatar[]>('/avatars?archived=true'),
    enabled,
  });
  return { archived: data ?? [], isLoading };
}
