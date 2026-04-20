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
let polylineInstance: AMapPolylineInstance | null = null
let startMarker: AMapMarkerInstance | null = null
let endMarker: AMapMarkerInstance | null = null
let pendingGeoRequest = false

const fallbackCenter: [number, number] = [126.50215136320409, 43.82136700270304]

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

function buildBezierPath(path: [number, number][]): [number, number][] {
  if (path.length < 2) {
    return path
  }

  const output: [number, number][] = [path[0]]

  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1]
    const to = path[index]
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const length = Math.hypot(dx, dy) || 1
    const midpoint: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]

    // 使用法线偏移构造二次贝塞尔控制点，让轨迹过渡更平滑。
    const bend = length * 0.16
    const control: [number, number] = [midpoint[0] + (-dy / length) * bend, midpoint[1] + (dx / length) * bend]

    for (let step = 1; step <= 4; step += 1) {
      const t = step / 4
      const oneMinusT = 1 - t
      const x = oneMinusT ** 2 * from[0] + 2 * oneMinusT * t * control[0] + t ** 2 * to[0]
      const y = oneMinusT ** 2 * from[1] + 2 * oneMinusT * t * control[1] + t ** 2 * to[1]
      output.push([x, y])
    }
  }

  return output
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
  if (!mapInstance || !polylineInstance || !amap) {
    return
  }

  const path = pointsToPath(props.points)
  const bezierPath = buildBezierPath(path)
  polylineInstance.setPath(bezierPath)

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
    const overlays: object[] = [polylineInstance as unknown as object]
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

    polylineInstance = new amap.Polyline({
      path: buildBezierPath(pointsToPath(props.points)),
      strokeColor: '#1677ff',
      strokeWeight: 2,
      lineJoin: 'round',
      lineCap: 'round',
    })

    mapInstance.add(polylineInstance)

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
