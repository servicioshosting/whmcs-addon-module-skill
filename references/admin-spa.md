# Admin SPA — Vite, iframe, API, TanStack Query

Source lives in repo-root `admin-ui/` (own pnpm workspace). Build output lands **inside** the module so only built files deploy.

Scaffold by copying `templates/admin-ui/` and replacing `<Name>` / `<Prefix>` / display name. Theme, components, and list patterns: see sibling docs in this folder.

## Vite

```ts
// admin-ui/vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  base: '/modules/addons/<Name>/assets/admin/',
  build: {
    outDir: '../addons/<Name>/assets/admin',
    emptyOutDir: true,
  },
  server: { port: 5173 },
});
```

Deps under `admin-ui/`: `svelte`, `@sveltejs/vite-plugin-svelte`, `vite`, `typescript`, `svelte-check`, **`@tanstack/svelte-query`**, **`tailwindcss`**, **`@tailwindcss/vite`**, **`bits-ui`**, `@internationalized/date` (bits-ui peer). See `admin-ui-theme.md`.

Build before deploy: `(cd admin-ui && pnpm install && pnpm run check && pnpm run build)`.

## Data layer: always TanStack Svelte Query

SPA views must **not** hand-roll `onMount` + manual `loading` / `busy` / `data` for primary content. Reads → `createQuery`; writes → `createMutation` + cache invalidate/patch.

Transport stays a thin `src/lib/api.ts` (CSRF + `request(op)` + `bootstrap`). Views call query helpers that wrap that transport — no view-local `fetch`.

```ts
// admin-ui/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/svelte-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true },
  },
});
```

```ts
// admin-ui/src/App.svelte — wrap root
import { QueryClientProvider } from '@tanstack/svelte-query';
import { queryClient } from './lib/queryClient';
// <QueryClientProvider client={queryClient}> … </QueryClientProvider>
```

```ts
// admin-ui/src/lib/queryKeys.ts — stable keys
export const queryKeys = {
  bootstrap: ['bootstrap'] as const,
  items: (filters: object) => ['items', filters] as const,
  item: (id: string | number) => ['items', 'detail', id] as const,
};
```

Bootstrap once at shell init via `createQuery` (or one `queryClient.fetchQuery` before views). Keep CSRF token module-private in `api.ts`. Mutation `onSuccess` / `onError` drive toasts through Notyf (`[Display Name]` prefix). Do not dual-source query results into parallel local copies.

## API client sketch

```ts
const API_BASE = new URL('../../controllers/admin.php', window.location.href).toString();
let csrfToken: string | null = null;

export function bootstrap(): Promise<BootstrapData> {
  return request<BootstrapData>('bootstrap').then((data) => {
    csrfToken = data.csrf;
    return data;
  });
}

async function request<T>(op: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (csrfToken) headers.set('X-<Prefix>-CSRF', csrfToken);
  if (options.method === 'POST') {
    headers.set('Content-Type', 'application/json');
  }
  const url = new URL(API_BASE);
  url.searchParams.set('op', op);
  // GET: merge options.params onto searchParams (skip empty)
  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err: any = new Error('Request failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}
```

Safe GETs skip CSRF server-side; mutations require the header. Match PHP `controllers/admin.php` ops.

## Iframe bridge

PHP shell listens for **`<Prefix>:height` only** — resize the iframe. SPA emits height via `templates/admin-ui/src/lib/size.ts` (`watchHeight` / `notifyHeight`). Guard with `IN_IFRAME = window.top !== window` so `pnpm/npm run dev` works standalone.

**Do not** emit or handle `<Prefix>:navigation` / `pushHistory` that rewrites the parent WHMCS `?view=` query. With `getNavWindow()` the SPA already writes the **parent** `#view=…` hash; a second `?view=` sync fights that router (tabs/filters break). Accounts Miner hit this bug; fix is height-only shell + hash routing.

Iframe `src`: `assets/admin/index.html?v={mtime}#view={default}` — cache-bust query, seed tab in iframe hash. On first paint `ensureRoute` / `readRoute` copy that into the parent hash when empty (also accept legacy iframe `?view=`).

## Flash / toasts

Bootstrap returns `messages` (from `FlashMessages::consume()`). Toast helper prefixes `[Display Name]` like PHP `FlashMessages::label()`. Prefer iframe-local Notyf (CDN in SPA `index.html`) so standalone `pnpm/npm run dev` works; fall back to `parent.notyf` when useful. See main skill **Flash messages**.

## Router

Tiny hash router in `src/lib/router.ts`: `#view=<tab>&…params`. Prefer parent-window hash when same-origin iframe (`getNavWindow`). Views in `src/views/*.svelte`. Shell must **not** call a navigation `postMessage` — `writeRoute` alone updates the parent hash.

Filter / pagination / modal-detail hash rules: **`admin-ui-patterns.md`**.

## Skeleton loaders (always with Query pending)

Primary admin content must never show a bare `"Loading…"` / `"Cargando…"` string while a query is pending — use skeleton placeholders that mirror the final layout (`TableSkeleton`, card skeletons) so content does not jump.

Rules:

- **Initial load:** `$query.isPending` / `$query.isLoading` → matching skeleton. Row/column count matches real layout.
- **Background refetch:** keep existing data; set `fetching` on `DataTable` (opacity) when `$query.isFetching && !$query.isPending` — do **not** swap data out for skeletons.
- **Mutations:** disable controls via `$mutation.isPending` (buttons, pager). Do not skeleton the whole page unless the mutated region is being replaced.
- **Errors:** `Alert` + retry (`query.refetch`); skeletons only while pending.

Components: `templates/admin-ui/src/lib/ui/TableSkeleton.svelte` — see `admin-ui-components.md`.

## SPA anti-patterns (do not scaffold)

- Raw `fetch` / `onMount` data loading in views (bypasses Query cache).
- Primary content as a `"Loading…"` / `"Cargando…"` text node instead of skeletons.
- Dual source of truth: copying query results into parallel local `data` variables.
- A second QueryClient or ad-hoc cache outside `queryClient`.
- Hand-rolled one-off button / badge / modal styles in views — extend `lib/ui/*` instead.
- daisyUI / Headless UI / Skeleton Labs — stack is **Tailwind + bits-ui** only (`admin-ui-theme.md`).
