/**
 * Réconciliation d'une feuille de notes après envoi au serveur.
 *
 * Une ligne de saisie n'est pas une note : c'est un couple « note, absent ».
 * Les deux voyagent ensemble au serveur, donc les deux doivent servir à
 * décider si la ligne est enregistrée ou toujours en attente. Comparer la
 * seule valeur numérique fait passer pour « enregistré » un décochage que le
 * backend a refusé, et l'écran recoche alors la case tout seul.
 *
 * Ces fonctions sont pures et sans React : c'est ici que vivait le bug, c'est
 * ici qu'il est testé.
 */

/** Statut renvoyé par le backend pour un zéro d'office. */
export const ABSENT_SERVER_STATUS = "absent"

/** État d'une ligne de saisie : la note et le zéro d'office vont ensemble. */
export interface GradeEntryState {
  value: number | null
  absent: boolean
}

/** Ce qu'une ligne devient après un envoi. */
export type GradeSaveOutcome = "saved" | "dirty" | "refused"

/**
 * Un élève absent n'emporte pas de note : le backend inscrit lui-même le zéro
 * d'office. Envoyer une valeur et un « absent » contradictoires laisserait le
 * serveur arbitrer, et l'écran ne saurait pas ce qu'il a réellement écrit.
 */
export function normalizeGradeState(state: GradeEntryState): GradeEntryState {
  return state.absent ? { value: null, absent: true } : state
}

/** Deux états de saisie décrivent-ils la même chose ? */
export function gradeStatesEqual(a: GradeEntryState, b: GradeEntryState): boolean {
  const left = normalizeGradeState(a)
  const right = normalizeGradeState(b)
  return left.absent === right.absent && Object.is(left.value, right.value)
}

/** La ligne telle qu'elle part dans le lot envoyé au backend. */
export function toGradePayloadEntry(
  studentId: number,
  state: GradeEntryState,
): { student_id: number; value: number | null; absent: boolean } {
  const normalized = normalizeGradeState(state)
  return {
    student_id: studentId,
    value: normalized.value,
    absent: normalized.absent,
  }
}

/**
 * Un zéro d'office ne se lève pas depuis la feuille de notes : c'est
 * l'administration qui délivre une autorisation de reprise. Tant que le
 * serveur porte le statut « absent », décocher la case ne peut qu'échouer, et
 * échouer de deux façons également silencieuses : soit la note repart à un
 * 0/20 « saisi » qui compte dans la moyenne sans que personne ne l'ait décidé,
 * soit le backend garde le statut et vide la valeur, et le zéro disparaît du
 * bulletin.
 */
export function canLiftAbsence(serverStatus: string | null | undefined): boolean {
  return serverStatus !== ABSENT_SERVER_STATUS
}

/**
 * Le serveur a-t-il refusé la levée du zéro d'office ? On a envoyé
 * `absent: false`, il répond toujours « absent » : c'est un refus, pas un
 * succès, même si la valeur renvoyée ressemble à ce qu'on attendait.
 */
export function isAbsenceLiftRefused(
  sent: GradeEntryState,
  serverStatus: string | null | undefined,
): boolean {
  return !normalizeGradeState(sent).absent && serverStatus === ABSENT_SERVER_STATUS
}

/** Cocher « Abs. » sur une ligne déjà notée remplace cette note par un zéro. */
export function absenceWouldOverwriteGrade(state: GradeEntryState): boolean {
  return !state.absent && state.value !== null
}

/**
 * Verdict d'une ligne après retour du serveur.
 *
 * - `refused` : le backend a gardé le zéro d'office. La ligne n'est pas
 *   enregistrée, et la renvoyer telle quelle échouerait à l'identique.
 * - `saved` : ce qui est à l'écran est exactement ce qui est parti.
 * - `dirty` : l'enseignant a retouché la ligne pendant l'envoi, il faut
 *   repartir avec la nouvelle valeur.
 */
export function reconcileGradeSave(args: {
  sent: GradeEntryState
  current: GradeEntryState
  serverStatus: string | null | undefined
}): GradeSaveOutcome {
  const { sent, current, serverStatus } = args
  if (isAbsenceLiftRefused(sent, serverStatus)) return "refused"
  return gradeStatesEqual(sent, current) ? "saved" : "dirty"
}

/**
 * Valeur d'amorçage du mode dictée pour une note déjà au serveur.
 *
 * `undefined` = pas encore saisi, `null` = absent, `number` = note /20. Le
 * garde de sortie « modifications non enregistrées » compare l'état courant à
 * cette même fonction : les deux lectures doivent venir d'un seul endroit,
 * sinon le garde crie à vide dès qu'un élève est absent, et un garde qui crie
 * à vide est un garde qu'on apprend à cliquer sans lire.
 */
export function dicteeEntryFromServer(grade: {
  value: number | null
  status: string
}): number | null | undefined {
  if (grade.status === ABSENT_SERVER_STATUS) return null
  if (grade.value !== null) return Number(grade.value)
  return undefined
}
