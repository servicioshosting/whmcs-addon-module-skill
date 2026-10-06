# Admin UI patterns — filters, pagination, lists

Opinions for SPA list UIs. Prefer these over inventing per-addon schemes. Source patterns: Accounts Miner (hash filters + TanStack) and FActivo (meta pagination / facets).

## Filters — hash is source of truth

Route shape:

```
#view=<tab>&q=…&page=…&sort=…&dir=…&status=…&server_id=…
```

Rules:

1. **URL hash = filter state.** Derived reads: `params.q`, `params.page`, etc. Writes go through `patchRoute` / `writeRoute` — not a parallel `$state` that drifts from the hash.
2. **Omit defaults** from the hash (`page=1`, `status=all`, default sort/dir → delete keys). Keeps links short and shareable.
3. **Any filter change resets `page`** (`page: null` in the patch).
4. **Search text:** local draft (`qInput`) synced from `params.q` via `$effect`; commit on form submit (or explicit Buscar). Do not hit the API on every keystroke unless the product asks for debounce search.
5. **Selects / toggles:** apply immediately on `change`.
6. **Sort:** `DataTable` `onSort` → patch `sort` / `dir` / clear `page`.

```ts
function writeFilters(patch: Record<string, string | number | null | undefined>) {
  patchRoute(patch, { view: 'packages' });
}

function search() {
  writeFilters({ q: qInput.trim() || null, page: null });
}

function setStatus(value: string) {
  writeFilters({ status: value === 'all' ? null : value, page: null });
}
```

Layout: put controls in `<FilterBar>` (title snippet + filters snippet + optional actions).

### Optional facets (FActivo-style)

When the API returns aggregations for filter chips/counts, put them on list `meta`:

```ts
meta: {
  page, pageSize, total, lastPage,
  facets?: { status: { value: string; count: number }[]; … }
}
```

UI may render facet chips that call the same `writeFilters`. Facets are optional; do not require them for every list.

## Pagination

### API contract

List JSON:

```ts
type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  lastPage: number;
  prevPage?: number; // optional convenience
  nextPage?: number;
};

// response
{ rows: T[]; meta: PaginationMeta & { /* servers, facets, … */ } }
```

- Default **`pageSize: 25`** for SPA lists (Accounts Miner). Document if a view uses another size (e.g. 20).
- Cap `pageSize` server-side (e.g. max 100–500) so clients cannot request unbounded pages.
- Classic PHP HTML admin may still use `Pagination` / `MakesPagination` — **SPA path uses JSON `meta` only**; do not scaffold both paginators for the same screen.

### SPA UI

Use `<Pager>` only:

```svelte
<Pager
  page={meta.page}
  lastPage={meta.lastPage}
  total={meta.total}
  disabled={listQuery.isFetching}
  onPage={(p) => writeFilters({ page: p <= 1 ? null : p })}
/>
```

Disable pager while a mutation that affects the list is pending. Do not invent a second pager markup in the view.

## List view recipe

```
FilterBar
  → createQuery(queryKeys.list(filterParams))
  → error? Alert + retry
  → isPending && !data? TableSkeleton
  → else DataTable (fetching = isFetching && !isPending)
  → Pager
  → optional Modal detail driven by hash id / tab
```

Filter params object fed to `queryKey` **and** `queryFn` must be the same derived shape so cache keys stay stable.

## Modal detail via hash

Pattern (Accounts Miner accounts / runs):

- List row click → `patchRoute({ id: row.id, tab: null })`.
- `$derived` `detailId` from `params.id`; `Modal` `open={detailId != null}`.
- On close → `patchRoute({ id: null, tab: null })`.
- Inner tabs → `params.tab` (omit default tab from hash).
- Detail fetch: separate `createQuery` keyed by id; skeleton inside modal body on first load.

## Anti-patterns

- Local-only filter state that is not reflected in the hash (breaks back button / share).
- Resetting to page 1 in the UI without clearing `page` from the hash (or leaving stale `page=5` after a tighter filter → empty surprise).
- Skeleton on every refetch.
- `"Cargando…"` text instead of `TableSkeleton`.
- Hand-rolled prev/next buttons bypassing `Pager`.
