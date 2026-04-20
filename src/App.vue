<template>
  <div class="app-shell">
    <div class="ambient-orb ambient-orb-left"></div>
    <div class="ambient-orb ambient-orb-right"></div>

    <header class="app-header">
      <p class="app-brand">Fit-Web</p>
      <p class="app-subtitle">移动端运动轨迹管理</p>
    </header>

    <main class="app-content">
      <RouterView />
    </main>

    <nav class="bottom-nav">
      <RouterLink class="bottom-nav-link" to="/">轨迹</RouterLink>
      <RouterLink class="bottom-nav-link" to="/editor">编辑</RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-shell {
  position: relative;
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  padding: 12px 14px 90px;
  overflow: hidden;
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
  background: linear-gradient(135deg, #ff9f4a, #00a89d);
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
