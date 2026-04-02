<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard">
    <h1>欢迎回来！</h1>
    <p>你已成功登录</p>
    <button @click="handleLogout" class="logout-btn">退出登录</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
}

h1 {
  color: #333;
  margin-bottom: 16px;
}

.logout-btn {
  margin-top: 24px;
  padding: 10px 24px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #c53030;
}
</style>