<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    label: string;
    class?: string;
    children: Snippet;
  };

  let { label, class: className = '', children }: Props = $props();
</script>

<label class="flex flex-col gap-1 text-xs font-medium text-whmcs-muted {className}">
  <span>{label}</span>
  <div class="text-sm font-normal text-whmcs-fg [&_input]:w-full [&_input]:rounded-[var(--radius-whmcs)] [&_input]:border [&_input]:border-whmcs-border [&_input]:bg-whmcs-bg [&_input]:px-2 [&_input]:py-1.5 [&_select]:w-full [&_select]:rounded-[var(--radius-whmcs)] [&_select]:border [&_select]:border-whmcs-border [&_select]:bg-whmcs-bg [&_select]:px-2 [&_select]:py-1.5">
    {@render children()}
  </div>
</label>
