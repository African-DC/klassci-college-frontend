"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  FileText,
  Loader2,
  RotateCcw,
  Check,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUploadHandoff,
  type HandoffOutcome,
} from "@/lib/hooks/useUploadHandoff";
import type { HandoffTargetKind } from "@/lib/contracts/upload-handoff";

/**
 * Le code QR, l'attente, l'aperçu, et les deux mots : Confirmer, Reprendre.
 *
 * Un seul composant pour les six points de téléversement du produit. Ce qui
 * change d'une cible à l'autre — le droit exigé, la sorte de destination, la
 * fonction qui écrit la fiche — vit dans le registre du serveur, jamais ici :
 * brancher une cible de plus, c'est passer un `targetKind` de plus, pas écrire
 * un second dialogue.
 *
 * Ce que ce composant garantit, et qui n'est pas décoratif
 * =======================================================
 *
 * **Rien n'est écrit avant « Confirmer ».** Le téléphone dépose dans un sas ;
 * la colonne `photo_url` n'est touchée que par le clic de l'opérateur, avec sa
 * session et son droit à lui. C'est ce qui rend acceptable qu'un jeton porteur
 * circule dans un code qu'on peut photographier par-dessus une épaule : le pire
 * qu'un code volé produit est une image que quelqu'un voit, et refuse.
 *
 * **Le code meurt avec le dialogue.** `enabled` suit l'ouverture ; à la
 * fermeture comme au démontage, `useUploadHandoff` révoque la session et
 * arrête le sondage. Sans cela un code resterait valable dix minutes sur un
 * écran que plus personne ne regarde.
 *
 * **Un code périmé se remplace sans quitter l'écran.** « Afficher un nouveau
 * code » remonte le panneau par sa `key` : l'ancienne session est révoquée par
 * le nettoyage de l'effet, une neuve s'ouvre. L'opérateur ne referme rien et
 * ne perd pas le contexte de la fiche qu'il regarde.
 */

export interface UploadHandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** La cible du registre serveur. Elle porte le droit, la destination et l'écriture. */
  targetKind: HandoffTargetKind;
  /**
   * Le destinataire, quand il existe. Absent à l'inscription : la photo est
   * prise avant que la fiche existe, la session bascule alors en `stage-only`
   * et le fichier revient au formulaire au lieu d'être écrit.
   */
  subjectId?: number | null;
  /** Ce que la cible réclame en plus — le type d'une pièce jointe, par exemple. */
  extras?: Record<string, string>;
  /** Ce que l'écran fait du résultat. La fermeture du dialogue est déjà faite. */
  onResolved: (outcome: HandoffOutcome) => void;
}

/** « 4:05 » — l'opérateur lit un temps restant, pas un horodatage. */
function compteARebours(secondes: number): string {
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  return `${minutes}:${String(reste).padStart(2, "0")}`;
}

export function UploadHandoffDialog({
  open,
  onOpenChange,
  targetKind,
  subjectId = null,
  extras,
  onResolved,
}: UploadHandoffDialogProps) {
  // Remonter le panneau est la seule façon honnête de rouvrir une session : le
  // nettoyage de l'effet révoque l'ancienne avant que la neuve s'ouvre.
  const [relance, setRelance] = useState(0);
  useEffect(() => {
    if (!open) setRelance(0);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open ? (
          <PanneauDeSession
            key={relance}
            targetKind={targetKind}
            subjectId={subjectId}
            extras={extras}
            onRelancer={() => setRelance((n) => n + 1)}
            onFermer={() => onOpenChange(false)}
            onResolved={onResolved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PanneauDeSession({
  targetKind,
  subjectId,
  extras,
  onRelancer,
  onFermer,
  onResolved,
}: {
  targetKind: HandoffTargetKind;
  subjectId: number | null;
  extras?: Record<string, string>;
  onRelancer: () => void;
  onFermer: () => void;
  onResolved: (outcome: HandoffOutcome) => void;
}) {
  const handoff = useUploadHandoff({
    targetKind,
    subjectId,
    extras,
    enabled: true,
  });

  const {
    opening,
    openError,
    state,
    metier,
    label,
    qrSvg,
    url,
    warnings,
    secondsLeft,
    expired,
    lost,
    retakesLeft,
    previewUrl,
    previewLoading,
    previewError,
    confirm,
    confirming,
    confirmError,
    retake,
    retaking,
    retakeError,
  } = handoff;

  const session = handoff.session;
  const apercuEstUneImage = (session?.staged_mime ?? "image/jpeg").startsWith(
    "image/",
  );
  const perime = expired || lost;
  const depose = state === "proposed";

  async function confirmer() {
    let resultat: HandoffOutcome;
    try {
      resultat = await confirm();
    } catch {
      // `confirmError` porte déjà le message à l'écran ; laisser filer le rejet
      // ne ferait qu'ajouter une erreur non gérée dans la console.
      return;
    }
    onFermer();
    onResolved(resultat);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 shrink-0" aria-hidden />
          {metier || "Dépôt par téléphone"}
        </DialogTitle>
        <DialogDescription>
          {label ? `${label} — ` : ""}
          Rien ne sera enregistré tant que vous n&apos;aurez pas confirmé sur
          cet écran.
        </DialogDescription>
      </DialogHeader>

      {/* Une seule région annoncée : l'état du dépôt change sans que rien ne
          prenne le focus, et une personne au lecteur d'écran doit l'apprendre. */}
      <div className="space-y-4" aria-live="polite">
        {opening && (
          <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Ouverture du dépôt…
          </p>
        )}

        {openError && <Alerte message={openError} />}

        {!opening && !openError && perime && !depose && (
          <div className="space-y-3">
            <Alerte message="Ce code n'est plus valable. Affichez-en un nouveau pour reprendre." />
            <Button type="button" className="h-11 w-full" onClick={onRelancer}>
              <RotateCcw aria-hidden />
              Afficher un nouveau code
            </Button>
          </div>
        )}

        {!opening && !openError && !perime && !depose && (
          <div className="space-y-4">
            {qrSvg ? (
              <div className="flex justify-center">
                {/*
                  Le SVG vient de notre propre serveur, rendu par `segno` à
                  partir d'une URL que nous avons fabriquée : il n'y a pas de
                  saisie utilisateur dans cette chaîne. Le poser tel quel évite
                  d'embarquer une librairie de code QR dans le navigateur pour
                  redessiner ce que le serveur sait déjà dessiner.
                */}
                <div
                  className="rounded-xl border bg-white p-3 [&_svg]:h-44 [&_svg]:w-44"
                  role="img"
                  aria-label="Code à scanner avec l'appareil photo du téléphone"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              </div>
            ) : null}

            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">
                Scannez ce code avec l&apos;appareil photo du téléphone.
              </p>
              <p className="text-xs text-muted-foreground">
                {secondsLeft !== null
                  ? `Valable encore ${compteARebours(secondsLeft)}.`
                  : "Valable quelques minutes."}{" "}
                {state === "receiving"
                  ? "Un téléphone est en train d'envoyer…"
                  : ""}
              </p>
            </div>

            {url ? (
              <details className="rounded-lg border bg-muted/30 px-3 py-2">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                  Le code ne passe pas ? Afficher l&apos;adresse à saisir
                </summary>
                <p className="mt-2 break-all font-mono text-[11px] leading-relaxed">
                  {url}
                </p>
              </details>
            ) : null}

            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((avertissement) => (
                  <Alerte key={avertissement} message={avertissement} />
                ))}
              </div>
            )}
          </div>
        )}

        {depose && (
          <div className="space-y-4">
            {previewLoading && (
              <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Chargement de l&apos;aperçu…
              </p>
            )}
            {previewError && (
              <Alerte message="L'aperçu n'a pas pu être chargé." />
            )}
            {previewUrl && apercuEstUneImage && (
              <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-xl border bg-muted">
                {/* Une URL d'objet locale : ces octets ne sont servis par aucune
                    origine, il n'y a rien à optimiser ni à mettre en cache. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Aperçu du dépôt reçu du téléphone"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {previewUrl && !apercuEstUneImage && (
              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
                <FileText
                  className="h-6 w-6 shrink-0 text-primary"
                  aria-hidden
                />
                <p className="min-w-0 text-sm">
                  Document reçu du téléphone. Confirmez pour l&apos;attacher à
                  la fiche.
                </p>
              </div>
            )}

            {confirmError && <Alerte message={confirmError} />}
            {retakeError && <Alerte message={retakeError} />}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="h-11 flex-1"
                disabled={confirming || retaking}
                onClick={() => void confirmer()}
              >
                {confirming ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Check aria-hidden />
                )}
                Confirmer
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                disabled={confirming || retaking || (retakesLeft ?? 0) <= 0}
                onClick={() => void retake().catch(() => undefined)}
              >
                {retaking ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <RotateCcw aria-hidden />
                )}
                Reprendre
              </Button>
            </div>
            {retakesLeft !== null && retakesLeft <= 0 && (
              <p className="text-xs text-muted-foreground">
                Plus de reprise possible sur ce code. Confirmez, ou fermez et
                affichez-en un nouveau.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Le message porte l'information ; la couleur ne fait que la souligner.
 *
 * La paire claire/sombre plutôt que `text-destructive` : en thème sombre ce
 * token tombe vers 1,9:1 sur le fond de page, illisible — et c'est un message
 * lu en plein soleil sur un écran de bureau bon marché.
 */
function Alerte({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-400"
        aria-hidden
      />
      <p className="min-w-0 break-words text-sm text-red-700 dark:text-red-400">
        {message}
      </p>
    </div>
  );
}
