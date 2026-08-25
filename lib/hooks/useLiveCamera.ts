"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  CameraCaptureError,
  canUseLiveCamera,
  captureVideoFrame,
  mapCameraError,
  openUserCamera,
  stopMediaStream,
} from "@/lib/photo/camera"

export type LiveCameraStatus = "idle" | "requesting" | "live" | "error"

export function useLiveCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionRef = useRef(0)
  const [status, setStatus] = useState<LiveCameraStatus>("idle")
  const [error, setError] = useState<CameraCaptureError | null>(null)
  const available = canUseLiveCamera()

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

  const start = useCallback(async () => {
    stop()
    setError(null)
    setStatus("requesting")
    const session = sessionRef.current
    try {
      const stream = await openUserCamera()
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

  return { available, videoRef, status, error, start, stop, capture }
}
