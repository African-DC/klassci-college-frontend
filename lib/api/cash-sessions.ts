import {
  CashSessionListSchema,
  CashSessionSchema,
  type CashSession,
  type CashSessionClose,
  type CashSessionList,
} from "@/lib/contracts/cash-session"
import { apiFetch, safeValidate } from "./client"

/** Journée demandée, ou aujourd'hui si non précisée. */
function dateQuery(businessDate?: string): string {
  return businessDate ? `?date=${encodeURIComponent(businessDate)}` : ""
}

export const cashSessionsApi = {
  /** Ma caisse : ce que le caissier connecté a encaissé ce jour-là. */
  mine: async (businessDate?: string): Promise<CashSession> => {
    const json = await apiFetch<unknown>(`/cash-sessions/me${dateQuery(businessDate)}`)
    return safeValidate(CashSessionSchema, json, "GET /cash-sessions/me")
  },

  /** Clôture : fige le théorique, calcule l'écart avec le montant compté. */
  close: async (data: CashSessionClose, businessDate?: string): Promise<CashSession> => {
    const json = await apiFetch<unknown>(`/cash-sessions/me/close${dateQuery(businessDate)}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return safeValidate(CashSessionSchema, json, "POST /cash-sessions/me/close")
  },

  /** Point journalier : toutes les caisses d'une date (comptable). */
  dailyPoint: async (businessDate?: string): Promise<CashSessionList> => {
    const json = await apiFetch<unknown>(`/cash-sessions${dateQuery(businessDate)}`)
    return safeValidate(CashSessionListSchema, json, "GET /cash-sessions")
  },
}
