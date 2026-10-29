import type { Subject } from "@/lib/contracts/subject"
import type { SubjectGroup } from "@/lib/contracts/subject-group"
import { matchesSearch } from "@/components/shared/multi-combobox-utils"
import { subjectTeachers } from "@/lib/utils/subject-teachers"

interface LevelOrder {
  id: number
  order?: number
}

export function groupSubjects(subjects: Subject[], levels: LevelOrder[]): SubjectGroup[] {
  const levelOrder = new Map(levels.map((level, index) => [level.id, level.order ?? index]))
  const map = new Map<string, SubjectGroup>()

  for (const subject of subjects) {
    const existing = map.get(subject.name)
    const isCatalogue = subject.level_id === null

    if (!existing) {
      map.set(subject.name, {
        name: subject.name,
        catalogue: isCatalogue ? subject : null,
        instances: isCatalogue ? [] : [subject],
        totalHours: isCatalogue ? 0 : subject.hours_per_week,
      })
    } else if (isCatalogue) {
      existing.catalogue = subject
    } else {
      existing.instances.push(subject)
      existing.totalHours += subject.hours_per_week
    }
  }

  for (const group of map.values()) {
    group.instances.sort(
      (a, b) => (levelOrder.get(a.level_id ?? 0) ?? 99) - (levelOrder.get(b.level_id ?? 0) ?? 99),
    )
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"))
}

export function filterSubjectGroups(
  groups: SubjectGroup[],
  query: string,
  levelFilter: string,
  teacherFilter: string,
): SubjectGroup[] {
  const needle = query.trim()
  return groups.filter((group) => {
    if (needle) {
      const matchName = matchesSearch(group.name, needle)
      const matchTeacher = group.instances.some((inst) =>
        subjectTeachers(inst).some((t) => matchesSearch(t.full_name, needle)),
      )
      if (!matchName && !matchTeacher) return false
    }

    if (levelFilter === "catalogue") {
      if (group.catalogue === null) return false
    } else if (levelFilter !== "all") {
      const lid = Number(levelFilter)
      if (!group.instances.some((inst) => inst.level_id === lid)) return false
    }

    if (teacherFilter === "with") {
      if (!group.instances.some((inst) => subjectTeachers(inst).length > 0)) return false
    } else if (teacherFilter === "without") {
      if (group.instances.length === 0) return false
      if (!group.instances.some((inst) => subjectTeachers(inst).length === 0)) return false
    }

    return true
  })
}