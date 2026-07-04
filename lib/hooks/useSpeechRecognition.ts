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
 *   `not-allowed` de l'ASR). Récupérable en autorisant le micro. On relit la
 *   Permissions API et on écoute son `onchange` → dès que l'utilisateur
 *   autorise, le flag se lève tout seul (aucun reload nécessaire).
 * - `serviceUnavailable` : le SERVICE de reconnaissance (serveur distant utilisé
 *   par `webkitSpeechRecognition` sur desktop) est indisponible (`network`,
 *   `service-not-allowed`, `audio-capture`). Le micro n'est PAS en cause. On
 *   invite alors à saisir au clavier, sans message alarmant.
 *
 * Le pré-vol `requestAndStart()` appelle `getUserMedia({audio:true})` dans le
 * geste utilisateur (clic) : prompt de permission propre + distinction nette
 * refus-micro / souci-service. `reset()` permet un « Réessayer » sans reload.
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
  /**
   * Demande la permission micro (getUserMedia) DANS le geste utilisateur, puis
   * démarre. À câbler sur le clic du bouton — c'est le chemin fiable desktop +
   * mobile. Résout après le start (ou après avoir positionné un flag d'échec).
   */
  requestAndStart: () => Promise<void>
  /** Réinitialise les flags d'échec pour permettre un « Réessayer ». */
  reset: () => void
  supported: boolean
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
      // où `webkitSpeechRecognition` s'appuie sur un service distant. Le micro
      // reste utilisable — on bascule sur la saisie clavier sans alarmer.
      if (
        event.error === "network" ||
        event.error === "service-not-allowed" ||
        event.error === "audio-capture"
      ) {
        setServiceUnavailable(true)
        userStoppedRef.current = true
        const msg =
          "Reconnaissance vocale indisponible sur ce navigateur ou ce réseau. Saisissez les notes au clavier."
        setError(msg)
        onErrorRef.current?.(msg)
        return
      }

      // Vrai refus du micro — récupérable, ne plus auto-restart.
      if (event.error === "not-allowed") {
        setPermissionDenied(true)
        userStoppedRef.current = true
        const msg =
          "Accès au micro refusé. Autorisez-le puis appuyez sur « Réessayer le micro »."
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

  const requestAndStart = useCallback(async () => {
    // Pré-vol permission dans le geste utilisateur : distingue refus-micro net
    // d'un souci de service, et pose un prompt de permission propre.
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // On n'a pas besoin du flux — l'ASR ouvre le sien. Libérer aussitôt.
        stream.getTracks().forEach((t) => t.stop())
        setPermissionDenied(false)
      } catch (err) {
        const name = (err as { name?: string })?.name
        if (name === "NotAllowedError" || name === "SecurityError") {
          setPermissionDenied(true)
          const msg =
            "Accès au micro refusé. Autorisez-le puis appuyez sur « Réessayer le micro »."
          setError(msg)
          onErrorRef.current?.(msg)
          return
        }
        if (name === "NotFoundError" || name === "NotReadableError") {
          setServiceUnavailable(true)
          const msg =
            "Aucun micro disponible. Saisissez les notes au clavier."
          setError(msg)
          onErrorRef.current?.(msg)
          return
        }
        // Autre erreur getUserMedia — on tente quand même l'ASR.
      }
    }
    start()
  }, [start])

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
    requestAndStart,
    reset,
    supported,
    permissionDenied,
    serviceUnavailable,
    error,
  }
}
