import type { TrackPoint } from '@/types/workout'

const EARTH_RADIUS_KM = 6371

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

export function roundTo(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

// 使用 Haversine 公式计算两点球面距离。
function haversineDistanceKm(from: TrackPoint, to: TrackPoint): number {
  const latDistance = toRadians(to.lat - from.lat)
  const lngDistance = toRadians(to.lng - from.lng)

  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDistance / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

export function calculateDistanceKm(points: TrackPoint[]): number {
  if (points.length < 2) {
    return 0
  }

  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    total += haversineDistanceKm(points[index - 1], points[index])
  }

  return roundTo(total, 2)
}

export function calculateAverageSpeedKmh(distanceKm: number, durationMin: number): number {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(durationMin) || durationMin <= 0) {
    return 0
  }

  return roundTo(distanceKm / (durationMin / 60), 2)
}
