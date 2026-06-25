import { STAKE_HEX, STAKE_LABELS, type Stake } from '@bv/shared';
import type { ReactNode } from 'react';

interface PairCardProps {
  pairIndex: number;
  stake: Stake | null;
  children: ReactNode;
}

/** Tarjeta de un par/grupo de tiro; muestra el color de estaca si aplica. */
export function PairCard({ pairIndex, stake, children }: PairCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center gap-2 border-border border-b bg-surface-2 px-3 py-2">
        {stake && (
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: STAKE_HEX[stake] }}
            aria-hidden
          />
        )}
        <span className="font-medium text-fg text-sm">Par {pairIndex + 1}</span>
        {stake && <span className="text-muted text-xs">· Estaca {STAKE_LABELS[stake]}</span>}
      </div>
      <div className="flex flex-col gap-1.5 p-2">{children}</div>
    </div>
  );
}
