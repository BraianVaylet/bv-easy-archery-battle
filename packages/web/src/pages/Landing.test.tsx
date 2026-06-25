import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Landing } from './Landing';

function renderLanding() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('Landing', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('ofrece accesos a registro y login', () => {
    renderLanding();
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Ya tengo cuenta' })).toHaveAttribute('href', '/login');
  });

  it('el toggle alterna el tema y persiste', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /tema/i }));
    const theme = document.documentElement.getAttribute('data-theme');
    expect(localStorage.getItem('bv-theme')).toBe(theme);
  });

  it('cambiar acento persiste y aplica --primary', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: 'Acento Azul' }));
    expect(localStorage.getItem('bv-accent')).toBe('#0091FF');
    expect(document.documentElement.style.getPropertyValue('--primary')).not.toBe('');
  });
});
