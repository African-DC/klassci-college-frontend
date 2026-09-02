import { z } from "zod"
import { apiFetch, safeValidate } from "./client"

/**
 * Les nouveautés viennent de deux moitiés, et il en faut deux pour dire vrai.
 *
 * Le portail embarque les siennes — les écrans — dans un fichier statique. Le
 * serveur sert les siennes : les calculs, les documents, les droits. Ne montrer
 * que la première tairait l'essentiel de ce qu'une école remarque.
 */

const EntreeSchema = z.object({
  text: z.string(),
  audience: z.array(z.string()).default([]),
  pull_request: z.number().nullable().default(null),
})

const TrancheSchema = z.object({
  product: z.string(),
  generated_at: z.string(),
  version: z.string().nullable(),
  released: z.boolean().default(false),
  total: z.number().default(0),
  sections: z.record(z.string(), z.array(EntreeSchema)).default({}),
})

/** Le serveur rend son historique entier ; on n'en garde que le sommet. */
const FluxServeurSchema = z.object({
  product: z.string(),
  generated_at: z.string().default(""),
  versions: z
    .array(
      z.object({
        version: z.string(),
        released: z.boolean().default(false),
        sections: z.record(z.string(), z.array(EntreeSchema)).default({}),
      }),
    )
    .default([]),
})

export type Entree = z.infer<typeof EntreeSchema>
export type Tranche = z.infer<typeof TrancheSchema>

/** Combien d'entrées par section, comme la tranche du portail. */
const PAR_SECTION = 6

const VIDE: Tranche = {
  product: "",
  generated_at: "",
  version: null,
  released: false,
  total: 0,
  sections: {},
}

export const whatsNewApi = {
  /** Les nouveautés du portail, servies en statique. */
  portail: async (): Promise<Tranche> => {
    const res = await fetch("/whats-new.json", { cache: "no-store" })
    if (!res.ok) return VIDE
    return safeValidate(TrancheSchema, await res.json(), "GET /whats-new.json")
  },

  /** Les nouveautés du serveur, ramenées à la même forme. */
  serveur: async (): Promise<Tranche> => {
    const json = await apiFetch<unknown>("/whats-new")
    const flux = safeValidate(FluxServeurSchema, json, "GET /whats-new")
    const [recente] = flux.versions
    const sections: Record<string, Entree[]> = {}
    for (const [nom, lignes] of Object.entries(recente?.sections ?? {})) {
      if (lignes.length > 0) sections[nom] = lignes.slice(0, PAR_SECTION)
    }
    return {
      product: flux.product,
      generated_at: flux.generated_at,
      version: recente?.version ?? null,
      released: recente?.released ?? false,
      total: Object.values(recente?.sections ?? {}).reduce((n, l) => n + l.length, 0),
      sections,
    }
  },
}
