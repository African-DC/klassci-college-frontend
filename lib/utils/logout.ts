import { signOut } from "next-auth/react"

/**
 * Déconnexion host-agnostique.
 *
 * `signOut({ callbackUrl })` fait résoudre l'URL de retour par NextAuth côté
 * serveur, contre `NEXTAUTH_URL` (ou l'origine dérivée du build). En prod
 * derrière le reverse proxy, cette valeur peut rester `http://localhost:3000`,
 * si bien que la déconnexion renvoie l'utilisateur sur `localhost` au lieu du
 * domaine réellement utilisé.
 *
 * On coupe court : `signOut({ redirect: false })` se contente d'invalider le
 * cookie de session, puis on redirige nous-mêmes vers un chemin relatif. Le
 * navigateur résout `/login` contre l'origine courante (le domaine ou l'IP que
 * l'utilisateur a réellement ouvert), quel que soit l'hôte. Même contrat que
 * `ChangePasswordForm` après un changement de mot de passe.
 */
export async function logout(): Promise<void> {
  await signOut({ redirect: false }).catch(() => {})
  window.location.href = "/login"
}
