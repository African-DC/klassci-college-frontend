import type { Metadata } from "next"
import { verifyDocument } from "@/lib/api/verify"
import {
  NotRecognizedView,
  RecognizedDocumentView,
  VerificationUnavailableView,
} from "../../_components/result-views"

// Jamais indexé : un document de vérification nominatif ne doit pas remonter
// dans les moteurs de recherche.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function VerifierPage({
  params,
}: {
  params: Promise<{ tenant: string; token: string }>
}) {
  const { tenant, token } = await params
  const result = await verifyDocument(tenant, token)

  if (result.status === "recognized") {
    return <RecognizedDocumentView doc={result.document} tenant={tenant} token={token} />
  }

  if (result.status === "unavailable") {
    return <VerificationUnavailableView />
  }

  return <NotRecognizedView />
}
