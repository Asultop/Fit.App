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
      <h3>轨迹地图预览</h3>
      <MapTrack :points="draft.points" :show-toolbar="true" />
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
        >
          <p class="point-title">点位 {{ index + 1 }}</p>
          <label>
            经度
            <input v-model.number="point.lng" type="number" step="0.000001" />
          </label>
          <label>
            纬度
            <input v-model.number="point.lat" type="number" step="0.000001" />
          </label>
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

import MapTrack from '@/components/MapTrack.vue'
import type { RootState } from '@/store'
import { cloneWorkout, type WorkoutData } from '@/types/workout'
import { calculateAverageSpeedKmh, calculateDistanceKm, roundTo } from '@/utils/metrics'
import { normalizeWorkoutData, workoutToJson } from '@/utils/json'

const store = useStore<RootState>()
const sourceWorkout = computed(() => store.getters.workout as WorkoutData)

const draft = reactive<WorkoutData>(cloneWorkout(sourceWorkout.value))
const statusMessage = ref('编辑完成后点击“保存 JSON”，将自动下载并同步展示页。')

watch(
  sourceWorkout,
  (nextWorkout) => {
    Object.assign(draft, cloneWorkout(nextWorkout))
  },
  { deep: true },
)

function addPoint(): void {
  const lastPoint = draft.points[draft.points.length - 1]

  draft.points.push({
    lng: roundTo(lastPoint ? lastPoint.lng + 0.002 : 116.397428, 6),
    lat: roundTo(lastPoint ? lastPoint.lat + 0.001 : 39.90923, 6),
    timestamp: new Date().toISOString(),
  })

  statusMessage.value = '已新增点位，可继续调整经纬度与时间。'
}

function removePoint(index: number): void {
  if (draft.points.length <= 2) {
    statusMessage.value = '轨迹至少需要保留两个点位。'
    return
  }

  draft.points.splice(index, 1)
  statusMessage.value = `已删除点位 ${index + 1}。`
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
  Object.assign(draft, cloneWorkout(sourceWorkout.value))
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
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(19, 26, 34, 0.12);
  backdrop-filter: blur(8px);
}

.toolbar-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 8px;
  background: #e5efff;
  color: #18324e;
  font-size: 13px;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(120deg, #f68b3e, #00a7a1);
  color: #fff;
}

.status-text {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: #1b334f;
  background: rgba(255, 255, 255, 0.76);
  border: 1px dashed rgba(27, 51, 79, 0.22);
}

.panel {
  border-radius: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(19, 26, 34, 0.1);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.05);
}

.panel h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #142d45;
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
  color: #2b3f54;
}

input {
  border: 1px solid #c8d5e8;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  color: #1d2935;
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
  background: #0e9a8f;
}

.point-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.point-item {
  border: 1px solid #d1d8e0;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
}

.point-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #1f3651;
}

.remove-btn {
  border: 0;
  border-radius: 8px;
  padding: 8px;
  color: #a01717;
  background: #ffe9e9;
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
