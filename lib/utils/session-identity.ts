import type { UserRole } from "@/types/next-auth"

/** Ce que la session porte pour identifier la personne connectée. */
interface SessionUser {
  email?: string | null
  firstName?: string | null
  lastName?: string | null
}

/**
 * Le nom à afficher pour la personne connectée.
 *
 * Le repli sur le début de l'adresse e-mail est délibéré : une session créée
 * avant que les noms ne transitent n'en porte pas, et elle reste valable
 * plusieurs jours. Sans ce repli, l'écran afficherait « undefined » jusqu'à
 * la prochaine connexion.
 */
export function displayName(user: SessionUser | undefined | null): string {
  const complet = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  if (complet) return complet
  return emailLocalPart(user?.email) || "Utilisateur"
}

/** Le prénom seul, pour une salutation. */
export function greetingName(user: SessionUser | undefined | null): string {
  const prenom = user?.firstName?.trim()
  if (prenom) return prenom
  return emailLocalPart(user?.email) || "Utilisateur"
}

function emailLocalPart(email: string | null | undefined): string {
  return (email ?? "").split("@")[0] ?? ""
}

/**
 * Le rôle en français, tel qu'on peut honnêtement le nommer.
 *
 * `/auth/me` ne rend que le rôle de portail : `staff` couvre indifféremment
 * le caissier, l'éducateur, le comptable, le secrétariat et le directeur des
 * études. Afficher « Caissier » serait donc inventer une précision que la
 * session ne porte pas — d'où « Personnel », qui est vrai pour tous.
 */
const LIBELLES: Record<UserRole, string> = {
  admin: "Administrateur",
  director: "Direction",
  staff: "Personnel",
  accountant: "Comptable",
  teacher: "Enseignant",
  student: "Élève",
  parent: "Parent",
  super_admin: "Super-administrateur",
}

export function roleLabel(role: UserRole | undefined | null): string {
  if (!role) return ""
  return LIBELLES[role] ?? "Personnel"
}
