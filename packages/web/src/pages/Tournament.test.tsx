import type {
  Avatar,
  TournamentDetailView,
  TournamentParticipant,
  TournamentRound,
} from '@bv/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { state, finishMutate, addMutate, deleteMutate } = vi.hoisted(() => ({
  state: {
    tournament: undefined as TournamentDetailView | undefined,
    avatars: [] as Avatar[],
  },
  finishMutate: vi.fn(),
  addMutate: vi.fn(),
  deleteMutate: vi.fn(),
}));

const noopMut = { mutate: vi.fn(), isPending: false, error: null };
vi.mock('../tournaments/useTournaments', () => ({
  useTournament: () => ({ tournament: state.tournament, isLoading: false, isError: false }),
  useFinishTournament: () => ({ mutate: finishMutate, isPending: false, error: null }),
  useAddRound: () => noopMut,
  useDeleteRound: () => ({ mutate: deleteMutate, isPending: false, error: null }),
  useUpdateTournament: () => noopMut,
  useAddParticipants: () => ({ mutate: addMutate, isPending: false, error: null }),
}));
vi.mock('../avatars/useAvatars', () => ({
  useAvatars: () => ({ avatars: state.avatars, isLoading: false }),
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
    state.avatars = [];
    state.tournament = fixture({ rounds: [round(1, 'completa'), round(2, 'completa')] });
    renderPage();
    expect(screen.getByRole('link', { name: 'Ver podios' })).toHaveAttribute(
      'href',
      '/tournaments/1/podium',
    );
    expect(screen.getByRole('button', { name: 'Finalizar torneo' })).toBeInTheDocument();
  });

  it('eliminar tirada está oculto hasta entrar en modo edición (lápiz)', () => {
    state.avatars = [];
    state.tournament = fixture({ rounds: [round(1, 'pendiente'), round(2, 'pendiente')] });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();

    // Oculto por defecto.
    expect(screen.queryByRole('button', { name: 'Eliminar tirada 2' })).toBeNull();
    // Aparece al activar edición.
    fireEvent.click(screen.getByRole('button', { name: 'Editar torneo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar tirada 2' }));
    expect(deleteMutate).toHaveBeenCalledWith(2);
    confirmSpy.mockRestore();
  });

  it('no muestra eliminar con una sola tirada, aun en edición', () => {
    state.avatars = [];
    state.tournament = fixture({ rounds: [round(1, 'pendiente')] });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Editar torneo' }));
    expect(screen.queryByRole('button', { name: 'Eliminar tirada 1' })).toBeNull();
  });

  it('agrega participantes disponibles a un torneo en curso', () => {
    state.avatars = [
      {
        id: 9,
        alias: 'Nuevo',
        bowCategory: 'compuesto',
        color: 'red',
        experience: 'senior',
        createdAt: 0,
        updatedAt: 0,
      },
    ];
    state.tournament = fixture({});
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Agregar participantes/ }));
    fireEvent.click(screen.getByRole('button', { name: /Nuevo/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar (1)' }));
    expect(addMutate).toHaveBeenCalledWith(
      [9],
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
