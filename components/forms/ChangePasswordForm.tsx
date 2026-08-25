"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signOut } from "next-auth/react"
import { Loader2, Lock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { accountsApi } from "@/lib/api/accounts"
import { ChangePasswordSchema, type ChangePasswordInput } from "@/lib/contracts/account"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

/**
 * Changement de mot de passe forcé à la 1re connexion (compte créé ou
 * réinitialisé par un admin). Après succès on déconnecte pour forcer une
 * reconnexion propre : le nouveau login renvoie `must_change_password=false`,
 * ce qui débloque l'accès (le flag du JWT courant, lui, reste à true).
 */
export function ChangePasswordForm() {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  })

  async function onSubmit(values: ChangePasswordInput) {
    setSubmitting(true)
    try {
      await accountsApi.changePassword(values.current_password, values.new_password)
      toast.success("Mot de passe mis à jour", {
        description: "Reconnectez-vous avec votre nouveau mot de passe.",
      })
      await signOut({ redirect: false }).catch(() => {})
      window.location.href = "/login?changed=1"
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec du changement"
      form.setError("current_password", { message })
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      {/* Voir LoginForm : sans `method="post"`, une soumission avant l'hydratation
          partirait en GET. Ce formulaire porte le mot de passe actuel en plus du
          nouveau. */}
      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="current_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe actuel</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Ex : Bonjour@2026"
                    className="h-11 pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nouveau mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
                    className="h-11 pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Répétez le mot de passe"
                    className="h-11 pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            "Changer mon mot de passe"
          )}
        </Button>
      </form>
    </Form>
  )
}
