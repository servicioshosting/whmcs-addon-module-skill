<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { items } from '../lib/api';
  import { queryKeys } from '../lib/queryKeys';
  import { notifyHeight } from '../lib/size';
  import { patchRoute } from '../lib/router';
  import Alert from '../lib/ui/Alert.svelte';
  import Badge from '../lib/ui/Badge.svelte';
  import Button from '../lib/ui/Button.svelte';
  import DataTable, { type DataTableColumn, type SortDir } from '../lib/ui/DataTable.svelte';
  import Field from '../lib/ui/Field.svelte';
  import FilterBar from '../lib/ui/FilterBar.svelte';
  import Modal from '../lib/ui/Modal.svelte';
  import Pager from '../lib/ui/Pager.svelte';
  import TableSkeleton from '../lib/ui/TableSkeleton.svelte';

  let { params = {} }: { params?: Record<string, string> } = $props();

  let qInput = $state('');

  const DEFAULT_SORT = 'name';
  const DEFAULT_DIR: SortDir = 'asc';

  const q = $derived(params.q ?? '');
  const page = $derived(Math.max(1, Number(params.page) || 1));
  const status = $derived(params.status ?? 'all');
  const sort = $derived(params.sort ?? DEFAULT_SORT);
  const dir = $derived(
    (params.dir === 'asc' || params.dir === 'desc' ? params.dir : DEFAULT_DIR) as SortDir,
  );
  const detailId = $derived(params.id ? Number(params.id) : null);

  $effect(() => {
    qInput = q;
  });

  const filterParams = $derived({
    page,
    pageSize: 25,
    q,
    ...(status !== 'all' ? { status } : {}),
    ...(sort !== DEFAULT_SORT ? { sort } : {}),
    ...(dir !== DEFAULT_DIR || sort !== DEFAULT_SORT ? { dir } : {}),
  });

  const listQuery = createQuery(() => ({
    queryKey: queryKeys.items(filterParams),
    queryFn: () => items(filterParams),
  }));

  const columns: DataTableColumn[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'status', label: 'Estado', sortable: true },
    { key: 'updated_at', label: 'Actualizado', sortable: true },
    { key: 'actions', label: '' },
  ];

  $effect(() => {
    void listQuery.data;
    void listQuery.isPending;
    notifyHeight();
  });

  function writeFilters(patch: Record<string, string | number | null | undefined>) {
    patchRoute(patch, { view: 'panel' });
  }

  function search() {
    writeFilters({ q: qInput.trim() || null, page: null });
  }

  function setStatus(value: string) {
    writeFilters({ status: value === 'all' ? null : value, page: null });
  }

  function setPage(next: number) {
    writeFilters({ page: next <= 1 ? null : next });
  }

  function setSort(key: string, nextDir: SortDir) {
    writeFilters({
      sort: key === DEFAULT_SORT ? null : key,
      dir: key === DEFAULT_SORT && nextDir === DEFAULT_DIR ? null : nextDir,
      page: null,
    });
  }

  function openDetail(id: number) {
    writeFilters({ id });
  }

  function closeDetail() {
    writeFilters({ id: null });
  }

  function statusTone(value: string): 'ok' | 'warn' | 'bad' | 'muted' {
    if (value === 'active' || value === 'ok') return 'ok';
    if (value === 'pending' || value === 'warn') return 'warn';
    if (value === 'error' || value === 'failed') return 'bad';
    return 'muted';
  }
</script>

<section>
  <FilterBar>
    {#snippet title()}
      <h2 class="m-0 text-base font-semibold">Ítems</h2>
    {/snippet}
    {#snippet filters()}
      <form
        class="flex flex-wrap items-end gap-2"
        onsubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <Field label="Buscar">
          <input bind:value={qInput} placeholder="nombre…" />
        </Field>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>
      <Field label="Estado">
        <select value={status} onchange={(e) => setStatus(e.currentTarget.value)}>
          <option value="all">Todos</option>
          <option value="active">Activo</option>
          <option value="pending">Pendiente</option>
          <option value="error">Error</option>
        </select>
      </Field>
    {/snippet}
  </FilterBar>

  {#if listQuery.isError}
    <Alert tone="bad" onRetry={() => listQuery.refetch()}>
      {listQuery.error.message || 'Error al cargar'}
    </Alert>
  {:else if listQuery.isPending && !listQuery.data}
    <TableSkeleton headers={['Nombre', 'Estado', 'Actualizado', '']} rows={8} />
  {:else if listQuery.data}
    {@const listRows = listQuery.data.rows}
    {@const meta = listQuery.data.meta}
    <DataTable
      {columns}
      {sort}
      {dir}
      onSort={setSort}
      fetching={listQuery.isFetching && !listQuery.isPending}
    >
      {#snippet rows()}
        {#each listRows as row (row.id)}
          <tr>
            <td class="font-mono text-xs">{row.name}</td>
            <td>
              <Badge tone={statusTone(row.status)}>{row.status}</Badge>
            </td>
            <td>{row.updated_at || '—'}</td>
            <td>
              <Button size="sm" variant="ghost" onclick={() => openDetail(row.id)}>Ver</Button>
            </td>
          </tr>
        {/each}
        {#if listRows.length === 0}
          <tr>
            <td colspan="4" class="text-whmcs-muted">No hay resultados.</td>
          </tr>
        {/if}
      {/snippet}
    </DataTable>
    <Pager
      page={meta.page}
      lastPage={meta.lastPage}
      total={meta.total}
      disabled={listQuery.isFetching}
      onPage={setPage}
    />
  {/if}
</section>

<Modal
  open={detailId != null}
  title={detailId != null ? `Ítem #${detailId}` : ''}
  onOpenChange={(next) => {
    if (!next) closeDetail();
  }}
>
  <p class="m-0 text-sm text-whmcs-muted">
    Detalle de ejemplo. Cargue datos con createQuery keyed by id.
  </p>
</Modal>
