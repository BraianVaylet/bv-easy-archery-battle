import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccentMenu } from './AccentMenu';
import { ThemeToggle } from './ThemeToggle';

interface AppShellProps {
  title: string;
  /** Muestra botón de volver (history -1). */
  showBack?: boolean;
  /** Acción extra a la derecha del header (ej. cerrar sesión). */
  action?: ReactNode;
  children: ReactNode;
}

/** Layout móvil: header compacto (back + título + acento/tema + acción) + contenido. */
export function AppShell({ title, showBack, action, children }: AppShellProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-1 border-border border-b bg-bg/80 px-3 backdrop-blur-md">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-fg hover:bg-surface-2"
          >
            ←
          </button>
        )}
        <h1 className="flex-1 truncate font-semibold text-fg">{title}</h1>
        <div className="flex shrink-0 items-center gap-1">
          <AccentMenu />
          <ThemeToggle />
          {action}
        </div>
      </header>
      <main className="flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
