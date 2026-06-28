import { BOW_CATEGORY_LABELS, type PodiumEntry, type TournamentPodium } from '@bv/shared';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PodiumList } from '../components/PodiumList';
import { Button, Card, Spinner } from '../components/ui';
import { shareOrCopy } from '../lib/share';
import { usePodium, useTournament } from '../tournaments/useTournaments';

interface Board {
  key: string;
  title: string;
  entries: PodiumEntry[];
}

/** Arma los podios disponibles (general + categorías con gente + escuela). */
function buildBoards(podium: TournamentPodium): Board[] {
  const boards: Board[] = [{ key: 'general', title: 'General', entries: podium.general }];
  for (const cat of podium.byCategory) {
    boards.push({
      key: cat.category,
      title: BOW_CATEGORY_LABELS[cat.category],
      entries: cat.entries,
    });
  }
  if (podium.escuela.length > 0) {
    boards.push({ key: 'escuela', title: 'Escuela', entries: podium.escuela });
  }
  return boards;
}

/** Texto plano del podio para compartir/copiar (top 3 de cada board). */
function buildShareText(name: string, boards: Board[]): string {
  const top = (entries: PodiumEntry[]) =>
    entries
      .filter((e) => e.rank <= 3)
      .map((e) => `${e.rank}. ${e.participant.alias} (${e.participant.totalScore})`)
      .join('\n');
  return [`🏆 ${name} — Podio`, ...boards.map((b) => `${b.title}\n${top(b.entries)}`)].join('\n\n');
}

/** Un podio: top 3 con opción de ver el listado completo. */
function PodiumBoard({ entries }: { entries: PodiumEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? entries : entries.slice(0, 3);
  return (
    <div className="flex flex-col gap-3">
      {/* Pantalla: top 3 expandible. */}
      <div className="no-print">
        <PodiumList entries={shown} />
      </div>
      {/* Impresión: listado completo. */}
      <div className="hidden print:block">
        <PodiumList entries={entries} />
      </div>
      {entries.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="no-print"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Ver menos' : `Ver todos (${entries.length})`}
        </Button>
      )}
    </div>
  );
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
  const boards = buildBoards(podium);

  const onPrint = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
  };
  const onShare = async () => {
    const result = await shareOrCopy({
      title: `${name} — Podio`,
      text: buildShareText(name, boards),
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

      {/* Podios apilados (uno debajo del otro) */}
      <section className="flex flex-col gap-4 print-area" aria-label="Podios">
        <h1 className="hidden font-semibold text-fg text-lg print:block">{name} — Podio</h1>
        {boards.map((b) => (
          <Card key={b.key} className="break-avoid">
            <h2 className="mb-3 font-semibold text-fg">{b.title}</h2>
            <PodiumBoard entries={b.entries} />
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
