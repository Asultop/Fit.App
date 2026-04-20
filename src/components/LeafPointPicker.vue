<template>
  <div class="leaf-shell">
    <div ref="mapElement" class="leaf-canvas"></div>
    <p class="leaf-hint">地图点击会更新当前选中点位坐标，点击圆点可切换当前点。</p>
    <p v-if="mapError" class="leaf-error">{{ mapError }}</p>
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

interface PointUpdatePayload {
  index: number
  lng: number
  lat: number
}

const props = defineProps<{
  points: TrackPoint[]
  activeIndex: number
}>()

const emit = defineEmits<{
  (event: 'select-point', index: number): void
  (event: 'update-point', payload: PointUpdatePayload): void
}>()

const mapElement = ref<HTMLElement | null>(null)
const mapError = ref('')

let amap: AMapNamespace | null = null
let mapInstance: AMapMapInstance | null = null
let polylineLayer: AMapPolylineInstance | null = null
let markerLayers: AMapMarkerInstance[] = []
let hasFittedView = false

const defaultCenter: [number, number] = [126.50215136320409, 43.82136700270304]

function toPointUpdatePayload(index: number, lat: number, lng: number): PointUpdatePayload {
  return {
    index,
    lng: Math.round(lng * 1_000_000) / 1_000_000,
    lat: Math.round(lat * 1_000_000) / 1_000_000,
  }
}

function renderTrack(forceFit = false): void {
  if (!mapInstance || !amap) {
    return
  }

  if (polylineLayer) {
    mapInstance.remove(polylineLayer as unknown as object)
    polylineLayer = null
  }

  markerLayers.forEach((marker) => {
    mapInstance?.remove(marker as unknown as object)
  })
  markerLayers = []

  const path = pointsToPath(props.points)

  if (path.length > 1) {
    polylineLayer = new amap.Polyline({
      path,
      strokeColor: '#1f8bff',
      strokeWeight: 3,
      lineJoin: 'round',
      lineCap: 'round',
    })

    mapInstance.add(polylineLayer as unknown as object)
  }

  props.points.forEach((point, index) => {
    const isActive = index === props.activeIndex

    const marker = new amap.Marker({
      position: [point.lng, point.lat],
      offset: [-8, -8],
      content: `<div style="width:${isActive ? 16 : 12}px;height:${isActive ? 16 : 12}px;border-radius:999px;background:${isActive ? '#4db2ff' : '#8ac8ff'};border:${isActive ? '3px' : '2px'} solid ${isActive ? '#0c5fb2' : '#2f7cc7'};box-sizing:border-box;"></div>`,
    })

    marker.on('click', () => {
      emit('select-point', index)
    })

    mapInstance.add(marker as unknown as object)
    markerLayers.push(marker)
  })

  const shouldFit = forceFit || !hasFittedView
  if (!shouldFit) {
    return
  }

  if (path.length > 1 && polylineLayer) {
    mapInstance.setFitView([...markerLayers, polylineLayer].map((overlay) => overlay as unknown as object))
    hasFittedView = true
    return
  }

  if (path.length === 1) {
    mapInstance.setCenter(path[0])
    hasFittedView = true
    return
  }

  mapInstance.setCenter(defaultCenter)
  hasFittedView = true
}

function onMapClick(event: any): void {
  if (props.activeIndex < 0 || props.activeIndex >= props.points.length) {
    return
  }

  if (!event?.lnglat) {
    return
  }

  emit('update-point', toPointUpdatePayload(props.activeIndex, event.lnglat.lat, event.lnglat.lng))
}

onMounted(() => {
  if (!mapElement.value) {
    return
  }

  loadAmap()
    .then((amapNamespace) => {
      amap = amapNamespace

      mapInstance = new amapNamespace.Map(mapElement.value as HTMLElement, {
        zoom: 15,
        resizeEnable: true,
        viewMode: '2D',
        center: defaultCenter,
      })

      mapInstance.on('click', onMapClick)
      renderTrack(true)
    })
    .catch((error) => {
      mapError.value = error instanceof Error ? error.message : '高德地图加载失败。'
    })
})

watch(
  () => props.points,
  () => {
    renderTrack(false)
  },
  { deep: true },
)

watch(
  () => props.activeIndex,
  () => {
    renderTrack(false)
  },
)

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.off('click', onMapClick)
    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style scoped>
.leaf-shell {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(18, 43, 68, 0.15);
  background: #f4f9ff;
}

.leaf-canvas {
  width: 100%;
  min-height: 290px;
}

.leaf-hint {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  color: #30495f;
  background: rgba(255, 255, 255, 0.84);
  border-top: 1px solid rgba(17, 38, 58, 0.12);
}

.leaf-error {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  color: #b42318;
  background: rgba(255, 238, 238, 0.9);
  border-top: 1px solid rgba(180, 35, 24, 0.24);
}
</style>
