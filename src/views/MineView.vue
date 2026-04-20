<template>
  <section class="mine-page">
    <section class="profile-card">
      <div class="name-row">
        <button class="profile-name" type="button" @click="handleNameTap">AsulTop</button>
        <span class="vip-tag">轻享VIP</span>
      </div>
      <div class="avatar" aria-label="用户头像">赵哲</div>
      <p class="bio">稳定训练、平稳配速</p>
    </section>

    <section class="feature-card">
      <h3>功能</h3>
      <div class="feature-list">
        <button class="feature-item" type="button">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <rect x="8" y="10" width="32" height="26" rx="7" fill="#4d9cff" />
            <rect x="14" y="16" width="20" height="3" rx="1.5" fill="#ffffff" />
            <rect x="14" y="22" width="14" height="3" rx="1.5" fill="#dfefff" />
          </svg>
          <span>我的课程</span>
        </button>
        <button class="feature-item" type="button">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 8l14 6v9c0 8.6-6.2 14.5-14 17-7.8-2.5-14-8.4-14-17v-9l14-6z" fill="#1eb89c" />
            <path d="M18 23l4 4 8-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>我的权益</span>
        </button>
        <button class="feature-item" type="button">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <rect x="9" y="25" width="6" height="12" rx="2" fill="#6aa8ff" />
            <rect x="18" y="19" width="6" height="18" rx="2" fill="#3d8dff" />
            <rect x="27" y="13" width="6" height="24" rx="2" fill="#2078f6" />
            <path d="M10 14l8-5 7 4 13-5" fill="none" stroke="#ff9f4a" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <span>历史排名</span>
        </button>
        <button class="feature-item" type="button">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="14" fill="#f49b45" />
            <circle cx="24" cy="24" r="6" fill="#fff4e8" />
            <path d="M24 10v4M24 34v4M10 24h4M34 24h4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <span>体测工具</span>
        </button>
      </div>
    </section>

    <section class="logout-box">
      <button class="logout-link" type="button" @click="handleLogout">退出系统</button>
    </section>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import { clearAccess } from '@/utils/access'

const router = useRouter()
let tapCounter = 0
let tapTimer = 0

function handleNameTap(): void {
  tapCounter += 1
  window.clearTimeout(tapTimer)

  tapTimer = window.setTimeout(() => {
    tapCounter = 0
  }, 700)

  if (tapCounter >= 3) {
    tapCounter = 0
    window.clearTimeout(tapTimer)
    void router.push({ name: 'editor' })
  }
}

function handleLogout(): void {
  clearAccess()
  void router.replace({
    path: '/access',
    query: {
      redirect: '/mine',
    },
  })
}
</script>

<style scoped>
.mine-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: rise-in 0.35s ease;
}

.profile-card,
.feature-card {
  border-radius: 16px;
  padding: 14px;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.6), rgba(237, 247, 255, 0.4));
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(14px) saturate(130%);
}

.feature-card {
  background: linear-gradient(165deg, rgba(245, 252, 255, 0.54), rgba(230, 243, 255, 0.34));
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-name {
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  color: var(--text-title);
  font-size: 18px;
  font-weight: 700;
}

.vip-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #00000077;
  background: #e799b098;
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  background: var(--accent-gradient);
  box-shadow: 0 8px 16px rgba(22, 64, 103, 0.2);
}

.bio {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.feature-card h3 {
  margin: 0 0 10px;
  color: var(--text-title);
  font-size: 16px;
}

.feature-list {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.feature-list::-webkit-scrollbar {
  display: none;
}

.feature-item {
  border: 1px solid var(--card-border);
  border-radius: 12px;
  width: 74px;
  height: 74px;
  flex: 0 0 auto;
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-strong);
  background: linear-gradient(165deg, #ffffff, #f2f8ff);
}

.feature-item svg {
  width: 24px;
  height: 24px;
}

.feature-item span {
  line-height: 1.2;
}

.logout-box {
  border-radius: 12px;
  border: 1px solid rgba(180, 35, 24, 0.25);
  background: rgba(220, 38, 38, 0.1);
  padding: 8px;
}

.logout-link {
  width: 100%;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #b42318;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  padding: 8px 0;
}

.hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-muted);
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
