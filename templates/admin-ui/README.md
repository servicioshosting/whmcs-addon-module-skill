# Admin UI template

Copy this folder to the addon repo as `admin-ui/`, then:

1. Replace `<Name>` in `vite.config.ts` (`base`, `outDir`).
2. Replace `<Prefix>` in `src/lib/api.ts` (CSRF header) and `src/lib/size.ts` (postMessage type).
3. Set display name in `index.html`, `Shell.svelte`.
4. Extend `src/lib/router.ts` tabs + `src/views/*`.
5. Implement real `op`s in PHP `controllers/admin.php` matching `src/lib/api.ts`.
6. `pnpm install && pnpm run check && pnpm run build`.

Stack: Svelte 5 + Vite + TanStack Query + Tailwind v4 + bits-ui.

Docs: `references/admin-spa.md`, `admin-ui-theme.md`, `admin-ui-components.md`, `admin-ui-patterns.md`.
