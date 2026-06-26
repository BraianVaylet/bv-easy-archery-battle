import {
  BOW_CATEGORY_LABELS,
  type PodiumEntry,
  type RoundStatus,
  type TournamentParticipant,
} from '@bv/shared';
import { Check, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
import { AvatarBadge } from '../components/AvatarBadge';
import { Button, Card, Input, Spinner } from '../components/ui';
import { cn } from '../lib/cn';
import {
  useAddParticipants,
  useAddRound,
  useFinishTournament,
  useTournament,
  useUpdateTournament,
} from '../tournaments/useTournaments';

const ROUND_BADGE: Record<RoundStatus, { label: string; className: string }> = {
  completa: { label: 'Completa', className: 'bg-primary-soft text-primary' },
  en_proceso: { label: 'En proceso', className: 'bg-amber-500/15 text-amber-600' },
  pendiente: { label: 'Pendiente', className: 'bg-surface-2 text-muted' },
};

export function Tournament() {
  const { id } = useParams();
  const tid = Number(id);
  const { tournament: t, isLoading, isError } = useTournament(tid);
  const finish = useFinishTournament(tid);
  const addRound = useAddRound(tid);

  if (isLoading) {
    return (
      <AppShell title="Torneo" showBack>
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </AppShell>
    );
  }
  if (isError || !t) {
    return (
      <AppShell title="Torneo" showBack>
        <p className="text-muted">No se pudo cargar el torneo.</p>
      </AppShell>
    );
  }

  const allComplete = t.rounds.length > 0 && t.rounds.every((r) => r.status === 'completa');
  const hasPodium = t.rounds.some((r) => r.status === 'completa');
  const finished = t.status === 'finalizado';

  return (
    <AppShell title={t.name} showBack>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-muted text-sm">
          {`${t.participants.length} arqueros · ${finished ? 'Finalizado' : 'En curso'}`}
        </p>
      </div>

      {!finished && <EditName tid={tid} name={t.name} />}

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-fg">Tiradas</h2>
        <div className="flex flex-col gap-2">
          {t.rounds.map((r) => (
            <Link
              key={r.id}
              to={`/tournaments/${tid}/rounds/${r.seq}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <span className="font-medium text-fg">Tirada {r.seq}</span>
              <span
                className={cn('rounded-full px-2 py-0.5 text-xs', ROUND_BADGE[r.status].className)}
              >
                {ROUND_BADGE[r.status].label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {t.miniPodium.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-semibold text-fg">Podio (general)</h2>
          <MiniPodium entries={t.miniPodium} />
        </Card>
      )}

      {!finished && <AddParticipants tid={tid} participants={t.participants} />}

      <div className="flex flex-col gap-3">
        {hasPodium ? (
          <Link to={`/tournaments/${tid}/podium`}>
            <Button className="w-full" size="lg">
              Ver podios
            </Button>
          </Link>
        ) : (
          <Button className="w-full" size="lg" disabled title="Completá la primera tirada">
            Ver podios
          </Button>
        )}

        <Link to={`/tournaments/${tid}/stats`}>
          <Button variant="secondary" className="w-full">
            Estadísticas
          </Button>
        </Link>

        {!finished && (
          <Button
            variant="secondary"
            className="w-full"
            loading={addRound.isPending}
            onClick={() => addRound.mutate()}
          >
            Agregar tirada
          </Button>
        )}

        {!finished && allComplete && (
          <Button className="w-full" loading={finish.isPending} onClick={() => finish.mutate()}>
            Finalizar torneo
          </Button>
        )}
        {finish.error && (
          <p className="text-center text-danger text-sm">{(finish.error as Error).message}</p>
        )}
      </div>
    </AppShell>
  );
}

/** Edición inline del nombre del torneo. */
function EditName({ tid, name }: { tid: number; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const update = useUpdateTournament(tid);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
        className="mb-5 inline-flex items-center gap-1.5 text-muted text-sm hover:text-fg"
      >
        <Pencil size={14} aria-hidden /> Editar nombre
      </button>
    );
  }

  return (
    <div className="mb-5 flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={60}
        aria-label="Nombre del torneo"
      />
      <Button
        size="sm"
        loading={update.isPending}
        onClick={() => update.mutate(value.trim(), { onSuccess: () => setEditing(false) })}
      >
        Guardar
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Cancelar
      </Button>
    </div>
  );
}

/** Agregar avatares propios que aún no participan. */
function AddParticipants({
  tid,
  participants,
}: {
  tid: number;
  participants: TournamentParticipant[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const { avatars } = useAvatars();
  const add = useAddParticipants(tid);

  const inTournament = new Set(participants.map((p) => p.avatarId));
  const available = avatars.filter((a) => !inTournament.has(a.id));

  if (!open) {
    return (
      <Button variant="secondary" className="mb-6 w-full" onClick={() => setOpen(true)}>
        <Plus size={16} aria-hidden /> Agregar participantes
      </Button>
    );
  }

  const toggle = (avatarId: number) =>
    setSelected((s) => (s.includes(avatarId) ? s.filter((x) => x !== avatarId) : [...s, avatarId]));

  return (
    <Card className="mb-6 flex flex-col gap-3">
      <h2 className="font-semibold text-fg">Agregar participantes</h2>
      {available.length === 0 ? (
        <p className="text-muted text-sm">No hay avatares disponibles para agregar.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {available.map((a) => {
            const checked = selected.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                aria-pressed={checked}
                onClick={() => toggle(a.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-2 text-left transition-colors',
                  checked
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface hover:bg-surface-2',
                )}
              >
                <AvatarBadge bowCategory={a.bowCategory} color={a.color} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-fg">{a.alias}</span>
                  <span className="block text-muted text-xs">
                    {BOW_CATEGORY_LABELS[a.bowCategory]}
                  </span>
                </span>
                {checked && <Check size={16} className="text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
      {add.error && <p className="text-danger text-sm">{(add.error as Error).message}</p>}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={selected.length === 0}
          loading={add.isPending}
          onClick={() =>
            add.mutate(selected, {
              onSuccess: () => {
                setSelected([]);
                setOpen(false);
              },
            })
          }
        >
          Agregar ({selected.length})
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cerrar
        </Button>
      </div>
    </Card>
  );
}

function MiniPodium({ entries }: { entries: PodiumEntry[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {entries.map((e) => (
        <li key={e.participant.id} className="flex items-center gap-3">
          <span className="w-6 text-center font-semibold text-muted">{e.rank}</span>
          <span className="flex-1 truncate text-fg">{e.participant.alias}</span>
          <span className="font-semibold text-fg tabular-nums">{e.participant.totalScore}</span>
        </li>
      ))}
    </ol>
  );
}
