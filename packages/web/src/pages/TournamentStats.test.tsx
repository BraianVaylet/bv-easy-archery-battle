import type {
  TournamentStats as TS,
  TournamentDetailView,
  TournamentParticipant,
} from '@bv/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    stats: undefined as TS | undefined,
    tournament: undefined as TournamentDetailView | undefined,
  },
}));

vi.mock('../tournaments/useTournaments', () => ({
  useTournamentStats: () => ({ stats: state.stats, isLoading: false, isError: false }),
  useTournament: () => ({ tournament: state.tournament, isLoading: false, isError: false }),
}));

import { TournamentStats } from './TournamentStats';

function participant(id: number, alias: string, total: number): TournamentParticipant {
  return {
    id,
    avatarId: id,
    alias,
    bowCategory: 'compuesto',
    color: 'blue',
    stake: null,
    experience: 'senior',
    pairIndex: 0,
    pairPosition: 'A',
    totalScore: total,
    totalInner: 0,
    totalSecond: 0,
    totalX: 0,
    totalM: 0,
    endsCompleted: 0,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/tournaments/1/stats']}>
      <Routes>
        <Route path="/tournaments/:id/stats" element={<TournamentStats />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TournamentStats (FE-10)', () => {
  it('muestra métricas agregadas, categorías y enlaces por arquero', () => {
    state.stats = {
      participants: 3,
      totalX: 2,
      totalM: 1,
      averageScore: 27.3,
      bestScore: 50,
      byCategory: [{ category: 'compuesto', participants: 2, averageScore: 47, bestScore: 50 }],
    };
    state.tournament = {
      id: 1,
      name: 'Copa',
      modality: 'sala',
      roundsCount: 1,
      arrowsPerEnd: 3,
      scoringSet: [],
      stakeMap: null,
      distances: null,
      status: 'finalizado',
      createdAt: 0,
      finishedAt: 1,
      participants: [participant(1, 'Ana', 50)],
      rounds: [],
      miniPodium: [],
    };
    renderPage();

    expect(screen.getByText('Arqueros')).toBeInTheDocument();
    expect(screen.getByText('Por categoría')).toBeInTheDocument();
    expect(screen.getByText('Compuesto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ana/ })).toHaveAttribute(
      'href',
      '/tournaments/1/participants/1/stats',
    );
  });
});
