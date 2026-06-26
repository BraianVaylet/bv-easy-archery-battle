import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

/** Botón de alternar tema claro/oscuro (icono sol/luna). */
export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-fg transition-colors hover:bg-surface-2"
    >
      {mode === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
