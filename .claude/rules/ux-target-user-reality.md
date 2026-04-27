# Rule: UX Target User Reality — Mme Diallo, pas Linear

## Quand s'active

Cette rule s'active automatiquement quand :
- Je conçois ou redesign une feature UI/UX
- Je choisis une lib (table, grid, datepicker, autocomplete...)
- Je benchmark contre PowerSchool / Notion / Linear / Airtable / Google Sheets
- Je valide un design en plan-and-confirm
- Je rejette ou j'accepte un pattern proposé par un agent

## Principe fondamental

**Avant de designer, je construis un portrait CONCRET de l'user, pas du produit.**

Le persona principal de KLASSCI College :

> **Mme Diallo, 52 ans**
> - Prof de maths au lycée Saint-Augustin de Yamoussoukro
> - 4 classes × 40 élèves × 5 évaluations/trimestre = 800 notes à saisir
> - **Itel S661** (Android entry-level), **Chrome Android**, écran 5.5" TFT
> - 3G/4G aléatoire, coupures électriques 3×/sem
> - Prépare ses notes **sur PAPIER** en corrigeant les copies
> - **N'a JAMAIS ouvert Excel** de sa vie
> - N'a jamais utilisé un gradebook digital
> - Pas de laptop personnel

Tout pattern UX doit passer le **test de Mme Diallo** :

1. "Mme Diallo, papier en main, peut-elle le faire sans aucune formation ?"
2. "Combien de tap/click pour sa tâche la plus fréquente ?"
3. "Est-ce que ça marche en 3G avec un drop intermittent ?"
4. "Est-ce que ça marche en plein soleil sur écran TFT entry-level ?"

Si la réponse est non à un seul → **recommencer le design**.

## Segmentation des personas

| Type | % | Profil | Implications design |
|------|---|--------|---------------------|
| **A** Tech-savvy 30+ | ~30% | Excel, laptop, WhatsApp Business | Power features (paste, 2D grid, keyboard shortcuts) |
| **B** Papier 50+ | ~50% | Phone-only, paper-based, voice-comfortable | Single-action screens, large targets, voice input |
| **C** Délégant | ~20% | N'utilise pas l'app, donne au secrétariat | Admin delegation flows |

**Designer pour A en P0 = ignorer 70% de la base.** P0 doit servir B et C en priorité.
A peut être servi en P1/v1.1 (les Type A ont des workarounds existants — ils restent en Excel).

## Référence visuelle / UX

### À copier
- ✓ **Wave Mobile Money** — une action par écran, gros boutons, friction zéro, voice optionnel
- ✓ **Orange Money / MTN MoMo** — mobile-natif, low-cognitive-load
- ✓ **WhatsApp** — chat-style, minimaliste, low-bandwidth-tolerant

### À éviter
- ✗ **PowerSchool / Skyward / Infinite Campus** — desktop-first US, $50/élève/an, optimisés pour IT directors
- ✗ **Notion / Linear / Airtable** — knowledge workers, claviers complets, Cmd+K
- ✗ **Google Sheets / Excel** — les profs Type B les ÉVITENT, ce ne sont pas des références à imiter

## Anti-patterns à bloquer en review

1. **"Spreadsheet UX / Excel-style nav"** comme P0 quand Type B est majorité
2. **"Tab → next, Enter → down"** comme primitive *obligatoire* (muscle memory absent chez 70% des profs CI)
3. **ReactGrid / AG Grid / Handsontable** intégrés AVANT d'avoir validé que c'est utile pour Type B
4. **"Bulk paste from Excel"** comme P0 si <50% des users utilisent Excel
5. **"Responsive design"** qui adapte un layout desktop pour mobile (vs design mobile-first vrai)
6. **"Color-only feedback"** (a11y daltonisme + faible luminosité écran entry-level + plein soleil)
7. **"Auto-save toutes les 30s"** qui peut perdre 30s sur tab close — préférer debounce 1500ms
8. **Modals empilées** sur écran 5.5" (overwhelm cognitif)
9. **"Suppose Wi-Fi stable"** — toujours design pour 3G + drops + offline queue + localStorage fallback
10. **Implémenter X parce que "PowerSchool fait X"** sans vérifier que X sert le persona principal

## Web Speech API — sous-utilisée, transformative

Native sur Chrome Android, **gratuit**, supporte français, ~95% précision sur chiffres prononcés ("douze", "douze virgule cinq", "absent"). Permet :

- **Saisie sans regarder l'écran** pendant que la prof lit sa feuille papier (5× plus rapide qu'au tactile)
- Inclusif (mauvaises mains, fatigue après 4h de cours, stress fin de trimestre)
- **Off-line** possible (Android 12+)

**Fallback obligatoire** : keyboard input toujours visible. Voice est une OPTION, pas une obligation.

## Le breakthrough du 2026-04-26 (gradebook entry)

Plan v3 ambitieux : ReactGrid 2D + Excel paste + AG Grid + keyboard nav Excel-style. Servait Type A (30%).

**Plan v4 retenu** : Mode dictée plein écran (voice + touch, séquentiel élève-par-élève) + linear list amélioré + admin delegation. Sert Type B (70%) en P0, Type C par réutilisation, Type A en v1.1.

Le glissement venait de "tuer Excel" interprété comme "faire un meilleur Excel" alors que c'était "permettre aux profs qui n'utilisent PAS Excel de saisir leurs notes facilement". Cible inverse.

**Le test qui a tout changé** : "Mme Diallo, 52, Itel S661, peut-elle utiliser ReactGrid 2D 50×15 sans formation ?" → Non. → Plan v3 rejeté.

## Voir aussi

- Mémoire : `feedback_persona_first_design.md`
- KLASSCI scope : ce repo = collège/lycée. KLASSCIv2 = supérieur (autre persona, autre rule).
- `klassci-frontend/.claude/rules/components.md` — règles techniques composants
- `~/.claude/rules/marcel-global-preferences.md` — "no AI slop, mobile-first, French content"
