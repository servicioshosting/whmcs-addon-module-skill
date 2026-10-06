<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { queryClient } from './lib/queryClient';
  import Shell from './Shell.svelte';

  const isDev = import.meta.env.DEV;
</script>

<QueryClientProvider client={queryClient}>
  <Shell />
  {#if isDev}
    {#await import('@tanstack/svelte-query-devtools') then mod}
      <mod.SvelteQueryDevtools />
    {/await}
  {/if}
</QueryClientProvider>
