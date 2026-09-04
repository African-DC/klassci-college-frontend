/**
 * Où le code QR sert, et où il ne sert à rien.
 *
 * La reprise par téléphone existe pour un poste qui n'a pas d'appareil photo —
 * le fixe du secrétariat, l'ordinateur du bureau, ou n'importe quelle machine
 * servie en HTTP simple, où `getUserMedia` n'existe tout bonnement pas. Là, le
 * code QR est le seul chemin : il se montre au premier rang.
 *
 * Sur un appareil qu'on tient dans la main et qui a une caméra, il ne sert à
 * rien du tout : le téléphone que le code appellerait est celui qui affiche le
 * code. Proposer le détour serait proposer de se scanner soi-même. On le
 * retire — la caméra directe reste le geste par défaut, sans détour, exactement
 * comme aujourd'hui.
 *
 * Entre les deux — un portable avec webcam — le code reste offert au second
 * rang : l'appareil photo d'un téléphone rend une bien meilleure photo d'élève
 * qu'une webcam de portable, et c'est le genre de choix qu'on laisse à la
 * personne, sans le lui imposer.
 *
 * Le cas qu'on accepte de perdre : une tablette avec caméra, qu'on voudrait
 * alimenter depuis un téléphone tiers. La caméra de la tablette fait déjà le
 * travail, et il n'existe aucun moyen fiable de distinguer une tablette d'un
 * téléphone dans un navigateur.
 */

export type HandoffRank =
  /** Aucun autre chemin : le bouton est l'action principale. */
  | "prominent"
  /** Un autre chemin existe et reste le défaut : bouton discret, disponible. */
  | "second"
  /** L'appareil EST le téléphone qu'on appellerait : rien à afficher. */
  | "hidden";

export interface HandoffRankInput {
  /** `canUseLiveCamera()` : contexte sécurisé ET `getUserMedia` présent. */
  camera: boolean;
  /** Le pointeur principal est un doigt : `(pointer: coarse)`. */
  coarsePointer: boolean;
}

export function handoffRank({
  camera,
  coarsePointer,
}: HandoffRankInput): HandoffRank {
  if (!camera) return "prominent";
  if (coarsePointer) return "hidden";
  return "second";
}

/**
 * Le pointeur principal est-il un doigt ?
 *
 * `matchMedia` peut manquer (rendu serveur, très vieux WebView) : on répond
 * alors « non », ce qui laisse le bouton visible. Se tromper dans ce sens
 * n'offre qu'un bouton de trop ; se tromper dans l'autre retirerait le seul
 * chemin d'un poste sans caméra.
 */
export function hasCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  return window.matchMedia("(pointer: coarse)").matches;
}
