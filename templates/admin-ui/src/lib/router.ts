export const tabs = [
  { id: 'panel', label: 'Panel' },
  { id: 'config', label: 'Configuración' },
] as const;

type Tabs = typeof tabs;

export type AdminView = Tabs[number]['id'];

export type Route = {
  view: AdminView;
  params: Record<string, string>;
};

const KNOWN_VIEWS: AdminView[] = tabs.map((v) => v.id);

function normalizeView(value: string | null | undefined): AdminView {
  return KNOWN_VIEWS.includes(value as AdminView) ? (value as AdminView) : 'panel';
}

/** Parent window when same-origin iframe; else self. */
export function getNavWindow(): Window {
  try {
    if (window.top && window.top !== window) {
      void window.top.location.href;
      return window.top;
    }
  } catch {
    // cross-origin — stay in iframe
  }
  return window;
}

function rawHash(win: Window = getNavWindow()): string {
  return win.location.hash.replace(/^#/, '').trim();
}

function migrateLegacy(raw: string): string {
  if (!raw) return '';
  if (raw.includes('=')) return raw;
  const path = raw.replace(/^\//, '').split(/[/?&]/)[0] ?? '';
  if (KNOWN_VIEWS.includes(path as AdminView)) return `view=${path}`;
  return raw;
}

export function parseHash(hash = rawHash()): Route {
  const raw = migrateLegacy(hash);
  const params = new URLSearchParams(raw);
  const view = normalizeView(params.get('view'));
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key === 'view') return;
    if (value === '') return;
    out[key] = value;
  });
  return { view, params: out };
}

export function serializeHash(route: Route): string {
  const params = new URLSearchParams();
  params.set('view', route.view);
  const keys = Object.keys(route.params).sort();
  for (const key of keys) {
    const value = route.params[key];
    if (value == null || value === '') continue;
    params.set(key, value);
  }
  return `#${params.toString()}`;
}

export function readRoute(): Route {
  const win = getNavWindow();
  let hash = rawHash(win);

  if (!hash) {
    const queryView = new URLSearchParams(window.location.search).get('view');
    if (queryView) {
      return { view: normalizeView(queryView), params: {} };
    }
  }

  return parseHash(hash);
}

export function writeRoute(route: Route, opts?: { replace?: boolean }): void {
  const win = getNavWindow();
  const next = serializeHash(route);
  const current = win.location.hash || '';
  if (current === next || current.replace(/^#/, '') === next.replace(/^#/, '')) return;

  if (opts?.replace) {
    const url = new URL(win.location.href);
    url.hash = next;
    win.history.replaceState(win.history.state, '', url.toString());
  } else {
    win.location.hash = next;
  }
}

/** Patch params on current view; omit keys set to null/undefined/''. */
export function patchRoute(
  patch: Record<string, string | number | null | undefined>,
  opts?: { replace?: boolean; view?: AdminView },
): void {
  const current = readRoute();
  const view = opts?.view ?? current.view;
  const params: Record<string, string> = view === current.view ? { ...current.params } : {};

  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === '') {
      delete params[key];
    } else {
      params[key] = String(value);
    }
  }

  writeRoute({ view, params }, opts);
}

export function listenRoute(handler: (route: Route) => void): () => void {
  const win = getNavWindow();
  const onChange = () => handler(readRoute());
  win.addEventListener('hashchange', onChange);
  return () => win.removeEventListener('hashchange', onChange);
}

export function ensureRoute(): Route {
  const route = readRoute();
  const win = getNavWindow();
  const expected = serializeHash(route);
  const current = win.location.hash || '';
  if (current !== expected && current.replace(/^#/, '') !== expected.replace(/^#/, '')) {
    writeRoute(route, { replace: true });
  }
  return route;
}
