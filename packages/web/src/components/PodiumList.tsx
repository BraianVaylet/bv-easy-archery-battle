import type { PodiumEntry } from '@bv/shared';
import { cn } from '../lib/cn';

const MEDAL: Record<number, string> = {
  1: 'bg-[#FFB224] text-[#10100f]',
  2: 'bg-[#C8CCD4] text-[#10100f]',
  3: 'bg-[#AD7F58] text-white',
};

/** Listado rankeado con los primeros 3 puestos resaltados. */
export function PodiumList({ entries }: { entries: PodiumEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted text-sm">Sin participantes.</p>;
  }
  return (
    <ol className="flex flex-col gap-1.5">
      {entries.map((e) => {
        const top = e.rank <= 3;
        return (
          <li
            key={e.participant.id}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2',
              top ? 'border border-border bg-surface' : 'px-3',
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-semibold text-sm',
                top ? MEDAL[e.rank] : 'bg-surface-2 text-muted',
              )}
            >
              {e.rank}
            </span>
            <span className="flex-1 truncate text-fg">{e.participant.alias}</span>
            <span className="font-semibold text-fg tabular-nums">{e.participant.totalScore}</span>
          </li>
        );
      })}
    </ol>
  );
}
