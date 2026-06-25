import { BOW_CATEGORY_LABELS } from '@bv/shared';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { StatTile } from '../components/StatTile';
import { Card, Spinner } from '../components/ui';
import { useTournament, useTournamentStats } from '../tournaments/useTournaments';

const round1 = (n: number) => Math.round(n * 10) / 10;

export function TournamentStats() {
  const { id } = useParams();
  const tid = Number(id);
  const { stats, isLoading, isError } = useTournamentStats(tid);
  const { tournament } = useTournament(tid);

  if (isLoading) {
    return (
      <AppShell title="Estadísticas" showBack>
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </AppShell>
    );
  }
  if (isError || !stats) {
    return (
      <AppShell title="Estadísticas" showBack>
        <p className="text-muted">No se pudieron cargar las estadísticas.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Estadísticas" showBack>
      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatTile label="Arqueros" value={stats.participants} />
        <StatTile label="Promedio" value={round1(stats.averageScore)} />
        <StatTile label="Mejor" value={stats.bestScore ?? '—'} />
        <StatTile label="Total X" value={stats.totalX} />
        <StatTile label="Total M" value={stats.totalM} />
      </div>

      {stats.byCategory.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 font-semibold text-fg">Por categoría</h2>
          <div className="flex flex-col gap-2">
            {stats.byCategory.map((c) => (
              <Card key={c.category} className="flex items-center justify-between p-3">
                <span className="text-fg text-sm">{BOW_CATEGORY_LABELS[c.category]}</span>
                <span className="text-muted text-xs">
                  prom {round1(c.averageScore)} · mejor {c.bestScore} · {c.participants}
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {tournament && tournament.participants.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-fg">Por arquero</h2>
          <div className="flex flex-col gap-2">
            {tournament.participants.map((p) => (
              <Link
                key={p.id}
                to={`/tournaments/${tid}/participants/${p.id}/stats`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
              >
                <span className="truncate text-fg">{p.alias}</span>
                <span className="text-muted text-sm">{p.totalScore} pts ›</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
