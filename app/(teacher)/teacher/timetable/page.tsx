import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { TeacherScheduleClient } from "@/components/teacher/TeacherScheduleClient"

export const metadata = { title: "Mon emploi du temps | KLASSCI" }

export default async function TeacherTimetablePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  // The client component fetches /teacher/schedule which resolves the
  // teacher profile from the JWT — no user_id↔teacher_profile.id mapping
  // is needed here. Previously this page passed session.user.id as the
  // teacher_id, which was the User PK (not the TeacherProfile PK) and
  // caused the schedule to always render empty.
  return <TeacherScheduleClient />
}
