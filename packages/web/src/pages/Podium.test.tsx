import type { TournamentParticipant, TournamentPodium } from '@bv/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: { podium: undefined as TournamentPodium | undefined },
}));

vi.mock('../tournaments/useTournaments', () => ({
  usePodium: () => ({ podium: state.podium, isLoading: false, isError: false }),
}));

import { Podium } from './Podium';

function p(id: number, alias: string, total: number): TournamentParticipant {
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
    <MemoryRouter initialEntries={['/tournaments/1/podium']}>
      <Routes>
        <Route path="/tournaments/:id/podium" element={<Podium />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Podium (FE-9)', () => {
  it('renderiza general, categoría y escuela', () => {
    const a = p(1, 'Ana', 30);
    const b = p(2, 'Beto', 24);
    state.podium = {
      general: [
        { rank: 1, participant: a },
        { rank: 2, participant: b },
      ],
      byCategory: [{ category: 'compuesto', entries: [{ rank: 1, participant: a }] }],
      escuela: [{ rank: 1, participant: b }],
    };
    renderPage();

    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Compuesto' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Escuela' })).toBeInTheDocument();
    // En el general aparecen ambos, con sus puntajes.
    expect(screen.getAllByText('Ana').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
  });

  it('oculta escuela cuando no hay principiantes', () => {
    const a = p(1, 'Ana', 30);
    state.podium = {
      general: [{ rank: 1, participant: a }],
      byCategory: [],
      escuela: [],
    };
    renderPage();
    expect(screen.queryByRole('heading', { name: 'Escuela' })).toBeNull();
  });
});
