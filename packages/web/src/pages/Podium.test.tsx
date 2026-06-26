import type { TournamentParticipant, TournamentPodium } from '@bv/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: { podium: undefined as TournamentPodium | undefined },
}));

vi.mock('../tournaments/useTournaments', () => ({
  usePodium: () => ({ podium: state.podium, isLoading: false, isError: false }),
  useTournament: () => ({
    tournament: { name: 'Copa Otoño' },
    isLoading: false,
    isError: false,
  }),
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

describe('Podium — exportar/compartir (P2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('Imprimir invoca window.print', () => {
    state.podium = {
      general: [{ rank: 1, participant: p(1, 'Ana', 30) }],
      byCategory: [],
      escuela: [],
    };
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
    expect(printSpy).toHaveBeenCalledOnce();
  });

  it('Compartir copia al portapapeles cuando no hay Web Share', async () => {
    state.podium = {
      general: [
        { rank: 1, participant: p(1, 'Ana', 30) },
        { rank: 2, participant: p(2, 'Beto', 24) },
      ],
      byCategory: [],
      escuela: [],
    };
    const writeText = vi.fn().mockResolvedValue(undefined);
    // Sin Web Share (undefined en jsdom) → cae al portapapeles.
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const text = String(writeText.mock.calls[0]?.[0] ?? '');
    expect(text).toContain('Ana');
    expect(text).toContain('Beto');
    expect(await screen.findByRole('status')).toHaveTextContent('copiado');
  });
});
