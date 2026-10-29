"use client"

import { useEffect, useState } from "react"
import { Plus, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supportIncidentApi } from "@/lib/api/support-incident"

export function IncidentCreateDialog({ initialReference, onCreated }: {
  initialReference?: string
  onCreated?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState(initialReference ?? "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const client = useQueryClient()
  useEffect(() => { setReference(initialReference ?? "") }, [initialReference])
  const create = useMutation({
    mutationFn: () => supportIncidentApi.create({
      title: title.trim(), description: description.trim(),
      reference: reference.trim() ? reference.trim().toUpperCase() : null, source: "web",
    }),
    onSuccess: (incident) => {
      void client.invalidateQueries({ queryKey: ["support-incidents"] })
      toast.success("Signalement enregistré", { description: "Dossier " + incident.id.slice(0, 10) })
      setTitle(""); setDescription(""); setReference(""); setOpen(false)
      onCreated?.(incident.id)
    },
    onError: () => toast.error("Envoi impossible", { description: "Vérifiez les informations puis réessayez." }),
  })
  const validReference = !reference.trim() || /^[0-9A-Fa-f]{6,16}$/.test(reference.trim())
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Signaler un problème</Button></DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouveau signalement</DialogTitle>
          <DialogDescription>Décrivez le problème et ajoutez le code affiché, si vous en avez un.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!create.isPending) create.mutate() }}>
          <div className="space-y-2">
            <Label htmlFor="incident-title">Que s'est-il passé ?</Label>
            <Input id="incident-title" required minLength={5} maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Impossible de valider une inscription" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="incident-reference">Code de référence (facultatif)</Label>
            <Input id="incident-reference" autoCapitalize="characters" spellCheck={false}
              maxLength={16} value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())}
              aria-invalid={!validReference} placeholder="Ex. A1B2C3D4E5F6" className="font-mono uppercase" />
            {!validReference && <p role="alert" className="text-xs text-destructive">Code hexadécimal de 6 à 16 caractères attendu.</p>}
            <p className="text-xs text-muted-foreground">Ne confondez pas avec le code établissement utilisé pour vous connecter.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="incident-description">Description</Label>
            <Textarea id="incident-description" required minLength={10} maxLength={2000} rows={5}
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Indiquez la page concernée, l'action réalisée et ce qui s'affiche. N'incluez aucun mot de passe ou donnée sensible." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={create.isPending || !validReference || title.trim().length < 5 || description.trim().length < 10}>
              {create.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Envoyer le signalement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
