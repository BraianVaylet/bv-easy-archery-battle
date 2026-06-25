import type { ParticipantStats as PS, TournamentDetailView } from '@bv/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    stats: undefined as PS | undefined,
    tournament: undefined as TournamentDetailView | undefined,
  },
}));

vi.mock('../tournaments/useTournaments', () => ({
  useParticipantStats: () => ({ stats: state.stats, isLoading: false, isError: false }),
  useTournament: () => ({ tournament: state.tournament, isLoading: false, isError: false }),
}));

import { ParticipantStats } from './ParticipantStats';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/tournaments/1/participants/1/stats']}>
      <Routes>
        <Route path="/tournaments/:id/participants/:pid/stats" element={<ParticipantStats />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ParticipantStats (FE-11)', () => {
  it('muestra total, evolución por tirada y distribución', () => {
    state.stats = {
      endsCompleted: 2,
      arrowsShot: 6,
      totalScore: 44,
      averagePerArrow: 7.33,
      averagePerEnd: 22,
      bestEnd: 26,
      xCount: 1,
      mCount: 1,
      innerCount: 1,
      evolution: [
        { seq: 1, total: 26, cumulative: 26 },
        { seq: 2, total: 18, cumulative: 44 },
      ],
      distribution: { X: 1, '10': 1, '9': 1, '8': 1, '7': 1, M: 1 },
    };
    state.tournament = {
      id: 1,
      name: 'Copa',
      modality: 'sala',
      roundsCount: 2,
      arrowsPerEnd: 3,
      scoringSet: [],
      stakeMap: null,
      distances: null,
      status: 'en_curso',
      createdAt: 0,
      finishedAt: null,
      participants: [
        {
          id: 1,
          avatarId: 1,
          alias: 'Ana',
          bowCategory: 'compuesto',
          color: 'blue',
          stake: null,
          experience: 'senior',
          pairIndex: 0,
          pairPosition: 'A',
          totalScore: 44,
          totalInner: 1,
          totalSecond: 1,
          totalX: 1,
          totalM: 1,
          endsCompleted: 2,
        },
      ],
      rounds: [],
      miniPodium: [],
    };
    renderPage();

    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.getByText('44')).toBeInTheDocument();
    expect(screen.getByText('Evolución por tirada')).toBeInTheDocument();
    expect(screen.getByText('Tirada 1')).toBeInTheDocument();
    expect(screen.getByText('Distribución por anillo')).toBeInTheDocument();
  });
});
