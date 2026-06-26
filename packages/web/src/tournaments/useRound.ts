import { type RoundView, type ScoreSaveResult, validateEndScore } from '@bv/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { TOURNAMENTS_KEY } from './useTournaments';

export function roundKey(tid: number, seq: number) {
  return ['round', tid, seq] as const;
}

/** Vista de una tirada (participantes ordenados + scores + estado). */
export function useRound(tid: number, seq: number) {
  const { data, isLoading, isError } = useQuery<RoundView>({
    queryKey: roundKey(tid, seq),
    queryFn: () => api.get<RoundView>(`/tournaments/${tid}/rounds/${seq}`),
    enabled: Number.isInteger(tid) && tid > 0 && Number.isInteger(seq) && seq > 0,
  });
  return { round: data, isLoading, isError };
}

interface SaveVars {
  participantId: number;
  arrows: string[];
}

/** Autosave de un end con actualización optimista del cache de la tirada. */
export function useSaveScore(tid: number, seq: number) {
  const qc = useQueryClient();
  const key = roundKey(tid, seq);

  return useMutation({
    mutationFn: ({ participantId, arrows }: SaveVars) =>
      api.put<ScoreSaveResult>(`/tournaments/${tid}/rounds/${seq}/scores/${participantId}`, {
        arrows,
      }),
    onMutate: async ({ participantId, arrows }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<RoundView>(key);
      if (prev) {
        const result = validateEndScore(prev.modality, prev.arrowsPerEnd, arrows);
        if (result.ok) {
          const c = result.value;
          qc.setQueryData<RoundView>(key, {
            ...prev,
            entries: prev.entries.map((e) =>
              e.participant.id === participantId
                ? {
                    ...e,
                    score: {
                      participantId,
                      arrows,
                      endTotal: c.total,
                      innerCount: c.innerCount,
                      secondCount: c.secondCount,
                      xCount: c.xCount,
                      mCount: c.mCount,
                      status: 'completa',
                      updatedAt: Date.now(),
                    },
                  }
                : e,
            ),
          });
        }
      }
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: [...TOURNAMENTS_KEY, tid] });
    },
  });
}
