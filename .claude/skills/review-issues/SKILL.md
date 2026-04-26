---
name: review-issues
description: Review all open issues on klassci-college-frontend and klassci-college-backend. Cross-links FE and BE issues, adds optimistic update patterns (TanStack Query v5), adds shared Zod/Pydantic API contract specs, and edits the GitHub issues with the enriched content. Use when asked to review, enrich, or cross-link issues between the frontend and backend repos.
disable-model-invocation: true
---

# Review Issues — KLASSCI (FE + BE)

Enrich and cross-link all open issues across both repos.

## Step 1 — Lister les issues ouvertes dans les deux repos

```bash
gh issue list --repo African-DC/klassci-college-frontend --state open --json number,title,labels,body | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{JSON.parse(d).forEach(i=>console.log('#'+i.number+' '+i.title))})"
gh issue list --repo African-DC/klassci-college-backend --state open --json number,title,labels,body | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{JSON.parse(d).forEach(i=>console.log('#'+i.number+' '+i.title))})"
```

## Step 2 — Pour chaque issue FE, identifier le pendant BE (et vice-versa)

Logique de cross-link :
- Authentification FE → Authentification BE (JWT tokens, rôles)
- Inscriptions/CRUD FE → Endpoints CRUD BE correspondants
- Notes/Grades FE → Endpoints grades BE
- Emploi du temps FE → Endpoints timetable BE
- Contrats API → Issue dédiée dans les deux repos

Créer une matrice de correspondance avant d'éditer quoi que ce soit.

## Step 3 — Enrichir chaque issue FE avec

### Contrat API obligatoire
```markdown
## Contrat API

| Méthode | Endpoint | Auth |
|---------|----------|------|
| GET | `/api/v1/<resource>` | Bearer token requis |
| POST | `/api/v1/<resource>` | Bearer token requis |
| PATCH | `/api/v1/<resource>/{id}` | Bearer token requis |
| DELETE | `/api/v1/<resource>/{id}` | Bearer token requis |

**Request body (POST/PATCH) :**
```json
{
  "field1": "string",
  "field2": 0
}
```

**Response (200) :**
```json
{
  "id": 1,
  "field1": "...",
  "created_at": "2026-01-01T00:00:00Z"
}
```
```

### Pattern Optimistic Updates (TanStack Query v5)
```markdown
## Optimistic Updates — Pattern obligatoire

```ts
const useCreate<Resource> = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Create<Resource>Input) => api.post('<resource>', data),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['<resource>'] })
      const previous = queryClient.getQueryData(['<resource>'])
      queryClient.setQueryData(['<resource>'], (old: <Resource>[]) => [
        ...(old ?? []),
        { ...newItem, id: Date.now() }  // ID temporaire
      ])
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['<resource>'], ctx?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['<resource>'] })
    },
  })
}
```
```

### Cross-link BE
```markdown
## Lié au backend

African-DC/klassci-college-backend#<N>
```

## Step 4 — Enrichir chaque issue BE avec

### Alignement Pydantic ↔ Zod
```markdown
## Alignement Schéma Pydantic ↔ Zod Frontend

Le schéma Pydantic de la response doit correspondre exactement au schéma Zod frontend :

**Backend Pydantic (à respecter) :**
```python
class <Resource>Response(BaseModel):
    id: int
    field1: str
    created_at: datetime
```

**Frontend Zod attendu :**
```ts
export const <resource>Schema = z.object({
  id: z.number(),
  field1: z.string(),
  created_at: z.string().datetime(),
})
```

**IMPORTANT :** Le champ `role` doit être exactement `"admin" | "teacher" | "student" | "parent"` (minuscules, sans accent) — le routage des portails en dépend.
```

### Cross-link FE
```markdown
## Lié au frontend

African-DC/klassci-college-frontend#<N>
```

## Step 5 — Appliquer les éditions GitHub

Pour chaque issue à enrichir :

```bash
# Lire le body actuel
gh issue view <N> --repo African-DC/klassci-college-frontend --json body

# Editer en ajoutant les sections (ne pas effacer le contenu existant)
gh issue edit <N> --repo African-DC/klassci-college-frontend --body "$(cat <<'EOF'
<contenu_existant_conservé>

## Contrat API
...

## Optimistic Updates — Pattern obligatoire
...

## Lié au backend
African-DC/klassci-college-backend#<N>
EOF
)"
```

## Step 6 — Résumé final

Afficher un tableau de toutes les issues enrichies :

| Repo | Issue | Enrichissement ajouté |
|------|-------|----------------------|
| FE | #N - titre | Contrat API + Optimistic + cross-link BE#N |
| BE | #N - titre | Pydantic schema + cross-link FE#N |

$ARGUMENTS
