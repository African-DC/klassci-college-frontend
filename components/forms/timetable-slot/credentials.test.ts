/**
 * Le mot de passe d'un enseignant ne doit pas se lire dans son adresse.
 *
 * La version précédente tirait un suffixe à trois chiffres avec `Math.random`
 * et le posait des deux côtés : l'adresse `aissatou.diallo.437@klassci.local`
 * annonçait le mot de passe `Klassci437!A`. Connaître l'un donnait l'autre,
 * sans une seule tentative, et l'adresse d'un enseignant n'est pas un secret.
 *
 * Ces tests appellent la vraie fonction. Le premier est celui qui compte :
 * il échoue dès qu'un fragment de l'adresse reparaît dans le mot de passe.
 */

import { describe, expect, it } from "vitest"
import { generateAutoCredentials } from "./inline-create-dialogs"

/** Les morceaux de l'adresse qu'un curieux peut lire. */
function fragmentsDeLAdresse(email: string): string[] {
  const local = email.split("@")[0]
  return local.split(".").filter((f) => f.length >= 2)
}

describe("les identifiants d'un enseignant créé au vol", () => {
  it("ne laisse aucun fragment de l'adresse reparaître dans le mot de passe", () => {
    for (let i = 0; i < 200; i++) {
      const { email, password } = generateAutoCredentials("Aïssatou", "Diallo")
      for (const fragment of fragmentsDeLAdresse(email)) {
        expect(password.toLowerCase()).not.toContain(fragment.toLowerCase())
      }
    }
  })

  it("donne deux mots de passe différents pour le même enseignant", () => {
    const vus = new Set<string>()
    for (let i = 0; i < 100; i++) vus.add(generateAutoCredentials("Kouadio", "Yao").password)
    expect(vus.size).toBe(100)
  })

  it("tire assez de hasard pour qu'on ne l'épuise pas", () => {
    // L'ancienne version avait 900 possibilités : une liste, pas un secret.
    const { password } = generateAutoCredentials("Mariam", "Koné")
    expect(password.length).toBeGreaterThanOrEqual(20)
  })

  it("satisfait les règles usuelles de composition", () => {
    const { password } = generateAutoCredentials("Sophie", "Yao")
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[^a-zA-Z0-9]/)
  })

  it("garde une adresse lisible, accents retirés", () => {
    const { email } = generateAutoCredentials("Aïssatou", "Diallo")
    expect(email).toMatch(/^aissatou\.diallo\.[a-z0-9]+@klassci\.local$/)
  })
})
