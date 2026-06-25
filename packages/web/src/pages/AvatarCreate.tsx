import { AVATAR_COLORS, BOW_CATEGORIES, BOW_CATEGORY_LABELS, avatarCreateSchema } from '@bv/shared';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
import { Button, FieldError, Input, Label } from '../components/ui';
import { cn } from '../lib/cn';

export function AvatarCreate() {
  const { create } = useAvatars();
  const navigate = useNavigate();
  const [alias, setAlias] = useState('');
  const [bowCategory, setBowCategory] = useState('');
  const [color, setColor] = useState('');
  const [beginner, setBeginner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    create.mutate(parsed.data, { onSuccess: () => navigate('/', { replace: true }) });
  };

  return (
    <AppShell title="Nuevo avatar" showBack>
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

        <div>
          <Label>Categoría de arco</Label>
          <div className="grid grid-cols-2 gap-2">
            {BOW_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={bowCategory === cat}
                onClick={() => setBowCategory(cat)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm transition-colors',
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
        </div>

        <div>
          <Label>Color</Label>
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
                  'h-9 w-9 rounded-full transition-transform hover:scale-110',
                  color === c.key && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                )}
              />
            ))}
          </div>
          <FieldError>{errors.color}</FieldError>
        </div>

        <label className="flex items-center gap-3 text-fg text-sm">
          <input
            type="checkbox"
            checked={beginner}
            onChange={(e) => setBeginner(e.target.checked)}
            className="h-5 w-5 accent-[var(--primary)]"
          />
          Principiante (categoría escuela)
        </label>

        {create.error && <FieldError>{(create.error as Error).message}</FieldError>}

        <Button type="submit" size="lg" loading={create.isPending}>
          Crear avatar
        </Button>
      </form>
    </AppShell>
  );
}
