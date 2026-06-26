import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AvatarBadge } from './AvatarBadge';

describe('AvatarBadge', () => {
  it('pinta el icono de la categoría sobre un círculo del color', () => {
    const { container } = render(<AvatarBadge bowCategory="compuesto" color="red" size={40} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.querySelector('svg')).toBeTruthy();
    expect(badge.style.backgroundColor).toBeTruthy();
    expect(badge.style.borderRadius).toBe('9999px');
  });

  it('usa un icono distinto por categoría', () => {
    const a = render(<AvatarBadge bowCategory="recurvo_olimpico" color="blue" />);
    const b = render(<AvatarBadge bowCategory="longbow" color="blue" />);
    // Olímpico dibuja 5 aros; longbow no.
    const aCircles = a.container.querySelectorAll('circle').length;
    const bCircles = b.container.querySelectorAll('circle').length;
    expect(aCircles).not.toBe(bCircles);
  });
});
