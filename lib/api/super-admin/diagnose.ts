import { apiFetch } from "@/lib/api/client"
import { type PlatformHealth, platformHealthSchema } from "@/lib/contracts/super-admin"

export const diagnoseApi = {
  platform: async (): Promise<PlatformHealth> => {
    return apiFetch<PlatformHealth>("/super-admin/diagnose", {
      schema: platformHealthSchema,
    })
  },
}
