"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { paymentsApi } from "@/lib/api/payments"

/**
 * Ouvrir le reçu d'un versement dans l'aperçu, puis l'imprimer ou le garder.
 *
 * Le PDF est téléchargé une fois, gardé en URL locale le temps de l'aperçu,
 * et libéré à la fermeture : un reçu par famille, toute la journée, finirait
 * sinon par peser sur la mémoire d'un téléphone d'entrée de gamme.
 */
export function useReceiptPreview() {
  const [url, setUrl] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const urlRef = useRef<string | null>(null)

  const close = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setUrl(null)
    setPaymentId(null)
  }, [])

  useEffect(() => close, [close])

  const open = useCallback(async (id: number) => {
    setLoadingId(id)
    try {
      const blob = await paymentsApi.downloadReceipt(id)
      const objectUrl = URL.createObjectURL(blob)
      urlRef.current = objectUrl
      setUrl(objectUrl)
      setPaymentId(id)
    } catch (err) {
      toast.error("Impossible d'ouvrir le reçu", {
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
      })
    } finally {
      setLoadingId(null)
    }
  }, [])

  const download = useCallback(() => {
    if (!urlRef.current || paymentId === null) return
    const lien = document.createElement("a")
    lien.href = urlRef.current
    lien.download = `recu-${paymentId}.pdf`
    lien.click()
  }, [paymentId])

  return { url, paymentId, loadingId, open, close, download }
}
