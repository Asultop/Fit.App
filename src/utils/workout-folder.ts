import { createDefaultWorkout, type WorkoutData } from '@/types/workout'
import { normalizeWorkoutData } from '@/utils/json'

type TrackJsonModule = {
  default: unknown
}

const trackModules = import.meta.glob('../tracks/*.json', {
  eager: true,
}) as Record<string, TrackJsonModule>

function fileNameFromPath(path: string): string {
  const segments = path.split('/')
  const fileName = segments[segments.length - 1] ?? 'workout'
  return fileName.replace(/\.json$/i, '')
}

export function loadWorkoutsFromFolder(): WorkoutData[] {
  const entries = Object.entries(trackModules).sort(([left], [right]) => left.localeCompare(right))

  if (!entries.length) {
    return [createDefaultWorkout()]
  }

  const loadedWorkouts: WorkoutData[] = []
  const usedIds = new Set<string>()

  entries.forEach(([path, module], index) => {
    try {
      const normalized = normalizeWorkoutData(module.default)
      const idBase = normalized.id?.trim() || `${fileNameFromPath(path)}-${index + 1}`
      let uniqueId = idBase
      let seed = 1

      while (usedIds.has(uniqueId)) {
        uniqueId = `${idBase}-${seed}`
        seed += 1
      }

      usedIds.add(uniqueId)
      loadedWorkouts.push({
        ...normalized,
        id: uniqueId,
      })
    } catch (error) {
      console.warn(`[tracks] 跳过非法轨迹文件: ${path}`, error)
    }
  })

  if (!loadedWorkouts.length) {
    return [createDefaultWorkout()]
  }

  return loadedWorkouts
}
