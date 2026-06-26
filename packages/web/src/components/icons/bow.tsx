import type { BowCategory } from '@bv/shared';
import type { ReactNode, SVGProps } from 'react';

export interface BowIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Iconografía de categorías de arco (SVG puro, `currentColor`). Pensada para
 * verse en blanco sobre el color del avatar. Glifos simples y distinguibles.
 */
function Svg({
  size = 24,
  strokeWidth = 1.8,
  children,
  ...rest
}: BowIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Compuesto: limbo vertical con levas (poleas) arriba y abajo + cable. */
export function CompoundIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <circle cx="7" cy="5" r="2.4" />
      <circle cx="7" cy="19" r="2.4" />
      <path d="M7 5V19" />
      <path d="M9.2 5C15.5 8 15.5 16 9.2 19" />
    </Svg>
  );
}

/** Cazador: anillo de mira con 3 pines. */
export function HunterIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M4.5 9H12M4.5 12H12M4.5 15H12" />
      <circle cx="13" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13" cy="15" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Raso (barebow): una flecha. */
export function ArrowIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <path d="M5 19 19 5" />
      <path d="M14 5h5v5" />
      <path d="M5 15v4h4" />
    </Svg>
  );
}

/** Recurvo olímpico: aros olímpicos (3 arriba, 2 abajo). */
export function OlympicIcon(p: BowIconProps) {
  return (
    <Svg strokeWidth={1.4} {...p}>
      <circle cx="7" cy="10" r="2.9" />
      <circle cx="12" cy="10" r="2.9" />
      <circle cx="17" cy="10" r="2.9" />
      <circle cx="9.5" cy="14" r="2.9" />
      <circle cx="14.5" cy="14" r="2.9" />
    </Svg>
  );
}

/** Recurvo tradicional: arco con puntas recurvadas + cuerda. */
export function RecurveIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <path d="M8 3C15 7 15 17 8 21" />
      <path d="M8 3C6 4.5 6.2 5.5 9 6" />
      <path d="M8 21C6 19.5 6.2 18.5 9 18" />
      <path d="M8 3V21" />
    </Svg>
  );
}

/** Longbow: arco largo en D + cuerda recta. */
export function LongbowIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <path d="M9 2C17 8 17 16 9 22" />
      <path d="M9 2V22" />
    </Svg>
  );
}

export const BOW_ICONS: Record<BowCategory, (p: BowIconProps) => ReactNode> = {
  compuesto: CompoundIcon,
  cazador: HunterIcon,
  raso: ArrowIcon,
  recurvo_olimpico: OlympicIcon,
  recurvo_tradicional: RecurveIcon,
  longbow: LongbowIcon,
};
