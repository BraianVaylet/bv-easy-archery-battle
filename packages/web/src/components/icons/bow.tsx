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

/** Compuesto: mira de scope con un solo pin vertical. */
export function CompoundIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 4.5V12" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
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

/** Raso (barebow): flecha con vanes (emplumado). */
export function ArrowIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.5V20.5" />
      <path d="M8.5 7 12 3.5 15.5 7" />
      <path d="M12 14.5 8.5 20.5" />
      <path d="M12 14.5 15.5 20.5" />
    </Svg>
  );
}

/** Recurvo olímpico: estabilizador de 3 barras (varilla larga + V-bar). */
export function OlympicIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <circle cx="8.5" cy="12" r="2.2" />
      <path d="M10.7 12H21" />
      <path d="M7 10.3 3.5 6.8" />
      <path d="M7 13.7 3.5 17.2" />
    </Svg>
  );
}

/** Recurvo tradicional: arco con palas marcadamente recurvadas + cuerda. */
export function RecurveIcon(p: BowIconProps) {
  return (
    <Svg {...p}>
      <path d="M9 3C16 7 16 17 9 21" />
      <path d="M9 3C4 3.5 4.5 7 9.5 7" />
      <path d="M9 21C4 20.5 4.5 17 9.5 17" />
      <path d="M9 3V21" />
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
