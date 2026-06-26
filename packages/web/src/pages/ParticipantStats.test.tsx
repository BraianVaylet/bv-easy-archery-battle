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
      worstEnd: 18,
      consistency: 4,
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
    // Métricas avanzadas: desvío y peor end.
    expect(screen.getByText('Desvío σ')).toBeInTheDocument();
    expect(screen.getByText('Peor end')).toBeInTheDocument();
  });

  it('muestra comparativas (posición y delta vs promedios) con varios participantes', () => {
    state.stats = {
      endsCompleted: 1,
      arrowsShot: 3,
      totalScore: 50,
      averagePerArrow: 16.67,
      averagePerEnd: 50,
      bestEnd: 50,
      worstEnd: 50,
      consistency: 0,
      xCount: 2,
      mCount: 0,
      innerCount: 2,
      evolution: [{ seq: 1, total: 50, cumulative: 50 }],
      distribution: { X: 2, '10': 1 },
    };
    const mk = (id: number, alias: string, total: number, cat: 'compuesto' | 'raso') => ({
      id,
      avatarId: id,
      alias,
      bowCategory: cat,
      color: 'blue',
      stake: null,
      experience: 'senior' as const,
      pairIndex: 0,
      pairPosition: 'A' as const,
      totalScore: total,
      totalInner: 0,
      totalSecond: 0,
      totalX: 0,
      totalM: 0,
      endsCompleted: 1,
    });
    state.tournament = {
      id: 1,
      name: 'Copa',
      modality: 'sala',
      roundsCount: 1,
      arrowsPerEnd: 3,
      scoringSet: [],
      stakeMap: null,
      distances: null,
      status: 'en_curso',
      createdAt: 0,
      finishedAt: null,
      participants: [mk(1, 'Ana', 50, 'compuesto'), mk(2, 'Beto', 30, 'raso')],
      rounds: [],
      miniPodium: [],
    };
    renderPage();

    expect(screen.getByText('Comparativas')).toBeInTheDocument();
    expect(screen.getByText('#1 de 2')).toBeInTheDocument();
  });
});
