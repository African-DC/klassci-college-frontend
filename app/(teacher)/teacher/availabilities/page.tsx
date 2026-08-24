import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { MyAvailabilityClient } from "@/components/teacher/MyAvailabilityClient"

export const metadata = { title: "Mes disponibilités | KLASSCI" }

export default async function TeacherAvailabilitiesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  // Le backend resout l'enseignant depuis le jeton : aucune correspondance
  // user_id / teacher_profile.id n'est a faire ici.
  return <MyAvailabilityClient />
}
