import { AVATAR_COLORS, type BowCategory } from '@bv/shared';
import { BOW_ICONS } from './icons/bow';

interface AvatarBadgeProps {
  bowCategory: BowCategory;
  color: string;
  /** Diámetro en px. */
  size?: number;
  className?: string;
}

function colorHex(key: string): string {
  return AVATAR_COLORS.find((c) => c.key === key)?.hex ?? '#7B8497';
}

/**
 * Imagen del avatar: icono blanco de la categoría de arco sobre un círculo del
 * color elegido (ej. polea blanca sobre fondo rojo para Compuesto + Rojo).
 */
export function AvatarBadge({ bowCategory, color, size = 36, className }: AvatarBadgeProps) {
  const Icon = BOW_ICONS[bowCategory];
  return (
    <span
      className={className}
      style={{
        backgroundColor: colorHex(color),
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '9999px',
        color: '#ffffff',
        flexShrink: 0,
      }}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.58)} />
    </span>
  );
}
