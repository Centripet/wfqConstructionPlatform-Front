<!-- src/views/Login.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">欢迎登录</h1>
      
      <!-- Tab切换 -->
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'password' }"
          @click="activeTab = 'password'"
        >
          密码登录
        </button>
        <button 
          :class="{ active: activeTab === 'captcha' }"
          @click="activeTab = 'captcha'"
        >
          验证码登录
        </button>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="errorMsg" class="error-message">
        {{ errorMsg }}
      </div>
      
      <!-- 密码登录表单 -->
      <form v-if="activeTab === 'password'" @submit.prevent="handlePasswordLogin">
        <div class="form-group">
          <input 
            v-model="passwordForm.account" 
            type="text" 
            placeholder="账号/手机号"
            required
          />
        </div>
        <div class="form-group">
          <input 
            v-model="passwordForm.passwordHash" 
            type="password" 
            placeholder="密码"
            required
          />
        </div>
        <button type="submit" :disabled="loading" class="btn-login">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <!-- 验证码登录表单 -->
      <form v-else @submit.prevent="handleCaptchaLogin">
        <div class="form-group">
          <input 
            v-model="captchaForm.account" 
            type="text" 
            placeholder="账号/手机号"
            required
          />
        </div>
        <div class="form-group code-group">
          <input 
            v-model="captchaForm.verificationCode" 
            type="text" 
            placeholder="验证码"
            required
          />
          <button 
            type="button" 
            @click="sendCode" 
            :disabled="codeSending || countdown > 0"
            class="btn-code"
          >
            {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
          </button>
        </div>
        <button type="submit" :disabled="loading" class="btn-login">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="links">
        <router-link to="/register">注册账号</router-link>
        <router-link to="/reset-password">忘记密码？</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 组件挂载时检查登录状态
onMounted(async () => {
  const isAuthenticated = await authStore.verifyRefreshToken()
  if (isAuthenticated) {
    router.push('/dashboard')
  }
})

const activeTab = ref('password')
const loading = ref(false)
const codeSending = ref(false)
const countdown = ref(0)
const errorMsg = ref('')  // 错误提示信息

const passwordForm = reactive({
  account: '',
  passwordHash: '',
  device: 'pc'
})

const captchaForm = reactive({
  account: '',
  verificationCode: ''
})

// 显示错误信息
const showError = (message) => {
  errorMsg.value = message
  // 3秒后自动清除错误信息
  setTimeout(() => {
    errorMsg.value = ''
  }, 3000)
}

// 密码登录
const handlePasswordLogin = async () => {
  // 清空之前的错误信息
  errorMsg.value = ''
  
  // 表单验证
  if (!passwordForm.account) {
    showError('请输入账号')
    return
  }
  if (!passwordForm.passwordHash) {
    showError('请输入密码')
    return
  }
  
  loading.value = true
  
  try {
    const result = await authStore.login(passwordForm, false)
    
    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/dashboard')
    } else {
      // 显示后端返回的错误信息
      showError(result.message || '登录失败，请检查账号或密码')
    }
  } catch (error) {
    console.error('登录错误:', error)
    showError(error.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 验证码登录
const handleCaptchaLogin = async () => {
  errorMsg.value = ''
  
  if (!captchaForm.account) {
    showError('请输入账号')
    return
  }
  if (!captchaForm.verificationCode) {
    showError('请输入验证码')
    return
  }
  
  loading.value = true
  
  try {
    const result = await authStore.login(captchaForm, true)
    
    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/dashboard')
    } else {
      showError(result.message || '登录失败，请检查账号或验证码')
    }
  } catch (error) {
    console.error('登录错误:', error)
    showError(error.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 发送验证码
const sendCode = async () => {
  if (!captchaForm.account) {
    showError('请输入账号')
    return
  }
  
  codeSending.value = true
  errorMsg.value = ''
  
  try {
    const result = await authStore.sendVerificationCode(captchaForm.account, 'account')
    
    if (result.success) {
      // 倒计时60秒
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
      // 显示成功提示
      showError('验证码已发送，请注意查收')
    } else {
      showError(result.message || '发送失败，请稍后重试')
    }
  } catch (error) {
    console.error('发送验证码错误:', error)
    showError(error.message || '发送失败，请稍后重试')
  } finally {
    codeSending.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: #f0f0f0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.tabs button.active {
  background: #667eea;
  color: white;
}

/* 错误提示样式 */
.error-message {
  background: #fee;
  color: #e53e3e;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
  border-left: 4px solid #e53e3e;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group {
  margin-bottom: 16px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.code-group {
  display: flex;
  gap: 10px;
}

.code-group input {
  flex: 1;
}

.btn-code {
  padding: 0 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.3s;
}

.btn-code:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-code:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-login {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 8px;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-login:hover:not(:disabled) {
  background: #5a67d8;
}

.links {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.links a {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.links a:hover {
  text-decoration: underline;
}
</style>