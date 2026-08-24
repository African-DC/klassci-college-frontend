# Premium Design System — KLASSCI College (shadcn/ui + Tailwind)

## Quand s'active

Cette rule s'active **dès qu'on crée ou redesign une page, un composant, un
modal ou un sous‑élément** dans `klassci-frontend` (Next.js + shadcn/ui +
Tailwind). Elle régit l'identité visuelle de bout en bout : du hero d'en‑tête
jusqu'au plus petit bouton imbriqué, **sur les 10 couches de profondeur**.

> Différence avec KLASSCIv2 (`premium-redesign.md`, supérieur) : KLASSCIv2 est
> **monochrome bleu** (2 couleurs). **KLASSCI College est bi‑chromatique
> bleu + orange** : l'orange du logo (#F58220, le « K ») doit *ressortir*,
> mais avec discipline (1 point focal orange par contexte, jamais l'arc‑en‑ciel).

---

## 1. La marque : bleu + orange + blanc

### Tokens (déjà dans `app/globals.css`, ne pas hardcoder)

| Token | Hex | Rôle |
|---|---|---|
| `--primary` | `#0F3F8C` | Bleu KLASSCI — structure, navigation, actions par défaut, texte fort |
| `--accent` | `#F58220` | **Orange KLASSCI — accent focal** (la chose à regarder/cliquer) |
| `--muted` / `--card` / `--border` | — | Surfaces et profondeur |
| `--background` / `--foreground` | — | Fond de page / texte |

### Le dégradé bi-marque du hero (signature)

Le hero glisse du **bleu** (titre, à gauche) vers **l'orange du logo** (coin bas-droite) :
les DEUX couleurs de la marque dans le fond du hero.
```
bg-[linear-gradient(135deg,#0a3d8f_0%,#0453cb_42%,#2a69cb_56%,#f5821f_92%)]
```
Le titre et les actions restent sur la zone bleue (haut). L'orange occupe le coin
bas-droite (derrière les derniers KPIs) → l'orange se voit dans le fond, pas juste
sur un bouton. Réservé au `PageHero`.

### Couleurs sémantiques (statut uniquement, jamais décoratif)

| Token Tailwind | Sens |
|---|---|
| `emerald-600` / `emerald-500` | Succès, payé, validé, présent |
| `amber-500` / `amber-600` | Alerte, en attente, à surveiller |
| `destructive` / `rose-600` | Erreur, impayé, rejeté, suppression |

**Règle d'or couleur** : si la couleur porte une info que l'œil doit capter en
< 1 s (statut, alerte, action focale), elle est autorisée. Sinon → bleu/neutre.

### Le rôle de l'orange (à respecter absolument)

L'orange `accent` = **l'accent focal, UN par contexte** : l'élément le plus
important à regarder ou cliquer dans une zone donnée. Exemples corrects :

- Repère de l'item de menu **actif** (barre orange).
- Le **CTA principal** d'un hero ou d'une carte (1 bouton orange max par carte).
- La **métrique clé** d'un bandeau (« Reste à payer », le solde).
- Un **onglet/chip sélectionné**, un **état actif**.
- Le **dot focal** d'une liste (l'élément qui requiert une action).

❌ **Interdit** : colorer chaque KPI d'une couleur différente, des catégories
neutres en orange « pour décorer », plusieurs oranges concurrents dans la même
carte (le focal se dilue). Voir anti‑patterns § 6.

---

## 2. La signature : `PageHero` (Couche 1)

**Toute page listing/dashboard commence par `<PageHero>`** (`components/shared/PageHero.tsx`).
Ne jamais réinventer un en‑tête. Les **formulaires (create/edit)** n'ont **pas**
de hero : ils utilisent l'en‑tête standard (icône `bg-primary` + titre).

Structure :
- **Dégradé bleu→orange** (les 2 couleurs du logo), texte blanc, icône en pastille verre.
- L'orange est présent **dans le fond** (coin bas-droite) ET sur le **CTA focal** (`heroAccentBtn`,
  orange + ring blanc pour rester net sur la zone orange).
- **KPIs intégrés dans le hero** en cartes verre blanches (`bg-white/10 border-white/15`),
  monochrome blanc (jamais une couleur par KPI). Layout d'une carte KPI :
  **label petit en haut** (`text-[11px] uppercase text-white/65`) + icône discrète à
  droite, **grande valeur en dessous** (`text-2xl font-bold`), hint optionnel.
  Hero compact (`p-5 sm:p-6`, KPIs `mt-4`). La valeur clé peut passer en orange si focale.

```tsx
<PageHero
  icon={Wallet}
  title="Frais scolaires"
  subtitle="Configuration des frais par niveau"
  actions={
    <>
      <button className={heroGlassBtn}>Nouvelle variante</button>
      <button className={heroAccentBtn}>Nouvelle catégorie</button>  {/* orange focal */}
    </>
  }
  kpis={[ { label: "Obligatoires", value: 5, icon: Shield }, /* … */ ]}
/>
```

Boutons du hero (exports de `PageHero.tsx`) :
- `heroAccentBtn` — **orange plein** (`bg-accent text-accent-foreground`) : l'action focale.
- `heroPrimaryBtn` — blanc plein (texte bleu) : action principale alternative.
- `heroGlassBtn` — verre (`bg-white/15 border-white/25`) : actions secondaires.

Autres exports partagés de `PageHero.tsx` :
- `SectionTitle` (couche 4) — titre de sous-section avec icône carrée au dégradé bleu.
- `premiumCardHover` — hover premium des cartes (couches 2-3) : `-translate-y-0.5` +
  ombre bleue `shadow-[0_10px_30px_-12px_rgba(4,83,203,0.35)]`. À ajouter sur toute
  carte survolable/cliquable.

---

## 3. Système de profondeur — les 10 couches

**Principe** : la page est lisible jusqu'à 10 niveaux d'imbrication parce que
chaque couche **alterne son élévation** (surélevée ↔ encaissée), **réduit son
rayon et son padding**, et **n'introduit la couleur que par sémantique ou par
le focal orange**. Une carte dans une carte dans une carte reste lisible.

| # | Couche | Surface (tokens, clair+sombre) | Bordure | Radius | Ombre | Padding | Primitive shadcn | Couleur |
|---|--------|-------------------------------|---------|--------|-------|---------|------------------|---------|
| 0 | Page | `bg-background` | — | — | — | `space-y-6 p-4 md:p-6` | layout | — |
| 1 | **Hero** | dégradé bleu, `text-white` | — | `rounded-2xl` | `shadow-sm` | `PageHero` | **1 orange focal** |
| 2 | **Section card** | `bg-card` | `border` | `rounded-xl` | `shadow-sm` | `Card` | titre bleu + 1 action |
| 3 | **Sub-card** (carte dans carte) | `bg-muted/40` | `border-border/60` | `rounded-lg` | — | `p-4` | `Card`/`div` | — |
| 4 | **Section-bar** (en‑tête interne) | section-icon dégradé + titre | `border-b` | — | — | `pb-3` | `CardHeader` | icône dégradé **orange** |
| 5 | **Row / list item** | `bg-background`, hover `bg-muted/50` | `border-b last:border-0` | — | — | `px-3 py-2.5` | `TableRow` / `div` | statut (badge) |
| 6 | **Inline group** (groupe dans une ligne) | `bg-muted/60` | `border` | `rounded-md` | — | `p-2` | `div` | — |
| 7 | **Control** (input/select) | `bg-background` | `border-input` | `rounded-md` | — | `h-9 px-3` | `Input`/`Select` | ring `--ring` au focus |
| 8 | **Button** | primary `bg-primary` / `outline` / `ghost` ; **focal = `bg-accent`** | — | `rounded-md` | `shadow-sm` | `h-9 px-3.5` | `Button` | **orange = CTA focal** |
| 9 | **Chip / badge** (dans un bouton/contrôle) | `Badge` (`secondary` ou tone sémantique) | — | `rounded-full`/`rounded` | — | `px-2 py-0.5` | `Badge` | statut |
| 10 | **Micro** (dot, helper, icône) | `text-muted-foreground` ; dot focal `bg-accent` | — | `rounded-full` | — | — | `span`/`svg` | dot orange = focal |

### Règle d'alternance d'élévation (la clé de la lisibilité 10 couches)

```
Couche paire profonde  → ENCAISSÉE : bg-muted/40 → /50 → /60 (de plus en plus)
Couche impaire         → SURÉLEVÉE  : bg-card / bg-background + border + shadow-sm
```
À chaque niveau plus profond : `rounded` d'un cran plus petit
(`2xl → xl → lg → md`), `padding` d'un cran plus petit (`p-6 → p-5 → p-4 → p-3 → p-2`),
opacité de surface qui monte. Jamais deux `bg-card` adjacents sans séparation
(sinon les cartes fusionnent visuellement).

### Recette « bouton dans une carte dans une carte » (couches 2→3→8)

```tsx
<Card className="border shadow-sm rounded-xl">                 {/* couche 2 */}
  <CardContent className="p-5 space-y-4">
    <div className="rounded-lg border border-border/60 bg-muted/40 p-4">  {/* couche 3 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Détail du frais</p>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
          Encaisser                                            {/* couche 8 — CTA focal orange */}
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

### Section-bar interne (couche 4) — section-icon dégradé

L'icône de section est au **dégradé orange** (l'orange de la marque, qui se diffuse
ainsi sur chaque sous-section de la page, pas seulement dans le hero) :
```tsx
<div className="flex items-center gap-2.5 border-b pb-3">
  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
    <Icon className="h-4 w-4" />
  </span>
  <h2 className="text-sm font-semibold">Montants par niveau</h2>
</div>
```

---

## 4. Composants shadcn par couche (ne rien recréer)

| Besoin | Composant shadcn | Jamais |
|---|---|---|
| Carte (couches 2,3) | `Card`, `CardHeader`, `CardContent` | un `<div>` custom avec ombre maison |
| Bouton (couche 8) | `Button` (variantes `default`/`outline`/`ghost`/`secondary`) | `<button>` brut stylé à la main |
| Statut (couche 9) | `Badge` | un span coloré ad hoc |
| Champ (couche 7) | `Input`, `Select`, `Textarea`, `Checkbox`, `Switch` | `<select>` natif |
| Onglets | `Tabs` | des liens custom |
| Tableau (couche 5) | `Table`, `TableRow`, `TableCell` | une grille CSS maison |
| Dialog/confirm | `Dialog`, `AlertDialog` | `window.confirm`/`alert` |
| Progression | `Progress` | une barre `<div>` maison |
| Avatar | `Avatar` + `AvatarFallback` | `<img>` sans fallback 404‑safe |
| Skeleton | `Skeleton` | un spinner global |

Customisation **uniquement via Tailwind** (className), jamais en réécrivant le
composant `components/ui/*`.

---

## 5. Dark / light (non négociable)

- **Tout** via tokens (`bg-card`, `bg-muted`, `text-foreground`, `border`,
  `bg-primary`, `bg-accent`) ou variantes `emerald-600 dark:emerald-400`.
- Aucune couleur claire en dur (`bg-blue-50`, `bg-rose-50`, `text-blue-600`…) :
  cassée en sombre.
- Le hero (dégradé bleu + texte blanc) est **identique** dans les 2 thèmes — c'est
  un bandeau coloré, c'est voulu.
- Vérifier chaque livrable en **clair ET sombre** (toggle thème) avant de merger.

---

## 6. Anti‑patterns à bloquer en review

1. ❌ KPIs/cartes avec **une couleur différente par item** (bleu/orange/vert/rouge décoratif) → tout en bleu/neutre, l'orange réservé au focal.
2. ❌ **Plusieurs oranges** concurrents dans la même carte → 1 focal orange max.
3. ❌ Orange sur une **catégorie neutre** « pour décorer » (ex : type de frais) → tons bleus par opacité ou neutre.
4. ❌ **Hero sur un formulaire** create/edit → en‑tête standard seulement.
5. ❌ **Deux `bg-card` adjacents** sans bordure/élévation distincte → ils fusionnent ; alterner encaissé/surélevé.
6. ❌ Couleur claire **hardcodée** (`bg-blue-50`…) → tokens, sinon dark cassé.
7. ❌ Recréer un `Button`/`Card`/`Badge` à la main → shadcn.
8. ❌ Profondeur sans réduction de `radius`/`padding` → les couches deviennent illisibles.
9. ❌ `window.confirm`/`alert` → `AlertDialog`.
10. ❌ Tiret long `—` en français, accents manquants, contenu UI en anglais.

---

## 7. Checklist avant de livrer une page

- [ ] Page démarre par `<PageHero>` (listing/dashboard) **avec 1 accent orange focal**.
- [ ] KPIs intégrés au hero, en cartes verre monochrome.
- [ ] Chaque couche imbriquée alterne élévation + réduit radius/padding (lisible jusqu'à 10).
- [ ] Orange = focal uniquement (1 par contexte) ; statut = sémantique ; reste = bleu/neutre.
- [ ] Tous les composants sont des primitives shadcn (className Tailwind).
- [ ] Rendu vérifié en **clair ET sombre**.
- [ ] Touch targets `h-11` sur mobile (persona Mme Diallo, cf. `ux-target-user-reality.md`).
- [ ] États gérés : loading (Skeleton), empty (par rôle), error, success (toast).
- [ ] Français propre, pas de tiret long, accents corrects.

---

## 8. Références canoniques

- `components/shared/PageHero.tsx` — hero signature (dégradé + KPIs + boutons orange/verre).
- `components/shared/fees/FeeSummaryHero.tsx` — bandeau bleu + « Reste à payer » orange focal.
- KLASSCIv2 `premium-redesign.md` — l'ancêtre monochrome (supérieur), à **adapter** ici (ajout orange).
- `ux-target-user-reality.md`, `redesign-premium.md`, `components.md` — persona + patterns.
- Rule globale `~/.claude/rules/marcel-global-preferences.md` — no AI slop, mobile‑first.
