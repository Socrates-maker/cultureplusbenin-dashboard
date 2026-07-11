import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiError } from './api';

/**
 * Generic collection hook. `path` is the REST base (e.g. `/cities`).
 * `params` are forwarded as query string arguments.
 */
export function useCollection<T>(
  path: string,
  params?: Record<string, unknown>,
  options?: Partial<UseQueryOptions<T[]>>,
) {
  return useQuery<T[]>({
    queryKey: [path, params ?? {}],
    queryFn: async () => {
      const { data } = await api.get<T[]>(path, { params });
      return data;
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
