import type { Modality } from '@bv/shared';
import type { ReactNode, SVGProps } from 'react';

export interface ModalityIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Iconografía de modalidades de torneo (SVG puro, `currentColor`).
 * Glifos simples que evocan el escenario de cada modalidad WA.
 */
function Svg({
  size = 20,
  strokeWidth = 1.8,
  children,
  ...rest
}: ModalityIconProps & { children: ReactNode }) {
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

/** Sala: diana concéntrica de tiro bajo techo. */
export function IndoorIcon(p: ModalityIconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Aire libre: sol sobre el horizonte (campo abierto). */
export function OutdoorIcon(p: ModalityIconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="11" r="4" />
      <path d="M12 2.5V4M12 18v1.5M4.2 11H2.7M21.3 11h-1.5M6.4 5.4 5.3 4.3M18.7 4.3l-1.1 1.1" />
      <path d="M3 20.5h18" />
    </Svg>
  );
}

/** Juegos de campo: terreno con pinos (recorrido en el bosque). */
export function FieldIcon(p: ModalityIconProps) {
  return (
    <Svg {...p}>
      <path d="M8 3 4 10h2.5L3 16h10L9.5 10H12L8 3Z" />
      <path d="M8 16v4" />
      <path d="M16 8l-2.5 4.5H15L13 17h6l-2-4.5h1.5L16 8Z" />
      <path d="M16 17v3" />
    </Svg>
  );
}

/** 3D: silueta de animal (blanco tridimensional). */
export function Target3DIcon(p: ModalityIconProps) {
  return (
    <Svg {...p}>
      <path d="M5 4l2 3M9 4L7 7" />
      <path d="M7 7c-1.5 0-2.5 1.2-2.5 2.7 0 1.3 1 2.3 2.3 2.3" />
      <path d="M7 12v4.5a1.5 1.5 0 0 0 1.5 1.5h.5" />
      <path d="M7 9.5h7.5c2.2 0 3.5 1.4 3.5 3.4V18" />
      <path d="M11 18v-3" />
      <path d="M18 18v-3" />
    </Svg>
  );
}

export const MODALITY_ICONS: Record<Modality, (p: ModalityIconProps) => ReactNode> = {
  sala: IndoorIcon,
  aire_libre: OutdoorIcon,
  campo: FieldIcon,
  '3d': Target3DIcon,
};
