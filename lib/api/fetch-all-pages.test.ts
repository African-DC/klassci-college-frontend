import { describe, expect, it, vi } from "vitest"
import type { PaginatedResponse } from "@/lib/contracts"
import { fetchAllPages, MAX_PAGE_SIZE } from "./fetch-all-pages"

type Row = { id: number }

const page = (items: Row[], n: number): PaginatedResponse<Row> => ({
  items,
  total: items.length,
  page: n,
  size: MAX_PAGE_SIZE,
  total_pages: 1,
})

const rows = (from: number, count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({ id: from + i }))

describe("charger toutes les pages d'une liste", () => {
  it("ne demande jamais plus de lignes que l'API n'en accepte", async () => {
    const list = vi.fn(async (p: Record<string, unknown>) => page([], Number(p.page)))
    await fetchAllPages(list)
    expect(list).toHaveBeenCalledWith({ page: 1, size: MAX_PAGE_SIZE })
  })

  it("enchaîne les pages pleines jusqu'à la dernière, incomplète", async () => {
    const list = vi.fn(async (p: Record<string, unknown>) => {
      const n = Number(p.page)
      return page(n < 3 ? rows((n - 1) * 100 + 1, 100) : rows(201, 17), n)
    })

    const result = await fetchAllPages(list, { class_id: 4 })

    expect(result).toHaveLength(217)
    expect(list).toHaveBeenCalledTimes(3)
    expect(list.mock.calls.every(([p]) => p.class_id === 4)).toBe(true)
  })

  it("s'arrête quand une page ne rapporte que des lignes déjà vues", async () => {
    // La recherche approchée renvoie les mêmes résultats à chaque page.
    const list = vi.fn(async (p: Record<string, unknown>) => page(rows(1, 100), Number(p.page)))

    const result = await fetchAllPages(list, { search: "kouame" })

    expect(result).toHaveLength(100)
    expect(list).toHaveBeenCalledTimes(2)
  })

  it("laisse remonter l'erreur de l'API au lieu de rendre une liste partielle", async () => {
    const list = vi.fn(async (p: Record<string, unknown>) => {
      if (Number(p.page) === 2) throw new Error("HTTP 500")
      return page(rows(1, 100), 1)
    })

    await expect(fetchAllPages(list)).rejects.toThrow("HTTP 500")
  })
})
