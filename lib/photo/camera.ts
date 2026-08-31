export type CameraErrorCode =
  | "insecure"
  | "unsupported"
  | "denied"
  | "not_found"
  | "busy"
  | "unknown"

export class CameraCaptureError extends Error {
  readonly code: CameraErrorCode

  constructor(code: CameraErrorCode, message: string) {
    super(message)
    this.name = "CameraCaptureError"
    this.code = code
  }
}

export function isSecureCameraContext(): boolean {
  if (typeof window === "undefined") return false
  return window.isSecureContext === true
}

export function canUseLiveCamera(): boolean {
  return (
    isSecureCameraContext() &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

export function mapCameraError(error: unknown): CameraCaptureError {
  if (error instanceof CameraCaptureError) return error

  if (!isSecureCameraContext()) {
    return new CameraCaptureError(
      "insecure",
      "La caméra nécessite une connexion sécurisée. Importez une photo ou ouvrez le site en HTTPS.",
    )
  }

  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return new CameraCaptureError(
      "unsupported",
      "Ce téléphone ne permet pas d'ouvrir la caméra ici. Importez une photo depuis la galerie.",
    )
  }

  const name = error instanceof DOMException ? error.name : ""
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    return new CameraCaptureError(
      "denied",
      "Accès caméra refusé. Autorisez la caméra dans les réglages du navigateur, ou importez une photo.",
    )
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") {
    return new CameraCaptureError(
      "not_found",
      "Aucune caméra n'est disponible. Importez une photo depuis la galerie.",
    )
  }
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") {
    return new CameraCaptureError(
      "busy",
      "La caméra est occupée par une autre application. Fermez-la, puis réessayez.",
    )
  }

  return new CameraCaptureError(
    "unknown",
    "Impossible d'ouvrir la caméra. Réessayez ou importez une photo.",
  )
}

export async function openUserCamera(): Promise<MediaStream> {
  if (!canUseLiveCamera()) {
    throw mapCameraError(new Error("camera unavailable"))
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 720 },
        height: { ideal: 720 },
      },
    })
  } catch (error) {
    throw mapCameraError(error)
  }
}

const MAX_CAPTURE_EDGE = 960

export async function captureVideoFrame(video: HTMLVideoElement): Promise<File> {
  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight
  if (!sourceWidth || !sourceHeight) {
    throw new CameraCaptureError("unknown", "L'aperçu caméra n'est pas prêt. Réessayez.")
  }

  const scale = Math.min(1, MAX_CAPTURE_EDGE / Math.max(sourceWidth, sourceHeight))
  const width = Math.round(sourceWidth * scale)
  const height = Math.round(sourceHeight * scale)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) {
    throw new CameraCaptureError("unknown", "Impossible de capturer la photo. Importez un fichier.")
  }
  context.drawImage(video, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new CameraCaptureError("unknown", "La photo n'a pas pu être enregistrée."))
      },
      "image/jpeg",
      0.86,
    )
  })

  return new File([blob], `eleve-${Date.now()}.jpg`, { type: "image/jpeg" })
}

const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

/**
 * Bornes d'un envoi d'image côté navigateur : mêmes formats et même plafond que
 * ceux appliqués par le backend, refusés avant d'occuper le réseau (3G, coupures).
 * Partagé par la photo élève, la photo de profil et le logo de l'établissement.
 * `subject` n'ajuste que le mot affiché à l'utilisateur.
 */
export function validatePhotoFile(file: File, subject = "photo"): string | null {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return `Format invalide. Utilisez une ${subject} JPEG, PNG ou WebP.`
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return `Cette ${subject} dépasse 5 Mo. Choisissez une image plus légère.`
  }
  return null
}
