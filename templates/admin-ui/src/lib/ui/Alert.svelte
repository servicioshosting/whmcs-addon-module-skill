<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  type Tone = 'ok' | 'bad' | 'info' | 'warn';

  type Props = {
    tone?: Tone;
    class?: string;
    onRetry?: () => void;
    children: Snippet;
  };

  let { tone = 'info', class: className = '', onRetry, children }: Props = $props();

  const tones: Record<Tone, string> = {
    ok: 'border-whmcs-ok bg-whmcs-ok-bg text-whmcs-ok',
    bad: 'border-whmcs-bad bg-whmcs-bad-bg text-whmcs-bad',
    warn: 'border-whmcs-warn bg-whmcs-warn-bg text-whmcs-warn',
    info: 'border-whmcs-primary bg-whmcs-info-bg text-whmcs-fg',
  };
</script>

<div
  class="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-whmcs)] border px-3 py-2 text-sm {tones[tone]} {className}"
  role="alert"
>
  <div>{@render children()}</div>
  {#if onRetry}
    <Button size="sm" variant="secondary" onclick={onRetry}>Reintentar</Button>
  {/if}
</div>
