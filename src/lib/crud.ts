import { useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiError, type Paginated } from './api';

/** Page size used by the paginated admin tables (backend default is 20, max 100). */
export const PAGE_SIZE = 20;

/**
 * Collection hook for small lists (select options, filters…). List endpoints
 * are paginated, so this unwraps the `{ data, page, limit, total }` envelope
 * and explicitly requests the backend maximum (100 items). For tables that can
 * grow beyond that, use `usePaginatedCollection` instead.
 */
export function useCollection<T>(
  path: string,
  params?: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T[]>>,
) {
  const merged = { limit: 100, ...params };
  return useQuery<T[]>({
    queryKey: [path, merged],
    queryFn: async () => {
      const { data } = await api.get<Paginated<T>>(path, { params: merged });
      return data.data;
    },
    ...options,
  });
}

/**
 * Paginated collection hook for admin tables. Owns the page state, resets it
 * when the path or filters change, and keeps the previous page's rows visible
 * while the next page loads.
 */
export function usePaginatedCollection<T>(
  path: string,
  filters?: Record<string, unknown>,
  options?: Partial<UseQueryOptions<Paginated<T>>>,
) {
  const [page, setPage] = useState(1);
  const filterKey = JSON.stringify(filters ?? {});
  useEffect(() => {
    setPage(1);
  }, [path, filterKey]);

  const params = { ...filters, page, limit: PAGE_SIZE };
  const query = useQuery<Paginated<T>>({
    queryKey: [path, params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<T>>(path, { params });
      return data;
    },
    placeholderData: keepPreviousData,
    ...options,
  });

  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // If the current page disappears (e.g. last row of the last page deleted),
  // fall back to the new last page.
  useEffect(() => {
    if (query.data && page > pageCount) setPage(pageCount);
  }, [query.data, page, pageCount]);

  return {
    ...query,
    rows: query.data?.data ?? [],
    page,
    setPage,
    total,
    pageCount,
  };
}

/** Fetches only the `total` of a paginated collection (for stat counters). */
export function useCollectionTotal(
  path: string,
  options?: Partial<UseQueryOptions<number>>,
) {
  return useQuery<number>({
    queryKey: [path, 'total'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<unknown>>(path, {
        params: { page: 1, limit: 1 },
      });
      return data.total;
    },
    ...options,
  });
}

export function useResource<T>(
  path: string,
  id: string | undefined,
  options?: Partial<UseQueryOptions<T>>,
) {
  return useQuery<T>({
    queryKey: [path, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<T>(`${path}/${id}`);
      return data;
    },
    ...options,
  });
}

/** Create / update / delete mutations that invalidate the collection cache. */
export function useCrudMutations(path: string, label = 'Élément') {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: [path], exact: false });

  const create = useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await api.post(path, payload);
      return data;
    },
    onSuccess: () => {
      toast.success(`${label} créé.`);
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) => {
      const { data } = await api.patch(`${path}/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success(`${label} mis à jour.`);
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${path}/${id}`);
    },
    onSuccess: () => {
      toast.success(`${label} supprimé.`);
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return { create, update, remove, invalidate };
}

/** Moderation actions (approve / reject) for tourist-sites and testimonials. */
export function useModeration(path: string) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: [path], exact: false });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`${path}/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      toast.success('Contenu approuvé et publié.');
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.patch(`${path}/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      toast.success('Contenu rejeté.');
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return { approve, reject };
}
