"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  ShieldAlert,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { accountsApi } from "@/lib/api/accounts"
import type { AccountAction, AccountEntityType } from "@/lib/contracts/account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SectionTitle } from "@/components/shared/PageHero"

interface AccountSectionProps {
  entityType: AccountEntityType
  entityId: number
}

const accountKey = (t: AccountEntityType, id: number) => ["account", t, id] as const

export function AccountSection({ entityType, entityId }: AccountSectionProps) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: accountKey(entityType, entityId),
    queryFn: () => accountsApi.get(entityType, entityId),
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<AccountAction | null>(null)

  useEffect(() => {
    if (data?.suggested_email) setEmail(data.suggested_email)
  }, [data?.suggested_email])

  const createMut = useMutation({
    mutationFn: () => accountsApi.create(entityType, entityId, email),
    onSuccess: (res) => {
      setResult(res)
      setCreateOpen(false)
      qc.invalidateQueries({ queryKey: accountKey(entityType, entityId) })
      toast.success("Compte créé")
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec de la création"),
  })

  const resetMut = useMutation({
    mutationFn: () => accountsApi.resetPassword(entityType, entityId),
    onSuccess: (res) => {
      setResult(res)
      setResetOpen(false)
      qc.invalidateQueries({ queryKey: accountKey(entityType, entityId) })
      toast.success("Mot de passe réinitialisé")
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec de la réinitialisation"),
  })

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <SectionTitle icon={KeyRound}>Compte de connexion</SectionTitle>
      </div>

      {isLoading || !data ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {data.has_account ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{data.email}</span>
                </span>
                <StatusPill
                  active={data.is_active}
                  neverLogged={!data.last_login}
                  mustChange={data.must_change_password}
                />
                <span className="text-xs text-muted-foreground">
                  {data.last_login
                    ? `Dernière connexion : ${new Date(data.last_login).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Jamais connecté"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 h-11 gap-2 sm:h-10"
                onClick={() => setResetOpen(true)}
              >
                <KeyRound className="h-4 w-4" />
                Réinitialiser le mot de passe
              </Button>
            </div>
          ) : data.can_create ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {data.full_name} n&apos;a pas encore de compte pour se connecter.
              </p>
              <Button
                size="sm"
                className="mt-3 h-11 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 sm:h-10"
                onClick={() => {
                  setEmail(data.suggested_email ?? "")
                  setCreateOpen(true)
                }}
              >
                <UserPlus className="h-4 w-4" />
                Créer le compte
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ce compte est géré à la création de la fiche.
            </p>
          )}

          {result && <TempPasswordCard result={result} />}
        </div>
      )}

      {/* Créer le compte — email pré-rempli éditable, confirmé */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer le compte de {data?.full_name}</DialogTitle>
            <DialogDescription>
              Vérifiez l&apos;email de connexion. Le mot de passe temporaire sera
              <strong> Bonjour@{new Date().getFullYear()}</strong>, à changer à la
              première connexion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="account-email">Email de connexion</Label>
            <Input
              id="account-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !email}
              className="gap-2"
            >
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Créer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Réinitialiser le mot de passe */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-base font-semibold">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Réinitialiser le mot de passe ?
            </div>
            <AlertDialogDescription>
              Le mot de passe de {data?.full_name} deviendra{" "}
              <strong>Bonjour@{new Date().getFullYear()}</strong>. L&apos;utilisateur
              devra le changer à sa prochaine connexion.
            </AlertDialogDescription>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetMut.mutate()} disabled={resetMut.isPending}>
              {resetMut.isPending ? "Réinitialisation..." : "Réinitialiser"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatusPill({
  active,
  neverLogged,
  mustChange,
}: {
  active: boolean
  neverLogged: boolean
  mustChange: boolean
}) {
  let label = "Actif"
  let cls = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
  if (mustChange) {
    label = "Mot de passe à changer"
    cls = "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
  } else if (!active) {
    label = "Désactivé"
    cls = "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
  } else if (neverLogged) {
    label = "En attente"
    cls = "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  )
}

function TempPasswordCard({ result }: { result: AccountAction }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
        Mot de passe temporaire à communiquer
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="rounded-md border bg-background px-3 py-1.5 font-mono text-sm">
          {result.temporary_password}
        </code>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => {
            void navigator.clipboard?.writeText(result.temporary_password)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-300/80">
        {result.email} — à changer obligatoirement à la première connexion.
      </p>
    </div>
  )
}
