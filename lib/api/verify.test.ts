import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { verifyDocument, verifyDocumentFile } from "./verify"

const validPayload = {
  valid: true,
  status: "active",
  scheme: "KSI2",
  document_type: "Bulletin de notes",
  issued_at: "2026-07-21T12:00:00",
  expires_at: null,
  school_name: "Collège Test",
  signature_algorithm: "Ed25519",
  key_id: "key-2026",
  file_verification_available: true,
}

describe("verifyDocument", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test"
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("returns recognized only for a valid API contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(validPayload))))
    await expect(verifyDocument("local", "token")).resolves.toEqual({
      status: "recognized",
      document: validPayload,
    })
  })

  it("reserves not_found for an explicit 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })))
    await expect(verifyDocument("local", "missing")).resolves.toEqual({ status: "not_found" })
  })

  it.each([
    new Response(null, { status: 503 }),
    new Response(JSON.stringify({ valid: true }), { status: 200 }),
  ])("returns unavailable for outages and malformed contracts", async (response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response))
    await expect(verifyDocument("local", "token")).resolves.toEqual({ status: "unavailable" })
  })

  it("returns unavailable for network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))
    await expect(verifyDocument("local", "token")).resolves.toEqual({ status: "unavailable" })
  })
})

describe("verifyDocumentFile", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test"
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("keeps exact file integrity distinct from a revoked seal", async () => {
    const payload = {
      valid: false,
      matches: true,
      status: "matching",
      signature_valid: true,
      document_status: "revoked",
    }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))))

    await expect(
      verifyDocumentFile("local", new File(["%PDF-1.7"], "doc.pdf"), { token: "token" }),
    ).resolves.toEqual(payload)
  })

  it("rejects error responses before parsing their body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 500 })),
    )

    await expect(
      verifyDocumentFile("local", new File(["%PDF-1.7"], "doc.pdf"), { token: "token" }),
    ).resolves.toBeNull()
  })

  it("accepts the typed 409 unavailable contract", async () => {
    const payload = {
      valid: false,
      matches: false,
      status: "unavailable",
      code: "FILE_VERIFICATION_UNAVAILABLE",
      signature_valid: true,
      document_status: "active",
    }
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    await expect(
      verifyDocumentFile("local", new File(["%PDF-1.7"], "doc.pdf"), { token: "legacy" }),
    ).resolves.toEqual(payload)
  })
})
