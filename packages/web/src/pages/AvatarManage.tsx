import type { Avatar } from '@bv/shared';
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useArchivedAvatars, useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
import { AvatarChip } from '../components/AvatarChip';
import { Button, EmptyState, Spinner } from '../components/ui';

/** Botón-icono compacto para acciones dentro de la card del avatar. */
function IconAction({
  label,
  onClick,
  to,
  loading,
  children,
}: {
  label: string;
  onClick?: () => void;
  to?: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  const cls =
    'flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50';
  if (to) {
    return (
      <Link to={to} aria-label={label} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={loading} className={cls}>
      {children}
    </button>
  );
}

/** Gestión de avatares: editar y archivar activos; restaurar archivados. */
export function AvatarManage() {
  const { avatars, isLoading, archive, unarchive } = useAvatars();
  const { archived, isLoading: loadingArchived } = useArchivedAvatars();

  return (
    <AppShell title="Avatares" showBack>
      <Link to="/avatars/new" className="mb-5 block">
        <Button className="w-full">
          <Plus size={16} aria-hidden /> Nuevo avatar
        </Button>
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
                <Button size="sm">
                  <Plus size={16} aria-hidden /> Crear avatar
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {avatars.map((a: Avatar) => (
              <li key={a.id}>
                <AvatarChip
                  avatar={a}
                  trailing={
                    <>
                      <IconAction label="Editar" to={`/avatars/${a.id}/edit`}>
                        <Pencil size={16} aria-hidden />
                      </IconAction>
                      <IconAction
                        label="Archivar"
                        onClick={() => archive.mutate(a.id)}
                        loading={archive.isPending && archive.variables === a.id}
                      >
                        <Archive size={16} aria-hidden />
                      </IconAction>
                    </>
                  }
                />
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
                <li key={a.id} className="opacity-75">
                  <AvatarChip
                    avatar={a}
                    trailing={
                      <IconAction
                        label="Restaurar"
                        onClick={() => unarchive.mutate(a.id)}
                        loading={unarchive.isPending && unarchive.variables === a.id}
                      >
                        <ArchiveRestore size={16} aria-hidden />
                      </IconAction>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AppShell>
  );
}
