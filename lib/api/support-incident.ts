import { apiFetch } from "@/lib/api/client"
import {
  incidentSchema, incidentPageSchema,
  type Incident, type IncidentPage, type IncidentStatus, type IncidentPriority,
} from "@/lib/contracts/support-incident"

interface ListParams { tenant?: string; reference?: string; status?: IncidentStatus | "all"; page?: number; size?: number }

function endpoint(tenant?: string): string {
  return tenant ? "/super-admin/incidents" : "/support/incidents"
}

function query(params: ListParams) {
  const qs = new URLSearchParams()
  if (params.tenant) qs.set("tenant", params.tenant)
  if (params.reference) qs.set("reference", params.reference.toUpperCase())
  if (params.status && params.status !== "all") qs.set("status", params.status)
  qs.set("page", String(params.page ?? 1))
  qs.set("size", String(params.size ?? 20))
  return qs.toString()
}

function detailPath(id: string, tenant?: string) {
  const encodedId = encodeURIComponent(id)
  return tenant
    ? "/super-admin/incidents/" + encodeURIComponent(tenant) + "/" + encodedId
    : "/support/incidents/" + encodedId
}

export const supportIncidentApi = {
  list(params: ListParams): Promise<IncidentPage> {
    return apiFetch(endpoint(params.tenant) + "?" + query(params), { schema: incidentPageSchema })
  },
  get(id: string, tenant?: string): Promise<Incident> {
    return apiFetch(detailPath(id, tenant), { schema: incidentSchema })
  },
  create(data: { title: string; description: string; reference: string | null; source: "web" }): Promise<Incident> {
    return apiFetch("/support/incidents", { method: "POST", body: JSON.stringify(data), schema: incidentSchema })
  },
  reply(id: string, message: string, tenant?: string): Promise<Incident> {
    return apiFetch(detailPath(id, tenant) + "/replies", {
      method: "POST", body: JSON.stringify({ message }), schema: incidentSchema,
    })
  },
  update(id: string, tenant: string, data: { status: IncidentStatus; priority?: IncidentPriority; message?: string }): Promise<Incident> {
    return apiFetch(detailPath(id, tenant), { method: "PATCH", body: JSON.stringify(data), schema: incidentSchema })
  },
}
