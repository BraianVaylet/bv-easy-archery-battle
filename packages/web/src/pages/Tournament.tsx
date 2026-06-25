import { MODALITY_LABELS, type PodiumEntry } from '@bv/shared';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Button, Card, Spinner } from '../components/ui';
import { cn } from '../lib/cn';
import { useFinishTournament, useTournament } from '../tournaments/useTournaments';

export function Tournament() {
  const { id } = useParams();
  const tid = Number(id);
  const { tournament: t, isLoading, isError } = useTournament(tid);
  const finish = useFinishTournament(tid);

  if (isLoading) {
    return (
      <AppShell title="Torneo" showBack>
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  if (isError || !t) {
    return (
      <AppShell title="Torneo" showBack>
        <p className="text-muted">No se pudo cargar el torneo.</p>
      </AppShell>
    );
  }

  const allComplete = t.rounds.length > 0 && t.rounds.every((r) => r.status === 'completa');
  const finished = t.status === 'finalizado';

  return (
    <AppShell title={t.name} showBack>
      <p className="mb-4 text-muted text-sm">
        {MODALITY_LABELS[t.modality]} · {t.participants.length} arqueros ·{' '}
        {finished ? 'Finalizado' : 'En curso'}
      </p>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-fg">Tiradas</h2>
        <div className="flex flex-col gap-2">
          {t.rounds.map((r) => (
            <Link
              key={r.id}
              to={`/tournaments/${tid}/rounds/${r.seq}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <span className="font-medium text-fg">Tirada {r.seq}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  r.status === 'completa'
                    ? 'bg-primary-soft text-primary'
                    : 'bg-surface-2 text-muted',
                )}
              >
                {r.status === 'completa' ? 'Completa' : 'Pendiente'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {t.miniPodium.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-semibold text-fg">Podio (general)</h2>
          <MiniPodium entries={t.miniPodium} />
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {allComplete ? (
          <Link to={`/tournaments/${tid}/podium`}>
            <Button className="w-full" size="lg">
              Ver podios
            </Button>
          </Link>
        ) : (
          <Button className="w-full" size="lg" disabled title="Completá todas las tiradas">
            Ver podios
          </Button>
        )}

        {!finished && allComplete && (
          <Button
            variant="secondary"
            className="w-full"
            loading={finish.isPending}
            onClick={() => finish.mutate()}
          >
            Finalizar torneo
          </Button>
        )}
        {finish.error && (
          <p className="text-center text-danger text-sm">{(finish.error as Error).message}</p>
        )}
      </div>
    </AppShell>
  );
}

function MiniPodium({ entries }: { entries: PodiumEntry[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {entries.map((e) => (
        <li key={e.participant.id} className="flex items-center gap-3">
          <span className="w-6 text-center font-semibold text-muted">{e.rank}</span>
          <span className="flex-1 truncate text-fg">{e.participant.alias}</span>
          <span className="font-semibold text-fg tabular-nums">{e.participant.totalScore}</span>
        </li>
      ))}
    </ol>
  );
}
