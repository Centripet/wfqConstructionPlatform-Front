// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// 路由规则 次序优先匹配 先覆盖后
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard.vue'),
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

const verifyAndCache = async () => {
    const authStore = useAuthStore()
    const now = Date.now()
    // 如果5分钟内验证过，且状态为true，则直接返回true，不发起请求
    if (authStore.isLoggedIn && (now - authStore.lastVerified) < 5 * 60 * 1000) {
        return true
    }
    // 否则，调用后端接口验证
    const isValid = await authStore.verifyRefreshToken()
    if (isValid) {
        authStore.isLoggedIn = true
        authStore.lastVerified = now
    } else {
        authStore.isLoggedIn = false
    }
    return isValid
}

// 全局前置守卫
router.beforeEach(async (to, from) => {
  // 检查是否是从登录页跳转过来的
  const isFromLogin = from.path === '/login'
  
  // 需要登录才能访问的页面
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    // const isAuthenticated = await authStore.verifyRefreshToken()
    const isAuthenticated = await verifyAndCache()
    if (!isAuthenticated) {
      return '/login'
    }
  }
  
  // 已登录用户访问登录/注册页面时，重定向到 dashboard
  if (to.meta.requiresGuest) {
    const authStore = useAuthStore()
    const isAuthenticated = await verifyAndCache()
    if (isAuthenticated) {
      return '/dashboard'
    }
  }
  
  // 根路径重定向逻辑：如果已登录，直接跳转到dashboard
  if (to.path === '/') {
    const authStore = useAuthStore()
    const isAuthenticated = await verifyAndCache()
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