import type {
  TournamentCreateInput,
  TournamentDetail,
  TournamentDetailView,
  TournamentListItem,
} from '@bv/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';

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
