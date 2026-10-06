<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    class?: string;
    title?: Snippet;
    children: Snippet;
  };

  let { class: className = '', title, children }: Props = $props();
</script>

<div
  class="rounded-[var(--radius-whmcs)] border border-whmcs-border bg-whmcs-bg p-4 {className}"
>
  {#if title}
    <div class="mb-3 text-sm font-semibold text-whmcs-fg">{@render title()}</div>
  {/if}
  {@render children()}
</div>
