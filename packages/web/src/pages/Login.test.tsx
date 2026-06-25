import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Login } from './Login';

const { loginMutate } = vi.hoisted(() => ({ loginMutate: vi.fn() }));

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: { mutate: loginMutate, isPending: false, error: null },
    register: { mutate: vi.fn(), isPending: false, error: null },
    logout: { mutate: vi.fn() },
  }),
}));

describe('Login', () => {
  it('envía alias y password al mutar', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'brai' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'archery123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(loginMutate).toHaveBeenCalledWith(
      { alias: 'brai', password: 'archery123' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
