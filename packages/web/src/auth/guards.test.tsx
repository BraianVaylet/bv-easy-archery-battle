import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

const useAuthMock = vi.fn();
vi.mock('./useAuth', () => ({ useAuth: () => useAuthMock() }));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>PRIVADO</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderPublicOnly() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<div>LOGIN</div>} />
        </Route>
        <Route path="/" element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('route guards', () => {
  afterEach(() => vi.clearAllMocks());

  it('ProtectedRoute redirige a /login sin sesión', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });
    renderProtected();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('ProtectedRoute deja pasar con sesión', () => {
    useAuthMock.mockReturnValue({ user: { id: 1, alias: 'brai' }, isLoading: false });
    renderProtected();
    expect(screen.getByText('PRIVADO')).toBeInTheDocument();
  });

  it('ProtectedRoute muestra spinner mientras carga', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true });
    renderProtected();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('PublicOnlyRoute redirige a Home con sesión', () => {
    useAuthMock.mockReturnValue({ user: { id: 1, alias: 'brai' }, isLoading: false });
    renderPublicOnly();
    expect(screen.getByText('HOME')).toBeInTheDocument();
  });

  it('PublicOnlyRoute deja ver login sin sesión', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });
    renderPublicOnly();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });
});
