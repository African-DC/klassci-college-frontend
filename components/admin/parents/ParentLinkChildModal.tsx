"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useStudents } from "@/lib/hooks/useStudents"
import { useLinkParent } from "@/lib/hooks/useParents"
import type { Student } from "@/lib/contracts/student"

const RELATIONSHIPS = [
  { value: "guardian", label: "Tuteur / Tutrice" },
  { value: "father", label: "Père" },
  { value: "mother", label: "Mère" },
  { value: "other", label: "Autre proche" },
]

export function ParentLinkChildModal({
  parentId,
  linkedStudentIds,
  open,
  onClose,
}: {
  parentId: number
  linkedStudentIds: number[]
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [studentId, setStudentId] = useState("")
  const [relationship, setRelationship] = useState("guardian")

  const { data, isLoading } = useStudents({ size: 100 })
  const { mutate: link, isPending } = useLinkParent()

  const students: Student[] = (data as { items?: Student[] } | undefined)?.items ?? []
  const available = students.filter((s) => !linkedStudentIds.includes(s.id))

  const submit = () => {
    if (!studentId) return
    link(
      { parentId, studentId: Number(studentId), relationshipType: relationship },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["parent", parentId, "full"] })
          setStudentId("")
          setRelationship("guardian")
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lier un enfant</DialogTitle>
          <DialogDescription>
            Associez un élève existant à ce parent et précisez le lien de parenté.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="child-select">Élève</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger id="child-select" className="h-11 sm:h-10">
                <SelectValue placeholder={isLoading ? "Chargement..." : "Choisir un élève"} />
              </SelectTrigger>
              <SelectContent>
                {available.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.last_name} {s.first_name}
                    {s.enrollment_number ? ` · ${s.enrollment_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isLoading && available.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Tous les élèves sont déjà liés à ce parent.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rel-select">Lien de parenté</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger id="rel-select" className="h-11 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!studentId || isPending}>
            {isPending ? "Liaison..." : "Lier l'enfant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
