import { MODALITY_LABELS, type TournamentListItem } from '@bv/shared';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { formatDate } from '../lib/date';
import { MODALITY_ICONS } from './icons/modality';

export function TournamentCard({ tournament: t }: { tournament: TournamentListItem }) {
  const finished = t.status === 'finalizado';
  const ModalityIcon = MODALITY_ICONS[t.modality];
  return (
    <Link
      to={`/tournaments/${t.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 font-medium text-fg">
          <ModalityIcon size={18} className="shrink-0 text-muted" />
          <span className="truncate">{t.name}</span>
        </p>
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
      <p className="mt-0.5 text-muted text-xs">Creado el {formatDate(t.createdAt)}</p>
    </Link>
  );
}
