# Admin UI theme — Tailwind + bits-ui

Unified look for WHMCS addon SPAs. **Required** when scaffolding an admin SPA.

## Stack

| Layer | Package | Role |
|-------|---------|------|
| Utilities | `tailwindcss` + `@tailwindcss/vite` (v4) | Layout, spacing, colors via utilities + CSS vars |
| Behavior / a11y | `bits-ui` (+ peer `@internationalized/date`) | Dialog, Tabs, Select, DropdownMenu, etc. |
| Look API | `src/lib/ui/*` wrappers | One component per role; views never invent chrome |

**Do not** add daisyUI, Headless UI (`@headlessui/*`), or Skeleton Labs. bits-ui is unstyled — wrappers apply Tailwind using the tokens below.

## Install

```bash
cd admin-ui
pnpm add bits-ui @internationalized/date @tanstack/svelte-query
pnpm add -D tailwindcss @tailwindcss/vite
```

Wire Vite (see `admin-spa.md`):

```ts
import tailwindcss from '@tailwindcss/vite';
plugins: [tailwindcss(), svelte()],
```

Import once from the app entry:

```ts
// main.ts
import './app.css';
```

## Design tokens (`src/app.css`)

Custom **`whmcs`** tokens — light, compact, WHMCS-admin friendly. Accent matches existing addons (`#0d6efd`).

```css
@import "tailwindcss";

@theme {
  --font-sans: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;

  --color-whmcs-bg: #ffffff;
  --color-whmcs-surface: #f8fafc;
  --color-whmcs-border: #e5e7eb;
  --color-whmcs-muted: #6b7280;
  --color-whmcs-fg: #1f2937;
  --color-whmcs-primary: #0d6efd;
  --color-whmcs-primary-fg: #ffffff;
  --color-whmcs-danger: #dc2626;
  --color-whmcs-danger-fg: #ffffff;
  --color-whmcs-ok: #15803d;
  --color-whmcs-ok-bg: #dcfce7;
  --color-whmcs-warn: #a16207;
  --color-whmcs-warn-bg: #fef9c3;
  --color-whmcs-bad: #b91c1c;
  --color-whmcs-bad-bg: #fee2e2;
  --color-whmcs-info-bg: #e0f2fe;

  --radius-whmcs: 0.375rem;
}

@layer base {
  html,
  body {
    margin: 0;
    font-family: var(--font-sans);
    color: var(--color-whmcs-fg);
    background: var(--color-whmcs-bg);
    font-size: 14px;
  }
}

/* Skeleton shimmer — used by TableSkeleton / pulse bars */
@keyframes whmcs-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.whmcs-skeleton-bar {
  display: inline-block;
  height: 0.75rem;
  max-width: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #eef1f5 0%, #f7f8fa 45%, #eef1f5 90%);
  background-size: 200% 100%;
  animation: whmcs-shimmer 1.2s ease-in-out infinite;
}
```

Extend `@theme` only when the whole addon needs a new shared color — not for one-off views.

## bits-ui usage rule

Import primitives **only inside** `src/lib/ui/*` wrappers (e.g. `Modal.svelte` → `Dialog`, `Tabs.svelte` → `Tabs`). Views import the wrapper, not `bits-ui` directly. That keeps a11y + look in one place.

Style bits parts with Tailwind classes on `Dialog.Content`, `Tabs.Trigger`, etc. Prefer CSS vars / `whmcs-*` theme colors over hard-coded hex in components (accent `#0d6efd` already lives in tokens).

## Density

Admin tables: ~13px body, compact padding (`px-2 py-2`). Match WHMCS admin density — not a marketing landing page.

## Scaffold checklist (theme)

1. Copy `templates/admin-ui/` → project `admin-ui/`.
2. Replace `<Name>` in `vite.config.ts` `base` / `outDir`.
3. Confirm `app.css` imported from `main.ts`.
4. Confirm `@tailwindcss/vite` in Vite plugins.
5. Build once; fix peer deps if bits-ui complains about `@internationalized/date`.
