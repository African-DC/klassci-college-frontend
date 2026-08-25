"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Check, Copy, KeyRound, Trash2 } from "lucide-react"
import { PageHero } from "@/components/shared/PageHero"
import { useCreatePat, usePatsList, useRevokePat } from "@/lib/hooks/super-admin/usePats"

const formSchema = z.object({
  name: z.string().min(1).max(150),
  scopes: z.string().min(1, "Au moins un scope requis"),
  expires_in_days: z.coerce.number().min(1).max(365),
})

type FormData = z.infer<typeof formSchema>

export function PatsPanel() {
  const { data, isLoading } = usePatsList()
  const create = useCreatePat()
  const revoke = useRevokePat()
  const [createdPlaintext, setCreatedPlaintext] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeId, setRevokeId] = useState<number | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", scopes: "super-admin:tenants:read", expires_in_days: 90 },
  })

  function onSubmit(values: FormData) {
    const scopes = values.scopes.split(",").map((s) => s.trim()).filter(Boolean)
    create.mutate(
      { name: values.name, scopes, expires_in_days: values.expires_in_days },
      {
        onSuccess: (result) => {
          setCreatedPlaintext(result.plaintext)
          form.reset()
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      <PageHero
        icon={KeyRound}
        title="Tokens d'accès"
        subtitle={
          <>
            Pour le CLI <code className="rounded bg-white/15 px-1 text-xs">klassci</code> et les agents IA. Le token clair n'est affiché qu'une seule fois.
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Créer un token</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" placeholder="dev-laptop" {...form.register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scopes">Scopes séparés par virgule</Label>
              <Input id="scopes" placeholder="super-admin:tenants:read" {...form.register("scopes")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expires_in_days">Expire dans</Label>
              <Input
                id="expires_in_days"
                type="number"
                min={1}
                max={365}
                {...form.register("expires_in_days", { valueAsNumber: true })}
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={create.isPending} className="h-11 sm:h-10">
                {create.isPending ? "Création..." : "Créer le token"}
              </Button>
            </div>
          </form>

          {createdPlaintext && (
            <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
              <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                Token créé. Copie-le maintenant, il ne sera plus jamais affiché.
              </p>
              <div className="mt-2 flex items-center gap-2 rounded bg-background px-3 py-2 font-mono text-xs">
                <span className="flex-1 break-all">{createdPlaintext}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(createdPlaintext)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  aria-label="Copier le token"
                >
                  {copied ? <Check aria-hidden="true" className="h-3 w-3" /> : <Copy aria-hidden="true" className="h-3 w-3" />}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCreatedPlaintext(null)} className="mt-2 text-xs">
                J'ai copié, masquer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tokens existants</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              <div className="p-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (data?.items ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Aucun token</div>
            ) : (
              data!.items.map((pat) => {
                const isRevoked = pat.revoked_at !== null
                const isExpired = new Date(pat.expires_at) < new Date()
                const inactive = isRevoked || isExpired
                return (
                  <div key={pat.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{pat.name}</p>
                        {isRevoked && <Badge variant="destructive">Révoqué</Badge>}
                        {!isRevoked && isExpired && <Badge variant="secondary">Expiré</Badge>}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">{pat.token_prefix}...</p>
                      <p className="text-xs text-muted-foreground">
                        Scopes : {pat.scopes.join(", ")} · Expire : {new Date(pat.expires_at).toLocaleDateString("fr-FR")}
                        {pat.last_used_at && ` · Dernière utilisation : ${new Date(pat.last_used_at).toLocaleString("fr-FR")}`}
                      </p>
                    </div>
                    {!inactive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRevokeId(pat.id)}
                        aria-label={`Révoquer le token ${pat.name}`}
                        className="h-11 w-11 self-end text-destructive hover:text-destructive sm:self-auto"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={revokeId !== null} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer ce token ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Toute machine ou agent qui utilise ce token sera déconnecté immédiatement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (revokeId !== null) revoke.mutate(revokeId)
                setRevokeId(null)
              }}
            >
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
