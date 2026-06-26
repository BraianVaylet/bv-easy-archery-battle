import { STAKE_HEX, STAKE_LABELS, type Stake } from '@bv/shared';
import type { ReactNode } from 'react';

interface PairCardProps {
  pairIndex: number;
  stake: Stake | null;
  /** Categorías de los arqueros del par, en orden (ej. ['Compuesto','Cazador']). */
  categories?: string[];
  children: ReactNode;
}

/** Tarjeta de un par/grupo de tiro; muestra el color de estaca y las categorías. */
export function PairCard({ pairIndex, stake, categories, children }: PairCardProps) {
  const solo = categories && categories.length === 1;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-border border-b bg-surface-2 px-3 py-2">
        {stake && (
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: STAKE_HEX[stake] }}
            aria-hidden
          />
        )}
        <span className="font-medium text-fg text-sm">
          {solo ? `Solo ${pairIndex + 1}` : `Par ${pairIndex + 1}`}
        </span>
        {categories && categories.length > 0 && (
          <span className="text-muted text-xs">- {categories.join(' | ')}</span>
        )}
        {stake && <span className="text-muted text-xs">· Estaca {STAKE_LABELS[stake]}</span>}
      </div>
      <div className="flex flex-col gap-1.5 p-2">{children}</div>
    </div>
  );
}
