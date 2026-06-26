import { ArrowLeft, House } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

/** Estilo común de los botones-icono del header. */
export const HEADER_BTN =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-fg transition-colors hover:bg-surface-2';

/** Layout móvil: header compacto (back/home + título + acento/tema + acción) + contenido. */
export function AppShell({ title, showBack, action, children }: AppShellProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const atHome = pathname === '/';

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-1 border-border border-b bg-bg/80 px-3 backdrop-blur-md">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className={HEADER_BTN}
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
        )}
        {!atHome && (
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Ir a Inicio"
            className={HEADER_BTN}
          >
            <House size={18} aria-hidden />
          </button>
        )}
        <h1 className="flex-1 truncate px-1 font-semibold text-fg">{title}</h1>
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
