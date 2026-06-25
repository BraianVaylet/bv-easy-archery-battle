import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { ThemeProvider } from './theme/ThemeProvider';

const { authState } = vi.hoisted(() => ({
  authState: { current: { user: null as null | { id: number; alias: string }, isLoading: false } },
}));

vi.mock('./auth/useAuth', () => ({
  useAuth: () => ({
    ...authState.current,
    login: { mutate: vi.fn(), isPending: false, error: null },
    register: { mutate: vi.fn(), isPending: false, error: null },
    logout: { mutate: vi.fn() },
  }),
}));

vi.mock('./avatars/useAvatars', () => ({
  useAvatars: () => ({ avatars: [], isLoading: false, create: { mutate: vi.fn() } }),
}));

vi.mock('./tournaments/useTournaments', () => ({
  useTournaments: () => ({ tournaments: [], isLoading: false }),
}));

function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('App (routing, FE-3)', () => {
  afterEach(() => {
    authState.current = { user: null, isLoading: false };
  });

  it('sin sesión, "/" redirige a login', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('muestra la pantalla de registro', () => {
    renderAt('/register');
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
  });

  it('con sesión, "/" muestra Home', () => {
    authState.current = { user: { id: 1, alias: 'brai' }, isLoading: false };
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Inicio' })).toBeInTheDocument();
  });
});
