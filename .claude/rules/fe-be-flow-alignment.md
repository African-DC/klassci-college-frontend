# Rule : Le modal FE expose TOUS les champs requis par son endpoint BE

## Quand s'active

Quand tu crées ou modifies un **modal/form** côté FE qui POST à un endpoint BE pour créer une entité (teacher, staff, student, parent, etc.).

## Règle

Le formulaire FE **doit exposer chaque champ marqué comme requis dans le schema Pydantic BE**. Sinon le submit échoue avec "Field required" — bug invisible à la review code, visible seulement au runtime.

## Pourquoi

KLASSCI College 2026-05-16, page `/admin/staff` : le modal demande `first_name/last_name/position/phone` mais BE `StaffCreate` exige aussi `user_id: int`. Résultat : on remplit tout, on submit, on voit "Field required" sans savoir lequel manque. UX cassée.

Le pattern correct existe déjà dans `create_teacher` du même codebase :
- FE modal : `first_name/last_name/email/password/speciality/phone`
- BE schema : pareil
- BE service : crée user + user_roles + teacher_profile en transaction

Le pattern qui RATE (cas `create_staff` actuel) :
- FE modal : `first_name/last_name/position/phone` (manque email/password/user_id)
- BE schema : exige `user_id`
- BE service : nécessite un user existant

→ **Mismatch sémantique**. Le FE assume "staff = juste un profil admin", le BE assume "staff hérite d'un user déjà créé". Personne n'a aligné.

## Pattern correct (réplique du teacher flow)

### BE schema

```python
class StaffCreate(BaseModel):
    first_name: str
    last_name: str
    position: str | None = None
    phone: str | None = None
    email: EmailStr
    password: str  # min 8 chars validé
```

### BE service

```python
async def create_staff(db, data: StaffCreate, *, created_by: int) -> StaffResponse:
    existing = (await db.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(400, f"Email {data.email} déjà utilisé")

    async with db.begin_nested():
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            role=UserRoleEnum.STAFF,
        )
        db.add(user)
        await db.flush()
        await _ensure_default_user_role(db, user.id, "staff")  # !! voir bug #17

        profile = await repo.create_staff(db, **{
            "user_id": user.id,
            **data.model_dump(exclude={"email", "password"}),
        })
        await audit_log(...)
    await db.commit()
    return _staff_to_response(profile)
```

### FE Zod schema

```ts
export const StaffCreateSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  position: z.string().optional(),
  phone: z.string().optional(),
})
```

### FE modal

```tsx
// Le modal doit exposer 6 champs au lieu de 4
<FormField name="first_name" ... />
<FormField name="last_name" ... />
<FormField name="email" type="email" ... />
<FormField name="password" type="password" placeholder="Min. 8 caractères" ... />
<FormField name="position" placeholder="ex: Secrétaire pédagogique" ... />
<FormField name="phone" placeholder="ex: +225 ..." ... />
```

## Checklist nouvelle entité créatrice de User

Pour chaque nouvelle page d'admin qui crée une entité avec un compte user associé (teacher, staff, student, parent, secrétaire, comptable, etc.) :

- [ ] Le modal FE expose `email` + `password` (les 2 champs auth)
- [ ] Le schema Zod FE rend `email`/`password` requis avec validation (min 8 pour password)
- [ ] Le schema Pydantic BE matche exactement le contract FE (mêmes champs, mêmes contraintes)
- [ ] Le service BE crée `User` + appelle `_ensure_default_user_role(db, user.id, "<role>")` + crée le profil — dans **une transaction `begin_nested`**
- [ ] Le commit est explicite : `await db.commit()` après la transaction
- [ ] Audit log avec `model_dump(mode="json", exclude={"password"})` (jamais le mdp en clair)
- [ ] Test E2E : créer via UI → login avec les nouveaux credentials → accéder au portail

## Anti-patterns à bloquer en review

1. **Modal qui ne demande pas email/password** pour une entité destinée à se connecter
2. **`StaffCreate` (BE) exige `user_id` que le modal n'expose pas** → mismatch, UX cassée
3. **`profile.user_id = null`** en sortie de création — l'entité est orpheline
4. **Pas d'appel à `_ensure_default_user_role`** après la création du User → 403 sur les endpoints permission-gated
5. **Password dans le commit/audit non hashé** (sécurité critique)
6. **Pas de check d'email unique avant insert** → race condition + erreur DB cryptique

## Quand admettre une exception

Très rare. Cas où un profil n'a PAS de compte user :
- Un "contact d'urgence" (juste nom + tel, ne se connecte jamais à l'app)
- Un "stagiaire externe" non encore officialisé

Dans ces cas : le profil n'a pas de `user_id` (nullable) ET le modèle ne le requiert pas. L'entité reste alors purement admin-managed. Documenter ce choix dans une rule projet.

## Voir aussi

- `api-client-zod-validation.md` — pour les contrats côté FE
- `empty-state-by-role.md` — pour le rendu post-création
- BE rule `singleton-lazy-bootstrap.md` — pour les entités singleton
- Mémoire `feedback_user_roles_on_create.md` — pour le pattern `_ensure_default_user_role`
- Rule globale `no-god-code.md` — le service de création reste mince, le helper `_ensure_default_user_role` est partagé
