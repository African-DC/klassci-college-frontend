import { beforeEach, describe, expect, it, vi } from "vitest"

// Le client HTTP lit la session NextAuth pour poser l'entête d'autorisation.
// Ici il n'y a pas de session : on teste le contrat d'envoi de fichier commun,
// pas l'auth elle-même.
vi.mock("next-auth/react", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import { signOut } from "next-auth/react"
import { settingsApi } from "./settings"
import { studentsApi } from "./students"

function respondWith(status: number, payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

const IMAGE = new File(["image"], "logo.png", { type: "image/png" })

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test"
  vi.clearAllMocks()
})

// Ces trois garanties sont la raison d'être de `apiFetchMultipart` : chaque
// module qui les réimplémentait de son côté en perdait au moins une.
describe("envoi de fichier authentifié", () => {
  it("laisse le navigateur poser le Content-Type multipart", async () => {
    const fetchMock = respondWith(200, { logo_url: "/uploads/logo.png" })

    await settingsApi.uploadLogo(IMAGE)

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe("http://api.test/admin/settings/logo")
    expect(init.method).toBe("POST")
    expect(init.body).toBeInstanceOf(FormData)
    // Poser "application/json" ici détruirait la frontière multipart.
    expect(Object.keys(init.headers)).not.toContain("Content-Type")
  })

  it("remonte le detail du backend quand le fichier est refusé", async () => {
    respondWith(400, { detail: "Fichier trop volumineux" })

    await expect(studentsApi.uploadPhoto(12, IMAGE)).rejects.toThrow("Fichier trop volumineux")
  })

  it("ne déconnecte pas sur un 401 reçu sans jeton envoyé (course post-login)", async () => {
    respondWith(401, { detail: "Not authenticated" })

    await expect(settingsApi.uploadLogo(IMAGE)).rejects.toThrow("Session expirée")
    expect(signOut).not.toHaveBeenCalled()
  })
})
