import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AppShell } from '../components/AppShell';
import { TournamentCard } from '../components/TournamentCard';
import { Button, EmptyState, Spinner } from '../components/ui';
import { useTournaments } from '../tournaments/useTournaments';

/** Home autenticado: torneos por estado + accesos a crear torneo y gestionar avatares. */
export function Home() {
  const { user, logout } = useAuth();
  const { tournaments, isLoading } = useTournaments();

  const enCurso = tournaments.filter((t) => t.status === 'en_curso');
  const finalizados = tournaments.filter((t) => t.status === 'finalizado');

  return (
    <AppShell
      title="Inicio"
      action={
        <button
          type="button"
          onClick={() => logout.mutate()}
          aria-label="Cerrar sesión"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-fg hover:bg-surface-2"
        >
          <LogOut size={18} aria-hidden />
        </button>
      }
    >
      <p className="mb-4 text-muted text-sm">
        Hola, <span className="font-medium text-fg">{user?.alias}</span>.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link to="/tournaments/new">
          <Button className="w-full">Nuevo torneo</Button>
        </Link>
        <Link to="/avatars">
          <Button className="w-full" variant="secondary">
            Avatares
          </Button>
        </Link>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-fg">En curso</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : enCurso.length === 0 ? (
          <EmptyState
            title="No hay torneos en curso"
            description="Creá un torneo para empezar a cargar puntajes."
            action={
              <Link to="/tournaments/new">
                <Button size="sm">Crear torneo</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {enCurso.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </section>

      {finalizados.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-fg">Finalizados</h2>
          <div className="flex flex-col gap-2">
            {finalizados.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
