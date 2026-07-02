import { toast } from "sonner"

/**
 * Ouvre un blob PDF en aperçu inline dans un nouvel onglet.
 *
 * Réutilise le pattern éprouvé de `PdfIdentitySection` : l'onglet est ouvert
 * de façon synchrone DANS le geste de clic (sinon le bloqueur de popups le
 * tue), puis pointé vers l'object URL une fois le blob récupéré. L'URL est
 * révoquée après un délai pour laisser le temps au rendu.
 *
 * L'état de chargement est géré par l'appelant ; les erreurs sont remontées
 * ici via un toast sonner. `fetchBlob` réutilise `apiFetchBlob` (Bearer token
 * + contrat 401), donc l'authentification n'est jamais refaite ici.
 */
export async function openPdfPreview(fetchBlob: () => Promise<Blob>): Promise<void> {
  const win = window.open("", "_blank")
  try {
    const blob = await fetchBlob()
    const url = URL.createObjectURL(blob)
    if (win) win.location.href = url
    else window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    win?.close()
    toast.error("Aperçu PDF indisponible", {
      description: err instanceof Error ? err.message : "Erreur lors de la génération du PDF",
    })
  }
}
