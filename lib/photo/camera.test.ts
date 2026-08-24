import { afterEach, describe, expect, it, vi } from "vitest"
import {
  CameraCaptureError,
  canUseLiveCamera,
  mapCameraError,
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
    expect(validatePhotoFile(new File(["x"], "notes.pdf", { type: "application/pdf" }))).toMatch(/JPEG/)
    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "face.jpg", { type: "image/jpeg" })
    expect(validatePhotoFile(huge)).toMatch(/5 Mo/)
    expect(validatePhotoFile(new File(["ok"], "face.jpg", { type: "image/jpeg" }))).toBeNull()
  })
})

describe("uploadStudentAvatar", () => {
  it("skips upload when no photo was captured", async () => {
    await expect(uploadStudentAvatar(12, null)).resolves.toBe("none")
  })

  it("fails closed when the student id is missing after create", async () => {
    await expect(uploadStudentAvatar(undefined, new File(["x"], "a.jpg", { type: "image/jpeg" }))).resolves.toBe("failed")
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
