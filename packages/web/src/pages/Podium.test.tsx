import type { TournamentParticipant, TournamentPodium } from '@bv/shared';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

describe('Podium (FE-9) — carousel', () => {
  it('muestra el general por defecto y navega entre podios', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Podio siguiente' }));
    expect(screen.getByRole('heading', { name: 'Compuesto' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Podio siguiente' }));
    expect(screen.getByRole('heading', { name: 'Escuela' })).toBeInTheDocument();
  });

  it('muestra top 3 y expande a todos', () => {
    state.podium = {
      general: [
        { rank: 1, participant: p(1, 'Ana', 40) },
        { rank: 2, participant: p(2, 'Beto', 30) },
        { rank: 3, participant: p(3, 'Cora', 20) },
        { rank: 4, participant: p(4, 'Dani', 10) },
      ],
      byCategory: [],
      escuela: [],
    };
    renderPage();
    const carousel = within(screen.getByRole('region', { name: 'Carrusel de podios' }));

    expect(carousel.queryByText('Dani')).toBeNull(); // 4º oculto en top 3
    fireEvent.click(carousel.getByRole('button', { name: 'Ver todos (4)' }));
    expect(carousel.getByText('Dani')).toBeInTheDocument();
  });

  it('sin escuela no aparece ese podio', () => {
    state.podium = {
      general: [{ rank: 1, participant: p(1, 'Ana', 30) }],
      byCategory: [],
      escuela: [],
    };
    renderPage();
    expect(screen.queryByRole('heading', { name: 'Escuela' })).toBeNull();
  });
});

describe('Podium — exportar/compartir', () => {
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
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const text = String(writeText.mock.calls[0]?.[0] ?? '');
    expect(text).toContain('Ana');
    expect(text).toContain('Beto');
    expect(await screen.findByText(/copiado/)).toBeInTheDocument();
  });
});
