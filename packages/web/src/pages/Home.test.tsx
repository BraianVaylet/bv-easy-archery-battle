import type { Avatar } from '@bv/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Home } from './Home';

const { avatarsState } = vi.hoisted(() => ({ avatarsState: { current: [] as Avatar[] } }));

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, alias: 'brai' }, logout: { mutate: vi.fn() } }),
}));
vi.mock('../avatars/useAvatars', () => ({
  useAvatars: () => ({
    avatars: avatarsState.current,
    isLoading: false,
    create: { mutate: vi.fn() },
  }),
}));

function renderHome() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('Home', () => {
  it('muestra estado vacío con acceso a crear avatar', () => {
    avatarsState.current = [];
    renderHome();
    expect(screen.getByText('Todavía no tenés avatares')).toBeInTheDocument();
  });

  it('lista los avatares del usuario', () => {
    avatarsState.current = [
      {
        id: 1,
        alias: 'Robin',
        bowCategory: 'recurvo_olimpico',
        color: 'blue',
        experience: 'senior',
        createdAt: 0,
        updatedAt: 0,
      },
    ];
    renderHome();
    expect(screen.getByText('Robin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+ Avatar' })).toHaveAttribute('href', '/avatars/new');
  });
});
