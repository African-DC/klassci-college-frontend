"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RoleUpdateSchema, type RoleUpdate } from "@/lib/contracts/role"
import { useRole, useUpdateRole, usePermissions } from "@/lib/hooks/useRoles"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PermissionMatrix } from "./PermissionMatrix"

function EditFormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

function EditForm({ roleId, onClose }: { roleId: number; onClose: () => void }) {
  const { data: roleData, isLoading } = useRole(roleId)
  const { mutate, isPending, error } = useUpdateRole(roleId)
  const { data: allPermissions } = usePermissions()

  const form = useForm<RoleUpdate>({
    resolver: zodResolver(RoleUpdateSchema),
    values: roleData
      ? {
          name: roleData.name,
          description: roleData.description ?? undefined,
          permission_ids: roleData.permissions?.map((p) => p.id) ?? [],
        }
      : undefined,
  })

  if (isLoading || !roleData) return <EditFormSkeleton />

  function onSubmit(data: RoleUpdate) {
    mutate(data, { onSuccess: onClose })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du rôle</FormLabel>
              <FormControl>
                <Input className="h-11" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[80px] resize-none"
                  placeholder="Description du rôle..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permission_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permissions</FormLabel>
              <PermissionMatrix
                permissions={allPermissions ?? []}
                selectedIds={field.value ?? []}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full h-11 font-semibold" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Mettre à jour"}
        </Button>
      </form>
    </Form>
  )
}

interface RoleEditModalProps {
  roleId: number | null
  open: boolean
  onClose: () => void
}

export function RoleEditModal({ roleId, open, onClose }: RoleEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier le rôle</DialogTitle>
        </DialogHeader>
        {roleId && <EditForm roleId={roleId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
