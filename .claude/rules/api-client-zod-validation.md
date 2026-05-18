# Rule : Tout API client FE valide via Zod, jamais cast TypeScript

## Quand s'active

Quand tu écris ou modifies un fichier dans `klassci-frontend/lib/api/*.ts`.

## Règle

Toute fonction qui retourne un type métier **doit** :

1. Appeler `apiFetch<unknown>(...)` (pas `<MonType>`)
2. Passer le résultat par `safeValidate(SchemaZod, ..., context)` avant return
3. Si l'enveloppe BE peut être `{data}`, `{items}` ou array brut → unwrap avant validation

**Pas de `return (json as MonType)`. Pas de `apiFetch<MonType>` sans `safeValidate` derrière.**

## Pourquoi

Le cast TypeScript est une promesse runtime non vérifiée. Dès que le BE drift (champ ajouté/retiré/renommé, Decimal sérialisé en string, etc.), le FE reçoit silencieusement des données invalides et crash en aval avec des erreurs cryptiques (`Cannot read properties of undefined`, etc.).

`safeValidate` (Zod) :
- Vérifie le shape à runtime
- Applique les `.default()` automatiquement (typiquement `.array().default([])` qui sauve les fresh tenants)
- Loggue un message explicite avec le context si validation échoue
- Type-check est dérivé du schéma → pas de double source de vérité

**Voir** memory `feedback_fe_api_client_must_zod`, incident 2026-05-16 sur `settings.trimesters.length` crash.

## Pattern correct

```ts
import { z } from "zod"
import { apiFetch, safeValidate } from "./client"
import { MyEntitySchema, type MyEntity } from "@/lib/contracts/my-entity"

const MyEntityArraySchema = z.array(MyEntitySchema)

function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>
    if (obj.data !== undefined) return obj.data
    if (obj.items !== undefined) return obj.items
  }
  return json
}

export const myEntityApi = {
  get: async (id: number): Promise<MyEntity> => {
    const json = await apiFetch<unknown>(`/my-entity/${id}`)
    return safeValidate(MyEntitySchema, unwrap(json), `GET /my-entity/${id}`)
  },

  list: async (): Promise<MyEntity[]> => {
    const json = await apiFetch<unknown>("/my-entity")
    return safeValidate(MyEntityArraySchema, unwrap(json), "GET /my-entity")
  },

  create: async (data: MyEntityCreate): Promise<MyEntity> => {
    const json = await apiFetch<unknown>("/my-entity", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(MyEntitySchema, unwrap(json), "POST /my-entity")
  },
}
```

## Anti-patterns à bloquer en review

```ts
// ❌ Cast direct, perd defaults Zod + zero runtime check
return (json as MyEntity)
```

```ts
// ❌ Typage attentif AVANT validation (promesse non tenue)
const data = await apiFetch<MyEntity>("/my-entity")
return data  // TS heureux mais runtime peut être n'importe quoi
```

```ts
// ❌ Fallback avec ?? qui contourne les defaults Zod
return (json as { data?: MyEntity }).data ?? (json as MyEntity)
```

```ts
// ❌ Validation après usage (trop tard, le crash est déjà arrivé)
const data = await apiFetch<unknown>("/my-entity")
const usedField = (data as MyEntity).someField  // crash si data drift
const validated = MyEntitySchema.parse(data)  // jamais atteint
```

## Checklist nouveau API client

- [ ] `apiFetch<unknown>(...)` (pas `<MonType>`)
- [ ] `safeValidate(Schema, unwrap(json), context)` avant return
- [ ] `context` descriptif pour les logs (`"GET /endpoint"`, `"POST /endpoint"`)
- [ ] Si Decimal/Date possible → schema Zod fait `.coerce.number()` ou `.preprocess(...)` (voir `feedback_pydantic_decimal_zod_drift.md`)
- [ ] Defaults Zod (`.default([])`, `.nullish()`) couvrent les cas BE renvoie sans le champ

## Quand le bypass est légitime

Quasi jamais. Exceptions rares :
- **Réponses non-JSON** : un download de PDF (`Blob`) — typer `Promise<Blob>` direct
- **Endpoints de health check** triviaux qui retournent `{"status":"ok"}` — encore mieux à valider

Si tu hésites : valide. Le coût est nul (5 lignes), le bénéfice est immense (crash futur évité).

## Voir aussi

- `data-fetching.md` — pattern TanStack Query par-dessus les API clients
- `forms.md` — Zod côté formulaires (input)
- Memory `feedback_fe_api_client_must_zod.md`
- Memory `feedback_pydantic_decimal_zod_drift.md`
- Rule globale `~/.claude/rules/no-mvp-only-premium.md`
