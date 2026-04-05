import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { TeacherScheduleClient } from "@/components/teacher/TeacherScheduleClient"

export const metadata = { title: "Mon emploi du temps | KLASSCI" }

export default async function TeacherTimetablePage() {
  const session = await auth()
  const teacherId = session?.user?.id ? Number(session.user.id) : 0

  if (!teacherId) {
    redirect("/login")
  }

  return <TeacherScheduleClient teacherId={teacherId} />
}
