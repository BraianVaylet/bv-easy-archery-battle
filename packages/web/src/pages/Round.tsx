import {
  BOW_CATEGORY_LABELS,
  type RoundParticipantEntry,
  SCORING,
  sortArrowsDescending,
} from '@bv/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { RoundStepper } from '../components/RoundStepper';
import { EndRow } from '../components/score/EndRow';
import { PairCard } from '../components/score/PairCard';
import { ScoreKeypad } from '../components/score/ScoreKeypad';
import { Button, Spinner } from '../components/ui';
import { useRound, useSaveScore } from '../tournaments/useRound';
import { useAddRound, useTournament } from '../tournaments/useTournaments';

export function Round() {
  const { id, seq } = useParams();
  const tid = Number(id);
  const s = Number(seq);
  const { round, isLoading, isError } = useRound(tid, s);
  const { tournament } = useTournament(tid);
  const save = useSaveScore(tid, s);
  const addRound = useAddRound(tid);
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState<string[]>([]);

  if (isLoading) {
    return (
      <AppShell title={`Tirada ${s}`} showBack>
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </AppShell>
    );
  }
  if (isError || !round) {
    return (
      <AppShell title={`Tirada ${s}`} showBack>
        <p className="text-muted">No se pudo cargar la tirada.</p>
      </AppShell>
    );
  }

  const { modality, arrowsPerEnd } = round;
  const cfg = SCORING[modality];

  function select(entry: RoundParticipantEntry) {
    setActiveId(entry.participant.id);
    setDraft(entry.score ? [...entry.score.arrows] : []);
  }

  function close() {
    setActiveId(null);
    setDraft([]);
  }

  function addToken(token: string) {
    if (activeId === null || draft.length >= arrowsPerEnd) return;
    const next = [...draft, token];
    setDraft(next);
    if (next.length === arrowsPerEnd) {
      save.mutate({ participantId: activeId, arrows: sortArrowsDescending(modality, next) });
      close();
    }
  }

  // Agrupa las entradas (ya ordenadas por par/posición) por pairIndex.
  const pairs = new Map<number, RoundParticipantEntry[]>();
  for (const e of round.entries) {
    const list = pairs.get(e.participant.pairIndex) ?? [];
    list.push(e);
    pairs.set(e.participant.pairIndex, list);
  }

  const draftTotal = draft.reduce((acc, t) => acc + (cfg.values[t] ?? 0), 0);
  // ¿Existe la tirada siguiente? Si no, en la última se ofrece agregar una.
  const hasNext = tournament?.rounds.some((r) => r.seq === s + 1) ?? false;
  const finished = tournament?.status === 'finalizado';

  return (
    <AppShell title={`Tirada ${s}`} showBack>
      {tournament && <RoundStepper tid={tid} rounds={tournament.rounds} current={s} />}

      <p className="mb-4 text-muted text-sm">
        {round.status === 'completa' ? 'Tirada completa' : 'Cargá los puntajes de cada arquero.'}
      </p>

      <div className="flex flex-col gap-3 pb-4">
        {[...pairs.entries()].map(([pairIndex, entries]) => (
          <PairCard
            key={pairIndex}
            pairIndex={pairIndex}
            stake={entries[0]?.participant.stake ?? null}
            categories={entries.map((e) => BOW_CATEGORY_LABELS[e.participant.bowCategory])}
          >
            {entries.map((e) => {
              const isActive = activeId === e.participant.id;
              const arrows = isActive
                ? sortArrowsDescending(round.modality, draft)
                : e.score
                  ? sortArrowsDescending(round.modality, e.score.arrows)
                  : null;
              const total = isActive ? draftTotal : (e.score?.endTotal ?? null);
              return (
                <EndRow
                  key={e.participant.id}
                  participant={e.participant}
                  arrows={arrows}
                  total={total}
                  arrowsPerEnd={round.arrowsPerEnd}
                  active={isActive}
                  onSelect={() => select(e)}
                />
              );
            })}
          </PairCard>
        ))}
      </div>

      {round.status === 'completa' &&
        tournament &&
        (hasNext ? (
          <Link to={`/tournaments/${tid}/rounds/${s + 1}`}>
            <Button variant="secondary" className="mb-2 w-full">
              Siguiente tirada
            </Button>
          </Link>
        ) : (
          !finished && (
            <Button
              variant="secondary"
              className="mb-2 w-full"
              loading={addRound.isPending}
              onClick={() =>
                addRound.mutate(undefined, {
                  onSuccess: () => navigate(`/tournaments/${tid}/rounds/${s + 1}`),
                })
              }
            >
              <Plus size={16} aria-hidden /> Agregar tirada
            </Button>
          )
        ))}
      <Link to={`/tournaments/${tid}`}>
        <Button variant="ghost" className="w-full">
          Volver al torneo
        </Button>
      </Link>

      {activeId !== null && (
        <ScoreKeypad
          tokens={cfg.tokens}
          draft={sortArrowsDescending(round.modality, draft)}
          arrowsPerEnd={round.arrowsPerEnd}
          onToken={addToken}
          onBackspace={() => setDraft((d) => d.slice(0, -1))}
          onClose={close}
        />
      )}
    </AppShell>
  );
}
