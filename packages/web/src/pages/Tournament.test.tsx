import type { TournamentDetailView, TournamentParticipant, TournamentRound } from '@bv/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { state, finishMutate } = vi.hoisted(() => ({
  state: { tournament: undefined as TournamentDetailView | undefined },
  finishMutate: vi.fn(),
}));

vi.mock('../tournaments/useTournaments', () => ({
  useTournament: () => ({ tournament: state.tournament, isLoading: false, isError: false }),
  useFinishTournament: () => ({ mutate: finishMutate, isPending: false, error: null }),
}));

import { Tournament } from './Tournament';

function participant(id: number, alias: string, totalScore: number): TournamentParticipant {
  return {
    id,
    avatarId: id,
    alias,
    bowCategory: 'recurvo_olimpico',
    color: 'blue',
    experience: 'senior',
    stake: null,
    pairIndex: 0,
    pairPosition: 'A',
    totalScore,
    totalInner: 0,
    totalSecond: 0,
    totalX: 0,
    totalM: 0,
    endsCompleted: 0,
  };
}

function round(seq: number, status: TournamentRound['status']): TournamentRound {
  return { id: seq, seq, arrowsPerEnd: 3, status, completedAt: null };
}

function fixture(over: Partial<TournamentDetailView>): TournamentDetailView {
  const p = participant(1, 'Ana', 30);
  return {
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
    participants: [p],
    rounds: [round(1, 'pendiente'), round(2, 'pendiente')],
    miniPodium: [{ rank: 1, participant: p }],
    ...over,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/tournaments/1']}>
      <Routes>
        <Route path="/tournaments/:id" element={<Tournament />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Tournament (FE-7)', () => {
  it('lista tiradas con enlaces y muestra mini-podio', () => {
    state.tournament = fixture({});
    renderPage();
    expect(screen.getByText('Tirada 1').closest('a')).toHaveAttribute(
      'href',
      '/tournaments/1/rounds/1',
    );
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('deshabilita Podios mientras no haya ninguna tirada completa', () => {
    state.tournament = fixture({ rounds: [round(1, 'pendiente'), round(2, 'en_proceso')] });
    renderPage();
    expect(screen.getByRole('button', { name: 'Ver podios' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Ver podios' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Finalizar torneo' })).toBeNull();
  });

  it('habilita Podios tras la primera tirada completa, pero oculta Finalizar', () => {
    state.tournament = fixture({ rounds: [round(1, 'completa'), round(2, 'pendiente')] });
    renderPage();
    expect(screen.getByRole('link', { name: 'Ver podios' })).toHaveAttribute(
      'href',
      '/tournaments/1/podium',
    );
    expect(screen.queryByRole('button', { name: 'Finalizar torneo' })).toBeNull();
  });

  it('habilita Podios y Finalizar cuando todo está completo', () => {
    state.tournament = fixture({ rounds: [round(1, 'completa'), round(2, 'completa')] });
    renderPage();
    expect(screen.getByRole('link', { name: 'Ver podios' })).toHaveAttribute(
      'href',
      '/tournaments/1/podium',
    );
    expect(screen.getByRole('button', { name: 'Finalizar torneo' })).toBeInTheDocument();
  });
});
