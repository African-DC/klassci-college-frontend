# components/admin/ — Composants Portail Administration

Organises par domaine metier. Un sous-dossier par module.

## Structure

```
admin/
  enrollments/     Composants gestion inscriptions
  fees/            Composants gestion frais et paiements
  timetable/       Composants emploi du temps (grille drag-and-drop)
  grades/          Composants saisie et validation des notes
  attendance/      Composants gestion des presences
  students/        Composants gestion des eleves
  staff/           Composants gestion du personnel
  permissions/     Composants roles et permissions (RBAC)
  reports/         Composants rapports et exports
  settings/        Composants parametres etablissement
```

## Convention par domaine

Chaque sous-dossier contient :
```
{Domain}Table.tsx         Liste avec TanStack Table
{Domain}TableSkeleton.tsx Skeleton de la liste
{Domain}Card.tsx          Carte recapitulative
{Domain}CreateModal.tsx   Modal de creation
{Domain}EditModal.tsx     Modal de modification
{Domain}ShowModal.tsx     Modal de resume
```
