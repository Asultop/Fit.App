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
  { lng: 126.502151, lat: 43.821367, timestamp: '2026-04-20T06:30:00' },
  { lng: 126.504951, lat: 43.822067, timestamp: '2026-04-20T06:34:00' },
  { lng: 126.507451, lat: 43.822667, timestamp: '2026-04-20T06:38:00' },
  { lng: 126.509951, lat: 43.821967, timestamp: '2026-04-20T06:42:00' },
  { lng: 126.511951, lat: 43.821167, timestamp: '2026-04-20T06:46:00' },
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
