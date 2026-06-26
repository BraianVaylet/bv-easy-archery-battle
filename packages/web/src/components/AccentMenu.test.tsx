import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AccentMenu } from './AccentMenu';

function renderMenu() {
  return render(
    <ThemeProvider>
      <AccentMenu />
    </ThemeProvider>,
  );
}

describe('AccentMenu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('abre el popover y cambia el acento desde el header', () => {
    renderMenu();
    // Cerrado: las opciones no están montadas.
    expect(screen.queryByRole('button', { name: 'Acento Azul' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Color de acento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Acento Azul' }));

    expect(localStorage.getItem('bv-accent')).toBe('#0091FF');
    expect(document.documentElement.style.getPropertyValue('--primary')).not.toBe('');
    // Se cierra tras elegir.
    expect(screen.queryByRole('button', { name: 'Acento Azul' })).toBeNull();
  });
});
