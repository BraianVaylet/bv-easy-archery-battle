# Documentación técnica — BV Archery Battle

## 1. Stack

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript (strict) en todo el monorepo |
| Monorepo | pnpm workspaces |
| Frontend | React 18, Vite 6, Tailwind CSS 4, TanStack Query 5, React Router 6, vite-plugin-pwa |
| Backend | Node, Hono, better-sqlite3 |
| Dominio | `@bv/shared` (Zod, lógica pura) |
| Auth | sesión httpOnly (token hash en DB) + CSRF |
| Lint/format | Biome |
| Tests | Vitest + Testing Library (FE), Vitest + SQLite in-memory (BE), Playwright (E2E) |
| Deploy | Docker (multi-stage) + volumen SQLite |

## 2. Modelo de datos (SQLite)

Convenciones: PK `id TEXT` (nanoid/uuid v4); timestamps epoch ms (`INTEGER`); enums como `TEXT` con `CHECK`; JSON como `TEXT`; FKs con índice; modo **WAL**; `foreign_keys = ON`.

### 2.1 Auth (reutilizado de bv-bow-sight)
```sql
CREATE TABLE users (
  id               TEXT PRIMARY KEY,
  alias            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,            -- argon2id
  recovery_question TEXT,
  recovery_answer_hash TEXT,                 -- argon2id
  created_at       INTEGER NOT NULL
);

CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,                 -- sha256(token de la cookie)
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
```

### 2.2 Catálogos (seed — "guardados en la BD")
```sql
CREATE TABLE bow_categories (id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, label TEXT NOT NULL, sort INTEGER NOT NULL);
CREATE TABLE colors         (id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, label TEXT NOT NULL, hex TEXT NOT NULL, sort INTEGER NOT NULL);
CREATE TABLE modalities (
  id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, label TEXT NOT NULL,
  default_arrows INTEGER NOT NULL,           -- sala 3, aire_libre 6, campo 3, 3d 2
  max_per_arrow  INTEGER NOT NULL,           -- 10/10/6/11
  scoring_set    TEXT NOT NULL,              -- JSON: ["X","10",...,"M"]
  default_rounds INTEGER NOT NULL DEFAULT 10
);
```

### 2.3 Dominio
```sql
CREATE TABLE avatars (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL,
  bow_category TEXT NOT NULL,                -- key de bow_categories
  color       TEXT NOT NULL,                 -- key de colors
  experience  TEXT NOT NULL DEFAULT 'senior' CHECK (experience IN ('escuela','senior')),
  archived_at INTEGER,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX idx_avatars_user ON avatars(user_id);

CREATE TABLE tournaments (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  modality     TEXT NOT NULL,                -- sala | aire_libre | campo | 3d
  rounds_count INTEGER NOT NULL DEFAULT 10,
  arrows_per_end INTEGER NOT NULL,
  scoring_set  TEXT NOT NULL,                -- JSON snapshot del set
  stake_map    TEXT,                         -- JSON: { roja:[cat...], azul:[...], amarilla:[...] } (campo/3d)
  distances    TEXT,                         -- JSON: { roja:m, azul:m, amarilla:m } (informativo)
  status       TEXT NOT NULL DEFAULT 'en_curso' CHECK (status IN ('en_curso','finalizado')),
  created_at   INTEGER NOT NULL,
  finished_at  INTEGER
);
CREATE INDEX idx_tournaments_user_status ON tournaments(user_id, status);

CREATE TABLE tournament_participants (
  id            TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  avatar_id     TEXT REFERENCES avatars(id) ON DELETE SET NULL,
  -- snapshot:
  alias         TEXT NOT NULL,
  bow_category  TEXT NOT NULL,
  color         TEXT NOT NULL,
  experience    TEXT NOT NULL CHECK (experience IN ('escuela','senior')),
  -- asignación:
  stake         TEXT CHECK (stake IN ('roja','azul','amarilla') OR stake IS NULL),
  pair_index    INTEGER NOT NULL,
  pair_position TEXT NOT NULL CHECK (pair_position IN ('A','B')),
  -- rollups denormalizados:
  total_score   INTEGER NOT NULL DEFAULT 0,
  total_x       INTEGER NOT NULL DEFAULT 0,
  total_inner   INTEGER NOT NULL DEFAULT 0,
  total_tens    INTEGER NOT NULL DEFAULT 0,
  total_m       INTEGER NOT NULL DEFAULT 0,
  ends_completed INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_participants_tournament ON tournament_participants(tournament_id);

CREATE TABLE rounds (
  id            TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  seq           INTEGER NOT NULL,
  arrows_per_end INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','completa')),
  created_at    INTEGER NOT NULL,
  completed_at  INTEGER,
  UNIQUE (tournament_id, seq)
);

CREATE TABLE round_scores (
  id             TEXT PRIMARY KEY,
  round_id       TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
  tournament_id  TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  arrows         TEXT NOT NULL,              -- JSON: ["X","9","M",...] (len = arrows_per_end)
  end_total      INTEGER NOT NULL,
  x_count        INTEGER NOT NULL DEFAULT 0,
  inner_count    INTEGER NOT NULL DEFAULT 0,
  m_count        INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'completa' CHECK (status IN ('pendiente','completa')),
  updated_at     INTEGER NOT NULL,
  UNIQUE (round_id, participant_id)
);
CREATE INDEX idx_scores_round ON round_scores(round_id);
CREATE INDEX idx_scores_participant ON round_scores(participant_id);
```

## 3. API

Base `/api`. JSON. Auth por cookie de sesión; mutaciones requieren header `x-csrf-token`. Validación con Zod `.strict()`. **Ownership** verificado en cada endpoint (recurso debe pertenecer al user de la sesión). Errores con forma `{ error: { code, message, details? } }`.

### Auth (reutilizado)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | alias + password (+ pregunta/respuesta recuperación) |
| POST | `/auth/login` | inicia sesión, set-cookie |
| POST | `/auth/logout` | cierra sesión |
| GET | `/auth/me` | usuario actual o 401 |
| GET | `/auth/csrf` | asegura token CSRF |
| POST | `/auth/recover` | recuperación por pregunta |

### Catálogo
| GET | `/catalog` | `{ bowCategories, modalities, colors }` |

### Avatars
| GET | `/avatars` | lista (no archivados) |
| POST | `/avatars` | crea `{ alias, bowCategory, color, beginner }` |
| PATCH | `/avatars/:id` | edita |
| DELETE | `/avatars/:id` | archiva (`archived_at`) |

### Torneos
| POST | `/tournaments` | `{ name, modality, roundsCount, arrowsPerEnd, stakeMap?, distances?, avatarIds[] }` → crea torneo+participants+pares+rounds (transacción) |
| GET | `/tournaments?status=en_curso\|finalizado` | lista |
| GET | `/tournaments/:id` | detalle + resumen de tiradas + mini-podios (top 3) |
| POST | `/tournaments/:id/finish` | cierra (exige tiradas completas) |
| GET | `/tournaments/:id/podium` | general + por categoría + escuela |
| GET | `/tournaments/:id/stats` | estadísticas del torneo |
| GET | `/tournaments/:id/participants/:pid/stats` | estadísticas del participante |

### Tiradas / puntajes
| GET | `/tournaments/:id/rounds/:seq` | participantes ordenados por estaca/par/posición + scores + estado |
| PUT | `/tournaments/:id/rounds/:seq/scores/:participantId` | autosave end `{ arrows[] }`; valida, recalcula, actualiza rollups, marca tirada completa; **idempotente / editable** |

### Ejemplo: autosave
```http
PUT /api/tournaments/T1/rounds/3/scores/P5
x-csrf-token: <token>
Content-Type: application/json

{ "arrows": ["X","9","7"] }
```
```json
{ "score": { "endTotal": 26, "xCount": 1, "innerCount": 1, "mCount": 0, "status": "completa" },
  "round": { "seq": 3, "status": "pendiente" } }
```

## 4. Validación (contratos compartidos)

`@bv/shared/schemas/*` define los Zod (`.strict()`) usados por FE (form + tipos) y BE (parseo). Ej.: `RegisterInput`, `LoginInput`, `AvatarInput`, `TournamentInput`, `ScoreInput`. El BE nunca confía en valores derivados del cliente (`end_total`, contadores): los recalcula con `validateEndScore`.

## 5. Performance

- better-sqlite3 (síncrono, en proceso) + WAL; **prepared statements** cacheados.
- Índices: FKs, `(user_id,status)`, `(round_id)`, `(participant_id)`.
- **Rollups denormalizados** → podio/stats sin recomputar ends; actualización por delta en la transacción del autosave.
- FE: code-splitting por ruta (`React.lazy`), `memo` en filas de scoring, Tailwind (CSS mínimo), TanStack Query con `staleTime` + optimistic updates.
- PWA: precache de assets; `NetworkFirst` con timeout para GET `/api`.
- **Presupuestos:** carga de puntaje < 100 ms percibido (optimistic); navegación entre páginas < 1 s en 3G; podio/stats < 200 ms en servidor.

## 6. Convenciones de código

- TS strict; sin `any` salvo justificación.
- Capas BE estrictas: `routes → services → repositories`; nada de SQL fuera de `repositories`.
- Dominio en `shared` **sin I/O** (testeable de forma pura).
- Nombres: componentes `PascalCase`, hooks `useX`, archivos de dominio `camelCase`.
- Biome para lint+format; CI bloquea en fallo.

## 7. Testing

Ver `ACTION_PLAN.md` (tareas con tests) y resumen en este doc §1. Prioridad: cobertura alta del dominio (`@bv/shared`), integración de servicios críticos (creación de torneo, autosave, podio, finish), y un E2E del flujo completo.
