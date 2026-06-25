import { AVATAR_COLORS, type Avatar, BOW_CATEGORY_LABELS } from '@bv/shared';

function colorHex(key: string): string {
  return AVATAR_COLORS.find((c) => c.key === key)?.hex ?? '#7B8497';
}

/** Chip de avatar: color + alias + categoría (y marca de escuela). */
export function AvatarChip({ avatar }: { avatar: Avatar }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <span
        className="h-9 w-9 shrink-0 rounded-full"
        style={{ backgroundColor: colorHex(avatar.color) }}
        aria-hidden
      />
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
