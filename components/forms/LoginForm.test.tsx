import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LoginForm } from "@/components/forms/LoginForm"

const push = vi.fn()
const refresh = vi.fn()
const signIn = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signIn(...args),
}))

describe("LoginForm school code", () => {
  beforeEach(() => {
    push.mockReset()
    refresh.mockReset()
    signIn.mockReset()
    document.cookie = "tenant_code=; max-age=0; path=/"
    document.cookie = "school_code=; max-age=0; path=/"
  })

  it("sends the Rostan tenant when the school types ROSTAN", async () => {
    signIn.mockResolvedValue({ error: undefined })
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText("ROSTAN"), { target: { value: "ROSTAN" } })
    fireEvent.change(screen.getByPlaceholderText("nom@etablissement.ci"), {
      target: { value: "admin@rostan-bouake.ci" },
    })
    fireEvent.change(screen.getByPlaceholderText("Entrez votre mot de passe"), {
      target: { value: "R0svHXt2znVDUPaC34!" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "admin@rostan-bouake.ci",
        password: "R0svHXt2znVDUPaC34!",
        tenant_code: "rostan-bouake",
        redirect: false,
      })
    })
    expect(push).toHaveBeenCalledWith("/")
  })

  it("blocks an unknown school code", async () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText("ROSTAN"), { target: { value: "???" } })
    fireEvent.change(screen.getByPlaceholderText("nom@etablissement.ci"), {
      target: { value: "admin@rostan-bouake.ci" },
    })
    fireEvent.change(screen.getByPlaceholderText("Entrez votre mot de passe"), {
      target: { value: "secret" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }))

    expect(signIn).not.toHaveBeenCalled()
    expect(await screen.findByText(/Code établissement inconnu/i)).toBeInTheDocument()
  })
})
