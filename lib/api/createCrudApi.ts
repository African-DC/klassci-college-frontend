import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import { PaginatedResponseSchema, type PaginatedResponse } from "@/lib/contracts"

export interface CrudApi<T, TCreate, TUpdate> {
  list: (params?: Record<string, unknown>) => Promise<PaginatedResponse<T>>
  getById: (id: number) => Promise<T>
  create: (data: TCreate) => Promise<T>
  update: (id: number, data: TUpdate) => Promise<T>
  remove: (id: number) => Promise<void>
}

// Extrait l'item de la réponse API, qu'elle soit { data: T } ou T directement
function unwrapResponse<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res && (res as Record<string, unknown>).data !== undefined) {
    return (res as Record<string, unknown>).data as T
  }
  return res as T
}

export function createCrudApi<T, TCreate, TUpdate>(
  basePath: string,
  schema: z.ZodType<T>,
): CrudApi<T, TCreate, TUpdate> {
  const PaginatedSchema = PaginatedResponseSchema(schema)
  const ArraySchema = z.array(schema)

  return {
    list: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<T>> => {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          query.set(key, String(value))
        }
      })
      const json = await apiFetch<PaginatedResponse<T> | T[]>(
        `${basePath}?${query.toString()}`,
      )
      if (Array.isArray(json)) {
        const data = safeValidate(ArraySchema, json, basePath)
        return { items: data, total: data.length, page: 1, size: data.length, total_pages: 1 }
      }
      return safeValidate(PaginatedSchema, json, basePath) as PaginatedResponse<T>
    },

    getById: async (id: number): Promise<T> => {
      const res = await apiFetch<unknown>(`${basePath}/${id}`)
      return safeValidate(schema, unwrapResponse<T>(res), `${basePath}/${id}`)
    },

    create: async (data: TCreate): Promise<T> => {
      const res = await apiFetch<unknown>(basePath, {
        method: "POST",
        body: JSON.stringify(data),
      })
      return safeValidate(schema, unwrapResponse<T>(res), `POST ${basePath}`)
    },

    update: async (id: number, data: TUpdate): Promise<T> => {
      const res = await apiFetch<unknown>(`${basePath}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
      return safeValidate(schema, unwrapResponse<T>(res), `PATCH ${basePath}/${id}`)
    },

    remove: async (id: number): Promise<void> => {
      await apiFetch(`${basePath}/${id}`, { method: "DELETE" })
    },
  }
}
