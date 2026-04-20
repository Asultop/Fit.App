import { createStore } from 'vuex'

import { cloneWorkout, type TrackPoint, type WorkoutData } from '@/types/workout'
import { loadWorkoutsFromFolder } from '@/utils/workout-folder'
import { calculateAverageSpeedKmh, calculateDistanceKm, roundTo } from '@/utils/metrics'

export interface RootState {
  workouts: WorkoutData[]
  selectedWorkoutId: string | null
  showAllTracks: boolean
}

const DISPLAY_RANGE_START = '2026-04-15'
const DISPLAY_RANGE_END = '2026-07-22'

function parseWorkoutDateTime(workout: WorkoutData): Date | null {
  const fallbackStartTime = '00:00'
  const dateTime = new Date(`${workout.date}T${workout.startTime || fallbackStartTime}:00`)

  if (Number.isNaN(dateTime.getTime())) {
    return null
  }

  return dateTime
}

function filterDisplayWorkouts(workouts: WorkoutData[], showAllTracks: boolean): WorkoutData[] {
  const rangeStart = new Date(`${DISPLAY_RANGE_START}T00:00:00`)
  const rangeEnd = new Date(`${DISPLAY_RANGE_END}T23:59:59`)
  const now = new Date()
  const effectiveEnd = showAllTracks
    ? rangeEnd
    : new Date(Math.min(rangeEnd.getTime(), now.getTime()))

  return workouts
    .map((workout) => ({
      workout,
      dateTime: parseWorkoutDateTime(workout),
    }))
    .filter(
      (item): item is { workout: WorkoutData; dateTime: Date } =>
        item.dateTime !== null && item.dateTime >= rangeStart && item.dateTime <= effectiveEnd,
    )
    .sort((left, right) => right.dateTime.getTime() - left.dateTime.getTime())
    .map((item) => item.workout)
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

const initialWorkouts = loadWorkoutsFromFolder().map((workout) => normalizeForStore(workout))
const firstWorkout = initialWorkouts[0] ?? null

const store = createStore<RootState>({
  state: {
    workouts: initialWorkouts,
    selectedWorkoutId: firstWorkout?.id ?? null,
    showAllTracks: false,
  },
  getters: {
    workouts: (state) => filterDisplayWorkouts(state.workouts, state.showAllTracks),
    showAllTracks: (state) => state.showAllTracks,
    selectedWorkout: (state, getters) => {
      const visibleWorkouts = getters.workouts as WorkoutData[]

      return (
        visibleWorkouts.find((workout) => workout.id === state.selectedWorkoutId) ??
        visibleWorkouts[0] ??
        null
      )
    },
  },
  mutations: {
    setWorkouts(state, payload: WorkoutData[]) {
      const normalized = payload.map((workout) => normalizeForStore(workout))
      state.workouts = normalized
      state.selectedWorkoutId = normalized[0]?.id ?? null
    },
    addWorkout(state, payload: WorkoutData) {
      const normalized = normalizeForStore(payload)
      state.workouts = [normalized, ...state.workouts]
      state.selectedWorkoutId = normalized.id
    },
    selectWorkout(state, workoutId: string) {
      state.selectedWorkoutId = workoutId
    },
    setShowAllTracks(state, payload: boolean) {
      state.showAllTracks = payload
    },
    setWorkout(state, payload: WorkoutData) {
      const normalized = normalizeForStore(payload)
      const index = state.workouts.findIndex((workout) => workout.id === normalized.id)

      if (index >= 0) {
        state.workouts.splice(index, 1, normalized)
      } else {
        state.workouts = [normalized, ...state.workouts]
      }

      state.selectedWorkoutId = normalized.id
    },
    mergeWorkout(state, payload: Partial<WorkoutData>) {
      const current =
        state.workouts.find((workout) => workout.id === state.selectedWorkoutId) ??
        state.workouts[0]

      if (!current) {
        return
      }

      const merged = normalizeForStore({
        ...current,
        ...payload,
      })

      const index = state.workouts.findIndex((workout) => workout.id === merged.id)
      if (index >= 0) {
        state.workouts.splice(index, 1, merged)
      }
    },
    setTrackPoints(state, payload: TrackPoint[]) {
      const current =
        state.workouts.find((workout) => workout.id === state.selectedWorkoutId) ??
        state.workouts[0]

      if (!current) {
        return
      }

      const updated = normalizeForStore({
        ...current,
        points: payload,
      })

      const index = state.workouts.findIndex((workout) => workout.id === updated.id)
      if (index >= 0) {
        state.workouts.splice(index, 1, updated)
      }
    },
    recalculateByPoints(state) {
      const current =
        state.workouts.find((workout) => workout.id === state.selectedWorkoutId) ??
        state.workouts[0]

      if (!current) {
        return
      }

      const distance = calculateDistanceKm(current.points)
      const speed = calculateAverageSpeedKmh(distance, current.totalDurationMin)

      const updated = {
        ...current,
        totalDistanceKm: distance,
        averageSpeedKmh: speed,
      }

      const index = state.workouts.findIndex((workout) => workout.id === updated.id)
      if (index >= 0) {
        state.workouts.splice(index, 1, normalizeForStore(updated))
      }
    },
  },
})

export default store
