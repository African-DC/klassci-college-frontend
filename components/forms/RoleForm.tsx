"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RoleCreateSchema, type RoleCreate } from "@/lib/contracts/role"
import { useCreateRole, usePermissions } from "@/lib/hooks/useRoles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PermissionMatrix } from "@/components/admin/roles/PermissionMatrix"

interface RoleFormProps {
  onSuccess: () => void
}

export function RoleForm({ onSuccess }: RoleFormProps) {
  const form = useForm<RoleCreate>({
    resolver: zodResolver(RoleCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      permission_ids: [],
    },
  })

  const { data: allPermissions } = usePermissions()
  const { mutate, isPending, error } = useCreateRole()

  function onSubmit(data: RoleCreate) {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du rôle *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Directeur des études" className="h-11" {...field} />
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
                  placeholder="Décrivez les responsabilités de ce rôle..."
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
          {isPending ? "Enregistrement..." : "Créer le rôle"}
        </Button>
      </form>
    </Form>
  )
}
