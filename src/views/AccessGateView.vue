<template>
  <section class="gate-page">
    <div class="gate-card">
      <p class="gate-kicker">Fit Security</p>
      <h1>请输入访问密码</h1>
      <p class="gate-description">仅输入正确密码后才可访问运动轨迹网站。</p>

      <form class="gate-form" @submit.prevent="handleSubmit">
        <label for="gate-password">访问密码</label>
        <input
          id="gate-password"
          v-model="password"
          type="password"
          autocomplete="off"
          placeholder="请输入密码"
        />

        <p v-if="errorMessage" class="gate-error">{{ errorMessage }}</p>

        <button type="submit">进入网站</button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ACCESS_PASSWORD, grantAccess } from '@/utils/access'

const route = useRoute()
const router = useRouter()

const password = ref('')
const errorMessage = ref('')

function getRedirectPath(): string {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }

  return '/'
}

function handleSubmit(): void {
  if (password.value === ACCESS_PASSWORD) {
    grantAccess()
    errorMessage.value = ''
    void router.replace(getRedirectPath())
    return
  }

  errorMessage.value = '密码错误，请重新输入。'
}
</script>

<style scoped>
.gate-page {
  min-height: calc(100vh - 24px);
  display: grid;
  place-items: center;
  padding: 18px 8px;
}

.gate-card {
  width: 100%;
  border-radius: 18px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(24, 47, 68, 0.14);
  box-shadow: 0 14px 30px rgba(16, 35, 51, 0.12);
}

.gate-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1f6d84;
  font-weight: 700;
}

h1 {
  margin: 10px 0 6px;
  font-size: 24px;
  line-height: 1.25;
  color: #13283b;
}

.gate-description {
  margin: 0;
  color: #375167;
  font-size: 13px;
}

.gate-form {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 13px;
  color: #26415a;
  font-weight: 600;
}

input {
  height: 44px;
  border-radius: 10px;
  border: 1px solid #bdd0df;
  padding: 0 12px;
  font-size: 14px;
  color: #102538;
}

input:focus {
  outline: 2px solid rgba(45, 139, 255, 0.28);
  border-color: #2d8bff;
}

.gate-error {
  margin: 2px 0;
  font-size: 12px;
  color: #b3261e;
}

button {
  margin-top: 6px;
  height: 44px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  background: linear-gradient(135deg, #2d8bff, #15b79e);
}
</style>
