import { MODALITY_LABELS, type TournamentListItem } from '@bv/shared';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

export function TournamentCard({ tournament: t }: { tournament: TournamentListItem }) {
  const finished = t.status === 'finalizado';
  return (
    <Link
      to={`/tournaments/${t.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-medium text-fg">{t.name}</p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 font-medium text-xs',
            finished ? 'bg-surface-2 text-muted' : 'bg-primary-soft text-primary',
          )}
        >
          {finished ? 'Finalizado' : 'En curso'}
        </span>
      </div>
      <p className="mt-1 text-muted text-xs">
        {MODALITY_LABELS[t.modality]} · {t.participantsCount} arqueros · {t.roundsCompleted}/
        {t.roundsCount} tiradas
      </p>
    </Link>
  );
}
