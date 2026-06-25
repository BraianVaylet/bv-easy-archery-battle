import { cn } from '../lib/cn';
import { useTheme } from '../theme/ThemeProvider';
import { ACCENTS } from '../theme/accent';

/** Selector de color base (acento). */
export function AccentPicker() {
  const { accent, setAccent } = useTheme();
  return (
    <div className="flex flex-wrap gap-3">
      {ACCENTS.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={() => setAccent(a.hex)}
          aria-label={`Acento ${a.label}`}
          aria-pressed={accent.toLowerCase() === a.hex.toLowerCase()}
          title={a.label}
          style={{ backgroundColor: a.hex }}
          className={cn(
            'h-11 w-11 rounded-full transition-transform hover:scale-110',
            accent.toLowerCase() === a.hex.toLowerCase() &&
              'ring-2 ring-fg ring-offset-2 ring-offset-surface',
          )}
        />
      ))}
    </div>
  );
}
