import { apiFetch } from "./client"
import type {
  PromotionExecuteRequest,
  PromotionExecuteResponse,
  PromotionPreviewRequest,
  PromotionPreviewResponse,
} from "@/lib/contracts/promotion"

export const promotionsApi = {
  preview: async (data: PromotionPreviewRequest) =>
    apiFetch<PromotionPreviewResponse>("/admin/promotions/preview", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  execute: async (data: PromotionExecuteRequest) =>
    apiFetch<PromotionExecuteResponse>("/admin/promotions/execute", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}
