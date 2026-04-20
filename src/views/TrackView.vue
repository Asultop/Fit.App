<template>
  <section class="track-page">
    <header class="hero-card">
      <h2>运动轨迹</h2>
      <p>{{ `${workout.date} ${workout.startTime}` }}</p>
    </header>

    <MapTrack :points="workout.points" @map-tap="handleMapTap" />

    <input
      ref="fileInputRef"
      class="hidden-input"
      type="file"
      accept="application/json"
      @change="handleFileChange"
    />

    <section class="metrics-grid">
      <MetricCard
        v-for="metric in metricItems"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useStore } from 'vuex'

import MapTrack from '@/components/MapTrack.vue'
import MetricCard from '@/components/MetricCard.vue'
import type { RootState } from '@/store'
import type { WorkoutData } from '@/types/workout'
import { parseWorkoutFile } from '@/utils/json'

const store = useStore<RootState>()
const fileInputRef = ref<HTMLInputElement | null>(null)

let tapCounter = 0
let tapTimer = 0

const workout = computed(() => store.getters.workout as WorkoutData)

const metricItems = computed(() => [
  {
    label: '总距离',
    value: `${workout.value.totalDistanceKm.toFixed(2)} km`,
  },
  {
    label: '总时间',
    value: `${workout.value.totalDurationMin.toFixed(0)} 分钟`,
  },
  {
    label: '平均速度',
    value: `${workout.value.averageSpeedKmh.toFixed(2)} km/h`,
  },
  {
    label: '步频',
    value: `${workout.value.cadenceSpm.toFixed(0)} spm`,
  },
])

function handleMapTap(): void {
  // 700ms 内累计 3 次点击，触发导入文件动作。
  tapCounter += 1
  window.clearTimeout(tapTimer)

  tapTimer = window.setTimeout(() => {
    tapCounter = 0
  }, 700)

  if (tapCounter === 3) {
    tapCounter = 0
    window.clearTimeout(tapTimer)
    fileInputRef.value?.click()
  }
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  try {
    const importedWorkout = await parseWorkoutFile(file)
    store.commit('setWorkout', importedWorkout)
  } catch (error) {
    console.error('导入运动轨迹失败：', error)
  } finally {
    input.value = ''
  }
}

onBeforeUnmount(() => {
  window.clearTimeout(tapTimer)
})
</script>

<style scoped>
.track-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: page-fade 0.35s ease;
}

.hero-card {
  margin: 0;
  border-radius: 18px;
  padding: 16px;
  color: #0f2238;
  border: 1px solid rgba(15, 34, 56, 0.12);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 245, 232, 0.9));
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.hero-card h2 {
  margin: 0;
  font-size: 24px;
}

.hero-card p {
  margin: 8px 0 0;
  font-size: 14px;
}

.hidden-input {
  display: none;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@keyframes page-fade {
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
