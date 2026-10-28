/**
 * Choisir une option dans un `Select` Radix sous jsdom.
 *
 * Radix ouvre sa liste au `pointerdown` et interroge la capture du pointeur et
 * le défilement, que jsdom n'implémente pas : on les simule ici une fois.
 */
import { fireEvent, screen } from "@testing-library/react"

/** Ouvre la liste d'un `Select` Radix sous jsdom. */
export function openSelect(trigger: HTMLElement): void {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>
  proto.hasPointerCapture ??= () => false
  proto.releasePointerCapture ??= () => {}
  proto.scrollIntoView ??= () => {}
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" })
}

export function pickSelectOption(trigger: HTMLElement, optionName: string): void {
  openSelect(trigger)
  fireEvent.click(screen.getByRole("option", { name: optionName }))
}
