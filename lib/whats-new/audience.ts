/**
 * Qui est concerné par quelle nouveauté.
 *
 * Le changelog nomme des **métiers** — comptable, caissier, secrétariat,
 * éducateur — là où la session ne connaît que des **portails** : admin,
 * enseignant, élève, parent. Les deux vocabulaires ne se recouvrent pas, et
 * c'est voulu : une école range ses métiers comme elle veut, le portail reste
 * le même.
 *
 * La traduction vit ici, à un seul endroit. Elle décide de ce qu'un parent lit
 * dans « Nouveautés », et se tromper de sens y serait grave dans les deux
 * directions : montrer à une famille une note technique sur les sauvegardes,
 * ou lui cacher que son portail affiche désormais l'échéancier.
 */

/** Les portails, tels que la session les nomme. */
export type Portail = "admin" | "teacher" | "student" | "parent" | "super-admin"

/**
 * Les personas du changelog qui parlent à chaque portail.
 *
 * L'administration porte tous les métiers de l'établissement : c'est le même
 * portail qui encaisse, inscrit et surveille, et découper plus finement
 * demanderait au changelog de connaître la répartition des postes, qui change
 * d'une école à l'autre.
 */
const PERSONAS_DU_PORTAIL: Record<Portail, readonly string[]> = {
  admin: ["admin", "comptable", "caissier", "secrétariat", "éducateur", "super-admin"],
  "super-admin": [
    "admin",
    "comptable",
    "caissier",
    "secrétariat",
    "éducateur",
    "super-admin",
    "devops",
    "technique",
  ],
  teacher: ["enseignant"],
  student: ["élève"],
  parent: ["parent"],
}

/**
 * Cette nouveauté parle-t-elle à ce portail ?
 *
 * **Une ligne sans persona est transverse**, et va donc à tout le monde : c'est
 * ce que le changelog veut dire en n'en nommant aucun. La traiter comme « on ne
 * sait pas » la ferait disparaître pour tous.
 */
export function concerne(portail: string | undefined, audience: readonly string[]): boolean {
  if (audience.length === 0) return true
  const attendus = PERSONAS_DU_PORTAIL[portail as Portail]
  if (!attendus) return false
  return audience.some((p) => attendus.includes(p.toLowerCase()))
}
