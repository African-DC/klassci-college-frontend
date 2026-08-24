"use client"

import { useEffect } from "react"

/**
 * Après un déploiement, les chunks JS changent de hash : un onglet ouvert avec
 * l'ancien build échoue en « Loading chunk … failed ». On recharge alors la page
 * une seule fois (garde en sessionStorage) pour récupérer le build courant.
 */
const GUARD_KEY = "chunk-reload-once"

function isChunkError(message: string): boolean {
  return (
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Loading CSS chunk/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message)
  )
}

export function ChunkErrorReloader() {
  useEffect(() => {
    // Recharge au plus une fois par fenêtre de 15 s : évite une boucle si le
    // build courant échoue vraiment, tout en récupérant sur un futur déploiement.
    function reloadOnce() {
      const last = Number(sessionStorage.getItem(GUARD_KEY) || "0")
      if (Date.now() - last < 15000) return
      sessionStorage.setItem(GUARD_KEY, String(Date.now()))
      window.location.reload()
    }

    function onError(event: ErrorEvent) {
      if (isChunkError(event.message || String(event.error ?? ""))) reloadOnce()
    }
    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason
      const message = reason instanceof Error ? reason.message : String(reason ?? "")
      if (isChunkError(message)) reloadOnce()
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
