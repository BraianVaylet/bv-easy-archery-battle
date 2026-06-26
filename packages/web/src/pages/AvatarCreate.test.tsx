import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AvatarCreate } from './AvatarCreate';

const { createMutate } = vi.hoisted(() => ({ createMutate: vi.fn() }));

vi.mock('../avatars/useAvatars', () => ({
  useAvatars: () => ({
    avatars: [],
    isLoading: false,
    create: { mutate: createMutate, isPending: false, error: null },
    update: { mutate: vi.fn(), isPending: false, error: null },
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AvatarCreate />
    </MemoryRouter>,
  );
}

describe('AvatarCreate', () => {
  it('valida campos requeridos y no muta si falta el alias/arco/color', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Crear avatar' }));
    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByText('Ingresá un alias.')).toBeInTheDocument();
  });

  it('crea el avatar con beginner→escuela cuando los datos son válidos', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'Brai' } });
    fireEvent.click(screen.getByRole('button', { name: 'Recurvo olímpico' }));
    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Crear avatar' }));

    expect(createMutate).toHaveBeenCalledWith(
      { alias: 'Brai', bowCategory: 'recurvo_olimpico', color: 'blue', beginner: true },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
