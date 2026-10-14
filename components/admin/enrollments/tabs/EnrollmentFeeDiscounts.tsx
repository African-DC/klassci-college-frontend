"use client"

import { useState } from "react"
import { Pencil, Tags, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useEnrollmentFeeDiscounts, useFeeDiscountActions } from "@/lib/hooks/useFeeDiscounts"
import type { DiscountLine } from "@/lib/api/fee-discounts"

const format = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`

export function EnrollmentFeeDiscounts({ enrollmentId, studentId }: {
  enrollmentId: number; studentId: number
}) {
  const { has } = usePermissions()
  const canRead = has("fees:discount:read")
  const canManage = has("fees:discount:manage")
  const { data, isLoading, isError, refetch } = useEnrollmentFeeDiscounts(enrollmentId, canRead)
  const { set, remove } = useFeeDiscountActions(enrollmentId, studentId)
  const [editing, setEditing] = useState<DiscountLine | null>(null)
  const [kind, setKind] = useState<"fixed" | "percent">("fixed")
  const [value, setValue] = useState("")
  const [reason, setReason] = useState("")
  const [removing, setRemoving] = useState<DiscountLine | null>(null)

  if (!canRead) return null
  if (isLoading) return <div className="h-20 animate-pulse rounded-xl bg-muted" />
  if (isError) return <p className="text-sm text-destructive">Impossible de lire les réductions. <Button variant="link" onClick={() => refetch()}>Réessayer</Button></p>
  const open = (line: DiscountLine) => {
    setEditing(line)
    setKind(line.discount_kind ?? "fixed")
    setValue(String(line.discount_value ?? ""))
    setReason(line.discount_reason ?? "")
  }
  const numericValue = Number(value)
  const valid = Number.isFinite(numericValue) && numericValue > 0 &&
    (kind !== "percent" || numericValue <= 100) && reason.trim().length >= 5 &&
    (kind !== "fixed" || numericValue <= (editing?.original_amount ?? 0))

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-label="Réductions des frais">
      <div className="mb-3 flex items-center gap-2">
        <Tags className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Réductions accordées</h3>
      </div>
      <div className="divide-y divide-border/60">
        {(data ?? []).map((line) => (
          <div key={line.fee_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{line.category_name}</p>
              <p className="text-xs text-muted-foreground">
                {line.discount_kind ? (
                  <><span className="line-through">{format(line.original_amount)}</span>{" → "}{format(line.payable_amount)}
                    {" · Remise : "}{format(line.discount_amount)}
                    {line.discount_reason ? ` · ${line.discount_reason}` : ""}</>
                ) : format(line.payable_amount)}
              </p>
            </div>
            {canManage && (
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => open(line)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />{line.discount_kind ? "Modifier" : "Réduire"}
                </Button>
                {line.discount_kind && <Button type="button" size="sm" variant="ghost" onClick={() => setRemoving(line)}>
                  <Trash2 className="h-4 w-4" /><span className="sr-only">Retirer la réduction</span>
                </Button>}
              </div>
            )}
          </div>
        ))}
      </div>
      {data?.length === 0 && <p className="text-sm text-muted-foreground">Aucun frais à réduire sur cette inscription.</p>}
      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open && !set.isPending) setEditing(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réduction sur {editing?.category_name}</DialogTitle>
            <DialogDescription>Ce geste modifie le montant dû, sans modifier le tarif de la classe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Montant initial : <strong>{format(editing?.original_amount ?? 0)}</strong></p>
            <div className="space-y-1.5">
              <Label htmlFor="discount-kind">Type</Label>
              <select id="discount-kind" className="flex h-11 w-full rounded-md border bg-background px-3 text-sm" value={kind}
                onChange={(e) => setKind(e.target.value as "fixed" | "percent")}>
                <option value="fixed">Montant fixe en FCFA</option>
                <option value="percent">Pourcentage</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount-value">Valeur</Label>
              <Input id="discount-value" type="number" min="0.01" max={kind === "percent" ? 100 : editing?.original_amount}
                step={kind === "percent" ? "0.01" : "1"} value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount-reason">Motif (obligatoire)</Label>
              <Input id="discount-reason" maxLength={255} value={reason}
                placeholder="Ex. Réduction fratrie accordée par la direction"
                onChange={(e) => setReason(e.target.value)} />
            </div>
            {valid && editing && <p className="text-sm text-muted-foreground">
              Nouveau montant dû : <strong>{format(Math.max(0, editing.original_amount -
                (kind === "fixed" ? numericValue : Math.round(editing.original_amount * numericValue) / 100)))}</strong>
            </p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={set.isPending}>Annuler</Button>
              <Button disabled={!valid || set.isPending} onClick={() => {
                if (!editing || !valid) return
                set.mutate({ feeId: editing.fee_id, data: { kind, value: numericValue, reason: reason.trim() } },
                  { onSuccess: () => setEditing(null) })
              }}>{set.isPending ? "Enregistrement…" : "Enregistrer"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={removing !== null} onOpenChange={(open) => { if (!open && !remove.isPending) setRemoving(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retirer la réduction ?</DialogTitle>
            <DialogDescription>Le montant initial sera à nouveau exigible pour {removing?.category_name}. Aucun versement ne sera modifié.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoving(null)} disabled={remove.isPending}>Annuler</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => {
              if (removing) remove.mutate(removing.fee_id, { onSuccess: () => setRemoving(null) })
            }}>Confirmer le retrait</Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
