<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
  type Size = 'sm' | 'md';

  type Props = {
    variant?: Variant;
    size?: Size;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  };

  let {
    variant = 'secondary',
    size = 'md',
    type = 'button',
    disabled = false,
    loading = false,
    class: className = '',
    onclick,
    children,
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-whmcs)] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-whmcs-primary disabled:cursor-not-allowed disabled:opacity-55';

  const sizes: Record<Size, string> = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const variants: Record<Variant, string> = {
    primary: 'bg-whmcs-primary text-whmcs-primary-fg hover:brightness-95',
    secondary:
      'border border-whmcs-border bg-whmcs-bg text-whmcs-fg hover:bg-whmcs-surface',
    ghost: 'bg-transparent text-whmcs-fg hover:bg-whmcs-surface',
    danger: 'bg-whmcs-danger text-whmcs-danger-fg hover:brightness-95',
  };
</script>

<button
  {type}
  class="{base} {sizes[size]} {variants[variant]} {className}"
  disabled={disabled || loading}
  {onclick}
>
  {#if loading}
    <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true"></span>
  {/if}
  {@render children()}
</button>
