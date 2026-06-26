import { type Avatar, BOW_CATEGORY_LABELS } from '@bv/shared';
import { AvatarBadge } from './AvatarBadge';

/** Chip de avatar: imagen (icono de categoría + color) + alias + categoría. */
export function AvatarChip({ avatar }: { avatar: Avatar }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <AvatarBadge bowCategory={avatar.bowCategory} color={avatar.color} size={40} />
      <div className="min-w-0">
        <p className="truncate font-medium text-fg">{avatar.alias}</p>
        <p className="text-muted text-xs">
          {BOW_CATEGORY_LABELS[avatar.bowCategory]}
          {avatar.experience === 'escuela' && ' · Escuela'}
        </p>
      </div>
    </div>
  );
}
