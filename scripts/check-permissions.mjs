#!/usr/bin/env node
/**
 * Ce qu'on affiche se demande à la matrice des droits, pas au rôle.
 *
 * # Ce que ce contrôle garde
 *
 * Une école répartit ses postes comme elle veut. Confier la configuration des
 * années au secrétariat doit suffire à lui ouvrir l'écran — sans toucher au
 * code. Chaque `role === "admin"` qui décide d'un affichage casse cette
 * promesse : le lien reste invisible pour la personne qui en a désormais la
 * charge, et visible pour celle à qui on l'a retirée.
 *
 * C'est arrivé. `AcademicYearBanner` montrait « Configurer maintenant » sur
 * `role === "admin"` ; il lit désormais `admin:academic-years:create`.
 *
 * # Ce que ce contrôle NE PEUT PAS faire
 *
 * Il ne sait pas si le droit demandé est le **bon**. Rien ici ne sait que le
 * tableau des soldes relève de `payments:read:all` : c'est un jugement, il se
 * prend en revue.
 *
 * Il ne voit pas un bouton d'action rendu à qui n'a que la lecture, quand la
 * condition est calculée ailleurs. Cela se regarde à l'écran.
 *
 * Le dire fait partie du travail : un garde-fou qu'on croit total est plus
 * dangereux que pas de garde-fou du tout.
 *
 *   node scripts/check-permissions.mjs           # tout le dépôt
 *   node scripts/check-permissions.mjs --staged  # seulement ce qui est indexé
 */

import { readFileSync, existsSync } from "node:fs"
import { execSync } from "node:child_process"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { globSync } from "node:fs"

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..")

/** Un rôle qui décide d'un affichage : `role === "admin"`, `role !== "parent"`. */

const ROLE_REEL = /(?:^|[^\w.])role\s*(?:===|!==)\s*["'`]/

/**
 * Là où comparer un rôle est légitime, et pourquoi.
 *
 * Cette liste est de la documentation autant qu'une exception : elle répond à
 * « où le rôle décide-t-il encore quelque chose », qu'on ne devrait pas avoir
 * à reconstituer en lisant tout le portail.
 */
const TOLERES = {
  "middleware.ts": "le rôle choisit le portail — c'est la seule chose qu'il décide",
  "auth.ts": "la session porte le rôle : c'est ici qu'il est établi",
  "components/shared/Navbar.tsx": "choisit le portail d'accueil, pas un accès",
  "components/shared/profile/ProfileInfoCard.tsx": "choisit un libellé, « Spécialité » ou « Poste »",
  "app/(super-admin)/super-admin/layout.tsx": "sépare les portails, comme le middleware",
  "app/(admin)/admin/dashboard/page.tsx": "redirige vers le bon portail",
  "lib/whats-new/audience.ts": "traduit un portail en personas de changelog, n'ouvre rien",
  "components/shared/AcademicYearBanner.tsx": "adapte le message au rôle ; le lien, lui, suit le droit",
}

/** Une entrée de menu que tout le monde voit, et pourquoi. */
const MENUS_OUVERTS = {
  Dashboard: "chaque rôle a le sien, et il ne montre que ce qu'on peut déjà lire",
  Notifications: "chacun lit les siennes",
}

function fichiers(staged) {
  if (staged) {
    const sortie = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      cwd: RACINE,
      encoding: "utf8",
    })
    return sortie
      .split(/\s+/)
      .filter((f) => /\.(ts|tsx)$/.test(f) && existsSync(join(RACINE, f)))
  }
  return globSync(["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "*.ts"], {
    cwd: RACINE,
  })
}

function verifier(staged) {
  const fautes = []

  for (const relatif of fichiers(staged)) {
    const chemin = relatif.split("\\").join("/")
    if (/\.test\.tsx?$/.test(chemin)) continue

    const src = readFileSync(join(RACINE, relatif), "utf8")

    // --- Règle 1 : aucun rôle ne décide d'un affichage --------------------
    if (!(chemin in TOLERES)) {
      src.split(/\r?\n/).forEach((ligne, i) => {
        const nu = ligne.trim()
        if (nu.startsWith("//") || nu.startsWith("*")) return
        if (!ROLE_REEL.test(ligne)) return
        fautes.push({
          fichier: chemin,
          ligne: i + 1,
          regle: "rôle qui décide d'un affichage",
          quoi: nu.slice(0, 90),
          pourquoi:
            "Lisez le droit : `const { has } = usePermissions()`. Une école qui confie " +
            "ce poste à un autre rôle doit pouvoir le faire sans toucher au code. " +
            "Si le rôle est légitime ici — portail, libellé — déclarez-le dans TOLERES.",
        })
      })
    }

    // --- Règle 2 : une entrée de menu déclare le droit qu'elle exige ------
    if (chemin.endsWith("lib/navigation/adminNav.ts")) {
      const lignes = src.split(/\r?\n/)
      lignes.forEach((ligne, i) => {
        if (!/anyOf:\s*\[\s*\]/.test(ligne)) return
        const label = ligne.match(/label:\s*"([^"]+)"/)?.[1] ?? "?"
        if (label in MENUS_OUVERTS) return
        fautes.push({
          fichier: chemin,
          ligne: i + 1,
          regle: "entrée de menu sans droit",
          quoi: `« ${label} » — anyOf: []`,
          pourquoi:
            "Une entrée que tout le monde voit mène souvent à un écran qui répond 403. " +
            "Nommez le droit, ou déclarez l'entrée dans MENUS_OUVERTS avec sa raison.",
        })
      })
    }
  }

  return fautes
}

const staged = process.argv.includes("--staged")
const fautes = verifier(staged)

if (fautes.length === 0) {
  console.log("Permissions : rien à signaler.")
  process.exit(0)
}

console.log("\nCe qu'on affiche se demande à la matrice des droits, pas au rôle.\n")
for (const f of fautes) {
  console.log(`  ${f.fichier}:${f.ligne}  [${f.regle}]`)
  console.log(`      ${f.quoi}`)
  console.log(`      ${f.pourquoi}\n`)
}
console.log(`${fautes.length} à corriger. La règle : scripts/check-permissions.mjs\n`)
process.exit(1)
