<script lang="ts">
  import { Tabs as BitsTabs } from 'bits-ui';
  import type { Snippet } from 'svelte';

  export type TabItem = {
    value: string;
    label: string;
    disabled?: boolean;
  };

  type Props = {
    value?: string;
    items: TabItem[];
    onValueChange?: (value: string) => void;
    class?: string;
    /** Optional panel content keyed by tab value — omit when parent switches views itself. */
    children?: Snippet<[string]>;
  };

  let {
    value = $bindable(''),
    items,
    onValueChange,
    class: className = '',
    children,
  }: Props = $props();

  const current = $derived(value || items[0]?.value || '');
</script>

<BitsTabs.Root
  value={current}
  onValueChange={(v) => {
    value = v;
    onValueChange?.(v);
  }}
  class={className}
>
  <BitsTabs.List
    class="flex flex-wrap gap-1 border-b border-whmcs-border"
  >
    {#each items as item (item.value)}
      <BitsTabs.Trigger
        value={item.value}
        disabled={item.disabled}
        class="relative -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-whmcs-muted transition-colors hover:text-whmcs-fg data-[state=active]:border-whmcs-primary data-[state=active]:text-whmcs-primary disabled:opacity-50"
      >
        {item.label}
      </BitsTabs.Trigger>
    {/each}
  </BitsTabs.List>

  {#if children}
    {#each items as item (item.value)}
      <BitsTabs.Content value={item.value} class="pt-3">
        {@render children(item.value)}
      </BitsTabs.Content>
    {/each}
  {/if}
</BitsTabs.Root>
