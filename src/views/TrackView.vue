<template>
  <section class="track-page">
    <header class="hero-card">
      <h2>运动轨迹</h2>
      <p>轨迹列表（一级菜单）</p>
    </header>

    <section class="list-card">
      <div class="list-header">
        <h3>轨迹列表</h3>
      </div>

      <div v-if="workouts.length" class="track-list">
        <button
          v-for="workoutItem in workouts"
          :key="workoutItem.id"
          class="track-item"
          type="button"
          @click="openTrackDetail(workoutItem.id)"
        >
          <div>
            <p class="track-title">{{ workoutItem.date }}</p>
            <p class="track-subtitle">{{ workoutItem.startTime }}</p>
          </div>
          <div class="track-stats">
            <span>{{ workoutItem.totalDistanceKm.toFixed(2) }} km</span>
            <span>{{ workoutItem.totalDurationMin.toFixed(0) }} 分钟</span>
          </div>
        </button>
      </div>
      <p v-else class="empty-text">暂无运动轨迹数据。</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

import type { RootState } from '@/store'
import type { WorkoutData } from '@/types/workout'

const store = useStore<RootState>()
const router = useRouter()

const workouts = computed(() => store.getters.workouts as WorkoutData[])
function openTrackDetail(workoutId: string): void {
  store.commit('selectWorkout', workoutId)
  void router.push({ name: 'track-detail', params: { id: workoutId } })
}
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

.list-card {
  border-radius: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(19, 26, 34, 0.12);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.05);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  color: #102638;
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.track-item {
  border: 1px solid rgba(27, 42, 58, 0.12);
  border-radius: 14px;
  padding: 12px 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.track-item:hover {
  border-color: rgba(18, 156, 147, 0.6);
  box-shadow: 0 10px 22px rgba(16, 48, 67, 0.12);
  transform: translateY(-1px);
}

.track-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #162b3c;
}

.track-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #516173;
}

.track-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  gap: 4px;
  color: #223547;
  font-weight: 600;
}

.empty-text {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  color: #4a5a6c;
  background: rgba(255, 255, 255, 0.75);
  border: 1px dashed rgba(32, 48, 64, 0.16);
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
