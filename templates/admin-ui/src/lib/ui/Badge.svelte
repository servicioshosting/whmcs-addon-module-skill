<script lang="ts">
  import type { Snippet } from 'svelte';

  type Tone = 'ok' | 'warn' | 'bad' | 'muted' | 'info';

  type Props = {
    tone?: Tone;
    class?: string;
    children: Snippet;
  };

  let { tone = 'muted', class: className = '', children }: Props = $props();

  const tones: Record<Tone, string> = {
    ok: 'bg-whmcs-ok-bg text-whmcs-ok',
    warn: 'bg-whmcs-warn-bg text-whmcs-warn',
    bad: 'bg-whmcs-bad-bg text-whmcs-bad',
    muted: 'bg-whmcs-surface text-whmcs-muted',
    info: 'bg-whmcs-info-bg text-whmcs-primary',
  };
</script>

<span
  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold {tones[tone]} {className}"
>
  {@render children()}
</span>
