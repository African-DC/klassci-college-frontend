# Rule : Empty state pour utilisateur non inscrit dans l'année courante

## Quand s'active

Cette rule s'active quand je rends un dashboard ou un KPI pour un user (student / parent → enfant) **qui n'a pas d'enrollment actif dans l'année courante** :

- `/student/dashboard` quand l'élève connecté n'a pas d'enrollment AY current
- `/parent/dashboard` quand un enfant suivi n'a pas d'enrollment AY current
- Tout sous-écran (notes, frais, EDT, présences) qui dépend de l'enrollment

## Le bug à éviter

État observé 2026-05-17 sur Aminata (compte créé, parent Mariam lié, **PAS d'enrollment**) :

| Symptôme | Pourquoi c'est anxiogène faux |
|---|---|
| `0 FCFA Frais restants` en **vert success** | Suggère "tout est payé !" → faux, rien n'est dû car pas inscrite |
| `0 Absences` neutral | Suggère "présence parfaite !" → faux, rien à compter |
| `Moyenne —` | Placeholder visible, parent comprend pas que c'est normal |
| `class_name: "—"` rendu en clair sous le nom | Tiret seul sans contexte, illisible |
| `ENFANTS INSCRITS 1` (compteur parent) | Mariam a Aminata "suivie", pas "inscrite" — anxiogène faux |
| `— — Votre résumé du jour` (subtitle student) | Template `{class} — {level} — Votre résumé` avec class/level vides |
| **PAS de banner d'alerte** | Mariam ne comprend pas qu'elle doit aller au secrétariat |

## La règle

**Toujours afficher un banner d'alerte explicite quand un élève n'a pas d'enrollment AY current**, et **masquer les KPIs financiers/académiques tant qu'il n'est pas inscrit** (ou les remplacer par "—" neutre avec tooltip).

### Pattern correct

```tsx
// /parent/dashboard pour un enfant pas inscrit
{child.class_name === null || child.class_name === "—" ? (
  <Card variant="alert" tone="amber">
    <AlertTriangle />
    <CardContent>
      <p>L&apos;inscription de <strong>{child.full_name}</strong> n&apos;est pas encore validée pour {currentYear}.</p>
      <p className="text-muted-foreground">Contactez l&apos;administration de l&apos;école pour finaliser le dossier.</p>
    </CardContent>
  </Card>
) : (
  <ChildKpisCard child={child} />
)}
```

### Composant `<NotEnrolledBanner>` recommandé

Crée un composant partagé pour les 2 portails :

```tsx
// components/shared/NotEnrolledBanner.tsx
interface NotEnrolledBannerProps {
  studentName: string
  academicYear: string
  audience: "student" | "parent"
}

export function NotEnrolledBanner({ studentName, academicYear, audience }: NotEnrolledBannerProps) {
  const message = audience === "student"
    ? `Votre inscription pour ${academicYear} n'est pas encore validée par l'administration.`
    : `L'inscription de ${studentName} pour ${academicYear} n'est pas encore validée.`
  return (
    <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-amber-900">{message}</p>
          <p className="mt-1 text-sm text-amber-800">
            Rendez-vous au secrétariat de l&apos;école pour finaliser le dossier.
          </p>
        </div>
      </div>
    </div>
  )
}
```

## Détection de l'état "non inscrit"

Le BE renvoie déjà la sentinelle :

```json
{
  "id": 1,
  "full_name": "Traoré Aminata",
  "class_name": "—",     // ← sentinelle "pas inscrite"
  "general_average": null,
  "total_absences": 0,
  "fees_remaining": 0.0
}
```

Au lieu de tester `class_name === "—"` (fragile), normaliser dans le schema Zod :

```ts
export const ParentChildSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  class_name: z.string().nullable().transform(v => v === "—" ? null : v),
  is_enrolled: z.boolean().optional(), // BE TODO : ajouter ce champ
  general_average: z.number().nullable(),
  total_absences: z.number().default(0),
  fees_remaining: z.number().default(0),
})
```

Mieux : demander au BE d'exposer `is_enrolled: bool` explicite et `class_name: null` quand pas inscrit (au lieu de `"—"` string).

## Labels à corriger

| Label actuel | Cas non inscrit | Proposition |
|---|---|---|
| `ENFANTS INSCRITS` (compteur parent) | "1" alors qu'Aminata pas inscrite | `MES ENFANTS` ou `ENFANTS SUIVIS` |
| `Frais restants` | "0 FCFA" vert | `—` neutre + "Frais à venir après inscription" |
| `Absences` | "0" neutral | `—` + "Aucune donnée tant que pas inscrit" |
| `Moyenne` | "— / 0" | `—` simple |
| Subtitle student "— — Votre résumé" | Tirets visibles | "Votre espace personnel" simple |

## Anti-patterns à bloquer en review

1. **Vert (success) sur un montant zéro** pour un user pas inscrit → faux signal positif
2. **Placeholder visible** (`—`, `null`, `undefined`) rendu en clair sans wrapper conditional
3. **KPI absences/notes/frais affichés** comme valides quand pas d'enrollment → trompeur
4. **Bouton "Notes" / "Frais"** cliquable qui mène sur page vide quand pas inscrit → frustrant
5. **Pas de CTA explicite "Contactez l'administration"** pour un parent dans cet état
6. **Test sur `"—"` string** au lieu de `null` ou `is_enrolled: false` explicite

## Checklist avant de ship un dashboard student/parent

- [ ] L'élève non inscrit voit un banner explicite, pas un dashboard vide-mais-trompeur
- [ ] Les KPIs financiers affichent `—` neutre, pas `0 FCFA` vert
- [ ] Les KPIs académiques affichent `—` neutre, pas `0` ou `— / 0`
- [ ] Le label compteur enfants côté parent dit "suivis" ou "mes" pas "inscrits"
- [ ] Le subtitle de bienvenue dégrade gracieusement (pas de tirets visibles)
- [ ] Les boutons sub-screens (Notes, Frais, EDT) sont disabled OU mènent à un empty state cohérent

## Voir aussi

- Rule `empty-state-by-role.md` — l'ancêtre de cette rule (s'applique aussi)
- Rule `no-mvp-only-premium.md` — production-grade dès la 1re itération
- Memory `project_session_2026_05_17_portails_e2e.md` — bugs observés + données BE
- Task #38 — Bug FE à fixer
