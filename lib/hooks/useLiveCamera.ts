"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CameraCaptureError,
  type CameraFacing,
  canUseLiveCamera,
  cameraUnavailableReason,
  captureVideoFrame,
  mapCameraError,
  openCamera,
  stopMediaStream,
} from "@/lib/photo/camera"

export type LiveCameraStatus = "idle" | "requesting" | "live" | "error"

export interface UseLiveCameraOptions {
  /**
   * Caméra ouverte au premier démarrage. `"user"` par défaut, pour qui se
   * photographie lui-même ; `"environment"` quand l'opérateur tient le
   * téléphone et photographie un élève en face de lui. Ensuite, c'est
   * `start(facing)` ou `flip()` qui décident.
   */
  facing?: CameraFacing
}

export function useLiveCamera({ facing = "user" }: UseLiveCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionRef = useRef(0)
  // La caméra voulue vit dans un ref, pas dans les dépendances de `start` :
  // basculer d'objectif ne doit pas changer l'identité de `start`, sinon les
  // effets qui l'appellent au montage relancent la caméra à chaque bascule.
  const facingRef = useRef<CameraFacing>(facing)
  const [activeFacing, setActiveFacing] = useState<CameraFacing>(facing)
  const [status, setStatus] = useState<LiveCameraStatus>("idle")
  const [error, setError] = useState<CameraCaptureError | null>(null)
  const available = canUseLiveCamera()
  // Identité stable : ce motif finit dans un `useEffect` de page, et un objet
  // neuf à chaque rendu y déclencherait une boucle.
  const unavailableReason = useMemo(
    () => (available ? null : cameraUnavailableReason()),
    [available],
  )

  const releaseStream = useCallback(() => {
    stopMediaStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const stop = useCallback(() => {
    sessionRef.current += 1
    releaseStream()
    setStatus("idle")
  }, [releaseStream])

  const fail = useCallback((caught: unknown, session: number) => {
    if (session !== sessionRef.current) return
    releaseStream()
    const mapped = mapCameraError(caught)
    setError(mapped)
    setStatus("error")
  }, [releaseStream])

  const start = useCallback(async (next?: CameraFacing) => {
    stop()
    const wanted = next ?? facingRef.current
    facingRef.current = wanted
    setActiveFacing(wanted)
    setError(null)
    setStatus("requesting")
    const session = sessionRef.current
    try {
      const stream = await openCamera({ facing: wanted })
      if (session !== sessionRef.current) {
        stopMediaStream(stream)
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.muted = true
        video.playsInline = true
        await video.play()
      }
      if (session !== sessionRef.current) {
        stopMediaStream(stream)
        streamRef.current = null
        return
      }
      setStatus("live")
    } catch (caught) {
      fail(caught, session)
    }
  }, [fail, stop])

  /** Passe de l'objectif arrière à l'avant et retour, sans fermer le dialogue. */
  const flip = useCallback(
    () => start(facingRef.current === "environment" ? "user" : "environment"),
    [start],
  )

  const capture = useCallback(async () => {
    const session = sessionRef.current
    const video = videoRef.current
    if (!video) {
      fail(new Error("preview missing"), session)
      return null
    }
    try {
      const file = await captureVideoFrame(video)
      stop()
      return file
    } catch (caught) {
      fail(caught, session)
      return null
    }
  }, [fail, stop])

  useEffect(() => stop, [stop])

  return {
    available,
    /** Pourquoi la caméra est hors de portée quand `available` est faux. */
    unavailableReason,
    facing: activeFacing,
    videoRef,
    status,
    error,
    start,
    stop,
    flip,
    capture,
  }
}
