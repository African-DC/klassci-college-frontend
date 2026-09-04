import type { Metadata } from "next"
import { readHandoff } from "@/lib/api/public-handoff"
import { HandoffCapture } from "../../_components/handoff-capture"
import { HandoffNotice } from "../../_components/handoff-notice"

// L'URL porte un jeton de dépôt : jamais indexée, jamais suivie.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Le rendu se fait sur le serveur, pas dans le téléphone.
 *
 * C'est ce qui fait qu'en 3G la page arrive peinte, avec le nom de l'école et
 * ce qu'on demande, au lieu d'un écran blanc suivi d'un appel. La suite —
 * prendre, revoir, envoyer — est du côté du navigateur, où elle doit être.
 */
export default async function TeleverserPage({
  params,
}: {
  params: Promise<{ tenant: string; token: string }>
}) {
  const { tenant, token } = await params
  const lu = await readHandoff(tenant, token)

  if (lu.status === "expired") {
    return (
      <HandoffNotice
        tone="neutral"
        title="Ce lien n'est plus valable"
        message="Un code d'envoi ne vit que quelques minutes, et ne sert qu'une fois. Demandez-en un nouveau sur l'ordinateur, puis scannez-le à nouveau."
      />
    )
  }

  if (lu.status === "unavailable") {
    return (
      <HandoffNotice
        tone="warning"
        title="Service indisponible"
        message="L'envoi par téléphone ne répond pas pour l'instant. Réessayez dans un moment, ou passez par l'ordinateur."
      />
    )
  }

  return <HandoffCapture tenant={tenant} token={token} view={lu.view} />
}
