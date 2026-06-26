import type { RoundView, TournamentParticipant } from '@bv/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { state, saveMutate } = vi.hoisted(() => ({
  state: { round: undefined as RoundView | undefined },
  saveMutate: vi.fn(),
}));

vi.mock('../tournaments/useRound', () => ({
  useRound: () => ({ round: state.round, isLoading: false, isError: false }),
  useSaveScore: () => ({ mutate: saveMutate, isPending: false, error: null }),
}));
vi.mock('../tournaments/useTournaments', () => ({
  useTournament: () => ({
    tournament: {
      status: 'en_curso',
      rounds: [
        { id: 1, seq: 1, arrowsPerEnd: 3, status: 'pendiente', completedAt: null },
        { id: 2, seq: 2, arrowsPerEnd: 3, status: 'pendiente', completedAt: null },
        { id: 3, seq: 3, arrowsPerEnd: 3, status: 'pendiente', completedAt: null },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useAddRound: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));

import { Round } from './Round';

function participant(id: number, alias: string): TournamentParticipant {
  return {
    id,
    avatarId: id,
    alias,
    bowCategory: 'recurvo_olimpico',
    color: 'blue',
    stake: null,
    experience: 'senior',
    pairIndex: 0,
    pairPosition: 'A',
    totalScore: 0,
    totalInner: 0,
    totalSecond: 0,
    totalX: 0,
    totalM: 0,
    endsCompleted: 0,
  };
}

function roundView(over: Partial<RoundView> = {}): RoundView {
  return {
    tournamentId: 1,
    modality: 'sala',
    seq: 1,
    arrowsPerEnd: 3,
    status: 'pendiente',
    entries: [{ participant: participant(1, 'Ana'), score: null }],
    ...over,
  };
}

function renderPage(seq = 1) {
  return render(
    <MemoryRouter initialEntries={[`/tournaments/1/rounds/${seq}`]}>
      <Routes>
        <Route path="/tournaments/:id/rounds/:seq" element={<Round />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Round + ScoreKeypad (FE-8)', () => {
  beforeEach(() => saveMutate.mockClear());

  it('seleccionar un arquero abre el keypad', () => {
    state.round = roundView();
    renderPage();
    expect(screen.queryByLabelText('Flechas cargadas')).toBeNull();
    fireEvent.click(screen.getByText('Ana'));
    expect(screen.getByLabelText('Flechas cargadas')).toBeInTheDocument();
  });

  it('muestra el stepper de progreso del torneo', () => {
    state.round = roundView();
    renderPage();
    expect(screen.getByRole('navigation', { name: 'Progreso del torneo' })).toBeInTheDocument();
    expect(screen.getByText('Tirada 1 de 3')).toBeInTheDocument();
  });

  it('al completar el end autoguarda con las flechas en orden descendente', () => {
    state.round = roundView();
    renderPage();
    fireEvent.click(screen.getByText('Ana'));
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: 'X' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));

    expect(saveMutate).toHaveBeenCalledTimes(1);
    expect(saveMutate).toHaveBeenCalledWith({ participantId: 1, arrows: ['X', '9', '7'] });
  });

  it('última tirada completa: ofrece "Agregar tirada" en vez de "Siguiente"', () => {
    state.round = roundView({ seq: 3, status: 'completa' });
    renderPage(3);
    expect(screen.getByRole('button', { name: 'Agregar tirada' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente tirada' })).toBeNull();
  });

  it('tirada intermedia completa: ofrece "Siguiente tirada"', () => {
    state.round = roundView({ seq: 1, status: 'completa' });
    renderPage(1);
    expect(screen.getByRole('button', { name: 'Siguiente tirada' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar tirada' })).toBeNull();
  });

  it('no guarda con un end incompleto', () => {
    state.round = roundView();
    renderPage();
    fireEvent.click(screen.getByText('Ana'));
    fireEvent.click(screen.getByRole('button', { name: 'X' }));
    expect(saveMutate).not.toHaveBeenCalled();
  });
});
