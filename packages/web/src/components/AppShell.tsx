import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AppShellProps {
  title: string;
  /** Muestra botón de volver (history -1). */
  showBack?: boolean;
  /** Acción a la derecha del header (ej. botón de tema). */
  action?: ReactNode;
  children: ReactNode;
}

/** Layout móvil: header compacto (back + título + acción) + contenido. */
export function AppShell({ title, showBack, action, children }: AppShellProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-border border-b bg-bg/90 px-3 backdrop-blur">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-fg hover:bg-surface-2"
          >
            ←
          </button>
        )}
        <h1 className="flex-1 truncate font-semibold text-fg">{title}</h1>
        {action}
      </header>
      <main className="flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
