// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach(async (to, from) => {
  // 检查是否是从登录页跳转过来的
  const isFromLogin = from.path === '/login'
  
  // 需要登录才能访问的页面
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    const isAuthenticated = await authStore.verifyRefreshToken()
    if (!isAuthenticated) {
      return '/login'
    }
  }
  
  // 已登录用户访问登录/注册页面时，重定向到 dashboard
  if (to.meta.requiresGuest) {
    const authStore = useAuthStore()
    const isAuthenticated = await authStore.verifyRefreshToken()
    if (isAuthenticated) {
      return '/dashboard'
    }
  }
  
  // 根路径重定向逻辑：如果已登录，直接跳转到dashboard
  if (to.path === '/') {
    const authStore = useAuthStore()
    const isAuthenticated = await authStore.verifyRefreshToken()
    if (isAuthenticated) {
      return '/dashboard'
    } else {
      return '/login'
    }
  }
  
  // 允许访问
  return true
})

export default router