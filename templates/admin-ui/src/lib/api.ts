export type BootstrapData = {
  csrf: string;
  messages?: { type: string; text: string }[];
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  lastPage: number;
  prevPage?: number;
  nextPage?: number;
};

export type ItemsQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
};

export type ItemRow = {
  id: number;
  name: string;
  status: string;
  updated_at: string | null;
};

export type ItemsResponse = {
  rows: ItemRow[];
  meta: PaginationMeta;
};

const API_BASE = new URL('../../controllers/admin.php', window.location.href).toString();

let csrfToken: string | null = null;
let pendingBootstrap: Promise<BootstrapData> | null = null;

type QueryValue = string | number;

interface RequestOptions {
  method?: 'GET' | 'POST';
  params?: Record<string, QueryValue>;
  body?: unknown;
}

function cleanParams(params: object): Record<string, QueryValue> {
  const cleaned: Record<string, QueryValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    cleaned[key] = value as QueryValue;
  }
  return cleaned;
}

function buildUrl(op: string, params: Record<string, QueryValue> = {}): URL {
  const url = new URL(API_BASE);
  url.searchParams.set('op', op);
  for (const [key, value] of Object.entries(params)) {
    const cleared = String(value).trim();
    if (cleared === '') continue;
    url.searchParams.set(key, cleared);
  }
  return url;
}

async function request<T>(op: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers = new Headers();
  if (csrfToken) {
    headers.set('X-<Prefix>-CSRF', csrfToken);
  }
  const init: RequestInit = { method, headers };
  if (method === 'POST') {
    headers.set('Content-Type', 'application/json');
    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }
  }
  const res = await fetch(buildUrl(op, options.params ?? {}), init);
  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    // ignore parse errors — throw below
  }
  if (!res.ok) {
    const err: Error & { status?: number; data?: unknown } = new Error('Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export function bootstrap(): Promise<BootstrapData> {
  if (!pendingBootstrap) {
    pendingBootstrap = request<BootstrapData>('bootstrap').then((data) => {
      csrfToken = data.csrf;
      return data;
    });
  }
  return pendingBootstrap;
}

export function items(query: ItemsQuery = {}): Promise<ItemsResponse> {
  return request<ItemsResponse>('items', { params: cleanParams(query) });
}
