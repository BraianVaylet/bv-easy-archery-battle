import { Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { useTheme } from '../theme/ThemeProvider';
import { ACCENTS } from '../theme/accent';

/** Botón de acento en el header: abre un popover con las opciones de color base. */
export function AccentMenu() {
  const { accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra al clickear fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Color de acento"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-fg transition-colors hover:bg-surface-2"
      >
        <Palette size={18} aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface p-3 shadow-lg">
          {ACCENTS.map((a) => {
            const active = accent.toLowerCase() === a.hex.toLowerCase();
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => {
                  setAccent(a.hex);
                  setOpen(false);
                }}
                aria-label={`Acento ${a.label}`}
                aria-pressed={active}
                title={a.label}
                style={{ backgroundColor: a.hex }}
                className={cn(
                  'h-9 w-9 rounded-full transition-transform hover:scale-110',
                  active && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
