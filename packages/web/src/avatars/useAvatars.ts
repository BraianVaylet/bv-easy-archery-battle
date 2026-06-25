import type { Avatar, AvatarCreateInput } from '@bv/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';

export const AVATARS_KEY = ['avatars'] as const;

/** Lista los avatares del usuario y expone la mutación de creación. */
export function useAvatars() {
  const qc = useQueryClient();

  const { data: avatars, isLoading } = useQuery<Avatar[]>({
    queryKey: AVATARS_KEY,
    queryFn: () => api.get<Avatar[]>('/avatars'),
  });

  const create = useMutation({
    mutationFn: (input: AvatarCreateInput) => api.post<Avatar>('/avatars', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: AVATARS_KEY }),
  });

  return { avatars: avatars ?? [], isLoading, create };
}
