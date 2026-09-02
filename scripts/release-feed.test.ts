import { describe, expect, it } from "vitest"
// @ts-expect-error — module JavaScript sans types : c'est lui qu'on teste.
import { analyser as analyserBrut, construire as construireBrut, lireEntree as lireBrut } from "./release-feed.mjs"

/**
 * Le script est du JavaScript pur, sans déclarations. On nomme ici la forme
 * qu'il rend, qui est celle du contrat : le test vérifie alors une promesse
 * écrite, et pas seulement ce que le code fait aujourd'hui.
 */
interface EntreeLue {
  text: string
  audience: string[]
  pull_request: number | null
}

interface VersionLue {
  version: string
  date: string | null
  released: boolean
  sections: Record<string, EntreeLue[]>
}

const analyser = analyserBrut as (markdown: string) => VersionLue[]
const lireEntree = lireBrut as (ligne: string) => EntreeLue
const construire = construireBrut as (
  produit: string,
  markdown: string,
) => { current_version: string | null }

/**
 * Ce fichier existe parce que le même analyseur est écrit deux fois : ici en
 * JavaScript, et en Python côté backend. Deux implémentations dérivent, et le
 * jour où elles dérivent, la vitrine et le modal ne disent plus la même chose.
 *
 * Les cas fixés ci-dessous sont ceux que le contrat promet — voir
 * `klassci-college-backend/docs/RELEASES-CONTRACT.md`.
 */

describe("une entrée du changelog", () => {
  it("sort le persona du texte et en fait une liste", () => {
    const e = lireEntree("Le journal s'ouvre sur l'année en cours *(admin, comptable)*")
    expect(e.text).toBe("Le journal s'ouvre sur l'année en cours")
    expect(e.audience).toEqual(["admin", "comptable"])
  })

  it("sort le numéro de PR et en fait un nombre", () => {
    expect(lireEntree("Une correction quelconque (#412)").pull_request).toBe(412)
  })

  it("ne devine rien quand la ligne ne dit rien", () => {
    const e = lireEntree("Une ligne transverse, sans persona ni PR")
    // `[]` veut dire « transverse », pas « on n'a pas su lire ».
    expect(e.audience).toEqual([])
    expect(e.pull_request).toBeNull()
  })

  it("laisse le texte lisible, sans virgule ni espace orphelins", () => {
    const e = lireEntree("Quelque chose d'utile *(parent)* (#7)")
    expect(e.text).toBe("Quelque chose d'utile")
  })
})

describe("le flux", () => {
  const md = [
    "# Changelog",
    "",
    "Préambule qui explique le format et ne décrit aucune livraison.",
    "",
    "## [Unreleased]",
    "",
    "### Added",
    "- Une nouveauté *(admin)*",
    "",
    "## [0.2.0] - 2026-08-01",
    "",
    "### Fixed",
    "- Un défaut corrigé *(parent)* (#12)",
    "",
    "[unreleased]: https://example.invalid/compare",
  ].join("\n")

  it("ignore le préambule", () => {
    expect(analyser(md)).toHaveLength(2)
  })

  it("laisse Unreleased sans date et non livrée", () => {
    const [premiere] = analyser(md)
    expect(premiere.version).toBe("Unreleased")
    // Lui inventer une date ferait annoncer une livraison qui n'a pas eu lieu.
    expect(premiere.date).toBeNull()
    expect(premiere.released).toBe(false)
  })

  it("retient la dernière version taguée comme version courante", () => {
    expect(construire("test", md).current_version).toBe("0.2.0")
  })

  it("n'avale pas les liens de comparaison du bas de fichier", () => {
    const versions = analyser(md)
    const lignes = versions.flatMap((v) => Object.values(v.sections).flat())
    expect(lignes.some((l) => l.text.includes("example.invalid"))).toBe(false)
  })
})
