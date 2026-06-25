import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Register } from './Register';

const { registerMutate } = vi.hoisted(() => ({ registerMutate: vi.fn() }));

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: { mutate: vi.fn(), isPending: false, error: null },
    register: { mutate: registerMutate, isPending: false, error: null },
    logout: { mutate: vi.fn() },
  }),
}));

describe('Register', () => {
  it('envía todos los campos (securityQuestionId numérico)', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'brai' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'archery123' } });
    fireEvent.change(screen.getByLabelText('Pregunta de seguridad'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Respuesta'), { target: { value: 'Firulais' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(registerMutate).toHaveBeenCalledWith(
      { alias: 'brai', password: 'archery123', securityQuestionId: 3, securityAnswer: 'Firulais' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
