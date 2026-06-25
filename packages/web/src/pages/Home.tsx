import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
import { AvatarChip } from '../components/AvatarChip';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button, EmptyState, Spinner } from '../components/ui';

/** Home autenticado: lista de avatares + accesos. Torneos llegan en FE-5+. */
export function Home() {
  const { user, logout } = useAuth();
  const { avatars, isLoading } = useAvatars();

  return (
    <AppShell title="Inicio" action={<ThemeToggle />}>
      <p className="mb-4 text-muted text-sm">
        Hola, <span className="font-medium text-fg">{user?.alias}</span>.
      </p>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-fg">Mis avatares</h2>
        <Link to="/avatars/new">
          <Button size="sm">+ Avatar</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : avatars.length === 0 ? (
        <EmptyState
          title="Todavía no tenés avatares"
          description="Creá un avatar (alias, arco y color) para participar en torneos."
          action={
            <Link to="/avatars/new">
              <Button size="sm">Crear avatar</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {avatars.map((a) => (
            <AvatarChip key={a.id} avatar={a} />
          ))}
        </div>
      )}

      <Button variant="ghost" className="mt-8 w-full" onClick={() => logout.mutate()}>
        Cerrar sesión
      </Button>
    </AppShell>
  );
}
