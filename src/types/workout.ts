export interface TrackPoint {
  lng: number
  lat: number
  timestamp: string
}

export interface WorkoutData {
  id: string
  date: string
  startTime: string
  totalDistanceKm: number
  totalDurationMin: number
  averageSpeedKmh: number
  cadenceSpm: number
  points: TrackPoint[]
}

const demoPoints: TrackPoint[] = [
  { lng: 120.1273, lat: 30.2741, timestamp: '2026-04-20T06:30:00' },
  { lng: 120.1316, lat: 30.2732, timestamp: '2026-04-20T06:34:00' },
  { lng: 120.1378, lat: 30.2718, timestamp: '2026-04-20T06:38:00' },
  { lng: 120.1412, lat: 30.2694, timestamp: '2026-04-20T06:42:00' },
  { lng: 120.1455, lat: 30.2671, timestamp: '2026-04-20T06:46:00' },
]

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `workout-${Date.now()}`
}

export function createDefaultWorkout(): WorkoutData {
  const today = new Date().toISOString().slice(0, 10)

  return {
    id: createId(),
    date: today,
    startTime: '06:30',
    totalDistanceKm: 5.2,
    totalDurationMin: 34,
    averageSpeedKmh: 9.18,
    cadenceSpm: 168,
    points: demoPoints.map((point) => ({ ...point })),
  }
}

export function cloneWorkout(source: WorkoutData): WorkoutData {
  return {
    ...source,
    points: source.points.map((point) => ({ ...point })),
  }
}
