<template>
  <article class="metric-card">
    <p class="metric-label">{{ label }}</p>
    <p class="metric-value">{{ value }}</p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
}>()
</script>

<style scoped>
.metric-card {
  background: #ffffff;
  border: 1px solid #d6d9de;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  margin: 0;
  color: #000;
  font-size: 14px;
  opacity: 0.7;
}

.metric-value {
  margin: 0;
  color: #000;
  font-size: 20px;
  font-weight: 700;
}
</style>
