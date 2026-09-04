"use client"

import { ChevronRight, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ETATS } from "@/components/admin/payments/settlement/LedgerRows"
import { cn } from "@/lib/utils"
import type { LedgerStatus } from "@/lib/contracts/fee-category-ledger"
import type { FeeCategoryOverview, OverviewCategory } from "@/lib/contracts/fee-category-overview"

/**
 * Un montant, ou l'aveu qu'on ne le connaît pas.
 *
 * `null` n'est pas zéro : c'est de l'argent encaissé, et un « 0 F » affiché
 * à la place se lirait comme « rien n'est rentré » — sur une carte que la
 * comptable lit pour décider quoi relancer.
 */
const fmt = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("fr-FR")} F`)

/**
 * Les trois seaux que la carte résume, dans l'ordre du recouvrement : ce sur
 * quoi il y a quelque chose à faire vient en premier. Ce sont les seaux du
 * tableau, avec les mêmes mots et les mêmes couleurs — deux vocabulaires pour
 * les mêmes états feraient croire à deux classements.
 */
const SEAUX_RESUMES: LedgerStatus[] = ["pending", "partial", "paid"]

/**
 * La couleur de la barre suit le seuil, et double la lecture du chiffre : sur
 * une grille de dix cartes, c'est elle qui fait ressortir le frais qui rentre
 * mal avant qu'on ait lu un seul pourcentage.
 */
function ton(taux: number): { barre: string; texte: string } {
  if (taux >= 80) {
    return {
      barre: "[&>*]:bg-emerald-500",
      texte: "text-emerald-700 dark:text-emerald-400",
    }
  }
  if (taux >= 50) {
    return {
      barre: "[&>*]:bg-amber-500",
      texte: "text-amber-700 dark:text-amber-400",
    }
  }
  return {
    barre: "[&>*]:bg-rose-500",
    texte: "text-rose-700 dark:text-rose-400",
  }
}

/**
 * La vue d'ensemble : une carte par catégorie de frais, avant d'en choisir une.
 *
 * **La question qui vient d'abord est « quel frais rentre mal ».** L'écran ne
 * savait y répondre qu'en ouvrant les catégories une par une : il fallait déjà
 * savoir laquelle allait mal pour la trouver. Chaque carte porte donc le taux,
 * les trois compteurs et « entré / attendu », et les cartes sont rangées du
 * moins bien rentré au mieux — c'est l'ordre de la relance.
 *
 * **Cliquer présélectionne, ce n'est pas une navigation.** La carte écrit la
 * catégorie dans le filtre visible, donc dans l'adresse : le détail s'ouvre en
 * dessous, le lien reste partageable, et le bouton retour ramène à la grille au
 * lieu de quitter l'écran. C'est un `<button>`, jamais un `<div>` cliquable :
 * sans cela ni le clavier ni un lecteur d'écran n'atteint la carte.
 *
 * **Pour une caissière, la carte dit ce qu'elle sait.** Le taux, l'attendu et
 * les compteurs se lisent sur tout l'argent reçu ; sans ce droit ils sont
 * absents, jamais approchés. La carte montre alors ce qu'elle a encaissé sur
 * chaque frais — un fait sur sa caisse — et l'écran dit pourquoi le reste
 * manque, plutôt que d'afficher une grille de tirets qui se lirait comme une
 * panne.
 */
export function LedgerOverview({
  donnees,
  isLoading,
  onChoisir,
}: {
  donnees: FeeCategoryOverview | undefined
  isLoading: boolean
  onChoisir: (categoryId: number) => void
}) {
  if (isLoading && !donnees) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!donnees) return null

  if (donnees.categories.length === 0) {
    return (
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Aucune catégorie de frais n&apos;est configurée sur cette année.
        </CardContent>
      </Card>
    )
  }

  // Le moins bien rentré d'abord : c'est ce qu'on vient chercher. Une copie,
  // parce que `sort` trie sur place et que la réponse est celle du cache.
  // Un taux absent (caissière, ou rien d'attendu) ne se compare à rien : ces
  // cartes vont à la fin plutôt que de passer pour les pires.
  const cartes = [...donnees.categories].sort((a, b) => {
    if (a.taux_recouvrement === null && b.taux_recouvrement === null)
      return a.category_name.localeCompare(b.category_name, "fr")
    if (a.taux_recouvrement === null) return 1
    if (b.taux_recouvrement === null) return -1
    return a.taux_recouvrement - b.taux_recouvrement
  })

  return (
    <section className="space-y-3" aria-labelledby="ledger-vue-ensemble">
      <div className="flex flex-col gap-1">
        <h2 id="ledger-vue-ensemble" className="text-sm font-semibold tracking-tight">
          Où en est chaque frais
        </h2>
        <p className="text-xs text-muted-foreground">
          {donnees.consolide
            ? "Choisissez un frais pour voir qui doit encore, famille par famille."
            : "Voici ce que vous avez encaissé sur chaque frais. Le taux de recouvrement et " +
              "l'attendu se calculent sur tout l'argent reçu : lus depuis une seule caisse, ils " +
              "annonceraient une dette chez des familles qui ont payé à un autre guichet. Ils " +
              "ne sont donc pas affichés."}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cartes.map((categorie) => (
          <li key={categorie.category_id}>
            <CarteCategorie
              categorie={categorie}
              consolide={donnees.consolide}
              onChoisir={onChoisir}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CarteCategorie({
  categorie,
  consolide,
  onChoisir,
}: {
  categorie: OverviewCategory
  /** Faux, le montant affiché est celui de la seule caisse qui lit — la carte le dit. */
  consolide: boolean
  onChoisir: (categoryId: number) => void
}) {
  const taux = categorie.taux_recouvrement
  const couleurs = taux !== null ? ton(taux) : null
  const compteurs = categorie.compteurs
  // Le chiffre porte son sujet sur la carte elle-même. Une grille se survole,
  // et une phrase d'en-tête lue une fois ne suit pas la carte qu'on compare
  // trois lignes plus bas.
  const legende = consolide ? "entré sur ce frais" : "entré par vous sur ce frais"

  return (
    <button
      type="button"
      onClick={() => onChoisir(categorie.category_id)}
      aria-label={
        taux !== null
          ? `${categorie.category_name} : ${arrondi(taux)} % recouvré. Ouvrir le détail.`
          : `${categorie.category_name} : ${fmt(categorie.total_en_argent)} ${legende}. Ouvrir le détail.`
      }
      className={cn(
        "group flex h-full w-full flex-col gap-3 rounded-xl bg-card p-4 text-left shadow-sm ring-1 ring-border",
        "transition-colors hover:bg-muted/40 hover:ring-primary/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{categorie.category_name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            {!categorie.is_mandatory && (
              <span className="rounded-full border border-border px-1.5 py-0.5">Facultatif</span>
            )}
            {categorie.accepts_in_kind && categorie.depots_en_nature !== null && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5">
                <Package aria-hidden className="h-3 w-3" />
                {(categorie.depots_en_nature ?? 0).toLocaleString("fr-FR")} dépôt
                {(categorie.depots_en_nature ?? 0) > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          aria-hidden
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </div>

      {taux !== null ? (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn("text-2xl font-bold tabular-nums leading-none", couleurs?.texte)}>
              {arrondi(taux)} %
            </span>
            <span className="text-[11px] text-muted-foreground">recouvré</span>
          </div>
          <Progress value={borne(taux)} className={cn("h-1.5", couleurs?.barre)} />
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {fmt(categorie.total_en_argent)}
            {categorie.total_attendu !== null ? ` / ${fmt(categorie.total_attendu)}` : ""}
          </p>
        </div>
      ) : (
        // Absent, jamais approché : sans le droit de lire toutes les caisses, ce
        // qui est entré ici est un fait, le taux ne le serait pas. La carte dit
        // donc le fait, et l'en-tête de la grille dit pourquoi le reste manque.
        <div className="space-y-1">
          <p className="text-2xl font-bold tabular-nums leading-none">
            {fmt(categorie.total_en_argent)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {categorie.total_attendu !== null
              ? `Attendu : ${fmt(categorie.total_attendu)}`
              : legende}
          </p>
        </div>
      )}

      {compteurs && (
        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          {SEAUX_RESUMES.map((etat) => (
            <div key={etat} className="flex items-center gap-1">
              <dt className="text-muted-foreground">{ETATS[etat].label}</dt>
              <dd className="font-semibold tabular-nums">
                {(compteurs[etat] ?? 0).toLocaleString("fr-FR")}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Sur un frais FACULTATIF, des inscriptions sans ligne sont le
          fonctionnement attendu et non un signal : le serveur rend
          `is_mandatory` exactement pour cette distinction. */}
      {categorie.is_mandatory &&
        categorie.eleves_sans_ligne !== null &&
        categorie.eleves_sans_ligne > 0 && (
          <p className="mt-auto text-[11px] text-muted-foreground">
            {categorie.eleves_sans_ligne.toLocaleString("fr-FR")} inscription
            {categorie.eleves_sans_ligne > 1 ? "s" : ""} du périmètre ne porte
            {categorie.eleves_sans_ligne > 1 ? "nt" : ""} pas ce frais
          </p>
        )}
    </button>
  )
}

/** Un taux s'affiche à la décimale près, jamais arrondi pour décider de quoi que ce soit. */
function arrondi(taux: number): string {
  return taux.toLocaleString("fr-FR", { maximumFractionDigits: 1 })
}

/** La barre ne dépasse pas sa piste : un trop-perçu se lit sur le chiffre, pas dessus. */
function borne(taux: number): number {
  return Math.max(0, Math.min(100, taux))
}
