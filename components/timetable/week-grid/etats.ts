/**
 * Ce qu'une case de la semaine raconte, et comment elle le montre.
 *
 * Cinq états, distingués par la **matière** et pas seulement par la teinte :
 * un aplat plein n'est pas une trame à 45°, qui n'est pas une trame à −45°,
 * qui n'est pas un fond vide. On doit pouvoir lire la grille sans la légende,
 * et la lire quand même quand on ne distingue pas le rouge du vert — ce qui
 * concerne un homme sur douze.
 *
 * Les deux trames qui coexistent vraiment, « indisponible » et « non
 * déclaré », sont donc orientées à l'opposé l'une de l'autre. Les distinguer
 * par la seule teinte reviendrait à ne pas les distinguer.
 */

import type { CSSProperties } from "react"

export type EtatCase = "libre" | "cours" | "ferme" | "ouvert" | "hors"

export const LIBELLES: Record<EtatCase, string> = {
  libre: "libre",
  cours: "occupé par un autre cours",
  ferme: "indisponible, déclaré",
  ouvert: "disponible, déclaré",
  hors: "hors des plages déclarées",
}

export const LIBELLES_LEGENDE: Record<EtatCase, string> = {
  libre: "Libre",
  cours: "Cours ailleurs",
  ferme: "Indisponible",
  ouvert: "Disponible",
  hors: "Non déclaré",
}

/**
 * L'aplat de chaque état.
 *
 * `cours` est le seul plein : c'est le seul empêchement qui porte un contenu,
 * un vrai cours avec sa classe. Les trames se lisent « barré » dans toutes les
 * cultures. `ouvert` reste discret pour ne pas concurrencer la sélection.
 */
export function styleDe(etat: EtatCase): { className: string; style?: CSSProperties } {
  switch (etat) {
    case "cours":
      return {
        className:
          "bg-sky-600/90 text-white shadow-sm ring-1 ring-inset ring-sky-700/30 dark:bg-sky-500/80",
      }
    case "ferme":
      return {
        className:
          "bg-rose-500/[0.07] ring-1 ring-inset ring-rose-400/40 dark:bg-rose-400/10 dark:ring-rose-400/30",
        style: {
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0 2px, transparent 2px 6px)",
          color: "rgb(244 63 94 / 0.3)",
        },
      }
    case "hors":
      return {
        className: "ring-1 ring-inset ring-border/60",
        style: {
          backgroundImage:
            "repeating-linear-gradient(-45deg, currentColor 0 1px, transparent 1px 9px)",
          color: "rgb(100 116 139 / 0.35)",
        },
      }
    case "ouvert":
      return { className: "bg-emerald-500/20 ring-1 ring-inset ring-emerald-500/40" }
    default:
      return { className: "bg-muted/25 ring-1 ring-inset ring-border/40" }
  }
}

