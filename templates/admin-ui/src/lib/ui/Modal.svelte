<script lang="ts">
  import { Dialog } from 'bits-ui';
  import type { Snippet } from 'svelte';

  type Props = {
    open?: boolean;
    title?: string;
    class?: string;
    onOpenChange?: (open: boolean) => void;
    children: Snippet;
    footer?: Snippet;
  };

  let {
    open = $bindable(false),
    title = '',
    class: className = '',
    onOpenChange,
    children,
    footer,
  }: Props = $props();
</script>

<Dialog.Root
  bind:open
  onOpenChange={(next) => {
    open = next;
    onOpenChange?.(next);
  }}
>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in"
    />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,720px)] w-[min(96vw,640px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[var(--radius-whmcs)] border border-whmcs-border bg-whmcs-bg p-4 shadow-lg outline-none {className}"
    >
      <div class="mb-3 flex items-start justify-between gap-3">
        {#if title}
          <Dialog.Title class="m-0 text-base font-semibold text-whmcs-fg">
            {title}
          </Dialog.Title>
        {:else}
          <span></span>
        {/if}
        <Dialog.Close
          class="inline-flex items-center rounded-[var(--radius-whmcs)] px-2.5 py-1 text-xs font-medium text-whmcs-fg hover:bg-whmcs-surface"
        >
          Cerrar
        </Dialog.Close>
      </div>

      <Dialog.Description class="sr-only">
        {title || 'Diálogo'}
      </Dialog.Description>

      <div>{@render children()}</div>

      {#if footer}
        <div class="mt-4 flex justify-end gap-2 border-t border-whmcs-border pt-3">
          {@render footer()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
