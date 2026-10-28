import { fireEvent, render, screen, within } from "@testing-library/react"
import { useState } from "react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { MultiCombobox, type MultiComboboxProps } from "./MultiCombobox"

beforeAll(() => {
  // jsdom n'implémente pas ces API utilisées par Radix Popover et cmdk.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>
  proto.scrollIntoView ??= () => {}
  proto.hasPointerCapture ??= () => false
  proto.releasePointerCapture ??= () => {}
})

const OPTIONS = [
  { value: 1, label: "Éloïse Martin", hint: "Français" },
  { value: 2, label: "Mariam Koné", hint: "Mathématiques" },
  { value: 3, label: "Jean Kouassi" },
]

function renderCombobox(overrides: Partial<MultiComboboxProps<number>> = {}) {
  const onChange = vi.fn()
  const props: MultiComboboxProps<number> = {
    options: OPTIONS,
    value: [],
    onChange,
    placeholder: "Sélectionner des enseignants",
    searchPlaceholder: "Rechercher…",
    emptyText: "Aucun enseignant disponible",
    ...overrides,
  }
  render(<MultiCombobox {...props} />)
  return { onChange }
}

function openList() {
  fireEvent.click(screen.getByRole("combobox"))
}

/** Version contrôlée pour vérifier une sélection successive. */
function Controlled({ onChange, modal }: { onChange: (ids: number[]) => void; modal?: boolean }) {
  const [value, setValue] = useState<number[]>([])
  return (
    <MultiCombobox
      options={OPTIONS}
      value={value}
      modal={modal}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
      placeholder="Sélectionner des enseignants"
      searchPlaceholder="Rechercher…"
      emptyText="Aucun enseignant disponible"
    />
  )
}

describe("MultiCombobox", () => {
  it("ouvre la liste et affiche les enseignants", () => {
    renderCombobox()
    expect(screen.getByRole("combobox")).toHaveTextContent("Sélectionner des enseignants")

    openList()

    expect(screen.getByRole("option", { name: /Éloïse Martin/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Mariam Koné/ })).toBeInTheDocument()
  })

  it("s'ouvre au clavier avec Entrée et avec la flèche bas", () => {
    renderCombobox()
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" })
    expect(screen.getByRole("option", { name: /Éloïse Martin/ })).toBeInTheDocument()
  })

  it("s'ouvre au clavier avec la flèche bas", () => {
    renderCombobox()
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" })
    expect(screen.getByRole("option", { name: /Mariam Koné/ })).toBeInTheDocument()
  })

  it("trouve « Éloïse » quand on tape « eloise » sans accents", () => {
    renderCombobox()
    openList()

    fireEvent.change(screen.getByPlaceholderText("Rechercher…"), { target: { value: "eloise" } })

    expect(screen.getByRole("option", { name: /Éloïse Martin/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Jean Kouassi/ })).not.toBeInTheDocument()
  })

  it("sélectionne deux enseignants et garde la liste ouverte", () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} modal={false} />)
    openList()

    fireEvent.click(screen.getByRole("option", { name: /Éloïse Martin/ }))
    fireEvent.click(screen.getByRole("option", { name: /Mariam Koné/ }))

    expect(onChange).toHaveBeenLastCalledWith([1, 2])
    expect(screen.getByRole("option", { name: /Mariam Koné/ })).toBeInTheDocument()
    expect(screen.getByText("2 enseignants sélectionnés")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retirer Éloïse Martin" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retirer Mariam Koné" })).toBeInTheDocument()
  })

  it("retire une pastille sans rouvrir la liste et sans toucher aux autres", () => {
    const { onChange } = renderCombobox({ value: [1, 2] })

    fireEvent.click(screen.getByRole("button", { name: "Retirer Éloïse Martin" }))

    expect(onChange).toHaveBeenCalledWith([2])
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })

  it("ne retire rien quand le combobox est désactivé", () => {
    const { onChange } = renderCombobox({ value: [1], disabled: true })

    const chip = screen.getByRole("button", { name: "Retirer Éloïse Martin" })
    expect(chip).toBeDisabled()
    fireEvent.click(chip)

    expect(onChange).not.toHaveBeenCalled()
  })

  it("affiche « Enseignant introuvable » pour un identifiant inconnu", () => {
    renderCombobox({ value: [99] })

    expect(screen.getByText("Enseignant introuvable")).toBeInTheDocument()
    expect(screen.queryByText("99")).not.toBeInTheDocument()
  })

  it("affiche l'état vide quand aucun enseignant n'existe", () => {
    renderCombobox({ options: [] })
    openList()

    expect(screen.getByText("Aucun enseignant disponible")).toBeInTheDocument()
  })

  it("affiche l'erreur et relance le chargement avec Réessayer", () => {
    const onRetry = vi.fn()
    renderCombobox({ error: "Impossible de charger les enseignants.", onRetry })
    openList()

    const alert = screen.getByRole("alert")
    expect(within(alert).getByText("Impossible de charger les enseignants.")).toBeInTheDocument()
    fireEvent.click(within(alert).getByRole("button", { name: "Réessayer" }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("affiche le chargement pendant la récupération de la liste", () => {
    renderCombobox({ loading: true, loadingText: "Chargement des enseignants…" })
    openList()

    expect(screen.getByText("Chargement des enseignants…")).toBeInTheDocument()
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })

  it("« Tout retirer » vide la sélection", () => {
    const { onChange } = renderCombobox({ value: [1, 3] })
    openList()

    fireEvent.click(screen.getByRole("button", { name: /Tout retirer/ }))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it("relie le déclencheur à son libellé et à son aide", () => {
    renderCombobox({ id: "teachers", "aria-labelledby": "teachers-label", "aria-describedby": "teachers-hint", "aria-invalid": true })

    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveAttribute("id", "teachers")
    expect(trigger).toHaveAttribute("aria-labelledby", "teachers-label")
    expect(trigger).toHaveAttribute("aria-describedby", "teachers-hint")
    expect(trigger).toHaveAttribute("aria-invalid", "true")
  })
})
