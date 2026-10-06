export const queryKeys = {
  bootstrap: ['bootstrap'] as const,
  items: (filters: object) => ['items', filters] as const,
  item: (id: string | number) => ['items', 'detail', id] as const,
};
