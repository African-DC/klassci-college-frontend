export type CameraErrorCode =
  | "insecure"
  | "unsupported"
  | "denied"
  | "not_found"
  | "busy"
  | "unknown"

/** Caméra ouverte : frontale (on se photographie) ou arrière (on photographie quelqu'un). */
export type CameraFacing = "user" | "environment"

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

/**
 * Pourquoi la caméra directe est hors de portée, ou `null` si elle est ouvrable.
 *
 * Sans contexte sécurisé — le serveur de démonstration est servi en clair —
 * `getUserMedia` n'existe pas du tout : une page qui ne dit rien laisse
 * l'opérateur devant un bouton mort, sans savoir qu'il lui reste l'import.
 * Le message est celui de `mapCameraError`, déjà écrit pour chaque cas.
 */
export function cameraUnavailableReason(): CameraCaptureError | null {
  if (canUseLiveCamera()) return null
  return mapCameraError(new Error("camera unavailable"))
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
  if (
    name === "NotFoundError" ||
    name === "OverconstrainedError" ||
    name === "DevicesNotFoundError"
  ) {
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

/**
 * Ouvre la caméra demandée. `facingMode` reste un `ideal` : sur un ordinateur
 * portable qui n'a qu'une webcam, demander l'arrière ne doit pas faire échouer
 * l'ouverture, seulement rester sans effet.
 */
export async function openCamera({
  facing = "user",
}: { facing?: CameraFacing } = {}): Promise<MediaStream> {
  if (!canUseLiveCamera()) {
    throw mapCameraError(new Error("camera unavailable"))
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 720 },
        height: { ideal: 720 },
      },
    })
  } catch (error) {
    throw mapCameraError(error)
  }
}

/** Caméra frontale, pour qui se photographie lui-même. */
export function openUserCamera(): Promise<MediaStream> {
  return openCamera({ facing: "user" })
}

/**
 * Les seuls types d'image que l'application accepte, partout.
 *
 * Exporte parce que l'apercu doit appliquer la MEME regle que l'envoi :
 * un garde d'apercu plus large que le validateur laisse afficher ce que le
 * serveur refusera, et fait afficher du SVG la ou une photo est attendue.
 */
export const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

const MAX_CAPTURE_EDGE = 960
const CAPTURE_QUALITY = 0.86

export interface DownscaleOptions {
  /** Plus grand côté conservé, en pixels. */
  maxEdge?: number
  /** Qualité de l'encodage JPEG, entre 0 et 1. */
  quality?: number
  /** Nom du fichier produit. */
  name?: string
}

/**
 * Redessine une source déjà décodée dans un canvas borné, puis l'encode en JPEG.
 * Seul endroit du projet qui fabrique une image réduite : la capture caméra et
 * l'import de fichier passent tous deux par ici, avec les mêmes bornes.
 */
async function drawToJpegFile(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  { maxEdge = MAX_CAPTURE_EDGE, quality = CAPTURE_QUALITY, name }: DownscaleOptions = {},
): Promise<File> {
  if (!sourceWidth || !sourceHeight) {
    throw new CameraCaptureError("unknown", "L'image n'a pas pu être lue. Réessayez.")
  }

  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) {
    throw new CameraCaptureError("unknown", "Impossible de préparer la photo. Importez un fichier.")
  }
  context.drawImage(source, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new CameraCaptureError("unknown", "La photo n'a pas pu être enregistrée."))
      },
      "image/jpeg",
      quality,
    )
  })

  return new File([blob], name ?? `photo-${Date.now()}.jpg`, {
    type: "image/jpeg",
  })
}

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

/**
 * `imageOrientation: "from-image"` n'est pas décoratif : le passage par un canvas
 * efface l'EXIF, et sans cette option une photo prise en portrait sur un Android
 * d'entrée de gamme ressort couchée — toute la promotion à l'envers sur les
 * bulletins. Le repli `<img>` sert les vieux WebView sans `createImageBitmap`.
 */
async function decodeImageFile(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => {
          if (typeof bitmap.close === "function") bitmap.close()
        },
      }
    } catch {
      // Certains moteurs refusent l'option d'orientation : on retombe sur <img>.
    }
  }
  return decodeWithImageElement(file)
}

function decodeWithImageElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release: () => URL.revokeObjectURL(url),
      })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new CameraCaptureError("unknown", "Ce fichier n'est pas une image lisible."))
    }
    image.src = url
  })
}

function withinSendableBounds(file: File, width: number, height: number, maxEdge: number): boolean {
  return (
    ALLOWED_PHOTO_TYPES.has(file.type) &&
    file.size <= MAX_PHOTO_BYTES &&
    Math.max(width, height) <= maxEdge
  )
}

function jpegName(original: string): string {
  const base = original.replace(/\.[^./\\]+$/, "").trim()
  return `${base || "photo"}.jpg`
}

/**
 * Ramène sous les bornes d'envoi n'importe quelle image choisie par l'utilisateur.
 *
 * À appliquer sur TOUTES les entrées, pas seulement la capture caméra : un JPEG
 * de téléphone récent pèse 4 à 6 Mo, donc au-dessus du plafond de 5 Mo que le
 * navigateur comme le serveur refusent, et interminable en 3G. Réduit, il tient
 * en quelques dizaines de kilo-octets.
 *
 * Ne lève jamais : une image déjà sous les bornes est rendue telle quelle, sans
 * ré-encodage inutile, et un fichier illisible est rendu intact pour que
 * `validatePhotoFile` produise le message affiché à l'utilisateur. La réduction
 * ne doit ajouter aucun mode d'échec à un geste qui marchait déjà.
 */
export async function downscaleImageFile(
  file: File,
  options: DownscaleOptions = {},
): Promise<File> {
  if (typeof document === "undefined") return file

  let decoded: DecodedImage | null = null
  try {
    decoded = await decodeImageFile(file)
    const maxEdge = options.maxEdge ?? MAX_CAPTURE_EDGE
    if (withinSendableBounds(file, decoded.width, decoded.height, maxEdge)) {
      return file
    }
    return await drawToJpegFile(decoded.source, decoded.width, decoded.height, {
      ...options,
      name: options.name ?? jpegName(file.name),
    })
  } catch {
    return file
  } finally {
    decoded?.release()
  }
}

export async function captureVideoFrame(video: HTMLVideoElement): Promise<File> {
  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight
  if (!sourceWidth || !sourceHeight) {
    throw new CameraCaptureError("unknown", "L'aperçu caméra n'est pas prêt. Réessayez.")
  }
  return drawToJpegFile(video, sourceWidth, sourceHeight, {
    name: `eleve-${Date.now()}.jpg`,
  })
}

/**
 * Bornes d'un envoi d'image côté navigateur : mêmes formats et même plafond que
 * ceux appliqués par le backend, refusés avant d'occuper le réseau (3G, coupures).
 * Partagé par la photo élève, la photo de profil et le logo de l'établissement.
 * `subject` n'ajuste que le mot affiché à l'utilisateur.
 *
 * S'appelle APRÈS `downscaleImageFile`, jamais avant : sinon elle refuse des
 * fichiers que la réduction aurait fait passer.
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
