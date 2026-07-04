"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Web Speech API — hook minimal pour la dictée FR continuous.
 *
 * Compatibilité validée 2026-04-26 :
 * - Chrome Android (Itel S661, Samsung A14) — `webkitSpeechRecognition`
 * - iOS Safari 16+ (iPhone 12) — `SpeechRecognition` natif
 * - Desktop Chrome / Edge — `webkitSpeechRecognition`
 *
 * Comportement :
 * - lang `fr-FR`
 * - continuous + interimResults : on capture chaque pause respiratoire
 * - auto-restart sur `onend` quand l'user n'a pas explicitement arrêté
 *
 * Deux modes d'échec DISTINCTS (avant, confondus → bandeau « micro refusé »
 * menteur sur desktop, cf. bug #282) :
 *
 * - `permissionDenied` : vrai refus du micro (getUserMedia NotAllowedError, ou
 *   `not-allowed` de l'ASR). `start()` déclenche lui-même le prompt de permission
 *   (pas de pré-vol getUserMedia : il entre en conflit avec l'ASR, cf. Chromium
 *   41083534). Après un refus corrigé via les réglages du site, Chromium exige
 *   un rechargement → le CTA de récupération recharge la page.
 * - `serviceUnavailable` : le SERVICE de reconnaissance (serveur distant utilisé
 *   par `webkitSpeechRecognition` sur desktop) est indisponible (`network`,
 *   `service-not-allowed`, `audio-capture`, `language-not-supported`). Micro OK,
 *   navigateur en cause (Edge notoirement cassé) → « utilisez Chrome / clavier ».
 *
 * `reset()` réarme après un échec. La Permissions API `onchange` lève aussi
 * `permissionDenied` si l'état passe à "granted" sans reload (grant par prompt).
 */

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string; confidence?: number }
  }>
}

interface SpeechRecognitionErrorEventLike {
  error: string
  message?: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string
  onResult: (transcript: string) => void
  onError?: (error: string) => void
}

interface UseSpeechRecognitionReturn {
  listening: boolean
  interimTranscript: string
  /** Démarre la reconnaissance sans pré-vol (usage interne / retry). */
  start: () => void
  /** Arrête la reconnaissance (geste volontaire). */
  stop: () => void
  /** Réinitialise les flags d'échec pour permettre un « Réessayer ». */
  reset: () => void
  supported: boolean
  /**
   * Contexte sécurisé (https ou localhost). Le micro et la reconnaissance
   * vocale sont BLOQUÉS par le navigateur sur origine non sécurisée (http hors
   * localhost, ex. une IP brute) : rien à autoriser côté utilisateur.
   */
  secureContext: boolean
  /** Vrai refus du micro — récupérable en autorisant. */
  permissionDenied: boolean
  /** Service de reconnaissance indisponible — micro OK, saisir au clavier. */
  serviceUnavailable: boolean
  error: string | null
}

export function useSpeechRecognition({
  lang = "fr-FR",
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [listening, setListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [serviceUnavailable, setServiceUnavailable] = useState(false)
  // Optimiste au SSR ; corrigé au mount. `isSecureContext` peut être undefined
  // sur de vieux navigateurs → on ne bloque que si explicitement false.
  const [secureContext, setSecureContext] = useState(true)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const userStoppedRef = useRef(false)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  // Keep callbacks fresh without retriggering effect.
  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    setSecureContext(window.isSecureContext !== false)
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      setSupported(false)
      return
    }
    setSupported(true)

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setListening(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) {
          const text = r[0].transcript.trim()
          if (text) onResultRef.current(text)
        } else {
          interim += r[0].transcript
        }
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      // "no-speech" et "aborted" sont normaux (silence ou stop volontaire).
      if (event.error === "no-speech" || event.error === "aborted") return

      // Souci du SERVICE de reconnaissance (pas le micro). Fréquent sur desktop
      // où `webkitSpeechRecognition` s'appuie sur un service distant, et
      // notoirement sur Microsoft Edge (`language-not-supported`, `network`
      // même micro autorisé). Le micro reste utilisable — bascule clavier.
      if (
        event.error === "network" ||
        event.error === "service-not-allowed" ||
        event.error === "audio-capture" ||
        event.error === "language-not-supported"
      ) {
        setServiceUnavailable(true)
        userStoppedRef.current = true
        const msg =
          "Reconnaissance vocale indisponible ici. Sur Microsoft Edge elle est souvent bloquée : utilisez Google Chrome pour dicter, ou saisissez les notes au clavier."
        setError(msg)
        onErrorRef.current?.(msg)
        return
      }

      // Vrai refus du micro. Après avoir autorisé via les réglages du site, les
      // navigateurs Chromium exigent un rechargement — d'où le CTA « Recharger ».
      if (event.error === "not-allowed") {
        setPermissionDenied(true)
        userStoppedRef.current = true
        const msg =
          "Accès au micro refusé. Autorisez-le dans le navigateur, puis rechargez la page."
        setError(msg)
        onErrorRef.current?.(msg)
        return
      }

      const msg = `Reconnaissance vocale : ${event.error}`
      setError(msg)
      onErrorRef.current?.(msg)
    }

    recognition.onend = () => {
      setListening(false)
      setInterimTranscript("")
      // Auto-restart sauf si l'user a stop explicitement (pause/exit/échec).
      if (!userStoppedRef.current) {
        try {
          recognition.start()
        } catch {
          // Already started or busy — ignore.
        }
      }
    }

    recognitionRef.current = recognition
    return () => {
      userStoppedRef.current = true
      try {
        recognition.abort()
      } catch {
        // Ignore.
      }
      recognitionRef.current = null
    }
  }, [lang])

  // ─── Permissions API : auto-déblocage quand l'utilisateur autorise ────────
  // Sur les navigateurs qui exposent `permissions.query({name:'microphone'})`
  // (Chrome/Edge), on écoute le changement d'état : passer à "granted" lève le
  // flag permissionDenied tout seul — plus besoin de recharger la page.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return
    let status: PermissionStatus | null = null
    let cancelled = false
    const onChange = () => {
      if (status && status.state === "granted") {
        setPermissionDenied(false)
        setError(null)
      }
    }
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((s) => {
        if (cancelled) return
        status = s
        status.addEventListener("change", onChange)
      })
      .catch(() => {
        // 'microphone' non supporté par cette Permissions API — pas grave.
      })
    return () => {
      cancelled = true
      status?.removeEventListener("change", onChange)
    }
  }, [])

  const start = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    userStoppedRef.current = false
    try {
      recognition.start()
    } catch {
      // Probably already started — ignore.
    }
  }, [])

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    userStoppedRef.current = true
    try {
      recognition.stop()
    } catch {
      // Already stopped — ignore.
    }
    setListening(false)
    setInterimTranscript("")
  }, [])

  const reset = useCallback(() => {
    setPermissionDenied(false)
    setServiceUnavailable(false)
    setError(null)
  }, [])

  return {
    listening,
    interimTranscript,
    start,
    stop,
    reset,
    supported,
    secureContext,
    permissionDenied,
    serviceUnavailable,
    error,
  }
}
