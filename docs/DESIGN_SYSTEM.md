# Sistema de diseño — BV Archery Battle

Mobile-first, elegante, claro y optimizado para smartphone. **Tema claro/oscuro** y **color base configurable**. Se **copia** el sistema de `bv-cross`/`bv-bow-sight` (tokens CSS + `data-theme` + acento derivado con contraste WCAG + persistencia + script anti-FOUC).

## 1. Tokens CSS (semánticos)

Definidos en `:root` (claro) y `[data-theme="dark"]` (oscuro). Mapeados a Tailwind vía `@theme`.

```css
:root {
  --bg:        /* fondo de app */;
  --surface:   /* tarjetas, inputs, modales */;
  --surface-2: /* hover, skeleton */;
  --border:    /* divisores, bordes */;
  --fg:        /* texto primario */;
  --muted:     /* texto secundario/labels */;
  --dim:       /* placeholders/terciario */;
  --primary:        /* color base (acento) */;
  --primary-strong: /* hover del acento */;
  --primary-soft:   /* fondo tenue del acento */;
  --on-primary:     /* texto sobre el acento (contraste WCAG) */;
  --danger:    ;
  --ok:        ;
}
[data-theme="dark"] { /* overrides con luminancia ajustada */ }
```

## 2. Color base (acento) configurable

- Paleta de **≥6 acentos** (ej. naranja, verde, azul, violeta, rojo, teal). El elegido se guarda en `localStorage` (`bv-accent`).
- A partir del hex base se **derivan** `--primary-strong`, `--primary-soft` y `--on-primary` calculando luminancia (fórmula WCAG) para garantizar contraste del texto en ambos temas.
- En tema oscuro se aclara el acento ~12% (mezcla hacia blanco).

## 3. Tema claro/oscuro

- `data-theme` en `<html>`; persistido en `localStorage` (`bv-theme`). Default: preferencia del sistema (`prefers-color-scheme`).
- **Anti-FOUC:** script inline en `index.html` que aplica `data-theme` y el acento **antes** de montar React.

## 4. Componentes base (`components/ui/`)

`Button` (primary/secondary/ghost/danger; sm/md/lg), `Input`, `Textarea`, `Select`, `Card`, `Label`, `FieldError`, `FieldHint`, `Modal`, `ConfirmDialog`, `SegmentedControl`, `Spinner`, `EmptyState`. Todos usan **tokens** (`bg-surface`, `text-muted`, `bg-primary`…), sin colores hardcodeados.

## 5. Componentes de dominio

- **`ScoreKeypad`** — botonera con el set de la modalidad (`X 10 9 … 1 M` / `6 … M` / `11 10 8 5 M`); targets grandes (≥44px); llena flechas en orden descendente.
- **`EndRow`** — fila por flecha con su valor; muestra total del end.
- **`PairCard`** — par A/B con **indicador de color de estaca** (roja/azul/amarilla) y datos del arquero.
- **`PodiumCard`** — 1.º/2.º/3.º destacados + listado.
- **`StatTile`** — métrica con label y valor.
- **`AvatarChip`** — alias + color + categoría.

## 6. Colores de avatar (paleta fija ≥10)

Set de ≥10 colores con buen contraste en ambos temas (sembrados en tabla `colors`). Sugerencia de paleta:

| key | label | hex (aprox.) |
|---|---|---|
| red | Rojo | #E5484D |
| orange | Naranja | #F76808 |
| amber | Ámbar | #FFB224 |
| yellow | Amarillo | #F5D90A |
| green | Verde | #30A46C |
| teal | Teal | #12A594 |
| blue | Azul | #0091FF |
| indigo | Índigo | #3E63DD |
| violet | Violeta | #8E4EC6 |
| pink | Rosa | #E93D82 |
| slate | Pizarra | #7B8497 |
| brown | Marrón | #AD7F58 |

Cada color se usa como acento del avatar en chips, filas de scoring y podios.

## 7. Layout y UX móvil

- One-hand reach: acciones primarias abajo; navegación con `AppShell` (header compacto + back).
- Targets táctiles ≥44px; `:focus-visible` siempre visible; labels asociadas; `inputmode="numeric"` donde aplique.
- Transiciones sutiles; estados de carga con `Spinner`/skeleton; `EmptyState` para listas vacías.
- Densidad pensada para cargar puntajes rápido entre tiradas.

## 8. Accesibilidad

- Contraste AA mínimo (texto y acento sobre fondos).
- Navegación por teclado y lectores de pantalla en formularios y keypad.
- Revisar con skills **web-design-guidelines** y **frontend-design**.

## 9. PWA / branding

- Manifest `standalone`, `orientation: portrait`, `theme_color`/`background_color` acordes al tema.
- Iconos `192/512` + `maskable-512`, favicon SVG. Logo propio (ver `bv-logos`).
