"use client"

import { Search, X, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ALL_PAYMENT_METHODS, paymentMethodLabel } from "@/lib/payment-methods"
import type { PaymentFiltersControls } from "@/lib/hooks/usePaymentFilters"
import type { PaymentMethod, PaymentStatus } from "@/lib/contracts/payment"
import type { FeeCategory } from "@/lib/contracts/fee"

interface PaymentsFiltersProps extends Pick<PaymentFiltersControls, "filters" | "set" | "reset" | "activeCount"> {
  feeCategories?: FeeCategory[]
  cashiers?: { id: number; name: string }[]
  /** Un guichet unique n'a personne à distinguer : le filtre disparaît. */
  showCashier: boolean
}

/**
 * La barre de filtres du journal des versements.
 *
 * Purement présentative : tout l'état vit dans `usePaymentFilters`, ce qui
 * permet à la page de construire ses paramètres serveur sans connaître la
 * disposition des champs, et à cette barre de changer de forme sans toucher
 * à la requête.
 */
export function PaymentsFilters({
  filters,
  set,
  reset,
  activeCount,
  feeCategories,
  cashiers,
  showCashier,
}: PaymentsFiltersProps) {
  return (
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par élève, référence..."
                value={filters.search}
                onChange={(e) => set("search", e.target.value)}
                className="h-10 pl-9 pr-9"
              />
              {filters.search && (
                <button
                  onClick={() => set("search", "")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtres rapides */}
            <Select
              value={filters.status ?? "all"}
              onValueChange={(v) => set("status", v === "all" ? undefined : (v as PaymentStatus))}
            >
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Validé</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.method ?? "all"}
              onValueChange={(v) => set("method", v === "all" ? undefined : (v as PaymentMethod))}
            >
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue placeholder="Méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes méthodes</SelectItem>
                {/* Le filtre porte sur l'historique, valeur « Mobile Money »
                    comprise : sans elle, une école ne retrouverait plus les
                    versements enregistrés avant la distinction des opérateurs. */}
                {ALL_PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {paymentMethodLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre catégorie de frais */}
            <Select
              value={filters.category ?? "all"}
              onValueChange={(v) => set("category", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {feeCategories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre encaisseur — la question de fond d'une caisse d'école */}
            {showCashier && (
              <Select
                value={filters.cashier ?? "all"}
                onValueChange={(v) => set("cashier", v === "all" ? undefined : v)}
              >
                <SelectTrigger className="w-[170px] h-10" aria-label="Filtrer par encaisseur">
                  <SelectValue placeholder="Encaissé par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les caisses</SelectItem>
                  {cashiers?.map((cashier) => (
                    <SelectItem key={cashier.id} value={cashier.id.toString()}>
                      {cashier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={reset} className="h-10 text-xs text-muted-foreground">
                <X className="mr-1 h-3 w-3" />
                Réinitialiser ({activeCount})
              </Button>
            )}
          </div>

          {/* Date range filter */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground shrink-0">Période :</span>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => set("dateFrom", e.target.value)}
              className="h-8 w-[8.75rem] min-w-0 max-w-full flex-1 text-xs sm:flex-none"
              placeholder="Du"
            />
            <span className="text-xs text-muted-foreground">au</span>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => set("dateTo", e.target.value)}
              className="h-8 w-[8.75rem] min-w-0 max-w-full flex-1 text-xs sm:flex-none"
              placeholder="Au"
            />
            {(filters.dateFrom || filters.dateTo) && (
              <button
                onClick={() => { set("dateFrom", ""); set("dateTo", "") }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
  )
}
