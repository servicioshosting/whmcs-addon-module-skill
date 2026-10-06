# Admin UI components — unified catalog

**Rule:** one component per role. Views compose `src/lib/ui/*`. Need a new look → extend props on the existing component, **do not** add a second button/badge/modal in the view.

Ship stubs: `templates/admin-ui/src/lib/ui/`.

## Catalog

| Component | File | Role |
|-----------|------|------|
| `Button` | `Button.svelte` | primary / secondary / ghost / danger; `sm` / `md`; `loading` / `disabled` |
| `Badge` | `Badge.svelte` | status tones: `ok` / `warn` / `bad` / `muted` / `info` |
| `Card` | `Card.svelte` | panel chrome (border, padding, optional title snippet) |
| `Alert` | `Alert.svelte` | inline error / success / info with optional retry |
| `Field` | `Field.svelte` | label + control slot (input/select); shared spacing |
| `Tabs` | `Tabs.svelte` | bits-ui Tabs — shell tabs or inner detail tabs |
| `Modal` | `Modal.svelte` | bits-ui Dialog — detail drawers / confirms |
| `DataTable` | `DataTable.svelte` | sortable head + row snippet; `fetching` opacity |
| `TableSkeleton` | `TableSkeleton.svelte` | first-load table placeholder only |
| `Pager` | `Pager.svelte` | prev / “Página x / y” / next + total |
| `FilterBar` | `FilterBar.svelte` | toolbar layout slot for search + selects + actions |

## Creation rule

Before styling anything in a view:

1. Does a catalog component already cover it? Use it.
2. Close but missing a prop (size, tone)? Extend that component.
3. Truly new role (e.g. `EmptyState`)? Add **one** new file under `lib/ui/` and document it here / in the addon AGENTS.md.

Anti-patterns:

- Five differently classed `<button class="…">` in one view.
- Copy-pasting modal markup into every detail view.
- Importing `bits-ui` from `views/*`.
- Per-view hex colors that duplicate `whmcs-*` tokens.

## Props conventions

- Svelte 5 runes: `$props()`, snippets for slots (`children`, `rows`, `actions`).
- Boolean flags default false; sizes as string unions.
- Event callbacks: `onSort`, `onPage`, `onOpenChange` — not DOM `createEventDispatcher`.
- Spanish UI strings belong in **views** (or i18n later); wrappers stay label-agnostic where possible (`Pager` may take `label` props).

## DataTable + TableSkeleton

Lifted from Accounts Miner patterns:

- `DataTable`: `columns[]` with `sortable`; `sort` / `dir` / `onSort`; `fetching` dims table on background refetch; `rows` snippet renders `<tr>`s.
- `TableSkeleton`: show only when `isPending && !data`. Pass `headers` matching real columns.

## Modal + Tabs

- `Modal`: bind `open`; title + body snippets; close on overlay / Escape (bits-ui). Hash-driven detail (`id` / `tab`) sets `open` from route — see `admin-ui-patterns.md`.
- `Tabs`: controlled `value` + `onValueChange`, or uncontrolled. Use for shell **or** inner modal tabs — same component.

## Button

```svelte
<Button variant="primary" size="sm" loading={$mutation.isPending} onclick={save}>
  Guardar
</Button>
```

Variants map to token colors (`whmcs-primary`, `whmcs-danger`, border secondary, ghost text). Never add `.btn-foo` in a view stylesheet.
