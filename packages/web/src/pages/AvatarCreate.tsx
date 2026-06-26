import {
  AVATAR_COLORS,
  BOW_CATEGORIES,
  BOW_CATEGORY_LABELS,
  type BowCategory,
  avatarCreateSchema,
} from '@bv/shared';
import { Check, Plus } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
import { AvatarBadge } from '../components/AvatarBadge';
import { Button, FieldError, Input, Label } from '../components/ui';
import { cn } from '../lib/cn';

/** Formulario de avatar: crea uno nuevo o edita uno existente (ruta con `:id`). */
export function AvatarCreate() {
  const { id } = useParams();
  const editing = id !== undefined;
  const avatarId = Number(id);
  const { avatars, create, update } = useAvatars();
  const navigate = useNavigate();

  const [alias, setAlias] = useState('');
  const [bowCategory, setBowCategory] = useState('');
  const [color, setColor] = useState('');
  const [beginner, setBeginner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // En modo edición, precarga los campos cuando el avatar está disponible.
  const current = editing ? avatars.find((a) => a.id === avatarId) : undefined;
  useEffect(() => {
    if (!current) return;
    setAlias(current.alias);
    setBowCategory(current.bowCategory);
    setColor(current.color);
    setBeginner(current.experience === 'escuela');
  }, [current]);

  const mutation = editing ? update : create;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = avatarCreateSchema.safeParse({ alias, bowCategory, color, beginner });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    // Tras crear o editar volvemos a la gestión de avatares (donde vive el listado).
    const onSuccess = () => navigate('/avatars', { replace: true });
    if (editing) update.mutate({ id: avatarId, patch: parsed.data }, { onSuccess });
    else create.mutate(parsed.data, { onSuccess });
  };

  return (
    <AppShell title={editing ? 'Editar arquero' : 'Nuevo arquero'} showBack>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <div className="flex items-center gap-3">
          {bowCategory && color ? (
            <AvatarBadge bowCategory={bowCategory as BowCategory} color={color} size={56} />
          ) : (
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border border-dashed text-muted text-xs"
              aria-hidden
            >
              ?
            </span>
          )}
          <p className="text-muted text-sm">
            {bowCategory && color
              ? 'Vista previa del arquero'
              : 'Elegí categoría y color para ver el arquero'}
          </p>
        </div>

        <div>
          <Label htmlFor="alias">Alias</Label>
          <Input
            id="alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            invalid={Boolean(errors.alias)}
            maxLength={30}
          />
          <FieldError>{errors.alias}</FieldError>
        </div>

        <fieldset className="border-0 p-0">
          <legend className="mb-1 block font-medium text-muted text-sm">Categoría de arco</legend>
          <div className="grid grid-cols-2 gap-2">
            {BOW_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={bowCategory === cat}
                onClick={() => setBowCategory(cat)}
                className={cn(
                  'min-h-11 rounded-lg border px-3 py-2 text-sm transition-colors',
                  bowCategory === cat
                    ? 'border-primary bg-primary-soft text-fg'
                    : 'border-border bg-surface text-muted hover:bg-surface-2',
                )}
              >
                {BOW_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <FieldError>{errors.bowCategory}</FieldError>
        </fieldset>

        <fieldset className="border-0 p-0">
          <legend className="mb-1 block font-medium text-muted text-sm">Color</legend>
          <div className="flex flex-wrap gap-3">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-label={c.label}
                aria-pressed={color === c.key}
                title={c.label}
                onClick={() => setColor(c.key)}
                style={{ backgroundColor: c.hex }}
                className={cn(
                  'h-11 w-11 rounded-full transition-transform hover:scale-110',
                  color === c.key && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                )}
              />
            ))}
          </div>
          <FieldError>{errors.color}</FieldError>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-3 text-fg text-sm">
          <input
            type="checkbox"
            checked={beginner}
            onChange={(e) => setBeginner(e.target.checked)}
            className="peer sr-only"
          />
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-surface-2 px-0.5 transition-colors peer-checked:bg-primary peer-checked:[&>span]:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-fg peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface">
            <span className="block h-5 w-5 rounded-full bg-white shadow-sm transition-transform" />
          </span>
          Principiante (categoría escuela)
        </label>

        {mutation.error && <FieldError>{(mutation.error as Error).message}</FieldError>}

        <Button type="submit" size="lg" loading={mutation.isPending}>
          {editing ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
          {editing ? 'Guardar cambios' : 'Crear arquero'}
        </Button>
      </form>
    </AppShell>
  );
}
