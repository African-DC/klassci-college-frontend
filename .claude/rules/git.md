# Règles Git — KLASSCI Frontend

## Format des Commits (Conventionnel)

```
<type>(<scope>): <description courte en impératif anglais>
```

**Types :** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`

**Scopes frontend :** `auth`, `enrollments`, `fees`, `timetable`, `grades`,
`attendance`, `notifications`, `dashboard`, `settings`, `ui`, `i18n`

**Règles :**
- Description ≤ 72 caractères
- Impératif anglais : "add" pas "added"
- PAS de "Generated with Claude Code" ni "Co-Authored-By"

**Exemples corrects :**
```
feat(enrollments): add enrollment creation modal with fee preview
fix(auth): redirect to correct portal after login
feat(dashboard): add real-time notification badge via WebSocket
style(ui): update status badge colors to match design system
test(grades): add grade entry form validation tests
```

## Branches — identiques au backend

```
main / staging / develop / feature/* / fix/* / hotfix/*
```

**Toujours brancher depuis `develop`.**
