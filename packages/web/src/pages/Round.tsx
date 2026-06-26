import {
  BOW_CATEGORY_LABELS,
  type RoundParticipantEntry,
  SCORING,
  sortArrowsDescending,
} from '@bv/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EndRow } from '../components/score/EndRow';
import { PairCard } from '../components/score/PairCard';
import { ScoreKeypad } from '../components/score/ScoreKeypad';
import { Button, Spinner } from '../components/ui';
import { useRound, useSaveScore } from '../tournaments/useRound';

export function Round() {
  const { id, seq } = useParams();
  const tid = Number(id);
  const s = Number(seq);
  const { round, isLoading, isError } = useRound(tid, s);
  const save = useSaveScore(tid, s);
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

  return (
    <AppShell title={`Tirada ${s}`} showBack>
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

      {round.status === 'completa' && (
        <Link to={`/tournaments/${tid}/rounds/${s + 1}`}>
          <Button variant="secondary" className="mb-2 w-full">
            Siguiente tirada
          </Button>
        </Link>
      )}
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
