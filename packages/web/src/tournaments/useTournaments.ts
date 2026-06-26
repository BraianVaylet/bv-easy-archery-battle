import type {
  ParticipantStats,
  TournamentCreateInput,
  TournamentDetail,
  TournamentDetailView,
  TournamentListItem,
  TournamentPodium,
  TournamentStats,
} from '@bv/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';

/** Invalida detalle + listado de un torneo tras una mutación. */
function useInvalidateTournament(id: number) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [...TOURNAMENTS_KEY, id] });
    qc.invalidateQueries({ queryKey: TOURNAMENTS_KEY });
  };
}

export const TOURNAMENTS_KEY = ['tournaments'] as const;

/** Lista los torneos del usuario (todos los estados). */
export function useTournaments() {
  const { data, isLoading } = useQuery<TournamentListItem[]>({
    queryKey: TOURNAMENTS_KEY,
    queryFn: () => api.get<TournamentListItem[]>('/tournaments'),
  });
  return { tournaments: data ?? [], isLoading };
}

/** Mutación para crear un torneo. */
export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TournamentCreateInput) => api.post<TournamentDetail>('/tournaments', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TOURNAMENTS_KEY }),
  });
}

/** Detalle (con mini-podio) de un torneo. */
export function useTournament(id: number) {
  const { data, isLoading, isError } = useQuery<TournamentDetailView>({
    queryKey: [...TOURNAMENTS_KEY, id],
    queryFn: () => api.get<TournamentDetailView>(`/tournaments/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
  return { tournament: data, isLoading, isError };
}

/** Mutación para finalizar un torneo (exige todas las tiradas completas). */
export function useFinishTournament(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<TournamentDetail>(`/tournaments/${id}/finish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...TOURNAMENTS_KEY, id] });
      qc.invalidateQueries({ queryKey: TOURNAMENTS_KEY });
    },
  });
}

/** Editar el nombre de un torneo en curso. */
export function useUpdateTournament(id: number) {
  const invalidate = useInvalidateTournament(id);
  return useMutation({
    mutationFn: (name: string) => api.patch<TournamentDetailView>(`/tournaments/${id}`, { name }),
    onSuccess: invalidate,
  });
}

/** Agregar participantes (avatares) a un torneo en curso. */
export function useAddParticipants(id: number) {
  const invalidate = useInvalidateTournament(id);
  return useMutation({
    mutationFn: (avatarIds: number[]) =>
      api.post<TournamentDetailView>(`/tournaments/${id}/participants`, { avatarIds }),
    onSuccess: invalidate,
  });
}

/** Agregar una tirada a un torneo en curso. */
export function useAddRound(id: number) {
  const invalidate = useInvalidateTournament(id);
  return useMutation({
    mutationFn: () => api.post<TournamentDetailView>(`/tournaments/${id}/rounds`),
    onSuccess: invalidate,
  });
}

/** Podios del torneo (general + por categoría + escuela). */
export function usePodium(id: number) {
  const { data, isLoading, isError } = useQuery<TournamentPodium>({
    queryKey: [...TOURNAMENTS_KEY, id, 'podium'],
    queryFn: () => api.get<TournamentPodium>(`/tournaments/${id}/podium`),
    enabled: Number.isInteger(id) && id > 0,
  });
  return { podium: data, isLoading, isError };
}

/** Estadísticas agregadas del torneo. */
export function useTournamentStats(id: number) {
  const { data, isLoading, isError } = useQuery<TournamentStats>({
    queryKey: [...TOURNAMENTS_KEY, id, 'stats'],
    queryFn: () => api.get<TournamentStats>(`/tournaments/${id}/stats`),
    enabled: Number.isInteger(id) && id > 0,
  });
  return { stats: data, isLoading, isError };
}

/** Estadísticas de un participante del torneo. */
export function useParticipantStats(id: number, participantId: number) {
  const { data, isLoading, isError } = useQuery<ParticipantStats>({
    queryKey: [...TOURNAMENTS_KEY, id, 'participants', participantId, 'stats'],
    queryFn: () =>
      api.get<ParticipantStats>(`/tournaments/${id}/participants/${participantId}/stats`),
    enabled: Number.isInteger(id) && id > 0 && Number.isInteger(participantId) && participantId > 0,
  });
  return { stats: data, isLoading, isError };
}
