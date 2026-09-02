/**
 * La barre de navigation passe-t-elle la photo à l'avatar ?
 *
 * Elle ne l'a jamais fait : le composant n'importait même pas `AvatarImage`,
 * si bien qu'un utilisateur voyait ses initiales sur toutes les pages alors
 * que sa photo s'affichait sur son profil. Ce n'était pas une URL cassée,
 * c'était un câblage absent — le genre de défaut qu'aucune vérification de
 * type ne trouve, puisque le code est parfaitement valide.
 *
 * Les primitives d'avatar sont remplacées ici par des doublures qui exposent
 * ce qu'on leur donne. C'est nécessaire, pas commode : le vrai `AvatarImage`
 * de Radix n'apparaît qu'une fois l'image chargée, et jsdom ne charge jamais
 * d'image. Un test écrit contre le rendu réel serait donc vert quoi qu'il
 * arrive, y compris avec le défaut d'origine.
 */

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Navbar } from "@/components/shared/Navbar"

const profil = vi.fn()

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { firstName: "KLASSCI", lastName: "Admin", role: "admin" } } }),
}))
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light", setTheme: vi.fn() }) }))
vi.mock("@/lib/hooks/useProfile", () => ({ useMyProfile: () => profil() }))
vi.mock("@/components/shared/NotificationBell", () => ({ NotificationBell: () => null }))
// Meme traitement que la cloche : ce test regarde l'avatar, et les deux
// declencheurs de la barre vont chercher leurs donnees. Les monter ici
// demanderait un QueryClient pour verifier une photo de profil.
vi.mock("@/components/shared/WhatsNewModal", () => ({ WhatsNewModal: () => null }))
vi.mock("@/lib/hooks/useAcademicYears", () => ({ useCurrentAcademicYear: () => ({ data: null }) }))

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarImage: ({ src }: { src?: string }) => <div data-testid="photo" data-src={src} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="initiales">{children}</div>
  ),
}))

describe("l'avatar de la barre de navigation", () => {
  beforeEach(() => profil.mockReset())

  it("passe la photo du profil quand elle existe", () => {
    profil.mockReturnValue({ data: { photo_url: "/uploads/photos/admin_1_ab.jpg" } })
    render(<Navbar onMenuClick={() => {}} />)
    expect(screen.getByTestId("photo").getAttribute("data-src")).toContain(
      "/uploads/photos/admin_1_ab.jpg",
    )
  })

  it("ne passe aucune photo quand le profil n'en a pas", () => {
    profil.mockReturnValue({ data: { photo_url: null } })
    render(<Navbar onMenuClick={() => {}} />)
    expect(screen.queryByTestId("photo")).toBeNull()
  })

  it("garde toujours les initiales en repli", () => {
    profil.mockReturnValue({ data: { photo_url: "/uploads/photos/x.jpg" } })
    render(<Navbar onMenuClick={() => {}} />)
    expect(screen.getByTestId("initiales").textContent).toBe("KL")
  })

  it("ne casse pas tant que le profil n'est pas chargé", () => {
    profil.mockReturnValue({ data: undefined })
    render(<Navbar onMenuClick={() => {}} />)
    expect(screen.queryByTestId("photo")).toBeNull()
    expect(screen.getByTestId("initiales")).toBeTruthy()
  })
})
