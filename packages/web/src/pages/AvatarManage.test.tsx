import type { Avatar } from '@bv/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { state, archiveMutate, unarchiveMutate } = vi.hoisted(() => ({
  state: { avatars: [] as Avatar[], archived: [] as Avatar[] },
  archiveMutate: vi.fn(),
  unarchiveMutate: vi.fn(),
}));

vi.mock('../avatars/useAvatars', () => ({
  useAvatars: () => ({
    avatars: state.avatars,
    isLoading: false,
    archive: { mutate: archiveMutate, isPending: false, variables: undefined },
    unarchive: { mutate: unarchiveMutate, isPending: false, variables: undefined },
  }),
  useArchivedAvatars: () => ({ archived: state.archived, isLoading: false }),
}));

import { AvatarManage } from './AvatarManage';

function avatar(id: number, alias: string): Avatar {
  return {
    id,
    alias,
    bowCategory: 'compuesto',
    color: 'blue',
    experience: 'senior',
    createdAt: 0,
    updatedAt: 0,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AvatarManage />
    </MemoryRouter>,
  );
}

describe('AvatarManage (P2)', () => {
  it('archiva un avatar activo', () => {
    state.avatars = [avatar(1, 'Ana')];
    state.archived = [];
    renderPage();

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/avatars/1/edit');
    fireEvent.click(screen.getByRole('button', { name: 'Archivar' }));
    expect(archiveMutate).toHaveBeenCalledWith(1);
  });

  it('restaura un avatar archivado', () => {
    state.avatars = [];
    state.archived = [avatar(2, 'Beto')];
    renderPage();

    expect(screen.getByText('Beto')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(unarchiveMutate).toHaveBeenCalledWith(2);
  });
});
