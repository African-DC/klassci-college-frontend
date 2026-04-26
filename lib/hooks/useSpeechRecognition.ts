"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Web Speech API — hook minimal pour la dictée FR continuous.
 *
 * Compatibilité validée 2026-04-26 :
 * - Chrome Android (Itel S661, Samsung A14) — `webkitSpeechRecognition`
 * - iOS Safari 16+ (iPhone 12) — `SpeechRecognition` natif
 * - Desktop Chrome — `webkitSpeechRecognition`
 *
 * Comportement :
 * - lang `fr-FR`
 * - continuous + interimResults : on capture chaque pause respiratoire
 * - auto-restart sur `onend` quand l'user n'a pas explicitement arrêté
 * - le 1er `start()` doit suivre une user gesture (click) pour iOS — la chaîne
 *   d'événements en cascade côté React est OK car appelée depuis un onClick.
 *
 * Le consommateur reçoit chaque transcript final via onResult(text).
 * `interimTranscript` affiché en live pour feedback visuel.
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
  start: () => void
  stop: () => void
  supported: boolean
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
      // Les autres méritent un feedback à l'user.
      if (event.error === "no-speech" || event.error === "aborted") return
      const msg = `Reconnaissance vocale : ${event.error}`
      setError(msg)
      onErrorRef.current?.(msg)
    }

    recognition.onend = () => {
      setListening(false)
      setInterimTranscript("")
      // Auto-restart sauf si l'user a stop explicitement (pause/exit).
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

  return { listening, interimTranscript, start, stop, supported, error }
}
