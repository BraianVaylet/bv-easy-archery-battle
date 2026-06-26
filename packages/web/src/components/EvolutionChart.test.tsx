import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvolutionChart } from './EvolutionChart';

describe('EvolutionChart (P2)', () => {
  it('no renderiza nada sin puntos', () => {
    const { container } = render(<EvolutionChart points={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('dibuja un punto y etiqueta por tirada con aria-label descriptivo', () => {
    const points = [
      { seq: 1, total: 26 },
      { seq: 2, total: 18 },
      { seq: 3, total: 24 },
    ];
    render(<EvolutionChart points={points} />);

    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toContain('tirada 1: 26');
    expect(svg.getAttribute('aria-label')).toContain('tirada 3: 24');

    // Un círculo por punto.
    expect(svg.querySelectorAll('circle')).toHaveLength(3);
    // La polilínea une los 3 puntos.
    const poly = svg.querySelector('polyline');
    expect(poly?.getAttribute('points')?.trim().split(' ')).toHaveLength(3);
  });
});
