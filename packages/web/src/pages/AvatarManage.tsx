import type { Avatar } from '@bv/shared';
import { Link } from 'react-router-dom';
import { useArchivedAvatars, useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
import { AvatarChip } from '../components/AvatarChip';
import { Button, EmptyState, Spinner } from '../components/ui';

/** Gestión de avatares: editar y archivar activos; restaurar archivados. */
export function AvatarManage() {
  const { avatars, isLoading, archive, unarchive } = useAvatars();
  const { archived, isLoading: loadingArchived } = useArchivedAvatars();

  return (
    <AppShell title="Avatares" showBack>
      <Link to="/avatars/new" className="mb-5 block">
        <Button className="w-full">Nuevo avatar</Button>
      </Link>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-fg">Activos</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : avatars.length === 0 ? (
          <EmptyState
            title="No tenés avatares"
            description="Creá uno para usarlo en tus torneos."
            action={
              <Link to="/avatars/new">
                <Button size="sm">Crear avatar</Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {avatars.map((a: Avatar) => (
              <li key={a.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <AvatarChip avatar={a} />
                </div>
                <Link to={`/avatars/${a.id}/edit`}>
                  <Button size="sm" variant="secondary">
                    Editar
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => archive.mutate(a.id)}
                  loading={archive.isPending && archive.variables === a.id}
                >
                  Archivar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(loadingArchived || archived.length > 0) && (
        <section>
          <h2 className="mb-2 font-semibold text-fg">Archivados</h2>
          {loadingArchived ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {archived.map((a: Avatar) => (
                <li key={a.id} className="flex items-center gap-2 opacity-75">
                  <div className="min-w-0 flex-1">
                    <AvatarChip avatar={a} />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => unarchive.mutate(a.id)}
                    loading={unarchive.isPending && unarchive.variables === a.id}
                  >
                    Restaurar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AppShell>
  );
}
