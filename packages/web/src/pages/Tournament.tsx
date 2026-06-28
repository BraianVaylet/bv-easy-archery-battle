import {
  BOW_CATEGORY_LABELS,
  MODALITY_LABELS,
  type Modality,
  type PodiumEntry,
  type RoundStatus,
  type TournamentParticipant,
} from '@bv/shared';
import {
  ChartColumn,
  Check,
  Flag,
  Info,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  UserPlus,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAvatars } from '../avatars/useAvatars';
import { AppShell } from '../components/AppShell';
import { AvatarBadge } from '../components/AvatarBadge';
import { MODALITY_ICONS } from '../components/icons/modality';
import { Button, Card, Input, Spinner } from '../components/ui';
import { cn } from '../lib/cn';
import { formatDate } from '../lib/date';
import {
  useAddParticipants,
  useAddRound,
  useDeleteRound,
  useFinishTournament,
  useTournament,
  useUpdateTournament,
} from '../tournaments/useTournaments';

const ROUND_BADGE: Record<RoundStatus, { label: string; className: string }> = {
  completa: { label: 'Completa', className: 'bg-primary-soft text-primary' },
  en_proceso: { label: 'En proceso', className: 'bg-amber-500/15 text-amber-600' },
  pendiente: { label: 'Pendiente', className: 'bg-surface-2 text-muted' },
};

const TOOLBAR_BTN =
  'flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-fg transition-colors hover:bg-surface-2';

/** Recordatorio breve de reglas WA por modalidad (para arqueros que ya practican). */
const MODALITY_RULES: Record<Modality, string[]> = {
  sala: [
    'Distancia: 18 m, bajo techo.',
    'Diana de 40 cm (o triple spot vertical).',
    'Puntaje: 10 a 1; el inner-10 cuenta como X (desempate). M = 0.',
    'Formato WA: 20 series de 3 flechas (60 en total).',
  ],
  aire_libre: [
    'Distancias: 70/60/50/30 m según categoría.',
    'Diana de 122 cm (80 cm en las distancias cortas).',
    'Puntaje: 10 a 1; el inner-10 cuenta como X (desempate). M = 0.',
    'Formato WA 720: 12 series de 6 flechas (72 en total).',
  ],
  campo: [
    'Recorrido por estaciones en terreno.',
    'La estaca por categoría (roja/azul/amarilla) define la distancia.',
    'Distancias conocidas y desconocidas.',
    'Puntaje: zona central 6, luego 5 a 1. M = 0.',
    'Recorrido WA: 24 dianas.',
  ],
  '3d': [
    'Siluetas 3D de animales a distancia desconocida.',
    'La estaca por categoría define la posición de tiro.',
    'Puntaje: 11 (centro interno), 10, 8, 5. M = 0.',
    'Recorrido WA: 24 dianas.',
  ],
};

export function Tournament() {
  const { id } = useParams();
  const tid = Number(id);
  const { tournament: t, isLoading, isError } = useTournament(tid);
  const finish = useFinishTournament(tid);
  const addRound = useAddRound(tid);
  const deleteRound = useDeleteRound(tid);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [info, setInfo] = useState(false);

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
  const ModalityIcon = MODALITY_ICONS[t.modality];

  return (
    <AppShell title={t.name} showBack>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center text-muted"
            title={MODALITY_LABELS[t.modality]}
          >
            <ModalityIcon size={24} />
          </span>
          <div>
            <p className="text-muted text-sm">
              {`${t.participants.length} arqueros · ${finished ? 'Finalizado' : 'En curso'}`}
            </p>
            <p className="text-muted text-xs">Creado el {formatDate(t.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!finished && (
            <>
              <button
                type="button"
                aria-label="Editar torneo"
                aria-pressed={editing}
                className={cn(
                  TOOLBAR_BTN,
                  editing && 'border-primary bg-primary-soft text-primary',
                )}
                onClick={() => setEditing((v) => !v)}
              >
                <Pencil size={16} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Agregar participantes"
                className={TOOLBAR_BTN}
                onClick={() => setAdding((v) => !v)}
              >
                <UserPlus size={16} aria-hidden />
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="Reglas de la modalidad"
            className={TOOLBAR_BTN}
            onClick={() => setInfo(true)}
          >
            <Info size={16} aria-hidden />
          </button>
          <Link to={`/tournaments/${tid}/stats`} aria-label="Estadísticas" className={TOOLBAR_BTN}>
            <ChartColumn size={16} aria-hidden />
          </Link>
        </div>
      </div>

      {info && (
        <ModalityInfo
          modality={t.modality}
          arrowsPerEnd={t.arrowsPerEnd}
          onClose={() => setInfo(false)}
        />
      )}

      {editing && <EditName tid={tid} name={t.name} />}

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-fg">Tiradas</h2>
        <div className="flex flex-col gap-2">
          {t.rounds.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <Link
                to={`/tournaments/${tid}/rounds/${r.seq}`}
                className="flex flex-1 items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
              >
                <span className="font-medium text-fg">Tirada {r.seq}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    ROUND_BADGE[r.status].className,
                  )}
                >
                  {ROUND_BADGE[r.status].label}
                </span>
              </Link>
              {!finished && editing && t.rounds.length > 1 && (
                <button
                  type="button"
                  aria-label={`Eliminar tirada ${r.seq}`}
                  disabled={deleteRound.isPending}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar la tirada ${r.seq}? Se perderán sus puntajes.`)) {
                      deleteRound.mutate(r.seq);
                    }
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              )}
            </div>
          ))}
          {!finished && (
            <button
              type="button"
              onClick={() => addRound.mutate()}
              disabled={addRound.isPending}
              className="flex items-center justify-center gap-2 rounded-lg border border-border border-dashed px-4 py-3 text-muted text-sm transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-60"
            >
              <Plus size={16} aria-hidden /> Agregar tirada
            </button>
          )}
        </div>
      </section>

      {t.miniPodium.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-semibold text-fg">Podio (general)</h2>
          <MiniPodium entries={t.miniPodium} />
        </Card>
      )}

      {!finished && adding && (
        <AddParticipants tid={tid} participants={t.participants} onDone={() => setAdding(false)} />
      )}

      <div className="flex flex-col gap-3">
        {hasPodium ? (
          <Link to={`/tournaments/${tid}/podium`}>
            <Button className="w-full" size="lg">
              <Trophy size={18} aria-hidden /> Ver podios
            </Button>
          </Link>
        ) : (
          <Button className="w-full" size="lg" disabled title="Completá la primera tirada">
            <Trophy size={18} aria-hidden /> Ver podios
          </Button>
        )}

        {!finished && allComplete && (
          <Button className="w-full" loading={finish.isPending} onClick={() => finish.mutate()}>
            <Flag size={18} aria-hidden /> Finalizar torneo
          </Button>
        )}
        {finish.error && (
          <p className="text-center text-danger text-sm">{(finish.error as Error).message}</p>
        )}
      </div>
    </AppShell>
  );
}

/** Modal con el recordatorio breve de reglas de la modalidad. */
function ModalityInfo({
  modality,
  arrowsPerEnd,
  onClose,
}: {
  modality: Modality;
  arrowsPerEnd: number;
  onClose: () => void;
}) {
  const Icon = MODALITY_ICONS[modality];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <dialog
        open
        aria-modal="true"
        aria-labelledby="modality-info-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 text-fg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <Icon size={22} className="shrink-0 text-primary" />
          <h2 id="modality-info-title" className="flex-1 font-semibold text-fg text-lg">
            {MODALITY_LABELS[modality]}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <ul className="flex flex-col gap-2 text-fg text-sm">
          {MODALITY_RULES[modality].map((rule) => (
            <li key={rule} className="flex gap-2">
              <span aria-hidden className="text-primary">
                •
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-border border-t pt-3 text-muted text-xs">
          En este torneo: {arrowsPerEnd} flechas por tirada.
        </p>
      </dialog>
    </div>
  );
}

/** Edición inline del nombre del torneo (dentro del modo edición). */
function EditName({ tid, name }: { tid: number; name: string }) {
  const [value, setValue] = useState(name);
  const update = useUpdateTournament(tid);
  return (
    <div className="mb-5 flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={60}
        aria-label="Nombre del torneo"
      />
      <Button size="sm" loading={update.isPending} onClick={() => update.mutate(value.trim())}>
        <Check size={16} aria-hidden /> Guardar
      </Button>
    </div>
  );
}

/** Agregar avatares propios que aún no participan. */
function AddParticipants({
  tid,
  participants,
  onDone,
}: {
  tid: number;
  participants: TournamentParticipant[];
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const { avatars } = useAvatars();
  const add = useAddParticipants(tid);

  const inTournament = new Set(participants.map((p) => p.avatarId));
  const available = avatars.filter((a) => !inTournament.has(a.id));

  const toggle = (avatarId: number) =>
    setSelected((s) => (s.includes(avatarId) ? s.filter((x) => x !== avatarId) : [...s, avatarId]));

  return (
    <Card className="mb-6 flex flex-col gap-3">
      <h2 className="font-semibold text-fg">Agregar participantes</h2>
      {available.length === 0 ? (
        <p className="text-muted text-sm">No hay arqueros disponibles para agregar.</p>
      ) : (
        <div
          className={cn(
            'flex flex-col gap-2',
            available.length > 5 && 'max-h-[19rem] overflow-y-auto pr-1',
          )}
        >
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
                onDone();
              },
            })
          }
        >
          <UserPlus size={16} aria-hidden /> Agregar ({selected.length})
        </Button>
        <Button variant="ghost" onClick={onDone}>
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
