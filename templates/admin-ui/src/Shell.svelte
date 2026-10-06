<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import Panel from './views/Panel.svelte';
  import { bootstrap } from './lib/api';
  import { queryKeys } from './lib/queryKeys';
  import { watchHeight } from './lib/size';
  import { ensureRoute, writeRoute, listenRoute, tabs } from './lib/router';
  import type { AdminView, Route } from './lib/router';
  import Alert from './lib/ui/Alert.svelte';
  import Tabs from './lib/ui/Tabs.svelte';

  let route = $state<Route>(ensureRoute());

  const bootstrapQuery = createQuery(() => ({
    queryKey: queryKeys.bootstrap,
    queryFn: bootstrap,
    staleTime: Infinity,
  }));

  $effect(() => {
    const stop = watchHeight();
    const offHash = listenRoute((next) => {
      route = next;
    });
    return () => {
      stop();
      offHash();
    };
  });

  function setView(next: AdminView) {
    if (route.view === next) return;
    writeRoute({ view: next, params: {} });
  }

  const view = $derived(route.view);
  const ready = $derived(bootstrapQuery.isSuccess);
  const backendError = $derived.by(() => {
    if (!bootstrapQuery.isError) return '';
    const error = bootstrapQuery.error as { status?: number; message?: string } | null;
    return error?.status === 401
      ? 'Sesión de administrador inválida o expirada. Recargue el panel.'
      : 'No se pudo contactar el backend. Intente de nuevo.';
  });

  const tabItems = $derived(tabs.map((t) => ({ value: t.id, label: t.label })));
</script>

{#if ready}
  <div class="mx-auto max-w-6xl px-1 pb-6 pt-1 text-whmcs-fg">
    <header class="mb-3">
      <h1 class="m-0 text-xl font-semibold">Display Name</h1>
      <p class="mt-1 text-sm text-whmcs-muted">Admin SPA scaffold</p>
    </header>

    <Tabs
      value={view}
      items={tabItems}
      onValueChange={(v) => setView(v as AdminView)}
    />

    <div class="mt-3">
      {#if view === 'panel'}
        <Panel params={route.params} />
      {:else}
        <p class="text-sm text-whmcs-muted">Vista «{view}» — agregue un componente en views/.</p>
      {/if}
    </div>
  </div>
{:else if backendError}
  <div class="p-4">
    <Alert tone="bad">{backendError}</Alert>
  </div>
{:else}
  <div class="p-4">
    <Alert tone="info">Cargando…</Alert>
  </div>
{/if}
