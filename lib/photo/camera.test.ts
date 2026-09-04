import { afterEach, describe, expect, it, vi } from "vitest"
import {
  CameraCaptureError,
  cameraUnavailableReason,
  canUseLiveCamera,
  downscaleImageFile,
  mapCameraError,
  openCamera,
  openUserCamera,
  stopMediaStream,
  validatePhotoFile,
} from "./camera"
import { photoOutcomeMessage, uploadStudentAvatar } from "./uploadStudentAvatar"

describe("camera helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("refuses live camera outside a secure context", () => {
    vi.stubGlobal("window", { isSecureContext: false })
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } })
    expect(canUseLiveCamera()).toBe(false)
    expect(mapCameraError(new Error("nope")).code).toBe("insecure")
  })

  it("names the reason the camera is out of reach, instead of failing silently", () => {
    vi.stubGlobal("window", { isSecureContext: false })
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } })
    const reason = cameraUnavailableReason()
    expect(reason?.code).toBe("insecure")
    expect(reason?.message).toMatch(/HTTPS/)

    vi.stubGlobal("window", { isSecureContext: true })
    expect(cameraUnavailableReason()).toBeNull()
  })

  it("maps a permission denial to a French recovery message", () => {
    vi.stubGlobal("window", { isSecureContext: true })
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } })
    const error = mapCameraError(new DOMException("denied", "NotAllowedError"))
    expect(error).toBeInstanceOf(CameraCaptureError)
    expect(error.code).toBe("denied")
    expect(error.message).toMatch(/Autorisez la caméra|importez une photo/i)
  })

  it("stops every media track", () => {
    const stop = vi.fn()
    stopMediaStream({ getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream)
    expect(stop).toHaveBeenCalledTimes(2)
  })

  it("rejects unsupported photo types and oversized files", () => {
    expect(validatePhotoFile(new File(["x"], "notes.pdf", { type: "application/pdf" }))).toMatch(
      /JPEG/,
    )
    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "face.jpg", { type: "image/jpeg" })
    expect(validatePhotoFile(huge)).toMatch(/5 Mo/)
    expect(validatePhotoFile(new File(["ok"], "face.jpg", { type: "image/jpeg" }))).toBeNull()
  })
})

describe("camera facing", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function stubSecureCamera() {
    const getUserMedia = vi.fn(async () => ({ getTracks: () => [] }) as unknown as MediaStream)
    vi.stubGlobal("window", { isSecureContext: true })
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } })
    return getUserMedia
  }

  it("opens the back camera when asked for it", async () => {
    const getUserMedia = stubSecureCamera()
    await openCamera({ facing: "environment" })
    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({ facingMode: { ideal: "environment" } }),
      }),
    )
  })

  it("keeps the front camera for openUserCamera", async () => {
    const getUserMedia = stubSecureCamera()
    await openUserCamera()
    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({ facingMode: { ideal: "user" } }),
      }),
    )
  })

  it("refuses to open without a secure context", async () => {
    vi.stubGlobal("window", { isSecureContext: false })
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } })
    await expect(openCamera({ facing: "environment" })).rejects.toMatchObject({ code: "insecure" })
  })
})

describe("downscaleImageFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /** jsdom n'a pas de canvas : on en pose un faux et on lit les côtés demandés. */
  function stubCanvas(blob: Blob) {
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob: vi.fn((callback: (result: Blob | null) => void) => callback(blob)),
    }
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
      tag === "canvas"
        ? (canvas as unknown as HTMLCanvasElement)
        : createElement(tag as "div")) as typeof document.createElement)
    return canvas
  }

  function stubBitmap(width: number, height: number) {
    const close = vi.fn()
    const createImageBitmap = vi.fn(async () => ({ width, height, close }))
    vi.stubGlobal("createImageBitmap", createImageBitmap)
    return { createImageBitmap, close }
  }

  function stubImageElement(image: { width: number; height: number } | "broken") {
    vi.stubGlobal("createImageBitmap", undefined)
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { createObjectURL: () => "blob:fake", revokeObjectURL })
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        naturalWidth = image === "broken" ? 0 : image.width
        naturalHeight = image === "broken" ? 0 : image.height
        set src(_value: string) {
          queueMicrotask(() => (image === "broken" ? this.onerror?.() : this.onload?.()))
        }
      },
    )
    return { revokeObjectURL }
  }

  const gallerySizedFile = (name = "IMG_2024.JPEG") =>
    new File([new Uint8Array(6 * 1024 * 1024)], name, { type: "image/jpeg" })

  it("brings a gallery photo back under the send ceiling", async () => {
    const canvas = stubCanvas(new Blob([new Uint8Array(120 * 1024)], { type: "image/jpeg" }))
    const { close } = stubBitmap(4000, 3000)

    const huge = gallerySizedFile()
    expect(validatePhotoFile(huge)).toMatch(/5 Mo/)

    const reduced = await downscaleImageFile(huge)
    expect(canvas.width).toBe(960)
    expect(canvas.height).toBe(720)
    expect(reduced.type).toBe("image/jpeg")
    expect(reduced.name).toBe("IMG_2024.jpg")
    expect(validatePhotoFile(reduced)).toBeNull()
    expect(close).toHaveBeenCalled()
  })

  it("asks for the EXIF orientation the canvas would erase", async () => {
    stubCanvas(new Blob([new Uint8Array(1024)], { type: "image/jpeg" }))
    const { createImageBitmap } = stubBitmap(3000, 4000)

    const portrait = gallerySizedFile("portrait.jpg")
    await downscaleImageFile(portrait)

    expect(createImageBitmap).toHaveBeenCalledWith(portrait, { imageOrientation: "from-image" })
  })

  it("falls back to an image element when createImageBitmap is missing", async () => {
    const canvas = stubCanvas(new Blob([new Uint8Array(2048)], { type: "image/jpeg" }))
    const { revokeObjectURL } = stubImageElement({ width: 4000, height: 3000 })

    const reduced = await downscaleImageFile(gallerySizedFile("photo.jpg"))

    expect(canvas.width).toBe(960)
    expect(canvas.height).toBe(720)
    expect(reduced.size).toBe(2048)
    expect(revokeObjectURL).toHaveBeenCalled()
  })

  it("leaves an image that already fits untouched, without re-encoding it", async () => {
    const canvas = stubCanvas(new Blob(["x"], { type: "image/jpeg" }))
    stubBitmap(800, 600)

    const small = new File([new Uint8Array(50 * 1024)], "face.png", { type: "image/png" })
    await expect(downscaleImageFile(small)).resolves.toBe(small)
    expect(canvas.toBlob).not.toHaveBeenCalled()
  })

  it("returns the original file when nothing can decode it, adding no failure mode", async () => {
    stubCanvas(new Blob(["x"], { type: "image/jpeg" }))
    stubImageElement("broken")

    const notAnImage = new File(["%PDF-"], "notes.pdf", { type: "application/pdf" })
    await expect(downscaleImageFile(notAnImage)).resolves.toBe(notAnImage)
    // Le message affiché reste celui de la validation, pas une erreur de décodage.
    expect(validatePhotoFile(notAnImage)).toMatch(/JPEG/)
  })
})

describe("uploadStudentAvatar", () => {
  it("skips upload when no photo was captured", async () => {
    await expect(uploadStudentAvatar(12, null)).resolves.toBe("none")
  })

  it("fails closed when the student id is missing after create", async () => {
    await expect(
      uploadStudentAvatar(undefined, new File(["x"], "a.jpg", { type: "image/jpeg" })),
    ).resolves.toBe("failed")
    expect(photoOutcomeMessage("failed")).toMatch(/fiche élève/i)
  })

  it("returns failed when the photo upload rejects", async () => {
    const { studentsApi } = await import("@/lib/api/students")
    vi.spyOn(studentsApi, "uploadPhoto").mockRejectedValueOnce(new Error("Upload failed"))
    await expect(
      uploadStudentAvatar(12, new File(["x"], "a.jpg", { type: "image/jpeg" })),
    ).resolves.toBe("failed")
  })

  it("returns saved when the photo upload succeeds", async () => {
    const { studentsApi } = await import("@/lib/api/students")
    vi.spyOn(studentsApi, "uploadPhoto").mockResolvedValueOnce({ photo_url: "/uploads/a.jpg" })
    await expect(
      uploadStudentAvatar(12, new File(["x"], "a.jpg", { type: "image/jpeg" })),
    ).resolves.toBe("saved")
  })
})
