"use client"

import type { Route } from "next"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTenantsList } from "@/lib/hooks/super-admin/useTenants"
import { ExternalLink } from "lucide-react"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(1)} ${units[i]}`
}

export function TenantsTable() {
  const { data, isLoading, isError, error, refetch } = useTenantsList()

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Erreur de chargement</p>
        <p className="mt-1 text-muted-foreground">{(error as Error).message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3">
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="text-right">Taille DB</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-64" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            : (data?.items ?? []).length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                      Aucun tenant pour le moment.
                      <Link href={"/super-admin/tenants/new" as Route} className="ml-2 text-primary hover:underline">
                        Créer le premier
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              : data!.items.map((tenant) => (
                  <TableRow key={tenant.slug} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link
                        href={`/super-admin/tenants/${tenant.slug}` as Route}
                        className="text-primary hover:underline"
                      >
                        {tenant.slug}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <a
                        href={tenant.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                      >
                        {tenant.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBytes(tenant.db_size_bytes)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
        </TableBody>
      </Table>
    </div>
  )
}
