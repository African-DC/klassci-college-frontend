# Rule : Empty state adaptatif par rôle utilisateur

## Quand s'active

Quand tu rends un état dégradé (donnée fondamentale absente, liste vide légitime, fonctionnalité pas encore activée) dans un composant utilisable par plusieurs rôles (admin, teacher, student, parent).

## Règle

Le message d'empty state doit **adapter l'action proposée au rôle** :

- **Admin** = message **actionnable** avec lien direct vers la config (`/admin/...`)
- **Teacher / Student / Parent** = message **informatif**, pointe la personne qui peut agir ("Contactez l'administration")

**Jamais le même texte/CTA pour tous les rôles.** Un lien admin masqué aux non-admins évite les 403 frustrants ; un message rassurant pour les rôles passifs respecte leur attente.

## Pourquoi

KLASSCI College vise la persona Mme Diallo (prof 52 ans, Itel S661) et Mme Aïcha (parent). Quand une donnée manque :

- Si Mme Diallo voit "Aucune année active. Configurer →" et clique → 403 → ticket support
- Si Aïcha voit "Aucun bulletin publié" sans rassurance → angoisse + appel à l'école

Avec l'adaptation :
- Mme Diallo voit "Contactez l'administration" → sait quoi faire (passer au secrétariat)
- Aïcha voit "Le bulletin du trimestre apparaîtra ici quand il sera publié" → patience sereine
- L'admin voit le lien direct → 1 clic pour fix

**Voir** memory `feedback_role_adaptive_empty_state`, composant `<AcademicYearBanner>` shipped 2026-05-16.

## Pattern correct

```tsx
// components/shared/AcademicYearBanner.tsx
type Role = "admin" | "teacher" | "student" | "parent"

const MISSING_MESSAGE: Record<Role, string> = {
  admin: "Aucune année scolaire active.",
  teacher: "Aucune année scolaire n'est encore configurée. Contactez l'administration.",
  student: "Année scolaire non configurée par l'établissement. Vos données apparaîtront dès qu'elle sera créée.",
  parent: "Année scolaire non configurée par l'établissement. Le suivi de vos enfants apparaîtra dès qu'elle sera créée.",
}

export function AcademicYearBanner({ currentYear, role }: { currentYear: string | null; role: Role }) {
  if (currentYear) {
    return <Chip>📅 Année {currentYear}</Chip>
  }
  return (
    <div role="alert" className="amber-banner">
      <AlertTriangle className="shrink-0" />
      <p>{MISSING_MESSAGE[role]}</p>
      {role === "admin" && (
        <Link href="/admin/academic-years">Configurer maintenant →</Link>
      )}
    </div>
  )
}
```

## Concepts qui méritent ce traitement

| Concept | Admin (action) | Teacher | Student | Parent |
|---|---|---|---|---|
| Année scolaire absente | `/admin/academic-years` | "Contactez l'admin" | "Apparaîtra dès création" | idem |
| Aucune classe assignée | `/admin/teachers/{id}` | "Demandez l'affectation" | (n/a) | (n/a) |
| Aucun bulletin publié | `/admin/reports` | (côté liste) | "Patientez" | "Notif quand publié" |
| Aucun paiement | `/admin/payments` | (n/a) | (n/a) | "Allez au secrétariat" |
| Aucun enfant inscrit | `/admin/enrollments` | (n/a) | (n/a) | "Contactez l'admin" |
| Aucune évaluation | `/admin/grades` | `/teacher/grades/{id}/new` | "Patientez" | "Notif quand notes publiées" |

## Anti-patterns à bloquer en review

1. **Texte hardcodé identique** pour tous : `"Aucune donnée"` sans contexte
2. **Lien admin visible côté autre rôle** → mène à 403 → frustration. **Masquer** le lien, garder le texte adapté
3. **Message technique** : "Aucun record dans `school_settings`"
4. **"Veuillez réessayer plus tard"** quand c'est un état vide légitime (pas une panne)
5. **Ton anxiogène** : "Erreur" / "Impossible" / "Échec" pour un état vide légitime
6. **Bouton "Créer" visible** à un rôle sans permission — masquer

## Checklist nouveau composant avec empty state

- [ ] Le message dit POURQUOI c'est vide (sinon l'utilisateur croit que c'est un bug)
- [ ] L'action proposée dépend du rôle (`role` prop ou `useSession().user.role`)
- [ ] Pour les rôles passifs, on pointe la personne qui peut agir (et pas un endroit générique)
- [ ] Pas de lien admin visible aux non-admins
- [ ] Ton rassurant pour les rôles passifs, urgent/actionnable pour admin
- [ ] La matrice `MISSING_MESSAGE: Record<Role, string>` est exhaustive (TS check)

## Voir aussi

- Memory `feedback_role_adaptive_empty_state.md`
- Memory `feedback_no_seed_in_prod_handle_empty.md` (pourquoi un fresh tenant a beaucoup d'empty states)
- Rule FE `ux-target-user-reality.md` — persona Mme Diallo + référence Wave Mobile Money
- Rule FE `redesign-premium.md` — patterns d'UI persona-first
- Rule globale `~/.claude/rules/no-mvp-only-premium.md`
