<template>
  <section class="editor-page">
    <div class="toolbar">
      <button class="toolbar-btn btn-primary" type="button" @click="saveJson">保存 JSON</button>
      <button class="toolbar-btn" type="button" @click="recalculateDistanceByPoints">
        按点位重算距离
      </button>
      <button class="toolbar-btn" type="button" @click="recalculateSpeedByDuration">
        按距离重算速度
      </button>
      <button class="toolbar-btn" type="button" @click="resetDraft">重置</button>
    </div>

    <p class="status-text">{{ statusMessage }}</p>

    <section class="panel">
      <h3>基础运动数据</h3>
      <div class="field-grid">
        <label>
          日期
          <input v-model="draft.date" type="date" />
        </label>
        <label>
          时间
          <input v-model="draft.startTime" type="time" />
        </label>
        <label>
          总距离 (km)
          <input v-model.number="draft.totalDistanceKm" type="number" min="0" step="0.01" />
        </label>
        <label>
          总时长 (min)
          <input v-model.number="draft.totalDurationMin" type="number" min="1" step="1" />
        </label>
        <label>
          平均速度 (km/h)
          <input v-model.number="draft.averageSpeedKmh" type="number" min="0" step="0.01" />
        </label>
        <label>
          步频 (spm)
          <input v-model.number="draft.cadenceSpm" type="number" min="0" step="1" />
        </label>
      </div>
    </section>

    <section class="panel">
      <h3>轨迹地图选点（Leaflet）</h3>
      <p class="map-tip">先在下方选中点位，再点击地图设置坐标。</p>
      <LeafPointPicker
        :points="draft.points"
        :active-index="activePointIndex"
        @select-point="setActivePoint"
        @update-point="updatePointByMap"
      />
    </section>

    <section class="panel">
      <div class="point-head">
        <h3>地图点位编辑</h3>
        <button class="add-point-btn" type="button" @click="addPoint">新增点位</button>
      </div>

      <div class="point-list">
        <article
          v-for="(point, index) in draft.points"
          :key="`${index}-${point.timestamp}`"
          class="point-item"
          :class="{ 'is-active': index === activePointIndex }"
        >
          <div class="point-head-row">
            <p class="point-title">点位 {{ index + 1 }}</p>
            <button class="pick-btn" type="button" @click="setActivePoint(index)">设为当前点</button>
          </div>
          <p class="point-coord">经度: {{ point.lng.toFixed(6) }}</p>
          <p class="point-coord">纬度: {{ point.lat.toFixed(6) }}</p>
          <label>
            时间
            <input v-model="point.timestamp" type="text" placeholder="2026-04-20T06:30:00" />
          </label>
          <button class="remove-btn" type="button" @click="removePoint(index)">删除该点</button>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'

import LeafPointPicker from '@/components/LeafPointPicker.vue'
import type { RootState } from '@/store'
import { cloneWorkout, createDefaultWorkout, type WorkoutData } from '@/types/workout'
import { calculateAverageSpeedKmh, calculateDistanceKm, roundTo } from '@/utils/metrics'
import { normalizeWorkoutData, workoutToJson } from '@/utils/json'

const store = useStore<RootState>()
const sourceWorkout = computed(() => store.getters.selectedWorkout as WorkoutData | null)
const fallbackWorkout = createDefaultWorkout()

const draft = reactive<WorkoutData>(cloneWorkout(sourceWorkout.value ?? fallbackWorkout))
const activePointIndex = ref(0)
const statusMessage = ref('编辑完成后点击“保存 JSON”，将自动下载并同步展示页。')

watch(
  sourceWorkout,
  (nextWorkout) => {
    if (!nextWorkout) {
      return
    }

    Object.assign(draft, cloneWorkout(nextWorkout))
    activePointIndex.value = 0
  },
  { deep: true },
)

function addPoint(): void {
  const lastPoint = draft.points[draft.points.length - 1]

  draft.points.push({
    lng: roundTo(lastPoint ? lastPoint.lng + 0.002 : 126.50215136320409, 6),
    lat: roundTo(lastPoint ? lastPoint.lat + 0.001 : 43.82136700270304, 6),
    timestamp: new Date().toISOString(),
  })

  activePointIndex.value = draft.points.length - 1

  statusMessage.value = '已新增点位，点击地图可设置该点坐标。'
}

function removePoint(index: number): void {
  if (draft.points.length <= 2) {
    statusMessage.value = '轨迹至少需要保留两个点位。'
    return
  }

  draft.points.splice(index, 1)

  if (activePointIndex.value >= draft.points.length) {
    activePointIndex.value = draft.points.length - 1
  }

  if (activePointIndex.value < 0) {
    activePointIndex.value = 0
  }

  statusMessage.value = `已删除点位 ${index + 1}。`
}

function setActivePoint(index: number): void {
  activePointIndex.value = index
  statusMessage.value = `已选中点位 ${index + 1}，点击地图可更新其坐标。`
}

function updatePointByMap(payload: { index: number; lng: number; lat: number }): void {
  const target = draft.points[payload.index]
  if (!target) {
    return
  }

  target.lng = roundTo(payload.lng, 6)
  target.lat = roundTo(payload.lat, 6)
  statusMessage.value = `点位 ${payload.index + 1} 坐标已更新。`
}

function recalculateDistanceByPoints(): void {
  draft.totalDistanceKm = roundTo(calculateDistanceKm(draft.points), 2)
  draft.averageSpeedKmh = roundTo(
    calculateAverageSpeedKmh(draft.totalDistanceKm, draft.totalDurationMin),
    2,
  )
  statusMessage.value = '已根据地图点位重新计算距离与平均速度。'
}

function recalculateSpeedByDuration(): void {
  draft.averageSpeedKmh = roundTo(
    calculateAverageSpeedKmh(draft.totalDistanceKm, draft.totalDurationMin),
    2,
  )
  statusMessage.value = '已根据距离和时长重新计算平均速度。'
}

function resetDraft(): void {
  Object.assign(draft, cloneWorkout(sourceWorkout.value ?? fallbackWorkout))
  activePointIndex.value = 0
  statusMessage.value = '已重置为当前已保存的轨迹数据。'
}

function triggerDownload(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()

  URL.revokeObjectURL(url)
}

function saveJson(): void {
  try {
    const normalized = normalizeWorkoutData(cloneWorkout(draft))
    store.commit('setWorkout', normalized)

    const output = workoutToJson(normalized)
    triggerDownload(output, `workout-${normalized.date}.json`)

    statusMessage.value = '保存成功，已下载 JSON 文件。'
  } catch (error) {
    statusMessage.value = error instanceof Error ? `保存失败：${error.message}` : '保存失败。'
  }
}
</script>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: rise-in 0.35s ease;
}

.toolbar {
  position: sticky;
  top: 6px;
  z-index: 4;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px;
  border-radius: 14px;
  background: var(--surface-glass);
  border: 1px solid var(--surface-border);
  backdrop-filter: blur(8px);
}

.toolbar-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 8px;
  background: var(--button-soft);
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
}

.btn-primary {
  background: var(--accent-gradient);
  color: #fff;
}

.status-text {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-strong);
  background: var(--surface-plain);
  border: 1px dashed var(--surface-dash-border);
}

.panel {
  border-radius: 16px;
  padding: 14px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
}

.panel h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--text-title);
}

.map-tip {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

input {
  border: 1px solid var(--input-border);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  color: var(--text-strong);
  background: #fff;
}

.point-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.add-point-btn {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  background: var(--accent-solid);
}

.point-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.point-item {
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
}

.point-item.is-active {
  border-color: rgba(21, 112, 201, 0.55);
  box-shadow: 0 6px 14px rgba(19, 76, 127, 0.12);
}

.point-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.point-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-title);
}

.pick-btn {
  border: 0;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--accent-gradient);
}

.point-coord {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.remove-btn {
  border: 0;
  border-radius: 8px;
  padding: 8px;
  color: var(--danger-text);
  background: var(--danger-soft);
  font-size: 13px;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
