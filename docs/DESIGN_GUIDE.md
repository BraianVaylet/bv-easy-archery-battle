## 1. FILOSOFÍA DE DISEÑO

### Principios Clave
- **Brutalism táctico**: Bordes limpios, sin decoración innecesaria
- **Tipografía como arquitectura**: La forma dice más que decoración
- **Motion con propósito**: Solo para feedback o guiar atención
- **Dark-first workflow**: Diseña dark mode primero, light mode es adaptación
- **Accesibilidad como base**: No es feature, es infraestructura
- **Legibilidad máxima**: Contraste alto, espaciado generoso

---

## 2. ESPECIFICACIONES TÉCNICAS

### Paleta de Colores

#### Dark Mode (PRIMARY)
```css
/* Fondos */
--bg-primary: #0a0a0a      /* Canvas principal */
--bg-secondary: #1a1a1a    /* Cards, paneles */
--bg-tertiary: #2d2d2d     /* Hover states */

/* Texto */
--text-primary: #ffffff    /* Máximo contraste */
--text-secondary: #b0b0b0  /* Secundario */
--text-muted: #707070      /* Disabled, placeholder */

/* Accents */
--accent-primary: #6366f1  /* Indigo - acciones */
--accent-secondary: #8b5cf6 /* Púrpura - estados */

/* Utility */
--border: #404040
--divider: #262626
--success: #10b981
--warning: #f59e0b
--error: #ef4444
```

#### Light Mode (ADAPTATION)
```css
--bg-primary: #ffffff
--bg-secondary: #f9f9f9
--bg-tertiary: #f0f0f0
--text-primary: #000000
--text-secondary: #595959
--text-muted: #999999
--border: #d0d0d0
```

### Tipografía

```css
/* Stack recomendado - Google Fonts */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Variable font (1 archivo en lugar de 6-8) */
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap');
```

**Escala tipográfica:**
```
Display:   48px / weight 600 / line-height 1.2
Heading 1: 36px / weight 600 / line-height 1.25
Heading 2: 28px / weight 600 / line-height 1.3
Heading 3: 24px / weight 600 / line-height 1.35
Body:      16px / weight 400 / line-height 1.5
Small:     14px / weight 400 / line-height 1.4
Tiny:      12px / weight 400 / line-height 1.3
```

### Espaciado (8px base)

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-7: 48px
--space-8: 64px
```

### Bordes y Radio

```css
--radius-none: 0px
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--border-width: 1px
--border-style: solid
```

### Sombras (Mínimas)

```css
/* Solo cuando hay depth real, no decorativo */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.15)
```

---

## 3. COMPONENTES CLAVE

### 3.1 Card/Panel Base

```jsx
export function Card({ children, className = '' }) {
  return (
    <div className={`
      bg-secondary border border-border rounded-md p-4
      ${className}
    `}>
      {children}
    </div>
  );
}
```

### 3.2 Button (Brutal Style)

```jsx
export function Button({ 
  children, 
  variant = 'primary',  // primary | secondary | ghost
  size = 'md',          // sm | md | lg
  disabled = false,
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'bg-accent-primary text-white hover:bg-accent-primary/90',
    secondary: 'border border-border text-primary hover:bg-tertiary',
    ghost: 'text-secondary hover:text-primary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        font-medium rounded-sm
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 3.3 Input (Minimal Border)

```jsx
export function Input({ 
  placeholder = '',
  value = '',
  onChange,
  type = 'text',
  className = '',
  ...props 
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`
        w-full px-3 py-2
        bg-tertiary border border-border
        text-primary placeholder:text-muted
        rounded-sm
        focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
        transition-colors duration-150
        ${className}
      `}
      {...props}
    />
  );
}
```

### 3.4 Navigation/Header (Brutalist)

```jsx
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-border">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-primary rounded-sm flex items-center justify-center">
            <span className="text-white text-sm font-bold">BV</span>
          </div>
          <span className="text-primary font-semibold text-lg">Invest</span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-6 text-sm">
          <a href="#" className="text-secondary hover:text-primary transition-colors">Dashboard</a>
          <a href="#" className="text-secondary hover:text-primary transition-colors">Portfolio</a>
          <a href="#" className="text-secondary hover:text-primary transition-colors">Settings</a>
        </div>
      </nav>
    </header>
  );
}
```

### 3.5 Data Table (Bento-style)

```jsx
export function DataTable({ columns, data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th 
                key={col.key}
                className="text-left px-4 py-3 text-secondary font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={idx}
              className="border-b border-divider hover:bg-tertiary transition-colors duration-150"
            >
              {columns.map(col => (
                <td 
                  key={col.key}
                  className="px-4 py-3 text-primary"
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 3.6 Alert/Notification (Sin decoración)

```jsx
export function Alert({ type = 'info', children }) {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    success: 'bg-success/10 border-success/20 text-green-300',
    warning: 'bg-warning/10 border-warning/20 text-yellow-300',
    error: 'bg-error/10 border-error/20 text-red-300',
  };

  return (
    <div className={`
      px-4 py-3 rounded-sm border text-sm
      ${styles[type]}
    `}>
      {children}
    </div>
  );
}
```

---

## 4. LAYOUT PATTERNS

### 4.1 Main Grid (Responsive)

```jsx
export function MainLayout({ sidebar, children }) {
  return (
    <div className="flex min-h-screen bg-primary">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border flex-col p-6 gap-6">
        {sidebar}
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### 4.2 Bento Grid (Dashboard)

```jsx
export function BentoGrid({ items }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <Card 
          key={idx}
          className={`${item.colSpan ? `md:col-span-${item.colSpan}` : ''}`}
        >
          {item.content}
        </Card>
      ))}
    </div>
  );
}
```

### 4.3 Form Layout (Vertical Stack)

```jsx
export function Form({ onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      {children}
    </form>
  );
}

export function FormField({ label, error, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-primary">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
```

---

## 5. TAILWIND V4 CONFIG

```js
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      bg: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
      },
      text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      },
      accent: {
        primary: 'var(--accent-primary)',
        secondary: 'var(--accent-secondary)',
      },
      border: 'var(--border)',
      divider: 'var(--divider)',
    },
    spacing: {
      0: '0',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      5: 'var(--space-5)',
      6: 'var(--space-6)',
      7: 'var(--space-7)',
      8: 'var(--space-8)',
    },
    borderRadius: {
      none: 'var(--radius-none)',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 6. CSS VARIABLES GLOBAL

```css
/* styles/globals.css */

@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap');

:root {
  /* Dark Mode (Default) */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #707070;
  --accent-primary: #6366f1;
  --accent-secondary: #8b5cf6;
  --border: #404040;
  --divider: #262626;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  
  /* Border Radius */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Motion */
  --duration-150: 150ms;
  --duration-300: 300ms;
  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f9f9f9;
    --bg-tertiary: #f0f0f0;
    --text-primary: #000000;
    --text-secondary: #595959;
    --text-muted: #999999;
    --border: #d0d0d0;
    --divider: #e8e8e8;
  }
}

* {
  @apply transition-colors duration-150;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Reducir motion para usuarios que lo solicitan */
@media (prefers-reduced-motion: reduce) {
  * {
    @apply transition-none !important;
    @apply animation-none !important;
  }
}
```

---

## 7. MOTION GUIDELINES

### Permitido (con propósito)
✅ Button state changes (50-150ms)  
✅ Loading indicators (smooth loop)  
✅ Entrance animations (items aparecen cuando se cargan)  
✅ Hover feedback (color change, subtle scale)  

### Prohibido (decorativo)
❌ Parallax scrolling  
❌ Excessive bounce/wiggle  
❌ Auto-playing video backgrounds  
❌ Confetti, sparkles, decorative particles  

### Patrón de Motion

```jsx
/* Para entrance */
className="animate-in fade-in duration-300"

/* Para hover */
className="hover:bg-tertiary hover:scale-105 transition-all duration-150"

/* Loading indicator */
className="animate-spin"

/* Fade out */
className="animate-out fade-out duration-200"
```

---

## 8. PASOS PARA PASAR A UN MODELO

### Paso 1: Prepara el Briefing

Copia esto en tu chat con Claude:

```markdown
# Briefing: Rediseño UI [Proyecto BV]

## Proyecto
- Nombre: [ej: BV Invest]
- Stack: React + Tailwind v4 + Hono + SQLite
- Objetivo: Implementar diseño estilo Claude (brutalism, dark-first, motion mínima)

## Archivos que necesito
1. Componentes reutilizables (Button, Card, Input, Alert, etc.)
2. Layout principal con sidebar
3. Landing/Dashboard page example
4. CSS variables setup en globals.css
5. Tailwind config actualizado

## Especificaciones
- Dark mode primary
- Paleta: Indigo accent (#6366f1)
- Tipografía: Inter variable
- Bordes: 1px solid, radio-sm (4px) máximo
- No sombras decorativas
- Benton Grid para datos complejos
- Accesibilidad WCAG AA mínimo

## Referencia de diseño
Ver: [Link a tu proyecto actual]

## Entregables
- [ ] Componentes base (Button, Card, Input, Header)
- [ ] Layout responsivo
- [ ] Dark/Light mode toggle
- [ ] Página de ejemplo con tabla de datos
```

### Paso 2: Comparte Archivos de Contexto

```bash
# En tu proyecto, crea una carpeta con refs
/design-refs/
  ├── claude-screenshot.png    # Captura UI
  ├── current-design.jsx       # Tu código actual
  ├── current-colors.css       # Colores actuales
  └── figma-link.txt           # Link a diseño
```

Sube estos archivos al chat.

### Paso 3: Prompt Detallado para el Modelo

```markdown
Necesito rediseñar [componente/página] siguiendo este patrón:

**Referencia Visual:** Claude.ai  
**Stack:** React + Tailwind v4  
**Restricciones:**
- Bordes 1px, radio ≤ 4px
- No drop shadows
- Dark mode first
- Max 3 colores + neutrals
- Motion solo para feedback

**Componentes a crear:**
1. Header (nav bar brutalist)
2. Card component (base para contenido)
3. Button variants (primary, secondary, ghost)
4. Input field (minimal)
5. Data table example

**Comportamiento:**
- Hover: cambio sutil de color, no escala
- Focus: ring outline, no shadow
- Disabled: opacity-50
- Responsive: mobile-first

**Referencia de código:**
[Pega tu código actual aquí]

Entrégame:
- Código JSX completo
- CSS variables si es necesario
- Tailwind classes documentadas
```

### Paso 4: Refina Iterativamente

Después de la primera entrega:

```markdown
Pequeños ajustes:
1. El header border es muy oscuro, hazlo más sutil
2. El button padding parece pequeño, aumenta a py-2
3. El input no tiene enough contrast en dark mode
4. Necesito un variant "danger" para el button

[Adjunta screenshot actual]
```

---

## 9. CHECKLIST DE IMPLEMENTACIÓN

### Visual
- [ ] Dark mode implementado como default
- [ ] Light mode hace uso de @media prefers-color-scheme
- [ ] Tipografía Inter v4 cargada desde Google Fonts
- [ ] Paleta limitada (max 4 colores principales)
- [ ] Bordes 1px sólidos, radio ≤ 4px
- [ ] Sombras mínimas o inexistentes
- [ ] Espaciado consistente (múltiplos de 4px)

### Interacción
- [ ] Buttons tienen :hover, :active, :disabled states
- [ ] Inputs tienen focus ring (no shadow)
- [ ] Loading estados visibles (spinners, text feedback)
- [ ] Motion respeta prefers-reduced-motion
- [ ] Acciones permanecen en contexto (no full page navs)

### Accesibilidad
- [ ] WCAG AA contrast ratios (4.5:1 texto normal, 3:1 large text)
- [ ] Heading hierarchy correcta (h1 > h2 > h3)
- [ ] Botones con :focus visible
- [ ] Inputs con labels asociados
- [ ] Alt text en imágenes
- [ ] Semantic HTML (button vs div)

### Performance
- [ ] Tipografía variable (1 archivo vs 6-8)
- [ ] CSS sin inline styles
- [ ] Tailwind purged de classes no usadas
- [ ] No custom JS para animaciones comunes
- [ ] Imágenes optimizadas

---

## 10. EJEMPLO COMPLETO (Dashboard Page)

```jsx
// pages/Dashboard.jsx
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';

export default function Dashboard() {
  const portfolioData = [
    { asset: 'AAPL', shares: 100, price: 180.50, value: 18050 },
    { asset: 'MSFT', shares: 50, price: 420.30, value: 21015 },
  ];

  return (
    <div className="min-h-screen bg-primary">
      <Header />
      
      <main className="max-w-7xl mx-auto p-6">
        
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-primary mb-2">
            Portfolio
          </h1>
          <p className="text-secondary">
            Overview de tu inversión
          </p>
        </div>

        {/* KPI Cards - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-sm text-muted mb-2">Total Value</p>
            <p className="text-3xl font-bold text-primary">$39,065</p>
            <p className="text-xs text-success mt-2">+12.5% YTD</p>
          </Card>
          
          <Card>
            <p className="text-sm text-muted mb-2">Gain/Loss</p>
            <p className="text-3xl font-bold text-primary">+$3,240</p>
            <p className="text-xs text-secondary mt-2">+9.1% total return</p>
          </Card>
          
          <Card>
            <p className="text-sm text-muted mb-2">Last Updated</p>
            <p className="text-lg font-mono text-secondary">Today 4:32 PM</p>
            <Button 
              variant="secondary" 
              size="sm"
              className="mt-3 w-full"
            >
              Refresh
            </Button>
          </Card>
        </div>

        {/* Holdings Table */}
        <Card>
          <h2 className="text-lg font-semibold text-primary mb-4">
            Holdings
          </h2>
          <DataTable 
            columns={[
              { key: 'asset', label: 'Asset' },
              { key: 'shares', label: 'Shares' },
              { key: 'price', label: 'Price' },
              { key: 'value', label: 'Value' },
            ]}
            data={portfolioData}
          />
        </Card>

      </main>
    </div>
  );
}
```

---

## 11. RECURSOS

**Documentación:**
- Tailwind v4: https://tailwindcss.com/docs
- Inter Font: https://fonts.google.com/specimen/Inter
- WCAG Accessibility: https://www.w3.org/WAI/WCAG21/quickref/

**Herramientas:**
- Contrast checker: https://webaim.org/resources/contrastchecker/
- CSS vars generator: https://chir.ag/projects/ntc/
- Motion testing: https://github.com/emilkowalski/css-motion-parser

---

