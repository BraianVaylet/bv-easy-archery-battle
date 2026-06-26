import { BOW_CATEGORY_LABELS, participantComparison } from '@bv/shared';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EvolutionChart } from '../components/EvolutionChart';
import { StatTile } from '../components/StatTile';
import { Card, Spinner } from '../components/ui';
import { useParticipantStats, useTournament } from '../tournaments/useTournaments';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Delta del participante vs un promedio (verde si supera, atenuado si no). */
function Delta({ value, avg }: { value: number; avg: number }) {
  const d = round2(value - avg);
  const sign = d > 0 ? '+' : '';
  return (
    <span className={d >= 0 ? 'text-ok tabular-nums' : 'text-muted tabular-nums'}>
      {sign}
      {d}
    </span>
  );
}

export function ParticipantStats() {
  const { id, pid } = useParams();
  const tid = Number(id);
  const participantId = Number(pid);
  const { stats, isLoading, isError } = useParticipantStats(tid, participantId);
  const { tournament } = useTournament(tid);
  const me = tournament?.participants.find((p) => p.id === participantId);
  const alias = me?.alias;

  const comparison = tournament
    ? participantComparison(
        participantId,
        tournament.participants.map((p) => ({
          id: p.id,
          totalScore: p.totalScore,
          bowCategory: p.bowCategory,
        })),
      )
    : null;

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

  const maxRing = Math.max(1, ...Object.values(stats.distribution));

  return (
    <AppShell title={alias ?? 'Estadísticas'} showBack>
      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatTile label="Total" value={stats.totalScore} />
        <StatTile label="Prom/flecha" value={round2(stats.averagePerArrow)} />
        <StatTile label="Prom/tirada" value={round2(stats.averagePerEnd)} />
        <StatTile label="Mejor end" value={stats.bestEnd ?? '—'} />
        <StatTile label="Peor end" value={stats.worstEnd ?? '—'} />
        <StatTile label="Desvío σ" value={round2(stats.consistency)} />
        <StatTile label="X" value={stats.xCount} />
        <StatTile label="M" value={stats.mCount} />
      </div>

      {comparison && comparison.totalParticipants > 1 && me && (
        <section className="mb-5">
          <h2 className="mb-2 font-semibold text-fg">Comparativas</h2>
          <Card>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted">Posición general</span>
                <span className="font-medium text-fg tabular-nums">
                  #{comparison.rankGeneral} de {comparison.totalParticipants}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">
                  vs. promedio general ({round2(comparison.generalAvg)})
                </span>
                <Delta value={me.totalScore} avg={comparison.generalAvg} />
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Posición {BOW_CATEGORY_LABELS[me.bowCategory]}</span>
                <span className="font-medium text-fg tabular-nums">
                  #{comparison.rankCategory} de {comparison.categoryParticipants}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">
                  vs. promedio categoría ({round2(comparison.categoryAvg)})
                </span>
                <Delta value={me.totalScore} avg={comparison.categoryAvg} />
              </li>
            </ul>
          </Card>
        </section>
      )}

      {stats.evolution.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 font-semibold text-fg">Evolución por tirada</h2>
          <Card className="flex flex-col gap-4">
            <EvolutionChart points={stats.evolution.map((e) => ({ seq: e.seq, total: e.total }))} />
            <ol className="flex flex-col gap-1.5">
              {stats.evolution.map((e) => (
                <li key={e.seq} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-muted">Tirada {e.seq}</span>
                  <span className="flex-1 font-medium text-fg tabular-nums">{e.total}</span>
                  <span className="text-muted tabular-nums">acum. {e.cumulative}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-fg">Distribución por anillo</h2>
        <Card>
          <ul className="flex flex-col gap-1.5">
            {Object.entries(stats.distribution).map(([token, count]) => (
              <li key={token} className="flex items-center gap-2 text-sm">
                <span className="w-6 font-medium text-fg">{token}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(count / maxRing) * 100}%` }}
                  />
                </span>
                <span className="w-6 text-right text-muted tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </AppShell>
  );
}
