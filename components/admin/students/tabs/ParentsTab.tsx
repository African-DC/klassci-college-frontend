"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Unlink, Mail, Phone, UserCheck, Users } from "lucide-react"
import { ParentCreateSchema, type ParentCreate, type Parent } from "@/lib/contracts/parent"
import {
  useStudentParents,
  useParents,
  useCreateParent,
  useLinkParent,
  useUnlinkParent,
} from "@/lib/hooks/useParents"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const RELATIONSHIP_TYPES = [
  { value: "father", label: "Père", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "mother", label: "Mère", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  { value: "guardian", label: "Tuteur", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "other", label: "Autre", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
] as const

function getRelationshipInfo(type: string) {
  return RELATIONSHIP_TYPES.find((r) => r.value === type) ?? RELATIONSHIP_TYPES[3]
}

interface ParentsTabProps {
  studentId: number
}

export function ParentsTab({ studentId }: ParentsTabProps) {
  const { data: parents, isLoading } = useStudentParents(studentId)
  const [createOpen, setCreateOpen] = useState(false)
  const [unlinkTarget, setUnlinkTarget] = useState<{ parentId: number; name: string } | null>(null)
  const { mutate: unlinkParent, isPending: unlinking } = useUnlinkParent()

  const handleUnlink = () => {
    if (!unlinkTarget) return
    unlinkParent(
      { parentId: unlinkTarget.parentId, studentId },
      { onSuccess: () => setUnlinkTarget(null) },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {parents && parents.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {parents.map((parent) => {
            const rel = getRelationshipInfo((parent as Record<string, unknown>).relationship_type as string ?? "guardian")
            const initials = `${parent.first_name?.[0] ?? ""}${parent.last_name?.[0] ?? ""}`.toUpperCase()
            const fullName = `${parent.last_name} ${parent.first_name}`

            return (
              <Card key={parent.id} className="border-0 shadow-sm ring-1 ring-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{fullName}</p>
                        <Badge variant="secondary" className={`text-[10px] ${rel.color}`}>
                          {rel.label}
                        </Badge>
                        {parent.user_id && (
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600">
                            <UserCheck className="mr-1 h-3 w-3" />
                            Compte actif
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {parent.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {parent.phone}
                          </span>
                        )}
                        {parent.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {parent.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setUnlinkTarget({ parentId: parent.id, name: fullName })}
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Aucun parent lié à cet élève.
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Ajouter un parent
        </Button>
      </div>

      {/* Add parent dialog (new or existing) */}
      <AddParentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        studentId={studentId}
      />

      {/* Unlink confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce parent ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le lien entre {unlinkTarget?.name} et cet élève sera supprimé. Le parent ne sera pas supprimé du système.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              disabled={unlinking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinking ? "Suppression..." : "Retirer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Add parent dialog (create new or link existing) ----------

type AddParentMode = "new" | "existing"

function AddParentDialog({
  open,
  onClose,
  studentId,
}: {
  open: boolean
  onClose: () => void
  studentId: number
}) {
  const [mode, setMode] = useState<AddParentMode>("new")
  const [createAccount, setCreateAccount] = useState(false)
  const { mutate: createParent, isPending: creating } = useCreateParent()
  const { mutate: linkParent, isPending: linking } = useLinkParent()

  // --- Existing parent search state ---
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [linkRelationship, setLinkRelationship] = useState<string>("guardian")

  const { data: searchResults, isLoading: searchLoading } = useParents(
    debouncedSearch.length >= 2 ? { search: debouncedSearch, size: 20 } : { size: 0 },
  )
  const matchingParents: Parent[] = debouncedSearch.length >= 2 ? (searchResults?.items ?? []) : []

  const form = useForm<ParentCreate>({
    resolver: zodResolver(ParentCreateSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      password: "",
      relationship_type: "guardian",
    },
  })

  const handleSubmitNew = (data: ParentCreate) => {
    const payload = { ...data }
    if (!createAccount) {
      delete payload.password
    }

    createParent(payload, {
      onSuccess: (parent) => {
        linkParent({
          parentId: parent.id,
          studentId,
          relationshipType: data.relationship_type,
        })
        resetAndClose()
      },
    })
  }

  const handleLinkExisting = () => {
    if (!selectedParent) return
    linkParent(
      { parentId: selectedParent.id, studentId, relationshipType: linkRelationship },
      { onSuccess: () => resetAndClose() },
    )
  }

  const resetAndClose = () => {
    form.reset()
    setCreateAccount(false)
    setMode("new")
    setSearchQuery("")
    setSelectedParent(null)
    setLinkRelationship("guardian")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un parent</DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-1 rounded-md bg-muted p-1">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "new"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setMode("new")}
          >
            Nouveau parent
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "existing"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setMode("existing")}
          >
            Parent existant
          </button>
        </div>

        {mode === "new" ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitNew)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom" className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Numéro de téléphone"
                          className="h-10"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Adresse email"
                          className="h-10"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="relationship_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien de parenté</FormLabel>
                    <Select value={field.value ?? "guardian"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="father">Père</SelectItem>
                        <SelectItem value="mother">Mère</SelectItem>
                        <SelectItem value="guardian">Tuteur</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account creation toggle */}
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="create-account"
                    checked={createAccount}
                    onCheckedChange={(checked) => {
                      setCreateAccount(checked === true)
                      if (!checked) {
                        form.setValue("password", "")
                      }
                    }}
                  />
                  <label
                    htmlFor="create-account"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Créer un compte de connexion pour le parent
                  </label>
                </div>

                {createAccount && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email du compte *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@exemple.com"
                              className="h-10"
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
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="8 caractères minimum"
                              className="h-10"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetAndClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Création..." : "Créer et lier"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          /* ---- Existing parent search & link ---- */
          <div className="space-y-4">
            <Input
              placeholder="Rechercher un parent (nom, prénom, téléphone)..."
              className="h-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedParent(null)
              }}
            />

            {searchLoading && debouncedSearch.length >= 2 && (
              <div className="flex items-center justify-center py-6">
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            )}

            {!searchLoading && debouncedSearch.length >= 2 && matchingParents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun parent trouvé pour &laquo; {debouncedSearch} &raquo;
              </p>
            )}

            {matchingParents.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {matchingParents.map((p) => {
                  const isSelected = selectedParent?.id === p.id
                  const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase()
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "hover:bg-muted/50",
                      )}
                      onClick={() => setSelectedParent(p)}
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {p.last_name} {p.first_name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {p.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {p.phone}
                            </span>
                          )}
                          {p.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {p.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="shrink-0 text-[10px] bg-primary/10 text-primary">
                          Sélectionné
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {selectedParent && (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Lien de parenté</label>
                  <Select value={linkRelationship} onValueChange={setLinkRelationship}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Père</SelectItem>
                      <SelectItem value="mother">Mère</SelectItem>
                      <SelectItem value="guardian">Tuteur</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetAndClose}>
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!selectedParent || linking}
                onClick={handleLinkExisting}
              >
                {linking ? "Liaison..." : "Lier le parent"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
