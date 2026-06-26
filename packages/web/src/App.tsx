import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PublicOnlyRoute } from './auth/PublicOnlyRoute';
import { AvatarCreate } from './pages/AvatarCreate';
import { AvatarManage } from './pages/AvatarManage';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { ParticipantStats } from './pages/ParticipantStats';
import { Podium } from './pages/Podium';
import { Recover } from './pages/Recover';
import { Register } from './pages/Register';
import { Round } from './pages/Round';
import { Tournament } from './pages/Tournament';
import { TournamentCreate } from './pages/TournamentCreate';
import { TournamentStats } from './pages/TournamentStats';

/** Árbol de rutas. Guards: público (login/registro) vs protegido (app). */
export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recover" element={<Recover />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/avatars" element={<AvatarManage />} />
        <Route path="/avatars/new" element={<AvatarCreate />} />
        <Route path="/avatars/:id/edit" element={<AvatarCreate />} />
        <Route path="/tournaments/new" element={<TournamentCreate />} />
        <Route path="/tournaments/:id" element={<Tournament />} />
        <Route path="/tournaments/:id/rounds/:seq" element={<Round />} />
        <Route path="/tournaments/:id/podium" element={<Podium />} />
        <Route path="/tournaments/:id/stats" element={<TournamentStats />} />
        <Route path="/tournaments/:id/participants/:pid/stats" element={<ParticipantStats />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
