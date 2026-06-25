# Dominio — Reglamento World Archery (WA) aplicado

Reglas WA que el sistema implementa. La lógica vive en `@bv/shared` (pura, testeable, compartida FE/BE). El servidor es la **autoridad**: deriva el valor de cada flecha desde su token y valida/recalcula totales.

Fuentes:
- [World Archery — Rulebook](https://www.worldarchery.sport/rulebook)
- [World Archery — Field archery](https://www.worldarchery.sport/sport/disciplines/field-archery)
- [World Archery — Target archery](https://www.worldarchery.sport/sport/disciplines/target-archery)
- [Archery Scoring — ArcheryBuddy](https://www.archerybuddy.app/articles/archery-scoring-rules-guide)

## 1. Modalidades

| Modalidad | `key` | Flechas/tirada (default) | Set de valores (descendente) | Máx/flecha | Token inner (desempate) |
|---|---|---|---|---|---|
| Sala (indoor) | `sala` | **3** | `X 10 9 8 7 6 5 4 3 2 1 M` | 10 | `X` |
| Aire libre (outdoor) | `aire_libre` | **6** | `X 10 9 8 7 6 5 4 3 2 1 M` | 10 | `X` |
| Juegos de campo (field) | `campo` | **3** | `6 5 4 3 2 1 M` | 6 | inner-6 (`X6`)* |
| 3D | `3d` | **2** | `11 10 8 5 M` | 11 | `11` |

\* El inner-6 (X de campo) es opcional para desempate; si no se modela, se usa el conteo de 6.

### Valor canónico por token

```
X   -> 10   (y suma a x_count / inner_count)
M   -> 0    (y suma a m_count)
11  -> 11   (3D; suma a inner_count)
n   -> n    (entero del token)
```

`maxEndScore(modality, arrows) = arrows * maxPerArrow`.

## 2. Notación de carga (formato WA)

- Las flechas de una tirada se registran **de mayor a menor** (ej. `9,9,9,5,3,M`).
- `M` (miss) = flecha sin puntaje.
- `X` = impacto en el anillo interno del 10 (vale 10; cuenta como X para desempate).
- Cada tirada acumula un **total de end** y un **acumulado** (running total) del torneo.

## 3. Categorías de arco

`compuesto`, `cazador`, `raso`, `recurvo_olimpico`, `recurvo_tradicional`, `longbow`.

> Nota: `cazador` (bowhunter) y `raso` (barebow) provienen del uso de campo/3D en federaciones hispanohablantes; se mantienen como categorías propias de la app. WA Field internacional reconoce recurvo, compuesto y barebow; el mapeo de estacas se ofrece **editable** para adaptarse al reglamento del club.

## 4. Estacas y distancias (solo Campo / 3D)

Estacas por cercanía al blanco: **roja** (más lejos) › **azul** (media) › **amarilla** (más cerca).

### Mapeo por defecto (editable por torneo)

| Estaca | Categorías por defecto | Distancias WA de referencia |
|---|---|---|
| `roja` | compuesto, recurvo_olimpico | marcadas 10–60 m |
| `azul` | raso, cazador | marcadas 5–50 m |
| `amarilla` | recurvo_tradicional, longbow | distancias más cortas |

- En **Sala/Aire libre**: `estaca = null` (todos a la misma distancia: sala 18 m; aire libre según ronda).
- Las distancias por estaca son **informativas** (no afectan el cálculo de puntaje); se guardan por torneo.

## 5. Pareo de arqueros

Objetivo: **armar pares por estaca siempre que sea posible**.

```
1. Agrupar participantes por estaca (roja, azul, amarilla; o grupo único si sala/aire libre).
2. Ordenar cada grupo de forma determinista (por categoría, luego alias).
3. Emparejar de a 2 dentro del grupo.
4. Si un grupo queda con 1 sobrante:
   - combinarlo al final con otros sobrantes formando pares/tríos.
5. Asignar pair_index incremental y posición A/B por par (A tira primero).
```

Resultado **determinista** (mismo input → mismo pareo).

## 6. Ranking y desempate

Orden de clasificación (mayor a menor):

1. **Puntaje total** (desc).
2. **Cantidad de inner** (desc): `X` en sala/aire libre, `11` en 3D, inner-6 en campo.
3. **Cantidad de 10** (desc) — donde aplique.
4. **Menor cantidad de `M`**.

Si persiste el empate → **puesto compartido** (ambos en la misma posición).

## 7. Validación de un end (`validateEndScore`)

Dado `{ modality, arrowsPerEnd, arrows[] }`:

- `arrows.length === arrowsPerEnd`.
- Cada token ∈ set de valores de la modalidad.
- Cada valor numérico ∈ `[0, maxPerArrow]`.
- `end_total = Σ valor(token)` y `0 ≤ end_total ≤ maxEndScore`.
- Recalcular `x_count` / `inner_count` / `m_count` desde los tokens.

Errores tipados: `ARROW_COUNT`, `INVALID_TOKEN`, `SCORE_RANGE`. (Portar de `bv-archery/packages/shared/src/scoring.ts`, adaptando los sets de valores por modalidad.)

## 8. Estadísticas derivadas

- **Por participante:** total, promedio por flecha y por tirada, mejor tirada, `x_count`, `m_count`, evolución por tirada, distribución por anillo.
- **Por torneo:** total de M, total de X, promedio general y por categoría, mejor puntaje general y por categoría, distribución agregada.

Todas se calculan desde `round_scores` o desde los **rollups denormalizados** de `tournament_participants` (ver `TECHNICAL.md`).
