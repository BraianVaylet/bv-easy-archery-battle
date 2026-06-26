import { AVATAR_COLORS, BOW_CATEGORIES, BOW_CATEGORY_LABELS, avatarCreateSchema } from '@bv/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
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
    const onSuccess = () => navigate(editing ? '/avatars' : '/', { replace: true });
    if (editing) update.mutate({ id: avatarId, patch: parsed.data }, { onSuccess });
    else create.mutate(parsed.data, { onSuccess });
  };

  return (
    <AppShell title={editing ? 'Editar avatar' : 'Nuevo avatar'} showBack>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
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

        <label className="flex items-center gap-3 text-fg text-sm">
          <input
            type="checkbox"
            checked={beginner}
            onChange={(e) => setBeginner(e.target.checked)}
            className="h-5 w-5 accent-[var(--primary)]"
          />
          Principiante (categoría escuela)
        </label>

        {mutation.error && <FieldError>{(mutation.error as Error).message}</FieldError>}

        <Button type="submit" size="lg" loading={mutation.isPending}>
          {editing ? 'Guardar cambios' : 'Crear avatar'}
        </Button>
      </form>
    </AppShell>
  );
}
