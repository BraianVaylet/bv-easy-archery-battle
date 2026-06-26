import { BOW_CATEGORY_LABELS, type TournamentPodium } from '@bv/shared';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PodiumList } from '../components/PodiumList';
import { Button, Card, Spinner } from '../components/ui';
import { shareOrCopy } from '../lib/share';
import { usePodium, useTournament } from '../tournaments/useTournaments';

/** Texto plano del podio para compartir/copiar (top 3 general + por categoría). */
function buildShareText(name: string, podium: TournamentPodium): string {
  const top = (entries: TournamentPodium['general']) =>
    entries
      .filter((e) => e.rank <= 3)
      .map((e) => `${e.rank}. ${e.participant.alias} (${e.participant.totalScore})`)
      .join('\n');

  const blocks = [`🏆 ${name} — Podio\n\nGeneral\n${top(podium.general)}`];
  for (const cat of podium.byCategory) {
    blocks.push(`${BOW_CATEGORY_LABELS[cat.category]}\n${top(cat.entries)}`);
  }
  if (podium.escuela.length > 0) blocks.push(`Escuela\n${top(podium.escuela)}`);
  return blocks.join('\n\n');
}

export function Podium() {
  const { id } = useParams();
  const tid = Number(id);
  const { podium, isLoading, isError } = usePodium(tid);
  const { tournament } = useTournament(tid);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const name = tournament?.name ?? 'Torneo';

  const onPrint = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
  };

  const onShare = async () => {
    const result = await shareOrCopy({
      title: `${name} — Podio`,
      text: buildShareText(name, podium),
    });
    if (result === 'copied') setFeedback('Podio copiado al portapapeles.');
    else if (result === 'shared') setFeedback('Podio compartido.');
    else if (result === 'unsupported') setFeedback('No se pudo compartir en este dispositivo.');
    else setFeedback(null);
  };

  return (
    <AppShell title="Podios" showBack>
      <div className="mb-4 flex items-center gap-2 no-print">
        <Button variant="secondary" size="sm" onClick={onShare}>
          Compartir
        </Button>
        <Button variant="secondary" size="sm" onClick={onPrint}>
          Imprimir
        </Button>
      </div>
      {feedback && <output className="mb-3 block text-muted text-sm no-print">{feedback}</output>}

      <div className="flex flex-col gap-5 print-area">
        <h1 className="hidden font-semibold text-fg text-lg print:block">{name} — Podio</h1>

        <Card className="break-avoid">
          <h2 className="mb-3 font-semibold text-fg">General</h2>
          <PodiumList entries={podium.general} />
        </Card>

        {podium.byCategory.map((cat) => (
          <Card key={cat.category} className="break-avoid">
            <h2 className="mb-3 font-semibold text-fg">{BOW_CATEGORY_LABELS[cat.category]}</h2>
            <PodiumList entries={cat.entries} />
          </Card>
        ))}

        {podium.escuela.length > 0 && (
          <Card className="break-avoid">
            <h2 className="mb-3 font-semibold text-fg">Escuela</h2>
            <PodiumList entries={podium.escuela} />
          </Card>
        )}
      </div>
    </AppShell>
  );
}
