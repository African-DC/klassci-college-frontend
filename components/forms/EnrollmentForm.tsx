"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  UserPlus,
  RefreshCw,
  GraduationCap,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  Settings2,
  ExternalLink,
} from "lucide-react"
import {
  NewEnrollmentSchema,
  ReEnrollmentSchema,
  type NewEnrollment,
  type ReEnrollment,
  type FeeVariantOption,
} from "@/lib/contracts/enrollment"
import type { Student } from "@/lib/contracts/student"
import type { Class } from "@/lib/contracts/class"
import { useCreateWithStudent, useReEnroll, useFeeVariants } from "@/lib/hooks/useEnrollments"
import { useStudents } from "@/lib/hooks/useStudents"
import { useClasses } from "@/lib/hooks/useClasses"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type EnrollmentType = "new" | "re-enrollment"

const STEPS = [
  { id: "type", label: "Type", icon: GraduationCap },
  { id: "student", label: "Eleve", icon: UserPlus },
  { id: "class", label: "Classe", icon: GraduationCap },
  { id: "summary", label: "Resume", icon: Check },
] as const

const RELATIONSHIP_TYPES = [
  { value: "father", label: "Père" },
  { value: "mother", label: "Mère" },
  { value: "guardian", label: "Tuteur" },
  { value: "other", label: "Autre" },
] as const

interface EnrollmentFormProps {
  onSuccess: () => void
}

// Unified type for the discriminated form
type EnrollmentFormData = NewEnrollment | ReEnrollment

export function EnrollmentForm({ onSuccess }: EnrollmentFormProps) {
  const [step, setStep] = useState(0)
  const [enrollmentType, setEnrollmentType] = useState<EnrollmentType | null>(null)
  const [showParentFields, setShowParentFields] = useState(false)
  const [showParentAccount, setShowParentAccount] = useState(false)
  const [maxReachedStep, setMaxReachedStep] = useState(0)

  // Mutations
  const createWithStudent = useCreateWithStudent()
  const reEnroll = useReEnroll()

  // Data queries
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ size: 100 })
  const { data: classesData, isLoading: classesLoading } = useClasses({ size: 100 })

  const students: Student[] = studentsData?.items ?? []
  const classes: Class[] = classesData?.items ?? []

  // New enrollment form
  const newForm = useForm<NewEnrollment>({
    resolver: zodResolver(NewEnrollmentSchema),
    defaultValues: {
      type: "new",
      first_name: "",
      last_name: "",
      birth_date: null,
      genre: null,
      enrollment_number: null,
      city: null,
      commune: null,
      parent: null,
      class_id: undefined,
      fee_variant_id: null,
      notes: null,
    },
  })

  // Re-enrollment form
  const reForm = useForm<ReEnrollment>({
    resolver: zodResolver(ReEnrollmentSchema),
    defaultValues: {
      type: "re-enrollment",
      student_id: undefined,
      class_id: undefined,
      fee_variant_id: null,
      notes: null,
    },
  })

  const watchedClassId = enrollmentType === "new"
    ? newForm.watch("class_id")
    : reForm.watch("class_id")

  // Fee variants for selected class
  const { data: feeVariants, isLoading: feeVariantsLoading } = useFeeVariants(
    watchedClassId && watchedClassId > 0 ? watchedClassId : undefined
  )

  // Selected student for re-enrollment
  const selectedStudentId = enrollmentType === "re-enrollment" ? reForm.watch("student_id") : undefined
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  )

  // Selected class name for summary
  const selectedClassName = useMemo(
    () => classes.find((c) => c.id === watchedClassId)?.name ?? "",
    [classes, watchedClassId]
  )

  // Selected fee variant for summary
  const selectedFeeVariantId = enrollmentType === "new"
    ? newForm.watch("fee_variant_id")
    : reForm.watch("fee_variant_id")
  const selectedFeeVariant = useMemo(
    () => feeVariants?.find((v) => v.id === selectedFeeVariantId),
    [feeVariants, selectedFeeVariantId]
  )

  const isPending = createWithStudent.isPending || reEnroll.isPending

  function goToStep(target: number) {
    setStep(target)
    if (target > maxReachedStep) {
      setMaxReachedStep(target)
    }
  }

  async function handleNext() {
    if (step === 0) {
      if (!enrollmentType) return
      goToStep(1)
      return
    }

    if (step === 1) {
      if (enrollmentType === "new") {
        const valid = await newForm.trigger(["first_name", "last_name", "birth_date", "genre", "enrollment_number"])
        if (!valid) return
        // Validate parent fields if shown
        if (showParentFields) {
          const parentValid = await newForm.trigger(["parent.first_name", "parent.last_name", "parent.phone", "parent.email", "parent.relationship_type"])
          if (!parentValid) return
        }
      } else {
        const valid = await reForm.trigger(["student_id"])
        if (!valid) return
      }
      goToStep(2)
      return
    }

    if (step === 2) {
      if (enrollmentType === "new") {
        const valid = await newForm.trigger(["class_id"])
        if (!valid) return
      } else {
        const valid = await reForm.trigger(["class_id"])
        if (!valid) return
      }
      goToStep(3)
      return
    }
  }

  function handlePrevious() {
    if (step > 0) setStep(step - 1)
  }

  function handleSubmit() {
    if (enrollmentType === "new") {
      newForm.handleSubmit((data) => {
        // Clean up parent if not filled
        if (!showParentFields) {
          data.parent = null
        }
        createWithStudent.mutate(data, {
          onSuccess: () => {
            newForm.reset()
            onSuccess()
          },
        })
      })()
    } else {
      reForm.handleSubmit((data) => {
        reEnroll.mutate(data, {
          onSuccess: () => {
            reForm.reset()
            onSuccess()
          },
        })
      })()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <Tabs value={STEPS[step].id} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {STEPS.map((s, i) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              disabled={i > maxReachedStep || (i > 0 && !enrollmentType)}
              onClick={() => {
                if (i <= maxReachedStep) setStep(i)
              }}
              className="text-xs sm:text-sm"
            >
              <s.icon className="mr-1.5 h-3.5 w-3.5 hidden sm:inline-block" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Step 0: Type selection */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choisissez le type d&apos;inscription a effectuer.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                enrollmentType === "new" && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setEnrollmentType("new")}
            >
              <CardContent className="flex flex-col items-center gap-3 pt-6 pb-4">
                <div className={cn(
                  "rounded-full p-3",
                  enrollmentType === "new" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <UserPlus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Nouvelle inscription</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inscrire un nouvel eleve
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                enrollmentType === "re-enrollment" && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setEnrollmentType("re-enrollment")}
            >
              <CardContent className="flex flex-col items-center gap-3 pt-6 pb-4">
                <div className={cn(
                  "rounded-full p-3",
                  enrollmentType === "re-enrollment" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Reinscription</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reinscrire un eleve existant
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 1: Student info */}
      {step === 1 && enrollmentType === "new" && (
        <Form {...newForm}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Renseignez les informations de l&apos;eleve.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={newForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prenom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Prenom de l'eleve" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'eleve" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={newForm.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-10"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newForm.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v || null)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Masculin</SelectItem>
                        <SelectItem value="F">Feminin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={newForm.control}
              name="enrollment_number"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Matricule *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="rounded-full p-0.5 hover:bg-muted transition-colors">
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 text-xs" side="top" align="start">
                        <p className="font-medium mb-1">Configuration du matricule</p>
                        <p className="text-muted-foreground">
                          Le matricule peut etre genere automatiquement si un pattern est configure dans les parametres.
                        </p>
                        <a
                          href="/admin/settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Settings2 className="h-3 w-3" />
                          Configurer le pattern
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Ex: KLASSCI-2026-0001"
                      className="h-10"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour une generation automatique (si le pattern est configure).
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={newForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex : Abidjan"
                        className="h-10"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newForm.control}
                name="commune"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commune</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex : Cocody"
                        className="h-10"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Parent section */}
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setShowParentFields(!showParentFields)
                if (showParentFields) {
                  newForm.setValue("parent", null)
                  setShowParentAccount(false)
                } else {
                  newForm.setValue("parent", {
                    first_name: "",
                    last_name: "",
                    phone: null,
                    email: null,
                    password: null,
                    relationship_type: "guardian",
                    city: null,
                    commune: null,
                  })
                }
              }}
            >
              {showParentFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Informations parent (optionnel)
            </button>

            {showParentFields && (
              <div className="space-y-4 pl-2 border-l-2 border-muted">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={newForm.control}
                    name="parent.first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom du parent *</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newForm.control}
                    name="parent.last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du parent *</FormLabel>
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
                    control={newForm.control}
                    name="parent.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Numéro de téléphone"
                            className="h-10"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newForm.control}
                    name="parent.email"
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
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={newForm.control}
                    name="parent.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex : Abidjan"
                            className="h-10"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newForm.control}
                    name="parent.commune"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commune</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex : Cocody"
                            className="h-10"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newForm.control}
                  name="parent.relationship_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lien de parenté</FormLabel>
                      <Select
                        value={field.value ?? "guardian"}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RELATIONSHIP_TYPES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Compte de connexion parent */}
                <div className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="parent-create-account"
                      checked={showParentAccount}
                      onCheckedChange={(checked) => {
                        setShowParentAccount(checked === true)
                        if (!checked) {
                          newForm.setValue("parent.password", null)
                        }
                      }}
                    />
                    <label
                      htmlFor="parent-create-account"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Créer un compte de connexion pour le parent
                    </label>
                  </div>

                  {showParentAccount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <FormField
                        control={newForm.control}
                        name="parent.email"
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
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={newForm.control}
                        name="parent.password"
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
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Form>
      )}

      {/* Step 1: Re-enrollment - student selection */}
      {step === 1 && enrollmentType === "re-enrollment" && (
        <Form {...reForm}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selectionnez l&apos;eleve a reinscrire.
            </p>

            <FormField
              control={reForm.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eleve *</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={studentsLoading ? "Chargement..." : "Selectionner un eleve"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.first_name} {s.last_name}
                          {s.enrollment_number ? ` (${s.enrollment_number})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStudent && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Nom complet</dt>
                    <dd className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</dd>
                    {selectedStudent.enrollment_number && (
                      <>
                        <dt className="text-muted-foreground">Matricule</dt>
                        <dd>{selectedStudent.enrollment_number}</dd>
                      </>
                    )}
                    {selectedStudent.genre && (
                      <>
                        <dt className="text-muted-foreground">Genre</dt>
                        <dd>{selectedStudent.genre === "M" ? "Masculin" : "Feminin"}</dd>
                      </>
                    )}
                    {selectedStudent.birth_date && (
                      <>
                        <dt className="text-muted-foreground">Date de naissance</dt>
                        <dd>{selectedStudent.birth_date}</dd>
                      </>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}

            <FormField
              control={reForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes optionnelles"
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      )}

      {/* Step 2: Class and fees */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choisissez la classe et la formule de frais.
          </p>

          {enrollmentType === "new" ? (
            <ClassAndFeesFields
              classes={classes}
              classesLoading={classesLoading}
              feeVariants={feeVariants ?? []}
              feeVariantsLoading={feeVariantsLoading}
              classId={newForm.watch("class_id")}
              feeVariantId={newForm.watch("fee_variant_id")}
              notes={newForm.watch("notes")}
              onClassChange={(id) => newForm.setValue("class_id", id, { shouldValidate: true })}
              onFeeVariantChange={(id) => newForm.setValue("fee_variant_id", id)}
              onNotesChange={(val) => newForm.setValue("notes", val)}
              classError={newForm.formState.errors.class_id?.message}
            />
          ) : (
            <ClassAndFeesFields
              classes={classes}
              classesLoading={classesLoading}
              feeVariants={feeVariants ?? []}
              feeVariantsLoading={feeVariantsLoading}
              classId={reForm.watch("class_id")}
              feeVariantId={reForm.watch("fee_variant_id")}
              notes={reForm.watch("notes")}
              onClassChange={(id) => reForm.setValue("class_id", id, { shouldValidate: true })}
              onFeeVariantChange={(id) => reForm.setValue("fee_variant_id", id)}
              onNotesChange={(val) => reForm.setValue("notes", val)}
              classError={reForm.formState.errors.class_id?.message}
            />
          )}
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verifiez les informations avant de valider.
          </p>

          <Card>
            <CardContent className="pt-4 pb-4 space-y-4">
              {/* Student info */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Eleve
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {enrollmentType === "new" ? (
                    <>
                      <dt className="text-muted-foreground">Nom</dt>
                      <dd className="font-medium">{newForm.getValues("first_name")} {newForm.getValues("last_name")}</dd>
                      {newForm.getValues("birth_date") && (
                        <>
                          <dt className="text-muted-foreground">Date de naissance</dt>
                          <dd>{newForm.getValues("birth_date")}</dd>
                        </>
                      )}
                      {newForm.getValues("genre") && (
                        <>
                          <dt className="text-muted-foreground">Genre</dt>
                          <dd>{newForm.getValues("genre") === "M" ? "Masculin" : "Feminin"}</dd>
                        </>
                      )}
                      {newForm.getValues("enrollment_number") && (
                        <>
                          <dt className="text-muted-foreground">Matricule</dt>
                          <dd>{newForm.getValues("enrollment_number")}</dd>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <dt className="text-muted-foreground">Nom</dt>
                      <dd className="font-medium">
                        {selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : `#${reForm.getValues("student_id")}`}
                      </dd>
                    </>
                  )}
                </dl>
              </div>

              {/* Parent info (new enrollment only) */}
              {enrollmentType === "new" && showParentFields && newForm.getValues("parent") && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-2">Parent</h4>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Nom</dt>
                      <dd>{newForm.getValues("parent.first_name")} {newForm.getValues("parent.last_name")}</dd>
                      {newForm.getValues("parent.phone") && (
                        <>
                          <dt className="text-muted-foreground">Telephone</dt>
                          <dd>{newForm.getValues("parent.phone")}</dd>
                        </>
                      )}
                      {newForm.getValues("parent.email") && (
                        <>
                          <dt className="text-muted-foreground">Email</dt>
                          <dd>{newForm.getValues("parent.email")}</dd>
                        </>
                      )}
                      <dt className="text-muted-foreground">Lien</dt>
                      <dd>
                        {RELATIONSHIP_TYPES.find(
                          (r) => r.value === newForm.getValues("parent.relationship_type")
                        )?.label ?? "Tuteur"}
                      </dd>
                    </dl>
                  </div>
                </>
              )}

              <Separator />

              {/* Class info */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Classe
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Classe</dt>
                  <dd className="font-medium">{selectedClassName || `#${watchedClassId}`}</dd>
                </dl>
              </div>

              {/* Fee info */}
              {selectedFeeVariant && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Frais
                    </h4>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Formule</dt>
                      <dd>{selectedFeeVariant.description ?? "Frais standard"}</dd>
                      <dt className="text-muted-foreground">Montant</dt>
                      <dd className="font-semibold text-primary">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(selectedFeeVariant.amount)}
                      </dd>
                    </dl>
                  </div>
                </>
              )}

              {/* Notes */}
              {enrollmentType === "re-enrollment" && reForm.getValues("notes") && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Notes</h4>
                    <p className="text-sm">{reForm.getValues("notes")}</p>
                  </div>
                </>
              )}
              {enrollmentType === "new" && newForm.getValues("notes") && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Notes</h4>
                    <p className="text-sm">{newForm.getValues("notes")}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Server errors */}
          {(createWithStudent.error || reEnroll.error) && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">
                {createWithStudent.error?.message || reEnroll.error?.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={step === 0 || isPending}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Precedent
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={step === 0 && !enrollmentType}
          >
            Suivant
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Enregistrement..." : "Enregistrer l'inscription"}
          </Button>
        )}
      </div>
    </div>
  )
}

// Shared fields for class selection, fee variant, and notes
// Used by both new enrollment and re-enrollment forms in step 2
interface ClassFeesFieldsProps {
  classes: Class[]
  classesLoading: boolean
  feeVariants: FeeVariantOption[]
  feeVariantsLoading: boolean
  classId: number | undefined
  feeVariantId: number | null | undefined
  notes: string | null | undefined
  onClassChange: (id: number) => void
  onFeeVariantChange: (id: number | null) => void
  onNotesChange: (val: string | null) => void
  classError?: string
}

function ClassAndFeesFields({
  classes,
  classesLoading,
  feeVariants,
  feeVariantsLoading,
  classId,
  feeVariantId,
  notes,
  onClassChange,
  onFeeVariantChange,
  onNotesChange,
  classError,
}: ClassFeesFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Classe *</label>
        <Select
          value={classId ? String(classId) : ""}
          onValueChange={(v) => {
            onClassChange(Number(v))
            onFeeVariantChange(null)
          }}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder={classesLoading ? "Chargement..." : "Selectionner une classe"} />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
                {c.max_students != null ? ` (max: ${c.max_students})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {classError && <p className="text-sm font-medium text-destructive">{classError}</p>}
      </div>

      {/* Fee variants loading */}
      {feeVariantsLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des frais...
        </div>
      )}

      {/* Fee variant cards */}
      {feeVariants.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Formule de frais</label>
          <div className="grid grid-cols-1 gap-2">
            {feeVariants.map((variant) => (
              <Card
                key={variant.id}
                className={cn(
                  "cursor-pointer transition-colors hover:border-primary/50",
                  feeVariantId === variant.id && "border-primary ring-2 ring-primary/20"
                )}
                onClick={() => onFeeVariantChange(variant.id)}
              >
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      feeVariantId === variant.id
                        ? "border-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {feeVariantId === variant.id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-sm">
                      {variant.description ?? "Frais standard"}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(variant.amount)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Notes</label>
        <Textarea
          placeholder="Notes optionnelles"
          className="resize-none"
          value={notes ?? ""}
          onChange={(e) => onNotesChange(e.target.value || null)}
        />
      </div>
    </div>
  )
}
