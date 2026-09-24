/**
 * Une clé par envoi, pour qu'un renvoi n'enregistre pas deux fois.
 *
 * Sur une 3G qui coupe, la caissière appuie sur « Enregistrer », l'écran
 * tourne, elle appuie encore. La clé reste la même tant que la saisie ne
 * change pas : le serveur rend alors le versement déjà écrit au lieu d'en
 * écrire un second. Une saisie modifiée est un autre versement, donc une
 * autre clé.
 */
export function newSubmissionKey(): string {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID()
  // Navigateurs anciens et pages servies en HTTP (démo sur IP) : `randomUUID`
  // n'y existe pas. `getRandomValues`, lui, est disponible partout.
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    // Une clé constante ferait refuser tous les versements suivants comme des
    // renvois : mieux vaut échouer ici, et le dire.
    throw new Error("Ce navigateur ne sait pas tirer une clé d'envoi sûre.")
  }
  const octets = new Uint8Array(16)
  cryptoApi.getRandomValues(octets)
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("")
}
