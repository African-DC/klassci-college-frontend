"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { downscaleImageFile, validatePhotoFile } from "@/lib/photo/camera";
import { UploadHandoffDialog } from "./UploadHandoffDialog";
import { useHandoffRank } from "./UploadHandoffButton";
import type { HandoffOutcome } from "@/lib/hooks/useUploadHandoff";
import type { HandoffTargetKind } from "@/lib/contracts/upload-handoff";

/**
 * Poser une photo sur une fiche qui existe déjà — élève, enseignant, personnel,
 * profil.
 *
 * Quatre écrans faisaient, ou allaient faire, exactement les mêmes sept gestes :
 * un `<input type="file">` caché, un ref, un état « envoi en cours », un envoi,
 * une invalidation de cache, deux toasts. Ils vivent ici une fois. Ce que
 * l'appelant garde, parce que cela lui appartient vraiment : quelle fonction
 * envoie le fichier, et quelles clés de cache invalider ensuite.
 *
 * Ce que ce regroupement corrige au passage : **aucun de ces écrans ne réduisait
 * ni ne validait le fichier choisi**. Un JPEG sorti de la galerie d'un téléphone
 * récent pèse quatre à six mégaoctets — refusé par le serveur, et interminable
 * sur la donnée mobile d'une école. La réduction passe donc AVANT la validation,
 * jamais après, comme sur l'écran d'inscription.
 *
 * Pourquoi un objet à poser, et pas un composant qui rend tout
 * ===========================================================
 *
 * Trois de ces écrans déclenchent la photo depuis une entrée de menu déroulant.
 * Un menu Radix démonte son contenu à la fermeture : un `<input>` ou un dialogue
 * placés dedans disparaîtraient au clic même qui doit les ouvrir. Le crochet
 * rend donc les déclencheurs, et `<RecordPhotoSurfaces>` rend l'input et le
 * dialogue — que l'appelant pose HORS du menu.
 */

export interface UseRecordPhotoOptions {
  /** La cible du registre serveur : `student_photo`, `teacher_photo`, … */
  targetKind: HandoffTargetKind;
  /** Le destinataire. `null` pour `profile_photo` : le serveur impose l'appelant. */
  subjectId?: number | null;
  /** L'envoi direct depuis le poste. Le fichier est déjà réduit et validé. */
  upload: (file: File) => Promise<unknown>;
  /** Invalidations de cache, une fois la photo écrite. */
  onSaved: () => void;
  /** Ce dont parlent les messages de refus : « photo », « logo »… */
  subject?: string;
}

export interface RecordPhoto {
  /** « Importer une photo » : ouvre le sélecteur de fichiers du poste. */
  pickFile: () => void;
  /** « Utiliser mon téléphone » : ouvre le code QR. */
  usePhone: () => void;
  /** Un envoi est en cours : les deux chemins se ferment le temps qu'il passe. */
  busy: boolean;
  /**
   * Le chemin téléphone a-t-il un sens ici ? Faux sur un appareil tenu en main
   * qui a déjà une caméra — le téléphone appelé serait celui qu'on tient.
   */
  phoneOffered: boolean;
  /** Réservé à `<RecordPhotoSurfaces>`. */
  readonly _interne: RecordPhotoInterne;
}

interface RecordPhotoInterne {
  inputRef: React.RefObject<HTMLInputElement | null>;
  appliquer: (file: File | null) => Promise<void>;
  targetKind: HandoffTargetKind;
  subjectId: number | null;
  dialogueOuvert: boolean;
  setDialogueOuvert: (ouvert: boolean) => void;
  onSaved: () => void;
}

export function useRecordPhoto({
  targetKind,
  subjectId = null,
  upload,
  onSaved,
  subject = "photo",
}: UseRecordPhotoOptions): RecordPhoto {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dialogueOuvert, setDialogueOuvert] = useState(false);
  const rang = useHandoffRank();

  const appliquer = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setBusy(true);
      try {
        const prepared = await downscaleImageFile(file);
        const refus = validatePhotoFile(prepared, subject);
        if (refus) {
          toast.error("Fichier refusé", { description: refus });
          return;
        }
        await upload(prepared);
        onSaved();
        toast.success("Photo mise à jour");
      } catch (cause) {
        toast.error("Échec de l'envoi", {
          description:
            cause instanceof Error ? cause.message : "Envoi impossible",
        });
      } finally {
        setBusy(false);
      }
    },
    [onSaved, subject, upload],
  );

  return {
    pickFile: () => inputRef.current?.click(),
    usePhone: () => setDialogueOuvert(true),
    busy,
    phoneOffered: rang !== null && rang !== "hidden",
    _interne: {
      inputRef,
      appliquer,
      targetKind,
      subjectId,
      dialogueOuvert,
      setDialogueOuvert,
      onSaved,
    },
  };
}

/**
 * L'input caché et le dialogue du code QR. À poser hors de tout menu déroulant.
 */
export function RecordPhotoSurfaces({ photo }: { photo: RecordPhoto }) {
  const {
    inputRef,
    appliquer,
    targetKind,
    subjectId,
    dialogueOuvert,
    setDialogueOuvert,
    onSaved,
  } = photo._interne;

  // `finalise` : le serveur a écrit la colonne, il ne reste qu'à relire la fiche.
  // Le cas `staged` n'existe pas ici — une fiche qui existe a toujours un
  // destinataire — mais le contrat le porte, alors on l'écrit.
  function resolu(resultat: HandoffOutcome) {
    if (resultat.kind === "saved") {
      onSaved();
      toast.success("Photo mise à jour");
      return;
    }
    void appliquer(resultat.file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          void appliquer(event.target.files?.[0] ?? null);
          // Réinitialisé pour qu'un même fichier puisse repartir après un échec.
          event.target.value = "";
        }}
      />
      <UploadHandoffDialog
        open={dialogueOuvert}
        onOpenChange={setDialogueOuvert}
        targetKind={targetKind}
        subjectId={subjectId}
        onResolved={resolu}
      />
    </>
  );
}
