"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"
import type { CrudApi } from "@/lib/api/createCrudApi"
import type { PaginatedResponse } from "@/lib/contracts"
import { dashboardKeys } from "./useDashboard"
import { pageSuivante } from "./pagination"

interface CrudLabels {
  created: string
  updated: string
  deleted: string
}

export function createCrudHooks<
  T extends { id: number },
  TCreate,
  TUpdate,
>(
  resourceKey: string,
  api: CrudApi<T, TCreate, TUpdate>,
  labels: CrudLabels,
) {
  const keys = {
    all: [resourceKey] as const,
    list: (params: Record<string, unknown>) => [resourceKey, "list", params] as const,
    detail: (id: number) => [resourceKey, id] as const,
  }

  function useList(params: Record<string, unknown> = {}) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: () => api.list(params),
      staleTime: 1000 * 60 * 5,
    })
  }

  /**
   * La même liste, chargée au fil du défilement.
   *
   * Les pages s'empilent sous une seule clé, et `aplatie` rend la forme
   * qu'attend `CrudTable` : `total` et `size` viennent de la première page,
   * `items` de toutes. La table n'a donc pas à savoir d'où viennent ses
   * lignes.
   *
   * `total` reste celui annoncé par le serveur, jamais le nombre de lignes
   * chargées : c'est ce qui permet au pied de dire « 40 sur 312 » plutôt que
   * de laisser croire que 40 est le compte.
   */
  function useInfiniteList(params: Record<string, unknown> = {}) {
    const requete = useInfiniteQuery({
      queryKey: [...keys.list(params), "infinite"] as const,
      queryFn: ({ pageParam }: { pageParam: number }) =>
        api.list({ ...params, page: pageParam }),
      initialPageParam: 1,
      // La condition d'arrêt vit dans `./pagination`, où elle est testée.
      getNextPageParam: (derniere: PaginatedResponse<T>, pages: unknown[]) =>
        pageSuivante(derniere, pages.length),
      staleTime: 1000 * 60 * 5,
    })

    const pages = requete.data?.pages
    const aplatie: PaginatedResponse<T> | undefined = pages?.length
      ? {
          ...pages[0],
          items: pages.flatMap((page) => page.items),
        }
      : undefined

    return {
      ...requete,
      data: aplatie,
      scrollInfini: {
        chargerSuite: () => void requete.fetchNextPage(),
        resteAcharger: Boolean(requete.hasNextPage),
        chargeEnCours: requete.isFetchingNextPage,
      },
    }
  }

  function useDetail(id: number) {
    return useQuery({
      queryKey: keys.detail(id),
      queryFn: () => api.getById(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    })
  }

  function useCreate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: TCreate) => api.create(data),
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: keys.all })
        const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
          queryKey: keys.all,
        })
        const previous = new Map(queries)
        // Ajout optimiste avec un id temporaire négatif
        const optimisticItem = { ...newData, id: -Date.now() } as unknown as T
        for (const [key, old] of queries) {
          if (!old?.items) continue
          queryClient.setQueryData(key, {
            ...old,
            total: old.total + 1,
            items: [...old.items, optimisticItem],
          })
        }
        return { previous }
      },
      onError: (err, _vars, context) => {
        if (context?.previous) {
          for (const [key, data] of context.previous) {
            queryClient.setQueryData(key, data)
          }
        }
        toast.error("Erreur", { description: err.message })
      },
      onSuccess: () => {
        toast.success(labels.created)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: keys.all })
        // Les compteurs en tête de page viennent du résumé, pas de la liste :
        // sans cela, l'écran affiche six lignes sous une carte qui annonce cinq.
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary })
      },
    })
  }

  function useUpdate(id: number) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: TUpdate) => api.update(id, data),
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: keys.all })
        await queryClient.cancelQueries({ queryKey: keys.detail(id) })
        const previousDetail = queryClient.getQueryData<T>(keys.detail(id))
        const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
          queryKey: keys.all,
        })
        const previousList = new Map(queries)
        if (previousDetail) {
          queryClient.setQueryData(keys.detail(id), { ...previousDetail, ...newData })
        }
        for (const [key, old] of queries) {
          if (!old?.items) continue
          queryClient.setQueryData(key, {
            ...old,
            items: old.items.map((s) => (s.id === id ? { ...s, ...newData } : s)),
          })
        }
        return { previousDetail, previousList }
      },
      onError: (err, _vars, context) => {
        if (context?.previousDetail) {
          queryClient.setQueryData(keys.detail(id), context.previousDetail)
        }
        if (context?.previousList) {
          for (const [key, data] of context.previousList) {
            queryClient.setQueryData(key, data)
          }
        }
        toast.error("Erreur", { description: err.message })
      },
      onSuccess: () => {
        toast.success(labels.updated)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: keys.all })
        queryClient.invalidateQueries({ queryKey: keys.detail(id) })
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary })
      },
    })
  }

  function useDelete() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: number) => api.remove(id),
      onMutate: async (deletedId) => {
        await queryClient.cancelQueries({ queryKey: keys.all })
        const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
          queryKey: keys.all,
        })
        const previous = new Map(queries)
        for (const [key, old] of queries) {
          if (!old?.items) continue
          queryClient.setQueryData(key, {
            ...old,
            total: old.total - 1,
            items: old.items.filter((s) => s.id !== deletedId),
          })
        }
        return { previous }
      },
      onError: (err, _vars, context) => {
        if (context?.previous) {
          for (const [key, data] of context.previous) {
            queryClient.setQueryData(key, data)
          }
        }
        toast.error("Erreur", { description: err.message })
      },
      onSuccess: () => {
        toast.success(labels.deleted)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: keys.all })
        // Les compteurs en tête de page viennent du résumé, pas de la liste :
        // sans cela, l'écran affiche six lignes sous une carte qui annonce cinq.
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary })
      },
    })
  }

  return { keys, useList, useInfiniteList, useDetail, useCreate, useUpdate, useDelete }
}
