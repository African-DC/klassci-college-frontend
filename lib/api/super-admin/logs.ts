import { apiFetch } from "@/lib/api/client"
import { z } from "zod"

const logsResponseSchema = z.object({
  service: z.string(),
  lines: z.array(
    z.object({
      timestamp: z.string().nullable(),
      raw: z.string(),
    }),
  ),
  truncated: z.boolean(),
  redacted_count: z.number(),
})

export type LogsResponse = z.infer<typeof logsResponseSchema>

export const logsApi = {
  read: async (service: string, lines: number): Promise<LogsResponse> => {
    const params = new URLSearchParams({ service, lines: String(lines) })
    return apiFetch<LogsResponse>(`/super-admin/logs?${params.toString()}`, {
      schema: logsResponseSchema,
    })
  },
}
