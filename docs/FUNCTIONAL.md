# Documentación funcional — BV Archery Battle

## 1. Objetivo

Permitir a un usuario (organizador/arquero) crear y gestionar **torneos amistosos de práctica** de arquería, cargar puntajes en formato World Archery (WA), cerrar el torneo y consultar **podios** y **estadísticas**. La app es una **PWA mobile-first** para pocos usuarios; la prioridad es la **velocidad y agilidad durante el torneo**.

## 2. Actores

- **Usuario / organizador:** crea cuenta, gestiona avatares, crea torneos, carga puntajes, consulta resultados.
- **Participantes (avatares):** no tienen cuenta; son entidades reutilizables creadas por el usuario. No interactúan con la app.

## 3. Conceptos

| Término | Definición |
|---|---|
| **Avatar** | Participante reutilizable (alias, categoría de arco, color, experiencia). No requiere registro. |
| **Torneo** | Competencia de una modalidad, con N tiradas, M flechas por tirada y un conjunto de participantes. |
| **Tirada** | Cada serie de flechas que tiran los participantes y para la que se anotan puntajes (WA: *end*). |
| **Modalidad** | Sala, Aire libre, Juegos de campo, 3D. Define flechas por tirada y valores de puntaje. |
| **Categoría** | Tipo de arco: compuesto, cazador, raso, recurvo olímpico, recurvo tradicional, longbow. |
| **Experiencia** | `escuela` (principiante) o `senior` (por defecto). Define el podio de escuela. |
| **Estaca** | Posición/distancia de tiro en Campo/3D: roja (más lejos), azul (media), amarilla (más cerca). |
| **Par** | Dos arqueros que comparten blanco; definen orden de tiro (posición A/B). |
| **Podio** | Ranking de resultados: general, por categoría y de escuela. |

## 4. Reglas de negocio

### 4.1 Cuentas
- Registro e ingreso **solo con alias + password** (reutiliza el flujo de `bv-cross`/`bv-bow-sight`). Recuperación por pregunta de seguridad. Un servicio de autenticación externo queda para una segunda instancia.

### 4.2 Avatares
- Campos: **alias** (texto, obligatorio), **arco/categoría** (selector, obligatorio), **color** (selector, ≥10 variantes, obligatorio), **principiante** (checkbox; activado → experiencia `escuela`, desactivado → `senior`, por defecto desactivado).
- Los avatares se **guardan y reutilizan** entre torneos. Editar/borrar un avatar **no** altera torneos pasados (se guarda un *snapshot* al crear el torneo).

### 4.3 Torneos
- Campos: **nombre** (obligatorio), **modalidad** (obligatoria), **tiradas** (número, def. 10), **flechas por tirada** (número; default según modalidad — ver `DOMAIN_WA.md`), **participantes** (agregar avatares existentes o crear uno nuevo *inline* sin abandonar la creación).
- Al crear el torneo:
  1. Se toma *snapshot* de cada participante.
  2. Se **asigna estaca** a cada arquero según su categoría (mapeo WA editable; solo Campo/3D — en Sala/Aire libre todos a la misma distancia).
  3. Se **arman los pares** intentando emparejar dentro de la misma estaca; sobrante → trío. Se asigna posición A/B.
  4. Se generan las **tiradas** 1..N.
- Un torneo nace **en curso**; pasa a **finalizado** cuando todas las tiradas están completas y el usuario lo cierra.

### 4.4 Carga de puntajes (tirada)
- Los participantes se muestran **ordenados por par y estaca**, con el **color de estaca** visible (orden y distancia de tiro).
- Se carga el puntaje de cada flecha con el **set de valores de la modalidad** (p. ej. Sala/Aire libre: `X,10,9…1,M`). Formato WA: flechas en orden **descendente**; `M` = miss; `X` = inner-10.
- Los datos se **guardan a medida que se cargan** (autosave por participante). Al completar todos, la tirada pasa a **completa** y se habilita la siguiente.
- Las tiradas completas pueden **editarse** (recalcula totales).
- El servidor **valida** cada end con las reglas WA y **recalcula** los totales (no confía en el cliente).

### 4.5 Cierre y resultados
- Con todas las tiradas completas, el usuario **cierra** el torneo y accede a Podios.
- Los torneos **finalizados** se reabren desde Home para revisar podios y estadísticas.

## 5. Podios

Tres podios, cada uno con 1.º/2.º/3.º resaltados y listado completo del resto:

1. **General** — todos los participantes por puntaje, sin considerar experiencia ni categoría.
2. **Por categoría (tipo de arco)** — ranking dentro de cada categoría presente.
3. **Escuela** — solo participantes con experiencia `escuela`, sin discriminar por categoría.

Desempate: ver `DOMAIN_WA.md` §Desempate.

## 6. Estadísticas

### 6.1 Del torneo
Cantidad de M, cantidad de X, **puntaje promedio** general y por categoría, **mejor puntaje** general y por categoría, distribución de impactos, y otra info relevante (p. ej. promedio por tirada).

### 6.2 Del participante (en ese torneo)
Cantidad de M, cantidad de X, puntaje promedio (por flecha/tirada), **mejor tirada**, **evolución** por tirada, consistencia.

## 7. Páginas y navegación

| Página | Ruta | Resumen |
|---|---|---|
| Inicio (landing) | `/` | Pública; CTA a ingreso/registro. |
| Ingreso | `/login` | Alias + password. |
| Registro | `/register` | Crear cuenta (alias + password + pregunta de recuperación). |
| Home | `/home` | Torneos en curso y finalizados; navegar a crear torneo y crear avatar. |
| Crear avatar | `/avatars/new` | Formulario de avatar. |
| Crear torneo | `/tournaments/new` | Formulario + selección/alta de participantes. |
| Torneo | `/tournaments/:id` | Lista de tiradas (estado, editar), mini-podios, acceso a Podios al completar. |
| Tirada | `/tournaments/:id/rounds/:seq` | Carga de puntajes por pares con color de estaca; autosave. |
| Podios | `/tournaments/:id/podium` | Los 3 podios. |
| Estadísticas torneo | `/tournaments/:id/stats` | Métricas generales del torneo. |
| Estadísticas participante | `/tournaments/:id/participants/:pid/stats` | Métricas del arquero en el torneo. |

### Flujo principal
`Registro/Ingreso → Home → (Crear avatares) → Crear torneo → Torneo → Tirada × N (autosave) → Cerrar → Podios / Estadísticas`.

## 8. Criterios de aceptación (resumen)

- Crear cuenta con alias+password e ingresar.
- Crear avatares con las 6 categorías y ≥10 colores; principiante marca `escuela`.
- Crear torneo de cualquiera de las 4 modalidades con flechas por defecto correctas.
- En Campo/3D: estacas asignadas por categoría y pares armados por estaca.
- Cargar puntajes en formato WA (incl. X y M) con autosave; tirada se marca completa y habilita la siguiente; ends editables.
- Cerrar torneo solo con todas las tiradas completas.
- Ver los 3 podios con orden y desempates correctos.
- Ver estadísticas de torneo y de participante.
- Reabrir torneos finalizados desde Home.
- Tema claro/oscuro y cambio de color base. PWA instalable. Uso fluido en smartphone.
