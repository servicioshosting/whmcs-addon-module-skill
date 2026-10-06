<script lang="ts">
  import Button from './Button.svelte';

  type Props = {
    page: number;
    lastPage: number;
    total?: number;
    disabled?: boolean;
    class?: string;
    onPage: (page: number) => void;
  };

  let {
    page,
    lastPage,
    total,
    disabled = false,
    class: className = '',
    onPage,
  }: Props = $props();

  const showControls = $derived(lastPage > 1);
</script>

<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-whmcs-muted {className}">
  {#if total != null}
    <span>{total} resultado{total === 1 ? '' : 's'}</span>
  {/if}
  {#if showControls}
    <Button
      size="sm"
      variant="secondary"
      disabled={disabled || page <= 1}
      onclick={() => onPage(page - 1)}
    >
      Anterior
    </Button>
    <span class="text-whmcs-fg">Página {page} / {lastPage}</span>
    <Button
      size="sm"
      variant="secondary"
      disabled={disabled || page >= lastPage}
      onclick={() => onPage(page + 1)}
    >
      Siguiente
    </Button>
  {/if}
</div>
