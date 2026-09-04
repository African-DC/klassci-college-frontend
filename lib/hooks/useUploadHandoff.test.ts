import { describe, expect, it } from "vitest"
import { HANDOFF_POLL_MS, pollDelay } from "./useUploadHandoff"
import type { HandoffSession } from "@/lib/contracts/upload-handoff"

const MAINTENANT = Date.parse("2026-09-04T10:00:00+00:00")

function session(partielle: Partial<HandoffSession> = {}): HandoffSession {
  return {
    id: "h_1",
    state: "open",
    mode: "finalise",
    label: "Kouadio A.",
    metier: "Photo d'élève",
    expires_at: "2026-09-04T10:10:00+00:00",
    retakes_left: 3,
    staged_mime: null,
    ...partielle,
  }
}

describe("pollDelay", () => {
  it("sonde tant que le code attend un téléphone", () => {
    expect(pollDelay(session(), MAINTENANT)).toBe(HANDOFF_POLL_MS)
  })

  it("continue pendant que le téléphone envoie", () => {
    expect(pollDelay(session({ state: "receiving" }), MAINTENANT)).toBe(HANDOFF_POLL_MS)
  })

  it("s'arrête dès que la photo est là", () => {
    expect(pollDelay(session({ state: "proposed" }), MAINTENANT)).toBe(false)
    expect(pollDelay(session({ state: "done" }), MAINTENANT)).toBe(false)
  })

  it("s'arrête à l'échéance, alors que la session est encore ouverte", () => {
    const expiree = session({ expires_at: "2026-09-04T09:59:59+00:00" })
    expect(pollDelay(expiree, MAINTENANT)).toBe(false)
  })

  it("s'arrête plutôt que de courir sur une échéance illisible", () => {
    expect(pollDelay(session({ expires_at: "jamais" }), MAINTENANT)).toBe(false)
  })

  it("ne sonde rien sans session", () => {
    expect(pollDelay(undefined, MAINTENANT)).toBe(false)
  })
})
