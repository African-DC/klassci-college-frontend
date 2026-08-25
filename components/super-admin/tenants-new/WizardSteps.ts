import { z } from "zod"

export const wizardSchema = z.object({
  tenant_slug: z
    .string()
    .min(2, "2 caractères min")
    .max(63, "63 caractères max")
    .regex(/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, "minuscules + chiffres + tirets"),
  school_name: z.string().min(1, "Nom requis").max(255),
  admin_email: z.string().email("Email invalide"),
  admin_password: z.string().min(8, "8 caractères min"),
  school_address: z.string().optional(),
  school_phone: z.string().optional(),
  school_email: z.string().email("Email invalide").or(z.literal("")).optional(),
  ministry_code: z.string().optional(),
})

export type WizardData = z.infer<typeof wizardSchema>

export const STEPS = [
  {
    id: "school",
    title: "Établissement",
    description: "Identifiant tenant et nom public de l'établissement",
    fields: ["tenant_slug", "school_name"] as const,
  },
  {
    id: "admin",
    title: "Administrateur",
    description: "Compte de connexion initial",
    fields: ["admin_email", "admin_password"] as const,
  },
  {
    id: "optional",
    title: "Détails optionnels",
    description: "Adresse, téléphone, email et code ministère",
    fields: ["school_address", "school_phone", "school_email", "ministry_code"] as const,
  },
  {
    id: "review",
    title: "Vérification",
    description: "Contrôle final avant provisioning",
    fields: [] as const,
  },
] as const

export type StepId = (typeof STEPS)[number]["id"]
