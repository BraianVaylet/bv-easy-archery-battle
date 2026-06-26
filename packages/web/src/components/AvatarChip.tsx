import { type Avatar, BOW_CATEGORY_LABELS } from '@bv/shared';
import type { ReactNode } from 'react';
import { AvatarBadge } from './AvatarBadge';

/** Chip de avatar: imagen (icono de categoría + color) + alias + categoría. */
export function AvatarChip({ avatar, trailing }: { avatar: Avatar; trailing?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <AvatarBadge bowCategory={avatar.bowCategory} color={avatar.color} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fg">{avatar.alias}</p>
        <p className="text-muted text-xs">
          {BOW_CATEGORY_LABELS[avatar.bowCategory]}
          {avatar.experience === 'escuela' && ' · Escuela'}
        </p>
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-1">{trailing}</div>}
    </div>
  );
}
