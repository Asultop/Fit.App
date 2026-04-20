<template>
  <section class="detail-page">
    <header class="detail-header">
      <div class="detail-header-main">
        <button class="back-btn" type="button" @click="goBack"><</button>
        <div class="detail-title-wrap">
          <h2>轨迹详情</h2>
          <p v-if="selectedWorkout">{{ `${selectedWorkout.date} ${selectedWorkout.startTime}` }}</p>
          <p v-else>未找到对应轨迹，请返回列表重新选择。</p>
        </div>
      </div>
    </header>

    <section v-if="selectedWorkout" class="detail-body">
      <MapTrack :points="selectedWorkout.points" />

      <section class="metrics-grid">
        <MetricCard
          v-for="metric in metricItems"
          :key="metric.label"
          :label="metric.label"
          :value="metric.value"
        />
      </section>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import MapTrack from '@/components/MapTrack.vue'
import MetricCard from '@/components/MetricCard.vue'
import type { RootState } from '@/store'
import type { WorkoutData } from '@/types/workout'

const store = useStore<RootState>()
const route = useRoute()
const router = useRouter()

const workouts = computed(() => store.getters.workouts as WorkoutData[])
const selectedWorkout = computed(() => store.getters.selectedWorkout as WorkoutData | null)

const metricItems = computed(() => {
  if (!selectedWorkout.value) {
    return []
  }

  return [
    {
      label: '总距离',
      value: `${selectedWorkout.value.totalDistanceKm.toFixed(2)} km`,
    },
    {
      label: '总时间',
      value: `${selectedWorkout.value.totalDurationMin.toFixed(0)} 分钟`,
    },
    {
      label: '平均速度',
      value: `${selectedWorkout.value.averageSpeedKmh.toFixed(2)} km/h`,
    },
    {
      label: '步频',
      value: `${selectedWorkout.value.cadenceSpm.toFixed(0)} spm`,
    },
  ]
})

function selectByRouteId(): void {
  const routeId = String(route.params.id ?? '')
  const target = workouts.value.find((workout) => workout.id === routeId)

  if (!target) {
    return
  }

  if (selectedWorkout.value?.id !== target.id) {
    store.commit('selectWorkout', target.id)
  }
}

function goBack(): void {
  void router.push({ name: 'track' })
}

watch(
  () => route.params.id,
  () => {
    selectByRouteId()
  },
  { immediate: true },
)
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: page-fade 0.35s ease;
}

.detail-header {
  margin: 0;
  border-radius: 18px;
  padding: 16px;
  color: #0f2238;
  border: 1px solid rgba(15, 34, 56, 0.12);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 245, 232, 0.9));
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.detail-header-main {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.back-btn {
  border: 0;
  border-radius: 10px;
  min-width: 36px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #f79042, #12a89f);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

.detail-title-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detail-header h2 {
  margin: 0;
  font-size: 24px;
}

.detail-header p {
  margin: 8px 0 0;
  font-size: 14px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
