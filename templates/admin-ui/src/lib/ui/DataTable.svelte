<script lang="ts" module>
  export type SortDir = 'asc' | 'desc';

  export type DataTableColumn = {
    key: string;
    label: string;
    sortable?: boolean;
    class?: string;
  };
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    columns: DataTableColumn[];
    sort?: string | null;
    dir?: SortDir;
    onSort?: (key: string, dir: SortDir) => void;
    fetching?: boolean;
    compact?: boolean;
    class?: string;
    rows: Snippet;
  };

  let {
    columns,
    sort = null,
    dir = 'asc',
    onSort,
    fetching = false,
    compact = false,
    class: className = '',
    rows,
  }: Props = $props();

  function clickSort(col: DataTableColumn) {
    if (!col.sortable || !onSort) return;
    if (sort === col.key) {
      onSort(col.key, dir === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(col.key, 'asc');
    }
  }

  function ariaSort(col: DataTableColumn): 'ascending' | 'descending' | 'none' | undefined {
    if (!col.sortable) return undefined;
    if (sort !== col.key) return 'none';
    return dir === 'asc' ? 'ascending' : 'descending';
  }

  function marker(col: DataTableColumn): string {
    if (!col.sortable) return '';
    if (sort !== col.key) return '↕';
    return dir === 'asc' ? '↑' : '↓';
  }
</script>

<table
  class="w-full border-collapse text-left {compact ? 'text-xs' : 'text-[13px]'} {fetching
    ? 'opacity-70 transition-opacity'
    : ''} {className}"
>
  <thead>
    <tr>
      {#each columns as col (col.key)}
        <th
          class="whitespace-nowrap border-b border-whmcs-border px-2 py-2 font-semibold text-whmcs-muted {col.class ??
            ''}"
          aria-sort={ariaSort(col)}
        >
          {#if col.sortable}
            <button
              type="button"
              class="inline-flex w-full items-center gap-1 bg-transparent p-0 text-left font-semibold text-inherit hover:text-whmcs-primary"
              onclick={() => clickSort(col)}
            >
              <span>{col.label}</span>
              <span
                class="text-[11px] leading-none {sort === col.key
                  ? 'text-whmcs-primary opacity-100'
                  : 'opacity-45'}"
                aria-hidden="true">{marker(col)}</span
              >
            </button>
          {:else}
            {col.label}
          {/if}
        </th>
      {/each}
    </tr>
  </thead>
  <tbody class="[&_td]:border-b [&_td]:border-whmcs-border [&_td]:px-2 [&_td]:py-2 [&_td]:align-top">
    {@render rows()}
  </tbody>
</table>
