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

function updatePolyline(): void {
  if (!mapInstance || !polylineInstance) {
    return
  }

  const path = pointsToPath(props.points)
  polylineInstance.setPath(path)

  if (path.length > 1) {
    mapInstance.setFitView([polylineInstance as unknown as object])
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
      center: centerPoint ? [centerPoint.lng, centerPoint.lat] : [116.397428, 39.90923],
    })

    polylineInstance = new amap.Polyline({
      path: pointsToPath(props.points),
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
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '地图初始化失败。'
  }
}

watch(
  () => props.points,
  () => {
    updatePolyline()
  },
  { deep: true },
)

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  if (mapInstance) {
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
