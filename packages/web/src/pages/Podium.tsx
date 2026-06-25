import { BOW_CATEGORY_LABELS } from '@bv/shared';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PodiumList } from '../components/PodiumList';
import { Card, Spinner } from '../components/ui';
import { usePodium } from '../tournaments/useTournaments';

export function Podium() {
  const { id } = useParams();
  const tid = Number(id);
  const { podium, isLoading, isError } = usePodium(tid);

  if (isLoading) {
    return (
      <AppShell title="Podios" showBack>
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </AppShell>
    );
  }
  if (isError || !podium) {
    return (
      <AppShell title="Podios" showBack>
        <p className="text-muted">No se pudieron cargar los podios.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Podios" showBack>
      <div className="flex flex-col gap-5">
        <Card>
          <h2 className="mb-3 font-semibold text-fg">General</h2>
          <PodiumList entries={podium.general} />
        </Card>

        {podium.byCategory.map((cat) => (
          <Card key={cat.category}>
            <h2 className="mb-3 font-semibold text-fg">{BOW_CATEGORY_LABELS[cat.category]}</h2>
            <PodiumList entries={cat.entries} />
          </Card>
        ))}

        {podium.escuela.length > 0 && (
          <Card>
            <h2 className="mb-3 font-semibold text-fg">Escuela</h2>
            <PodiumList entries={podium.escuela} />
          </Card>
        )}
      </div>
    </AppShell>
  );
}
