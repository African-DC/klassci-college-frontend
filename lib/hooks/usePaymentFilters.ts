"use client"

import { useMemo, useState } from "react"
import { useDebounce } from "@/lib/hooks/useDebounce"
import type { PaymentListParams, PaymentMethod, PaymentStatus } from "@/lib/contracts/payment"

/** L'état des sept filtres du journal des versements, en un seul objet. */
export interface PaymentFilters {
  search: string
  status?: PaymentStatus
  method?: PaymentMethod
  category?: string
  cashier?: string
  dateFrom: string
  dateTo: string
}

const EMPTY: PaymentFilters = { search: "", dateFrom: "", dateTo: "" }

/**
 * Les filtres du journal, et ce que le serveur doit en recevoir.
 *
 * Ils vivaient en sept `useState` dans la page, avec la construction des
 * paramètres, le compte des filtres actifs et la réinitialisation dispersés
 * autour. Réunis ici, ils forment un seul état cohérent : ajouter un filtre
 * demande une clé, pas quatre modifications à quatre endroits.
 *
 * La période part au serveur : la filtrer dans le navigateur ne trierait que
 * la page affichée, et l'export qui suit ne dirait pas la même chose que
 * l'écran.
 *
 * L'année scolaire n'est pas ici : c'est le périmètre de la page, pas un
 * filtre qu'on réinitialise. Elle vit à côté, comme sur l'écran des frais.
 */
export function usePaymentFilters() {
  const [filters, setFilters] = useState<PaymentFilters>(EMPTY)
  const debouncedSearch = useDebounce(filters.search)

  const params = useMemo<PaymentListParams>(
    () => ({
      ...(filters.status && { status: filters.status }),
      ...(filters.method && { method: filters.method }),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filters.category && { fee_category_id: Number(filters.category) }),
      ...(filters.cashier && { received_by: Number(filters.cashier) }),
      ...(filters.dateFrom && { date_from: `${filters.dateFrom}T00:00:00` }),
      ...(filters.dateTo && { date_to: `${filters.dateTo}T23:59:59` }),
    }),
    [filters, debouncedSearch],
  )

  // La recherche ne compte pas : elle a son propre champ, visible et effaçable.
  const activeCount = [
    filters.status,
    filters.method,
    filters.category,
    filters.cashier,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length

  return {
    filters,
    /** Modifie un filtre sans toucher aux autres. */
    set: <K extends keyof PaymentFilters>(key: K, value: PaymentFilters[K]) =>
      setFilters((f) => ({ ...f, [key]: value })),
    reset: () => setFilters(EMPTY),
    params,
    activeCount,
  }
}

export type PaymentFiltersControls = ReturnType<typeof usePaymentFilters>
