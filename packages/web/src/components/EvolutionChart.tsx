interface Point {
  seq: number;
  total: number;
}

interface EvolutionChartProps {
  points: Point[];
  /** Tope del eje Y; por defecto el máximo de los datos. */
  maxValue?: number;
}

// Espacio de coordenadas fijo; el SVG escala por viewBox.
const W = 320;
const H = 150;
const PAD = { top: 14, right: 10, bottom: 24, left: 10 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

/**
 * Gráfico de líneas (SVG puro, sin dependencias) de la evolución del puntaje
 * por tirada. Tema-aware (usa tokens de color). Accesible: el SVG es `img` con
 * `aria-label`; el detalle numérico vive en la lista que lo acompaña.
 */
export function EvolutionChart({ points, maxValue }: EvolutionChartProps) {
  if (points.length === 0) return null;

  const n = points.length;
  const max = Math.max(1, maxValue ?? Math.max(...points.map((p) => p.total)));

  const x = (i: number) => (n === 1 ? PAD.left + INNER_W / 2 : PAD.left + (INNER_W * i) / (n - 1));
  const y = (v: number) => PAD.top + INNER_H * (1 - v / max);

  const coords = points.map((p, i) => ({ ...p, cx: x(i), cy: y(p.total) }));
  const linePts = coords.map((c) => `${c.cx},${c.cy}`).join(' ');
  const areaPts = `${PAD.left},${PAD.top + INNER_H} ${linePts} ${PAD.left + INNER_W},${
    PAD.top + INNER_H
  }`;

  const label = `Evolución de puntaje por tirada: ${points
    .map((p) => `tirada ${p.seq}: ${p.total}`)
    .join(', ')}.`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Línea base */}
      <line
        x1={PAD.left}
        y1={PAD.top + INNER_H}
        x2={PAD.left + INNER_W}
        y2={PAD.top + INNER_H}
        className="stroke-border"
        strokeWidth={1}
      />
      {/* Relleno suave bajo la curva */}
      {n > 1 && <polygon points={areaPts} className="fill-primary-soft" />}
      {/* Curva */}
      <polyline
        points={linePts}
        fill="none"
        className="stroke-primary"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Puntos + etiquetas */}
      {coords.map((c) => (
        <g key={c.seq}>
          <circle cx={c.cx} cy={c.cy} r={3.5} className="fill-primary" />
          <title>{`Tirada ${c.seq}: ${c.total}`}</title>
          <text
            x={c.cx}
            y={c.cy - 8}
            textAnchor="middle"
            className="fill-fg text-[9px] tabular-nums"
          >
            {c.total}
          </text>
          <text
            x={c.cx}
            y={H - 7}
            textAnchor="middle"
            className="fill-muted text-[9px] tabular-nums"
          >
            {c.seq}
          </text>
        </g>
      ))}
    </svg>
  );
}
