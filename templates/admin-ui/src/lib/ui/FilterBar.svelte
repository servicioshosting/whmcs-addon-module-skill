<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    class?: string;
    title?: Snippet;
    filters?: Snippet;
    actions?: Snippet;
  };

  let { class: className = '', title, filters, actions }: Props = $props();
</script>

<div
  class="mb-3 flex flex-wrap items-start justify-between gap-3 {className}"
>
  <div class="min-w-0">
    {#if title}
      <div class="mb-2">{@render title()}</div>
    {/if}
    {#if filters}
      <div class="flex flex-wrap items-end gap-2">
        {@render filters()}
      </div>
    {/if}
  </div>
  {#if actions}
    <div class="flex flex-wrap items-center gap-2">
      {@render actions()}
    </div>
  {/if}
</div>
