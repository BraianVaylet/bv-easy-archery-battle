import {
  AVATAR_COLORS,
  type Avatar,
  BOW_CATEGORIES,
  BOW_CATEGORY_LABELS,
  DEFAULT_ARROWS,
  DEFAULT_ROUNDS,
  MODALITIES,
  MODALITY_LABELS,
  type Modality,
  avatarCreateSchema,
  tournamentCreateSchema,
} from '@bv/shared';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
import { AvatarBadge } from '../components/AvatarBadge';
import { Button, FieldError, Input, Label } from '../components/ui';
import { cn } from '../lib/cn';
import { useCreateTournament } from '../tournaments/useTournaments';

export function TournamentCreate() {
  const navigate = useNavigate();
  const createTournament = useCreateTournament();
  const { avatars } = useAvatars();

  const [name, setName] = useState('');
  const [modality, setModality] = useState<Modality>('sala');
  const [roundsCount, setRoundsCount] = useState(DEFAULT_ROUNDS);
  const [arrowsPerEnd, setArrowsPerEnd] = useState(DEFAULT_ARROWS.sala);
  const [selected, setSelected] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function pickModality(m: Modality) {
    setModality(m);
    setArrowsPerEnd(DEFAULT_ARROWS[m]);
  }

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = tournamentCreateSchema.safeParse({
      name,
      modality,
      roundsCount,
      arrowsPerEnd,
      avatarIds: selected,
    });
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
    createTournament.mutate(parsed.data, {
      onSuccess: (t) => navigate(`/tournaments/${t.id}`, { replace: true }),
    });
  }

  return (
    <AppShell title="Nuevo torneo" showBack>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={Boolean(errors.name)}
            maxLength={60}
          />
          <FieldError>{errors.name}</FieldError>
        </div>

        <fieldset className="border-0 p-0">
          <legend className="mb-1 block font-medium text-muted text-sm">Modalidad</legend>
          <div className="grid grid-cols-2 gap-2">
            {MODALITIES.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modality === m}
                onClick={() => pickModality(m)}
                className={cn(
                  'min-h-11 rounded-lg border px-3 py-2 text-sm transition-colors',
                  modality === m
                    ? 'border-primary bg-primary-soft text-fg'
                    : 'border-border bg-surface text-muted hover:bg-surface-2',
                )}
              >
                {MODALITY_LABELS[m]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="rounds">Tiradas</Label>
            <Input
              id="rounds"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={roundsCount}
              onChange={(e) => setRoundsCount(Number(e.target.value))}
              invalid={Boolean(errors.roundsCount)}
            />
            <FieldError>{errors.roundsCount}</FieldError>
          </div>
          <div>
            <Label htmlFor="arrows">Flechas por tirada</Label>
            <Input
              id="arrows"
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              value={arrowsPerEnd}
              onChange={(e) => setArrowsPerEnd(Number(e.target.value))}
              invalid={Boolean(errors.arrowsPerEnd)}
            />
            <FieldError>{errors.arrowsPerEnd}</FieldError>
          </div>
        </div>

        <div>
          <Label>Participantes</Label>
          {avatars.length === 0 ? (
            <p className="text-muted text-sm">No tenés avatares. Creá uno con el botón de abajo.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {avatars.map((a) => (
                <AvatarToggle
                  key={a.id}
                  avatar={a}
                  selected={selected.includes(a.id)}
                  onToggle={() => toggle(a.id)}
                />
              ))}
            </div>
          )}
          <FieldError>{errors.avatarIds}</FieldError>
        </div>

        <InlineAvatarCreate onCreated={(a) => setSelected((s) => [...s, a.id])} />

        {createTournament.error && (
          <FieldError>{(createTournament.error as Error).message}</FieldError>
        )}

        <Button type="submit" size="lg" loading={createTournament.isPending}>
          Crear torneo
        </Button>
      </form>
    </AppShell>
  );
}

function AvatarToggle({
  avatar,
  selected,
  onToggle,
}: {
  avatar: Avatar;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:bg-surface-2',
      )}
    >
      <AvatarBadge bowCategory={avatar.bowCategory} color={avatar.color} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-fg">{avatar.alias}</span>
        <span className="block text-muted text-xs">{BOW_CATEGORY_LABELS[avatar.bowCategory]}</span>
      </span>
      <span className="text-muted text-sm">{selected ? '✓' : '+'}</span>
    </button>
  );
}

/** Crear un avatar sin salir del armado del torneo. */
function InlineAvatarCreate({ onCreated }: { onCreated: (a: Avatar) => void }) {
  const { create } = useAvatars();
  const [open, setOpen] = useState(false);
  const [alias, setAlias] = useState('');
  const [bowCategory, setBowCategory] = useState('');
  const [color, setColor] = useState('');
  const [beginner, setBeginner] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        + Crear avatar
      </Button>
    );
  }

  function submit() {
    const parsed = avatarCreateSchema.safeParse({ alias, bowCategory, color, beginner });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
      return;
    }
    setError(undefined);
    create.mutate(parsed.data, {
      onSuccess: (a) => {
        onCreated(a);
        setOpen(false);
        setAlias('');
        setBowCategory('');
        setColor('');
        setBeginner(false);
      },
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border border-dashed p-4">
      <div>
        <Label htmlFor="inline-alias">Alias del avatar</Label>
        <Input id="inline-alias" value={alias} onChange={(e) => setAlias(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {BOW_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={bowCategory === cat}
            onClick={() => setBowCategory(cat)}
            className={cn(
              'min-h-11 rounded-lg border px-2 py-1.5 text-xs transition-colors',
              bowCategory === cat
                ? 'border-primary bg-primary-soft text-fg'
                : 'border-border bg-surface text-muted hover:bg-surface-2',
            )}
          >
            {BOW_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-label={c.label}
            aria-pressed={color === c.key}
            onClick={() => setColor(c.key)}
            style={{ backgroundColor: c.hex }}
            className={cn(
              'h-11 w-11 rounded-full transition-transform hover:scale-110',
              color === c.key && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
            )}
          />
        ))}
      </div>
      <label className="flex items-center gap-2 text-fg text-sm">
        <input
          type="checkbox"
          checked={beginner}
          onChange={(e) => setBeginner(e.target.checked)}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Principiante (escuela)
      </label>
      {error && <FieldError>{error}</FieldError>}
      <div className="flex gap-2">
        <Button type="button" size="sm" loading={create.isPending} onClick={submit}>
          Agregar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
