import { DicteeMode } from "@/components/teacher/grades/DicteeMode"

interface DicteePageProps {
  params: Promise<{ classId: string; evaluationId: string }>
}

export const metadata = { title: "Mode dictée — KLASSCI" }

export default async function DicteePage({ params }: DicteePageProps) {
  const { classId, evaluationId } = await params
  return (
    <DicteeMode
      classId={Number(classId)}
      evaluationId={Number(evaluationId)}
    />
  )
}
