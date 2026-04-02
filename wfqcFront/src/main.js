// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 先初始化认证状态，再使用路由
const authStore = useAuthStore()
authStore.initAuth()

app.use(router)

app.mount('#app')