import { createStore } from 'vuex'

import { cloneWorkout, createDefaultWorkout, type TrackPoint, type WorkoutData } from '@/types/workout'
import { calculateAverageSpeedKmh, calculateDistanceKm, roundTo } from '@/utils/metrics'

export interface RootState {
  workout: WorkoutData
}

function normalizeForStore(workout: WorkoutData): WorkoutData {
  const points = workout.points.map((point) => ({
    lng: Number(point.lng),
    lat: Number(point.lat),
    timestamp: point.timestamp,
  }))

  const safeDuration = Math.max(Number(workout.totalDurationMin) || 1, 1)
  const safeDistance =
    Number(workout.totalDistanceKm) > 0 ? Number(workout.totalDistanceKm) : calculateDistanceKm(points)

  const safeSpeed =
    Number(workout.averageSpeedKmh) > 0
      ? Number(workout.averageSpeedKmh)
      : calculateAverageSpeedKmh(safeDistance, safeDuration)

  return {
    ...cloneWorkout(workout),
    points,
    totalDistanceKm: roundTo(safeDistance, 2),
    totalDurationMin: roundTo(safeDuration, 2),
    averageSpeedKmh: roundTo(safeSpeed, 2),
    cadenceSpm: roundTo(Math.max(Number(workout.cadenceSpm) || 0, 0), 0),
  }
}

const store = createStore<RootState>({
  state: {
    workout: normalizeForStore(createDefaultWorkout()),
  },
  getters: {
    workout: (state) => state.workout,
  },
  mutations: {
    setWorkout(state, payload: WorkoutData) {
      state.workout = normalizeForStore(payload)
    },
    mergeWorkout(state, payload: Partial<WorkoutData>) {
      state.workout = normalizeForStore({
        ...state.workout,
        ...payload,
      })
    },
    setTrackPoints(state, payload: TrackPoint[]) {
      state.workout = normalizeForStore({
        ...state.workout,
        points: payload,
      })
    },
    recalculateByPoints(state) {
      const distance = calculateDistanceKm(state.workout.points)
      const speed = calculateAverageSpeedKmh(distance, state.workout.totalDurationMin)

      state.workout = {
        ...state.workout,
        totalDistanceKm: distance,
        averageSpeedKmh: speed,
      }
    },
  },
})

export default store
