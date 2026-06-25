import { cn } from '../../lib/cn';

interface ScoreKeypadProps {
  /** Tokens de la modalidad (descendente, incluye inner y M). */
  tokens: readonly string[];
  /** Flechas ya cargadas (orden de visualización descendente). */
  draft: string[];
  arrowsPerEnd: number;
  onToken: (token: string) => void;
  onBackspace: () => void;
  onClose: () => void;
}

/** Botonera de carga de puntaje (targets ≥44px). Llena el end en orden descendente. */
export function ScoreKeypad({
  tokens,
  draft,
  arrowsPerEnd,
  onToken,
  onBackspace,
  onClose,
}: ScoreKeypadProps) {
  const full = draft.length >= arrowsPerEnd;
  return (
    <div className="sticky bottom-0 z-20 border-border border-t bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1.5" aria-label="Flechas cargadas">
          {Array.from({ length: arrowsPerEnd }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: celdas posicionales fijas del end
              key={i}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border font-medium text-sm',
                draft[i] ? 'border-primary bg-primary-soft text-fg' : 'border-border text-dim',
              )}
            >
              {draft[i] ?? '·'}
            </span>
          ))}
        </div>
        <button type="button" onClick={onClose} className="text-muted text-sm hover:text-fg">
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {tokens.map((t) => (
          <button
            key={t}
            type="button"
            disabled={full}
            onClick={() => onToken(t)}
            className="h-12 rounded-lg border border-border bg-surface font-semibold text-fg transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={onBackspace}
          aria-label="Borrar última flecha"
          className="h-12 rounded-lg border border-border bg-surface font-semibold text-fg transition-colors hover:bg-surface-2"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
