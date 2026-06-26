import type { TournamentRound } from '@bv/shared';
import { Check } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

interface RoundStepperProps {
  tid: number;
  rounds: TournamentRound[];
  /** seq de la tirada actual. */
  current: number;
}

const STEP: Record<TournamentRound['status'], string> = {
  completa: 'border-primary bg-primary-soft text-primary',
  en_proceso: 'border-amber-500 bg-amber-500/15 text-amber-600',
  pendiente: 'border-border bg-surface text-muted',
};

/** Stepper horizontal con el progreso de tiradas del torneo. */
export function RoundStepper({ tid, rounds, current }: RoundStepperProps) {
  if (rounds.length < 2) return null;

  return (
    <nav aria-label="Progreso del torneo" className="mb-4">
      <p className="mb-1.5 text-muted text-xs">
        Tirada {current} de {rounds.length}
      </p>
      {/* Los conectores son flex-1 → ocupan todo el ancho; con muchas tiradas el
          min-w fuerza el scroll horizontal manteniendo una separación mínima. */}
      <ol className="flex items-center overflow-x-auto px-1 py-2">
        {rounds.map((r, i) => {
          const isCurrent = r.seq === current;
          return (
            <Fragment key={r.id}>
              <li className="shrink-0">
                <Link
                  to={`/tournaments/${tid}/rounds/${r.seq}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Tirada ${r.seq}`}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border font-medium text-sm transition-colors',
                    isCurrent
                      ? 'border-primary bg-primary text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-bg'
                      : STEP[r.status],
                  )}
                >
                  {r.status === 'completa' && !isCurrent ? <Check size={15} aria-hidden /> : r.seq}
                </Link>
              </li>
              {i < rounds.length - 1 && (
                <li
                  aria-hidden
                  className={cn(
                    'h-0.5 min-w-3 flex-1',
                    r.status === 'completa' ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
