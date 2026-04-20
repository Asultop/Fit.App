import type { TrackPoint, WorkoutData } from '@/types/workout'
import { calculateAverageSpeedKmh, calculateDistanceKm, roundTo } from '@/utils/metrics'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseNumber(value: unknown, fieldName: string): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} 不是有效数字。`)
  }

  return parsed
}

function parsePoint(value: unknown, index: number): TrackPoint {
  if (!isRecord(value)) {
    throw new Error(`points[${index}] 不是对象。`)
  }

  const lng = parseNumber(value.lng, `points[${index}].lng`)
  const lat = parseNumber(value.lat, `points[${index}].lat`)
  const timestamp = typeof value.timestamp === 'string' ? value.timestamp : new Date().toISOString()

  return {
    lng,
    lat,
    timestamp,
  }
}

function parseDate(value: unknown): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  return new Date().toISOString().slice(0, 10)
}

function parseTime(value: unknown): string {
  if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
    return value
  }

  return '06:30'
}

export function normalizeWorkoutData(raw: unknown): WorkoutData {
  if (!isRecord(raw)) {
    throw new Error('JSON 根节点必须是对象。')
  }

  const pointsSource = Array.isArray(raw.points) ? raw.points : []
  const points = pointsSource.map((point, index) => parsePoint(point, index))

  if (points.length < 2) {
    throw new Error('points 至少要包含两个轨迹点。')
  }

  const totalDistanceKm =
    raw.totalDistanceKm !== undefined
      ? parseNumber(raw.totalDistanceKm, 'totalDistanceKm')
      : calculateDistanceKm(points)

  const totalDurationMin =
    raw.totalDurationMin !== undefined
      ? parseNumber(raw.totalDurationMin, 'totalDurationMin')
      : 1

  const averageSpeedKmh =
    raw.averageSpeedKmh !== undefined
      ? parseNumber(raw.averageSpeedKmh, 'averageSpeedKmh')
      : calculateAverageSpeedKmh(totalDistanceKm, totalDurationMin)

  const cadenceSpm =
    raw.cadenceSpm !== undefined ? parseNumber(raw.cadenceSpm, 'cadenceSpm') : 160

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : `workout-${Date.now()}`,
    date: parseDate(raw.date),
    startTime: parseTime(raw.startTime),
    totalDistanceKm: roundTo(Math.max(totalDistanceKm, 0), 2),
    totalDurationMin: roundTo(Math.max(totalDurationMin, 1), 2),
    averageSpeedKmh: roundTo(Math.max(averageSpeedKmh, 0), 2),
    cadenceSpm: roundTo(Math.max(cadenceSpm, 0), 0),
    points,
  }
}

export async function parseWorkoutFile(file: File): Promise<WorkoutData> {
  const text = await file.text()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('文件内容不是合法 JSON。')
  }

  return normalizeWorkoutData(parsed)
}

export function workoutToJson(workout: WorkoutData): string {
  return JSON.stringify(workout, null, 2)
}
