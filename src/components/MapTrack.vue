<template>
  <div class="map-shell" @click="emit('map-tap')">
    <div ref="mapElement" class="map-canvas"></div>
    <div v-if="mapError" class="map-message map-error">{{ mapError }}</div>
    <div v-else-if="points.length < 2" class="map-message">
      请至少提供两个轨迹点以展示路线。
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  loadAmap,
  pointsToPath,
  type AMapMapInstance,
  type AMapMarkerInstance,
  type AMapNamespace,
  type AMapPath,
  type AMapPolylineInstance,
} from '@/services/amap'
import type { TrackPoint } from '@/types/workout'

const props = withDefaults(
  defineProps<{
    points: TrackPoint[]
    showToolbar?: boolean
  }>(),
  {
    showToolbar: false,
  },
)

const emit = defineEmits<{
  (event: 'map-tap'): void
}>()

const mapElement = ref<HTMLElement | null>(null)
const mapError = ref('')

let amap: AMapNamespace | null = null
let mapInstance: AMapMapInstance | null = null
let routePolylines: AMapPolylineInstance[] = []
let startMarker: AMapMarkerInstance | null = null
let endMarker: AMapMarkerInstance | null = null
let pendingGeoRequest = false

const fallbackCenter: [number, number] = [126.50215136320409, 43.82136700270304]
const ROUTE_LINE_WIDTH = 6

type ColoredRouteSegment = {
  color: string
  path: AMapPath[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function haversineDistanceKm(from: AMapPath, to: AMapPath): number {
  const earthRadiusKm = 6371
  const latDistance = toRadians(to[1] - from[1])
  const lngDistance = toRadians(to[0] - from[0])

  const fromLat = toRadians(from[1])
  const toLat = toRadians(to[1])

  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDistance / 2) ** 2

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function parseTimestamp(value: string): number | null {
  const parsed = Date.parse(value)

  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed
}

function segmentSpeedKmh(from: TrackPoint, to: TrackPoint): number {
  const distanceKm = haversineDistanceKm([from.lng, from.lat], [to.lng, to.lat])
  const fromTimestamp = parseTimestamp(from.timestamp)
  const toTimestamp = parseTimestamp(to.timestamp)

  if (fromTimestamp !== null && toTimestamp !== null && toTimestamp > fromTimestamp) {
    const durationHours = (toTimestamp - fromTimestamp) / 3_600_000
    if (durationHours > 0) {
      return clamp(distanceKm / durationHours, 4, 16)
    }
  }

  return 9
}

function smoothSegmentSpeeds(points: TrackPoint[]): number[] {
  if (points.length < 2) {
    return []
  }

  const rawSpeeds: number[] = []

  for (let index = 1; index < points.length; index += 1) {
    rawSpeeds.push(segmentSpeedKmh(points[index - 1], points[index]))
  }

  return rawSpeeds.map((speed, index) => {
    const previous = rawSpeeds[index - 1] ?? speed
    const next = rawSpeeds[index + 1] ?? speed
    return clamp(previous * 0.25 + speed * 0.5 + next * 0.25, 4, 16)
  })
}

function speedToColor(speedKmh: number): string {
  if (speedKmh < 8.5) {
    return '#1d4ed8'
  }

  if (speedKmh < 9.5) {
    return '#0e9f87'
  }

  if (speedKmh < 10.5) {
    return '#f59e0b'
  }

  return '#e5484d'
}

function cornerIntensity(previous: AMapPath, current: AMapPath, next: AMapPath): number {
  const incomingX = current[0] - previous[0]
  const incomingY = current[1] - previous[1]
  const outgoingX = next[0] - current[0]
  const outgoingY = next[1] - current[1]

  const incomingLength = Math.hypot(incomingX, incomingY)
  const outgoingLength = Math.hypot(outgoingX, outgoingY)

  if (incomingLength < 1e-8 || outgoingLength < 1e-8) {
    return 0
  }

  const cosine = clamp(
    (incomingX * outgoingX + incomingY * outgoingY) / (incomingLength * outgoingLength),
    -1,
    1,
  )

  return Math.acos(cosine) / Math.PI
}

function cubicBezierAt(
  p0: AMapPath,
  p1: AMapPath,
  p2: AMapPath,
  p3: AMapPath,
  t: number,
): AMapPath {
  const oneMinusT = 1 - t

  return [
    oneMinusT ** 3 * p0[0] +
      3 * oneMinusT ** 2 * t * p1[0] +
      3 * oneMinusT * t ** 2 * p2[0] +
      t ** 3 * p3[0],
    oneMinusT ** 3 * p0[1] +
      3 * oneMinusT ** 2 * t * p1[1] +
      3 * oneMinusT * t ** 2 * p2[1] +
      t ** 3 * p3[1],
  ]
}

function buildBezierSegmentPath(path: AMapPath[], segmentIndex: number): AMapPath[] {
  const previous = path[segmentIndex - 1] ?? path[segmentIndex]
  const current = path[segmentIndex]
  const next = path[segmentIndex + 1]
  const nextNext = path[segmentIndex + 2] ?? next

  const currentTurn = cornerIntensity(previous, current, next)
  const nextTurn = cornerIntensity(current, next, nextNext)

  const baseTension = 1 / 6
  const cornerTensionBoost = 0.75
  const control1Scale = baseTension * (1 + currentTurn * cornerTensionBoost)
  const control2Scale = baseTension * (1 + nextTurn * cornerTensionBoost)

  const control1: AMapPath = [
    current[0] + (next[0] - previous[0]) * control1Scale,
    current[1] + (next[1] - previous[1]) * control1Scale,
  ]

  const control2: AMapPath = [
    next[0] - (nextNext[0] - current[0]) * control2Scale,
    next[1] - (nextNext[1] - current[1]) * control2Scale,
  ]

  const segmentDistance = Math.hypot(next[0] - current[0], next[1] - current[1])
  const samples = Math.min(
    42,
    Math.max(12, Math.round(12 + segmentDistance * 2600 + (currentTurn + nextTurn) * 12)),
  )

  const sampledPath: AMapPath[] = [current]

  for (let step = 1; step <= samples; step += 1) {
    sampledPath.push(cubicBezierAt(current, control1, control2, next, step / samples))
  }

  return sampledPath
}

function buildColoredSegments(path: AMapPath[], segmentSpeeds: number[]): ColoredRouteSegment[] {
  if (path.length < 2) {
    return []
  }

  const groupedSegments: ColoredRouteSegment[] = []

  for (let segmentIndex = 0; segmentIndex < path.length - 1; segmentIndex += 1) {
    const segmentPath = buildBezierSegmentPath(path, segmentIndex)
    const color = speedToColor(segmentSpeeds[segmentIndex] ?? 9)

    const previousGroup = groupedSegments[groupedSegments.length - 1]
    if (previousGroup && previousGroup.color === color) {
      previousGroup.path.push(...segmentPath.slice(1))
    } else {
      groupedSegments.push({
        color,
        path: segmentPath,
      })
    }
  }

  return groupedSegments
}

function clearRoutePolylines(): void {
  if (!mapInstance) {
    routePolylines = []
    return
  }

  routePolylines.forEach((polyline) => {
    mapInstance?.remove(polyline as unknown as object)
  })

  routePolylines = []
}

function shouldUseFallbackCenter(): boolean {
  return props.points.length < 2
}

function createEndpointMarker(
  position: [number, number],
  label: '起' | '终',
): AMapMarkerInstance | null {
  if (!amap) {
    return null
  }

  const color = label === '起' ? '#138a4b' : '#d4382d'

  return new amap.Marker({
    position,
    offset: [-12, -12],
    content: `<div style="width:24px;height:24px;border-radius:999px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 4px 10px rgba(0,0,0,0.2);">${label}</div>`,
  })
}

function updateCenter(center: [number, number]): void {
  if (!mapInstance) {
    return
  }

  mapInstance.setCenter(center)
}

function requestCurrentLocation(): void {
  if (!mapInstance || pendingGeoRequest || !navigator.geolocation) {
    if (mapInstance) {
      updateCenter(fallbackCenter)
    }
    return
  }

  pendingGeoRequest = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      pendingGeoRequest = false
      updateCenter([position.coords.longitude, position.coords.latitude])
    },
    () => {
      pendingGeoRequest = false
      updateCenter(fallbackCenter)
    },
    { enableHighAccuracy: true, timeout: 5000 },
  )
}

function updatePolyline(): void {
  if (!mapInstance || !amap) {
    return
  }

  const path = pointsToPath(props.points)
  const segmentSpeeds = smoothSegmentSpeeds(props.points)
  const coloredSegments = buildColoredSegments(path, segmentSpeeds)

  clearRoutePolylines()

  coloredSegments.forEach((segment) => {
    const polyline = new amap!.Polyline({
      path: segment.path,
      strokeColor: segment.color,
      strokeWeight: ROUTE_LINE_WIDTH,
      lineJoin: 'round',
      lineCap: 'round',
    })

    routePolylines.push(polyline)
    mapInstance?.add(polyline as unknown as object)
  })

  if (startMarker) {
    mapInstance.remove(startMarker as unknown as object)
    startMarker = null
  }

  if (endMarker) {
    mapInstance.remove(endMarker as unknown as object)
    endMarker = null
  }

  if (path.length > 0) {
    startMarker = createEndpointMarker(path[0], '起')
    if (startMarker) {
      mapInstance.add(startMarker as unknown as object)
    }
  }

  if (path.length > 1) {
    endMarker = createEndpointMarker(path[path.length - 1], '终')
    if (endMarker) {
      mapInstance.add(endMarker as unknown as object)
    }
  }

  if (path.length > 1) {
    const overlays: object[] = routePolylines.map((polyline) => polyline as unknown as object)
    if (startMarker) {
      overlays.push(startMarker as unknown as object)
    }
    if (endMarker) {
      overlays.push(endMarker as unknown as object)
    }

    mapInstance.setFitView(overlays)
  } else if (shouldUseFallbackCenter()) {
    requestCurrentLocation()
  }
}

async function initMap(): Promise<void> {
  if (!mapElement.value) {
    return
  }

  try {
    amap = await loadAmap()
    const centerPoint = props.points[0]

    mapInstance = new amap.Map(mapElement.value, {
      zoom: 14,
      resizeEnable: true,
      viewMode: '2D',
      center: centerPoint ? [centerPoint.lng, centerPoint.lat] : fallbackCenter,
    })

    if (props.showToolbar) {
      mapInstance.addControl(new amap.ToolBar())
    }

    updatePolyline()
    if (shouldUseFallbackCenter()) {
      requestCurrentLocation()
    }
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '地图初始化失败。'
  }
}

watch(
  () => props.points,
  () => {
    updatePolyline()
    if (shouldUseFallbackCenter()) {
      requestCurrentLocation()
    }
  },
  { deep: true },
)

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  if (mapInstance) {
    clearRoutePolylines()

    if (startMarker) {
      mapInstance.remove(startMarker as unknown as object)
      startMarker = null
    }

    if (endMarker) {
      mapInstance.remove(endMarker as unknown as object)
      endMarker = null
    }

    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style scoped>
.map-shell {
  position: relative;
  min-height: 260px;
  border-radius: 18px;
  overflow: hidden;
  background: #e6edf8;
  border: 1px solid rgba(19, 26, 34, 0.12);
}

.map-canvas {
  width: 100%;
  min-height: 260px;
}

.map-message {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: #1e2936;
  background: rgba(255, 255, 255, 0.9);
  pointer-events: none;
}

.map-error {
  color: #b42318;
  border: 1px solid rgba(180, 35, 24, 0.25);
}
</style>
