"use client"

import { useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"

/**
 * Gestionnaire d'inactivité (« mode veille ») de la session.
 *
 * Tant que l'utilisateur interagit (souris, clavier, tactile, scroll), on
 * rafraîchit périodiquement la session : le callback jwt de NextAuth rotate
 * alors l'access token BE (15 min) avant qu'il n'expire et reporte l'échéance
 * du cookie de session. Résultat : la session NE expire PAS pendant qu'on
 * utilise l'app.
 *
 * Après IDLE_TIMEOUT sans aucune interaction, on déconnecte proprement et on
 * renvoie vers /login?expired=1. L'inactivité se compte à partir de la
 * dernière interaction réelle, pas du temps total de connexion.
 *
 * Monté une seule fois (dans Providers) : inactif tant que l'utilisateur n'est
 * pas authentifié, donc sans effet sur les pages publiques (login).
 */

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 min sans interaction → déconnexion
const POLL_INTERVAL_MS = 2 * 60 * 1000 // vérifie / rafraîchit toutes les 2 min
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "pointerdown",
] as const

export function SessionKeepAlive() {
  const { status, update } = useSession()
  const lastActivityRef = useRef(Date.now())

  // Enregistre la dernière interaction utilisateur (ignore les onglets cachés
  // pour que l'inactivité se mesure sur une présence réelle).
  useEffect(() => {
    const bump = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return
      lastActivityRef.current = Date.now()
    }
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, bump, { passive: true }),
    )
    return () =>
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, bump))
  }, [])

  useEffect(() => {
    if (status !== "authenticated") return

    const tick = () => {
      const idleMs = Date.now() - lastActivityRef.current
      if (idleMs >= IDLE_TIMEOUT_MS) {
        // Inactivité prolongée → déconnexion propre (mode veille). Full reload
        // pour vider les caches client (TanStack Query / Zustand).
        void signOut({ redirect: false }).finally(() => {
          window.location.href = "/login?expired=1"
        })
        return
      }
      // Actif récemment → re-lit la session, ce qui déclenche le callback jwt
      // (refresh de l'access token si proche de l'expiration) et reporte
      // l'échéance du cookie.
      void update()
    }

    const id = setInterval(tick, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [status, update])

  return null
}
