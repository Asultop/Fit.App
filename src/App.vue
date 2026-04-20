<template>
  <div class="app-shell" :data-section="activeSection">
    <template v-if="!isAccessRoute">
      <div class="ambient-orb ambient-orb-left"></div>
      <div class="ambient-orb ambient-orb-right"></div>

      <header class="app-header">
        <p class="app-brand">Fit</p>
        <p class="app-subtitle">轻简小跑</p>
      </header>
    </template>

    <main class="app-content">
      <RouterView />
    </main>

    <nav v-if="!isAccessRoute" class="bottom-nav">
      <RouterLink class="bottom-nav-link" to="/">运动</RouterLink>
      <RouterLink class="bottom-nav-link" to="/mine">我的</RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeSection = computed(() => (route.meta.section as string) ?? 'track')
const isAccessRoute = computed(() => route.name === 'access')
</script>

<style scoped>
.app-shell {
  position: relative;
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  padding: 12px 14px 90px;
  overflow: hidden;
  --accent-gradient: linear-gradient(135deg, #ff9f4a, #00a89d);
  --accent-solid: #0e9a8f;
  --button-soft: #e5efff;
  --text-strong: #18324e;
  --text-title: #142d45;
  --text-muted: #2b3f54;
  --surface-glass: rgba(255, 255, 255, 0.88);
  --surface-plain: rgba(255, 255, 255, 0.76);
  --surface-border: rgba(19, 26, 34, 0.12);
  --surface-dash-border: rgba(27, 51, 79, 0.22);
  --panel-bg: rgba(255, 255, 255, 0.86);
  --panel-border: rgba(19, 26, 34, 0.1);
  --panel-shadow: 0 8px 18px rgba(0, 0, 0, 0.05);
  --input-border: #c8d5e8;
  --card-border: #d1d8e0;
  --danger-text: #a01717;
  --danger-soft: #ffe9e9;
}

.app-shell[data-section='mine'] {
  --accent-gradient: linear-gradient(135deg, #2d8bff, #20c997);
  --accent-solid: #2d8bff;
  --button-soft: #e8f2ff;
  --text-strong: #13324b;
  --text-title: #0f2a3d;
  --text-muted: #335064;
  --surface-glass: rgba(255, 255, 255, 0.92);
  --surface-plain: rgba(255, 255, 255, 0.82);
  --surface-border: rgba(20, 44, 64, 0.14);
  --surface-dash-border: rgba(29, 63, 90, 0.24);
  --panel-bg: rgba(255, 255, 255, 0.9);
  --panel-border: rgba(22, 50, 72, 0.12);
  --panel-shadow: 0 10px 22px rgba(20, 48, 70, 0.08);
  --input-border: #c3d7f0;
  --card-border: #cbd6e3;
  --danger-text: #9a2c2c;
  --danger-soft: #ffecec;
}

.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(36px);
  opacity: 0.45;
  z-index: 0;
  animation: drift 7s ease-in-out infinite;
}

.ambient-orb-left {
  width: 160px;
  height: 160px;
  top: -40px;
  left: -40px;
  background: #ffc082;
}

.ambient-orb-right {
  width: 190px;
  height: 190px;
  top: 120px;
  right: -95px;
  background: #79d8ce;
  animation-delay: 1.5s;
}

.app-header {
  position: relative;
  z-index: 1;
  margin: 4px 0 12px;
}

.app-brand {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.app-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #3a4b5d;
}

.app-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  width: calc(100% - 28px);
  max-width: 402px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(19, 26, 34, 0.12);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  z-index: 3;
}

.bottom-nav-link {
  text-align: center;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 0;
  border-radius: 999px;
  color: #24415d;
  transition: all 0.2s ease;
}

.bottom-nav-link.router-link-active {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
}

@keyframes drift {
  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(12px);
  }
}

@media (max-width: 360px) {
  .app-shell {
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
