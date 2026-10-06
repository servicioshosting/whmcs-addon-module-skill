<script lang="ts">
  interface Props {
    columns?: number;
    rows?: number;
    headers?: string[];
    compact?: boolean;
    class?: string;
  }

  let {
    columns = 5,
    rows = 6,
    headers = [],
    compact = false,
    class: className = '',
  }: Props = $props();

  const colCount = $derived(headers.length > 0 ? headers.length : columns);
</script>

<table
  class="w-full border-collapse text-left {compact ? 'text-xs' : 'text-[13px]'} {className}"
  aria-busy="true"
  aria-label="Cargando"
>
  {#if headers.length > 0}
    <thead>
      <tr>
        {#each headers as h}
          <th class="border-b border-whmcs-border px-2 py-2 font-semibold text-whmcs-muted"
            >{h}</th
          >
        {/each}
      </tr>
    </thead>
  {/if}
  <tbody>
    {#each Array(rows) as _, ri}
      <tr>
        {#each Array(colCount) as _, ci}
          <td class="border-b border-whmcs-border px-2 py-2">
            <span
              class="whmcs-skeleton-bar"
              style="width: {50 + ((ri * 3 + ci * 7) % 40)}%; animation-delay: {(ri * 40 + ci * 30) %
                400}ms"
            ></span>
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
