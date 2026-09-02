#!/usr/bin/env node
/**
 * Transforme `CHANGELOG.md` en un flux lisible par une machine.
 *
 * Jumeau de `scripts/release_feed.py` du backend, en JavaScript parce que ce
 * dépôt-ci n'a pas Python garanti sur les postes ni dans son image. Les deux
 * produisent la même forme, décrite une seule fois dans
 * `klassci-college-backend/docs/RELEASES-CONTRACT.md`.
 *
 * Deux implémentations d'un même analyseur peuvent dériver : c'est pour ça que
 * `release-feed.test.ts` fixe le comportement sur les cas du contrat, et que
 * la CI vérifie que le fichier produit suit le changelog.
 *
 *   node scripts/release-feed.mjs           # écrit RELEASES.json
 *   node scripts/release-feed.mjs --check   # échoue si le fichier a dérivé
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..")
const CHANGELOG = join(RACINE, "CHANGELOG.md")
const SORTIE = join(RACINE, "RELEASES.json")
// La tranche que le portail affiche. Servie depuis `public/`, donc récupérée à
// la demande : importer l'historique entier dans le bundle y ajouterait une
// centaine de kilo-octets que personne ne lit, sur des téléphones qui comptent.
const SORTIE_APP = join(RACINE, "public", "whats-new.json")
/** Le saut de ligne final, ecrit une fois pour ne pas etre echappe de travers. */
const NL = String.fromCharCode(10)

const VERSION = /^##\s+\[([^\]]+)\]\s*(?:-\s*(\d{4}-\d{2}-\d{2}))?\s*$/
const SECTION = /^###\s+(.+?)\s*$/
const ENTREE = /^-\s+(.*)$/
const PERSONA = /\*\(([^)]+)\)\*/
const PR = /\(#(\d+)\)/

/** Une ligne du changelog, telle qu'un écran peut la consommer. */
export function lireEntree(ligne) {
  const personas = ligne.match(PERSONA)
  const pr = ligne.match(PR)

  let texte = ligne
  if (personas) texte = texte.replace(personas[0], "")
  if (pr) texte = texte.replace(pr[0], "")

  return {
    text: texte.split(/\s+/).filter(Boolean).join(" ").replace(/[ ,;]+$/, ""),
    audience: personas ? personas[1].split(",").map((p) => p.trim()) : [],
    pull_request: pr ? Number(pr[1]) : null,
  }
}

/** Lit le changelog section par section, sans rien deviner. */
export function analyser(markdown) {
  const versions = []
  let section = null

  for (const ligne of markdown.split(/\r?\n/)) {
    const entete = ligne.match(VERSION)
    if (entete) {
      const [, nom, date] = entete
      versions.push({
        version: nom,
        date: date ?? null,
        released: nom.toLowerCase() !== "unreleased" && Boolean(date),
        sections: {},
      })
      section = null
      continue
    }

    // Tout ce qui précède la première version est le préambule du fichier :
    // il explique le format, il ne décrit aucune livraison.
    if (versions.length === 0) continue

    const titre = ligne.match(SECTION)
    if (titre) {
      section = titre[1]
      versions.at(-1).sections[section] ??= []
      continue
    }

    const entree = ligne.trim().match(ENTREE)
    // Les liens de comparaison en bas de fichier commencent aussi par un
    // tiret ; ils n'appartiennent à aucune section.
    if (entree && section) versions.at(-1).sections[section].push(lireEntree(entree[1]))
  }

  return versions
}

/**
 * Ce que le modal montre : les dernières entrées, et rien de plus.
 *
 * « Nouveautés » répond à « qu'est-ce qui a changé depuis ma dernière visite »,
 * pas à « raconte-moi deux ans ». Le produit n'a encore taggué aucune version :
 * tout vit sous `[Unreleased]`, soit près de quatre cents lignes accumulées sur
 * des mois. Les servir entières ferait cent kilo-octets sur un téléphone, pour
 * une liste que personne ne lirait jusqu'au bout.
 *
 * L'historique complet reste dans `RELEASES.json`, pour la vitrine et son agent.
 */
export const PAR_SECTION = 6

export function tranche(flux, parSection = PAR_SECTION) {
  const [recente] = flux.versions
  const sections = {}
  for (const [nom, lignes] of Object.entries(recente?.sections ?? {})) {
    // Les entrées les plus récentes sont en tête de section : la règle du dépôt
    // demande d'ajouter sous `[Unreleased]`, en haut. Prendre les premières,
    // c'est donc prendre les dernières écrites.
    if (lignes.length > 0) sections[nom] = lignes.slice(0, parSection)
  }
  return {
    product: flux.product,
    generated_at: flux.generated_at,
    version: recente?.version ?? null,
    released: recente?.released ?? false,
    // Ce que la tranche laisse de côté, pour que l'écran puisse le dire au
    // lieu de laisser croire qu'il montre tout.
    total: Object.values(recente?.sections ?? {}).reduce((n, l) => n + l.length, 0),
    sections,
  }
}

export function construire(produit, markdown) {
  const versions = analyser(markdown)
  const livrees = versions.filter((v) => v.released)
  return {
    product: produit,
    source: "CHANGELOG.md",
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    current_version: livrees[0]?.version ?? null,
    versions,
  }
}

function main() {
  const check = process.argv.includes("--check")
  const flux = construire("klassci-college-frontend", readFileSync(CHANGELOG, "utf8"))
  const rendu = JSON.stringify(flux, null, 2) + "\n"

  if (check) {
    if (!existsSync(SORTIE)) {
      console.error("RELEASES.json manque. Lancez : node scripts/release-feed.mjs")
      process.exit(1)
    }
    // `generated_at` bouge à chaque exécution : le comparer ferait échouer une
    // vérification sur une horloge, pas sur un contenu.
    const sans = (o) => {
      const { generated_at, ...reste } = o
      return reste
    }
    const avant = JSON.stringify(sans(JSON.parse(readFileSync(SORTIE, "utf8"))))
    const apres = JSON.stringify(sans(JSON.parse(rendu)))
    const trancheAvant = existsSync(SORTIE_APP)
      ? JSON.stringify(sans(JSON.parse(readFileSync(SORTIE_APP, "utf8"))))
      : ""
    if (avant !== apres || trancheAvant !== JSON.stringify(sans(tranche(flux)))) {
      console.error("RELEASES.json a dérivé du changelog. Lancez : node scripts/release-feed.mjs")
      process.exit(1)
    }
    return
  }

  writeFileSync(SORTIE, rendu, "utf8")
  writeFileSync(SORTIE_APP, JSON.stringify(tranche(flux), null, 2) + NL, "utf8")
  const entrees = flux.versions.reduce(
    (n, v) => n + Object.values(v.sections).reduce((m, s) => m + s.length, 0),
    0,
  )
  console.log(
    `RELEASES.json : ${flux.versions.length} versions, ${entrees} entrées. public/whats-new.json : ${tranche(flux).version}.`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
