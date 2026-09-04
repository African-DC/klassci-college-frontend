"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Eye, FileSpreadsheet, FileText, Package, TrendingUp, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataError } from "@/components/shared/DataError"
import { PageHero, heroAccentBtn, heroGlassBtn } from "@/components/shared/PageHero"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AcademicYearScopeBar } from "@/components/shared/AcademicYearScopeBar"
import { LedgerBuckets, SEAU_TOUS } from "@/components/admin/payments/settlement/LedgerBuckets"
import { LedgerEncaisserDialog } from "@/components/admin/payments/settlement/LedgerEncaisserDialog"
import { LedgerFilters } from "@/components/admin/payments/settlement/LedgerFilters"
import { LedgerOverview } from "@/components/admin/payments/settlement/LedgerOverview"
import { LedgerCards, LedgerTable } from "@/components/admin/payments/settlement/LedgerRows"
import { feeCategoryLedgerApi } from "@/lib/api/fee-category-ledger"
import { useClassChoice } from "@/lib/hooks/useClassChoice"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import { useFeeCategories } from "@/lib/hooks/useFees"
import { useFeeCategoryLedger } from "@/lib/hooks/useFeeCategoryLedger"
import { useFeeCategoryOverview } from "@/lib/hooks/useFeeCategoryOverview"
import { useFiltresUrl } from "@/lib/hooks/useFiltresUrl"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { openPdfPreview } from "@/lib/pdf/preview"
import { downloadBlob } from "@/lib/utils"
import {
  LedgerBucketSchema,
  type LedgerBucket,
  type LedgerRow,
} from "@/lib/contracts/fee-category-ledger"

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} F`

/**
 * Les paramètres que cet écran possède dans l'adresse. Constante de module :
 * recréée à chaque rendu, elle ferait recalculer les valeurs sans fin.
 */
const CLES = ["annee", "frais", "classe", "du", "au", "etat", "q"] as const

/**
 * Le seau sur lequel l'écran s'ouvre : celui où il y a quelque chose à faire.
 *
 * Pas le plus rempli — sur une scolarité bien rentrée, ce serait « Soldé », et
 * l'écran ouvrirait sur la liste des gens à ne pas relancer. Un seau explicite
 * dans l'adresse (`etat=tous`) sert à demander la lecture complète.
 */
const SEAU_PAR_DEFAUT = "pending"
const TOUS_DANS_L_URL = "tous"

/**
 * Le point sur une catégorie de frais.
 *
 * L'application regardait un élève, ou une classe. Elle ne savait pas regarder
 * **un frais** — et c'est ce qu'on demande quand un article vient d'un
 * prestataire : combien envoyer au fournisseur, et combien d'articles doivent
 * se retrouver en stock. Sur une scolarité, les mêmes colonnes disent combien
 * est rentré sur le mois et qui n'a pas encore payé.
 *
 * **Ce qui est entré se cloisonne ; ce qui reste dû ne se cloisonne pas.** Une
 * caissière lit ce qu'elle a encaissé : c'est un fait sur sa caisse. Ce qu'une
 * famille doit encore se calcule sur tout l'argent reçu — filtré sur un
 * guichet, il annoncerait une dette chez quelqu'un qui a payé à côté. L'écran
 * le dit, et n'affiche alors aucun impayé plutôt qu'un faux. Le taux, l'attendu
 * et les seaux suivent la même ligne : absents, jamais approchés.
 *
 * **L'état de l'écran vit dans l'adresse.** « Tenue, 6e A, ce mois-ci » s'envoie
 * à un collègue, se met en favori, et le bouton retour défait le dernier filtre
 * au lieu de quitter l'écran.
 *
 * **La vue d'ensemble d'abord, l'action au bout de la ligne.** Tant qu'aucun
 * frais n'est choisi, l'écran répond à la question qui vient avant — quel frais
 * rentre mal — par une carte par catégorie ; cliquer présélectionne le frais
 * dans le filtre, donc dans l'adresse, et ouvre le détail sans quitter l'écran.
 * Et chaque ligne du détail mène quelque part : la fiche de l'élève, et
 * l'encaissement pré-rempli pour qui a le droit de l'enregistrer. Sans cela,
 * l'écran conduisait jusqu'à « voici qui doit encore » et n'offrait plus qu'un
 * fichier — c'est-à-dire une sortie du produit.
 */
export function CategoryLedgerClient() {
  const { valeurs, set } = useFiltresUrl(CLES)

  const {
    academicYearId,
    years,
    isLoading: loadingYears,
  } = useCurrentAcademicYearId(Number(valeurs.annee) || undefined)
  const currentYear = years?.find((y) => y.is_current)

  const { data: categories, isLoading: loadingCategories } = useFeeCategories()
  const categoryId = Number(valeurs.frais) || undefined

  const { classes } = useClassChoice()
  const classId = Number(valeurs.classe) || undefined

  const dateFrom = valeurs.du
  const dateTo = valeurs.au

  // Le tri en seaux est un outil de recouvrement : il se lit sur tout l'argent
  // reçu. Sans ce droit le serveur le refuse en 422 — on ne le demande donc
  // pas, plutôt que d'essuyer une erreur qu'on aurait pu prévoir. Le droit se
  // lit dans la matrice, jamais dans un rôle.
  const { has, isLoading: loadingDroits } = usePermissions()
  const peutTrier = has("payments:read:all")
  // Le même slug que celui exigé par la route d'enregistrement : ce qu'on
  // montre et ce qu'on autorise se disent avec le même mot, écrit une fois.
  const peutEncaisser = has("payments:create")

  // L'adresse se tape à la main et se transmet : elle passe par le contrat,
  // jamais par une assertion. Une valeur inconnue — `tous`, ou un seau retiré
  // du serveur depuis que le lien a été envoyé — vaut « tous les états », ce
  // qui montre plus que demandé mais ne cache rien.
  const seauDemande = valeurs.etat || SEAU_PAR_DEFAUT
  const seauLu = LedgerBucketSchema.safeParse(seauDemande)
  const seau: LedgerBucket | "" = seauLu.success ? seauLu.data : SEAU_TOUS

  const criteres = {
    categoryId,
    academicYearId,
    classId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    state: peutTrier && seau ? seau : undefined,
    q: valeurs.q || undefined,
  }

  const { data, isError, error, refetch, isFetching, scrollInfini } = useFeeCategoryLedger(
    criteres,
    // Tant que les droits ne sont pas connus, on ne demande rien : partir sans
    // le seau puis repartir avec ferait clignoter la liste et le compteur.
    { enabled: !loadingDroits },
  )

  // La vue d'ensemble ne se charge que tant qu'aucun frais n'est choisi : elle
  // répond à « lequel regarder », et cette question ne se pose plus une fois la
  // réponse donnée. Le périmètre est celui du détail — même année, même classe,
  // même période — sans quoi la carte annoncerait un total que le détail
  // qu'elle ouvre ne retrouverait pas.
  const vueEnsemble = useFeeCategoryOverview(
    {
      academicYearId,
      classId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    { enabled: !categoryId && !loadingDroits },
  )

  const [exporting, setExporting] = useState(false)
  const [aEncaisser, setAEncaisser] = useState<LedgerRow | null>(null)

  // `null` tant que le frais ou l'annee manquent : les deux actions se lisent
  // alors comme indisponibles, sans qu'aucune assertion ne promette au type
  // ce que l'ecran n'a pas encore.
  const perimetre =
    categoryId && academicYearId
      ? {
          categoryId,
          academicYearId,
          classId,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }
      : null

  /**
   * Le nom du fichier dit ce que le document couvre.
   *
   * Le serveur nomme bien sa pièce jointe, mais le client ne lit jamais son
   * en-tête : `apiFetchBlob` rend le corps et jette la réponse. Le nom vient
   * donc toujours d'ici, et « point-tenue.pdf » deux fois de suite écrasait le
   * point de septembre par celui d'octobre.
   */
  function nomDuFichier(extension: string) {
    const frais = slug(data?.category_name ?? "categorie")
    const classe = slug(classes.find((c) => c.id === classId)?.name ?? "toutes-classes")
    return `point-${frais}-${classe}-${periode(dateFrom, dateTo)}-${aujourdhui()}.${extension}`
  }

  /**
   * L'aperçu passe par le helper partagé : il ouvre l'onglet **dans** le geste
   * de clic, sans quoi le bloqueur de fenêtres le tue avant que le document
   * n'arrive.
   */
  function apercu() {
    if (!perimetre) return
    void openPdfPreview(() =>
      feeCategoryLedgerApi.export(perimetre, { format: "pdf", inline: true }),
    )
  }

  async function exporter(format: "pdf" | "xlsx") {
    if (!perimetre) return
    setExporting(true)
    try {
      const blob = await feeCategoryLedgerApi.export(perimetre, { format })
      downloadBlob(blob, nomDuFichier(format))
    } catch (err) {
      toast.error("Le document n'a pas pu être exporté", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setExporting(false)
    }
  }

  const kpis = [
    ...(data?.consolide
      ? [
          {
            label: "Taux de recouvrement",
            // Absent, jamais zéro : rien d'attendu n'est pas « rien rentré ».
            value:
              data.taux_recouvrement !== null
                ? `${data.taux_recouvrement.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
                : "—",
            icon: TrendingUp,
            hint:
              data.total_attendu !== null
                ? `Attendu : ${fmt(data.total_attendu)}`
                : "Rien n'est attendu sur ce périmètre",
          },
        ]
      : []),
    {
      label: "Entré en argent",
      value: data ? fmt(data.total_en_argent) : "—",
      icon: Wallet,
      hint: data ? `${data.eleves_en_argent} élèves sur la période` : "Choisissez un frais",
    },
    ...(data?.consolide
      ? [
          {
            label: "Reste à payer",
            value: data.total_restant_du !== null ? fmt(data.total_restant_du) : "—",
            icon: Wallet,
            hint:
              data.eleves_restant_du !== null
                ? `${data.eleves_restant_du} élèves, à aujourd'hui`
                : "à aujourd'hui",
          },
        ]
      : []),
    ...(data?.accepts_in_kind
      ? [
          {
            label: "Déposé en nature",
            value: String(data.depots_en_nature),
            icon: Package,
            // Un depot vaut une ligne de frais remise. Parler de « paquets »
            // promettrait un decompte que la base ne tient pas.
            hint: "dépôts enregistrés sur la période",
          },
        ]
      : []),
  ]

  // Un recalcul en cours ne remplace pas les chiffres par des squelettes : on
  // les grise et on les garde. C'est l'écart entre l'avant et l'après qu'on lit
  // en changeant de seau ou de période, et un squelette l'efface.
  const recalcul = isFetching && !scrollInfini.chargeEnCours
  const listeFiltree = Boolean(criteres.state) || Boolean(criteres.q)
  const total = data?.total_lignes ?? data?.lignes.length ?? 0

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHero
        icon={Wallet}
        title="Point par catégorie de frais"
        subtitle="Ce qui est entré, ce qui a été déposé, et qui doit encore"
        actions={
          <>
            <button type="button" className={heroGlassBtn} onClick={apercu} disabled={!perimetre}>
              <Eye aria-hidden className="mr-1.5 h-4 w-4" />
              Aperçu
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!perimetre || exporting}>
                <button type="button" className={heroAccentBtn}>
                  <Download aria-hidden className="mr-1.5 h-4 w-4" />
                  {exporting ? "Export…" : "Exporter"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exporter("pdf")} className="h-11 sm:h-9">
                  <FileText aria-hidden className="mr-2 h-4 w-4" />
                  Document PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exporter("xlsx")} className="h-11 sm:h-9">
                  <FileSpreadsheet aria-hidden className="mr-2 h-4 w-4" />
                  Classeur Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        kpis={kpis}
      />

      <AcademicYearScopeBar
        years={years}
        selectedYearId={academicYearId}
        onSelect={(id) => set({ annee: id })}
        isLoading={loadingYears}
        selectId="ledger-academic-year"
        currentHelper="Le document porte sur cette année. Une inscription d'un autre exercice n'y figure pas."
        offYearWarning={
          `Ce n'est pas l'année en cours${currentYear ? ` (${currentYear.name})` : ""}. ` +
          "Les totaux ci-dessous ne parlent plus de l'exercice actuel."
        }
      />

      <LedgerFilters
        categories={categories ?? []}
        categoriesLoading={loadingCategories}
        categoryId={categoryId}
        onCategory={(id) => set({ frais: id })}
        classes={classes}
        classId={classId}
        onClass={(id) => set({ classe: id })}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPeriod={({ from, to }) =>
          set({
            ...(from !== undefined && { du: from }),
            ...(to !== undefined && { au: to }),
          })
        }
        recherche={valeurs.q}
        // La frappe ne laisse pas dix entrées d'historique à remonter une par
        // une : elle remplace l'adresse au lieu d'en empiler une nouvelle.
        onRecherche={(q) => set({ q }, { historique: false })}
        // Le seau n'est pas effacé ici : il est visible en permanence dans sa
        // rangée de puces, donc il ne fait pas partie de ce qu'on oublie
        // d'avoir posé. Ce bouton défait ce que le tableau ne montre plus.
        onEffacer={() => set({ classe: "", du: "", au: "", q: "" })}
      />

      {data && !data.consolide && (
        // Dit avant le tableau, pas apres : quelqu'un qui lit les totaux du
        // haut doit savoir tout de suite qu'ils ne couvrent que sa caisse.
        <Card className="border-0 shadow-sm ring-1 ring-amber-500/40">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Ce document ne couvre que votre caisse
            </p>
            <p className="mt-1 text-muted-foreground">
              Il dit ce que vous avez encaissé sur ce frais, et rien de ce qui a été encaissé
              ailleurs. Le reste à payer n'y figure donc pas : le calculer sur une seule caisse
              annoncerait une dette chez des familles qui ont payé à un autre guichet. Le taux de
              recouvrement et le tri par état ne s'affichent pas non plus, pour la même raison.
            </p>
          </CardContent>
        </Card>
      )}

      {!categoryId ? (
        vueEnsemble.isError ? (
          // Le repli, et pas une alarme rouge : les filtres au-dessus marchent
          // toujours, et choisir un frais à la main donne le détail complet. La
          // vue d'ensemble est ce qui évite de deviner, pas ce qui permet de
          // lire.
          <Card className="border-0 shadow-sm ring-1 ring-border">
            <CardContent className="space-y-3 py-10 text-center text-sm text-muted-foreground">
              <p>
                La vue d&apos;ensemble des frais n&apos;a pas pu être chargée. Choisissez une
                catégorie ci-dessus pour voir où en est chaque famille.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-9"
                onClick={() => void vueEnsemble.refetch()}
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <LedgerOverview
            donnees={vueEnsemble.data}
            isLoading={vueEnsemble.isLoading}
            // Choisir une carte ECRIT le filtre visible, donc l'adresse : ce
            // n'est pas une navigation vers un autre écran, c'est une
            // présélection. C'est ce qui rend le bouton retour utile — il
            // ramène à la grille au lieu de quitter le point.
            onChoisir={(id) => set({ frais: id })}
          />
        )
      ) : isError ? (
        <DataError error={error ?? undefined} onRetry={() => refetch()} />
      ) : !data ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <div
          aria-busy={recalcul}
          className={recalcul ? "space-y-3 opacity-60 transition-opacity" : "space-y-3"}
        >
          {data.compteurs && (
            <LedgerBuckets
              compteurs={data.compteurs}
              valeur={seau}
              onChange={(choix) => set({ etat: choix === SEAU_TOUS ? TOUS_DANS_L_URL : choix })}
            />
          )}

          {data.recherche_approchee && (
            <p className="text-xs text-muted-foreground">
              Aucune fiche ne correspond exactement à « {data.recherche || valeurs.q} ». Voici les
              plus proches.
            </p>
          )}

          {data.truncated_from !== null && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Le périmètre compte {data.truncated_from.toLocaleString("fr-FR")} lignes ; seules les
              premières sont consultables. Resserrez la classe ou la période pour lire l'ensemble.
            </p>
          )}

          {listeFiltree && (
            // Le serveur n'accepte ni le seau ni la recherche sur la route
            // d'export : le document porte le périmètre entier. Le taire
            // laisserait croire qu'on exporte la liste qu'on a sous les yeux.
            <p className="text-xs text-muted-foreground">
              Le document exporté couvre le périmètre entier, sans le tri par état ni la recherche.
            </p>
          )}

          {data.lignes.length === 0 ? (
            <Card className="border-0 shadow-sm ring-1 ring-border">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {listeFiltree
                  ? "Aucun élève de ce périmètre ne correspond à ce tri."
                  : "Aucune inscription ne porte ce frais sur ce périmètre."}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="hidden md:block">
                <LedgerTable
                  ledger={data}
                  onEncaisser={peutEncaisser ? setAEncaisser : undefined}
                />
              </div>
              <div className="md:hidden">
                <LedgerCards
                  ledger={data}
                  onEncaisser={peutEncaisser ? setAEncaisser : undefined}
                />
              </div>
            </>
          )}

          {data.lignes.length > 0 && (
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
              <p>
                {data.lignes.length.toLocaleString("fr-FR")} ligne
                {data.lignes.length > 1 ? "s" : ""} affichée
                {data.lignes.length > 1 ? "s" : ""} sur {total.toLocaleString("fr-FR")}
                {data.eleves_sans_ligne !== undefined && data.eleves_sans_ligne > 0 && (
                  <>
                    {" · "}
                    {data.eleves_sans_ligne.toLocaleString("fr-FR")} inscription
                    {data.eleves_sans_ligne > 1 ? "s" : ""} du périmètre ne porte
                    {data.eleves_sans_ligne > 1 ? "nt" : ""} pas ce frais
                  </>
                )}
              </p>
              {scrollInfini.resteAcharger && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 sm:h-9"
                  onClick={scrollInfini.chargerSuite}
                  disabled={scrollInfini.chargeEnCours}
                >
                  {scrollInfini.chargeEnCours ? "Chargement…" : "Charger plus"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Monté seulement quand une ligne est choisie : la fenêtre part alors de
          l'inscription EXACTE de cette ligne, et sa saisie meurt avec elle.
          Gardée montée, elle rouvrirait sur le montant tapé pour la famille
          précédente. */}
      {aEncaisser && data && (
        <LedgerEncaisserDialog
          open
          ligne={aEncaisser}
          categorie={data.category_name}
          onClose={() => setAEncaisser(null)}
        />
      )}
    </div>
  )
}

/** `Tenue de sport` devient `tenue-de-sport` — lisible dans un dossier. */
function slug(texte: string): string {
  return (
    texte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "sans-nom"
  )
}

/** Ce que le document couvre, dit dans son nom plutôt que deviné. */
function periode(du: string, au: string): string {
  if (du && au) return `${du}_${au}`
  if (du) return `depuis-${du}`
  if (au) return `jusquau-${au}`
  return "annee-complete"
}

function aujourdhui(): string {
  const maintenant = new Date()
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0")
  const quantieme = String(maintenant.getDate()).padStart(2, "0")
  return `${maintenant.getFullYear()}-${mois}-${quantieme}`
}
