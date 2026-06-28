import type { Avatar } from '@bv/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TournamentCreate } from './TournamentCreate';

const { createMutate } = vi.hoisted(() => ({ createMutate: vi.fn() }));

const avatar: Avatar = {
  id: 5,
  alias: 'Robin',
  bowCategory: 'recurvo_olimpico',
  color: 'blue',
  experience: 'senior',
  createdAt: 0,
  updatedAt: 0,
};

vi.mock('../tournaments/useTournaments', () => ({
  useCreateTournament: () => ({ mutate: createMutate, isPending: false, error: null }),
}));
vi.mock('../avatars/useAvatars', () => ({
  useAvatars: () => ({
    avatars: [avatar],
    isLoading: false,
    create: { mutate: vi.fn(), isPending: false, error: null },
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <TournamentCreate />
    </MemoryRouter>,
  );
}

describe('TournamentCreate (FE-6)', () => {
  it('la modalidad fija las flechas y las tiradas por defecto (WA)', () => {
    renderPage();
    const arrows = screen.getByLabelText('Flechas por tirada');
    const rounds = screen.getByLabelText('Tiradas');
    expect(arrows).toHaveValue(3); // sala
    expect(rounds).toHaveValue(20);
    fireEvent.click(screen.getByRole('button', { name: 'Aire libre' }));
    expect(arrows).toHaveValue(6);
    expect(rounds).toHaveValue(12);
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    expect(arrows).toHaveValue(2);
    expect(rounds).toHaveValue(24);
    fireEvent.click(screen.getByRole('button', { name: 'Juegos de campo' }));
    expect(arrows).toHaveValue(3);
    expect(rounds).toHaveValue(24);
  });

  it('valida nombre y participantes', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Crear torneo' }));
    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByText('Ingresá un nombre.')).toBeInTheDocument();
    expect(screen.getByText('Agregá al menos un participante.')).toBeInTheDocument();
  });

  it('crea el torneo con los defaults correctos', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Nombre del torneo'), { target: { value: 'Copa' } });
    fireEvent.click(screen.getByText('Robin'));
    fireEvent.click(screen.getByRole('button', { name: 'Crear torneo' }));

    expect(createMutate).toHaveBeenCalledWith(
      { name: 'Copa', modality: 'sala', roundsCount: 20, arrowsPerEnd: 3, avatarIds: [5] },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
