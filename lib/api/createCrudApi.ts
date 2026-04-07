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
        const items = safeValidate(ArraySchema, json, basePath)
        return { items, total: items.length, page: 1, size: items.length }
      }
      return safeValidate(PaginatedSchema, json, basePath)
    },

    getById: async (id: number): Promise<T> => {
      const res = await apiFetch<T>(`${basePath}/${id}`)
      return safeValidate(schema, res, `${basePath}/${id}`)
    },

    create: async (data: TCreate): Promise<T> => {
      const res = await apiFetch<T>(basePath, {
        method: "POST",
        body: JSON.stringify(data),
      })
      return safeValidate(schema, res, `POST ${basePath}`)
    },

    update: async (id: number, data: TUpdate): Promise<T> => {
      const res = await apiFetch<T>(`${basePath}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
      return safeValidate(schema, res, `PATCH ${basePath}/${id}`)
    },

    remove: async (id: number): Promise<void> => {
      await apiFetch(`${basePath}/${id}`, { method: "DELETE" })
    },
  }
}
