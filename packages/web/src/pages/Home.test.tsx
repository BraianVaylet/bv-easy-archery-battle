import type { TournamentListItem } from '@bv/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Home } from './Home';

const { state } = vi.hoisted(() => ({
  state: { tournaments: [] as TournamentListItem[] },
}));

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, alias: 'brai' }, logout: { mutate: vi.fn() } }),
}));
vi.mock('../avatars/useAvatars', () => ({
  useAvatars: () => ({ avatars: [], isLoading: false, create: { mutate: vi.fn() } }),
}));
vi.mock('../tournaments/useTournaments', () => ({
  useTournaments: () => ({ tournaments: state.tournaments, isLoading: false }),
}));

function makeTournament(over: Partial<TournamentListItem>): TournamentListItem {
  return {
    id: 1,
    name: 'T',
    modality: 'sala',
    roundsCount: 10,
    arrowsPerEnd: 3,
    scoringSet: [],
    stakeMap: null,
    distances: null,
    status: 'en_curso',
    createdAt: 0,
    finishedAt: null,
    participantsCount: 2,
    roundsCompleted: 0,
    ...over,
  };
}

function renderHome() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('Home (FE-5)', () => {
  it('ofrece accesos a crear torneo y avatar', () => {
    state.tournaments = [];
    renderHome();
    expect(screen.getByRole('link', { name: 'Nuevo torneo' })).toHaveAttribute(
      'href',
      '/tournaments/new',
    );
    expect(screen.getByRole('link', { name: 'Nuevo avatar' })).toHaveAttribute(
      'href',
      '/avatars/new',
    );
    expect(screen.getByText('No hay torneos en curso')).toBeInTheDocument();
  });

  it('separa torneos por estado y enlaza al detalle', () => {
    state.tournaments = [
      makeTournament({ id: 1, name: 'Activo', status: 'en_curso' }),
      makeTournament({ id: 2, name: 'Cerrado', status: 'finalizado' }),
    ];
    renderHome();
    expect(screen.getByRole('heading', { name: 'En curso' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Finalizados' })).toBeInTheDocument();
    expect(screen.getByText('Activo').closest('a')).toHaveAttribute('href', '/tournaments/1');
    expect(screen.getByText('Cerrado').closest('a')).toHaveAttribute('href', '/tournaments/2');
  });
});
