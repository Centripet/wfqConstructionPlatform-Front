// stores/auth.js
import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    userId: null,
    isLoggedIn: false,
    tokenExpireTimer: null,
    accessToken: null
  }),
  
  getters: {
    isAuthenticated: (state) => state.isLoggedIn,
    currentUser: (state) => state.user,
    token: (state) => state.accessToken
  },
  
  actions: {
    // 登录
    async login(credentials, isCaptcha = false) {
      try {
        const api = isCaptcha ? authApi.loginCaptcha : authApi.login
        const res = await api(credentials)
        
        // 响应已由拦截器处理
        if (res.success) {
          this.userId = res.data?.user_id
          this.isLoggedIn = true
          
          // 从响应头中获取Authorization token
          if (res.headers) {
            const authorization = res.headers.authorization || res.headers.Authorization
            if (authorization) {
              this.accessToken = authorization
              sessionStorage.setItem('accessToken', authorization)
            }
          }
          
          this.startTokenExpireTimer()
          
          // 可选：将 userId 存储到 sessionStorage 作为备份标识
          sessionStorage.setItem('userId', this.userId)
          
          return res
        } else {
          return res
        }
      } catch (error) {
        console.error('登录API错误:', error)
        return { success: false, message: error.message || '登录失败，请稍后重试' }
      }
    },
    // 初始化认证状态（异步验证 refresh token）
    async initAuth() {
      // 从 sessionStorage 恢复 accessToken
      const savedToken = sessionStorage.getItem('accessToken')
      if (savedToken) {
        this.accessToken = savedToken
      }
      // 调用接口验证 refresh token 是否有效
      const isAuthenticated = await this.verifyRefreshToken()
      return isAuthenticated
    },
    // 发送验证码
    async sendVerificationCode(str, method = 'phone') {
      try {
        const res = await authApi.sendCaptcha({ str, method })
        return res
      } catch (error) {
        return { success: false, message: error.message || '发送失败' }
      }
    },
    
    // 注册
    async register(data) {
      try {
        const res = await authApi.register(data)
        return res
      } catch (error) {
        return { success: false, message: error.message || '注册失败' }
      }
    },

    // 重置密码
    async resetPassword(data) {
      try {
        const res = await authApi.resetPassword(data)
        return res
      } catch (error) {
        return { success: false, message: error.message || '重置失败' }
      }
    },
    
    // 忘记密码
    async forgetPassword(data) {
      try {
        const res = await authApi.forgetPassword(data)
        return res
      } catch (error) {
        return { success: false, message: error.message || '重置失败' }
      }
    },
    
    // 登出
    async logout() {
      try {
        await authApi.logout()
      } catch (error) {
        console.error('登出请求失败:', error)
      } finally {
        this.clearAuthState()
      }
    },
    
    // 更新Token（从响应拦截器调用）
    updateToken(newToken) {
      if (newToken) {
        this.accessToken = newToken
        sessionStorage.setItem('accessToken', newToken)
        console.log('Token已更新:', newToken)
      }
    },
    
    // 清除认证状态
    clearAuthState() {
      this.user = null
      this.userId = null
      this.isLoggedIn = false
      this.accessToken = null
      sessionStorage.removeItem('accessToken')
      if (this.tokenExpireTimer) {
        clearTimeout(this.tokenExpireTimer)
        this.tokenExpireTimer = null
      }
    },
    
    // 启动Token过期倒计时
    startTokenExpireTimer() {
      if (this.tokenExpireTimer) {
        clearTimeout(this.tokenExpireTimer)
      }
      // AccessToken有效期1小时，提前5秒刷新
      this.tokenExpireTimer = setTimeout(() => {
        this.refreshTokenSilently()
      }, 25 * 60 * 1000) // 分钟后尝试刷新
    },
    
    // 静默刷新Token
    async refreshTokenSilently() {
      try {
        const res = await authApi.refreshToken()
        if (res.success) {
          // 刷新成功，重启计时器
          this.startTokenExpireTimer()
        } else {
          // 刷新失败，跳转登录
          this.clearAuthState()
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Token刷新失败:', error)
        this.clearAuthState()
        window.location.href = '/login'
      }
    },
    
    // 验证refresh token是否有效
    async verifyRefreshToken() {
      try {
        const res = await authApi.refreshTokenVerify()
        if (res.success) {
          this.isLoggedIn = true
          // 尝试从 sessionStorage 恢复 userId
          const savedUserId = sessionStorage.getItem('userId')
          if (savedUserId) {
            this.userId = savedUserId
          }
          // 从响应头中获取新的accessToken
          if (res.headers) {
            const authorization = res.headers.authorization || res.headers.Authorization
            if (authorization) {
              this.accessToken = authorization
              sessionStorage.setItem('accessToken', authorization)
            }
          }
          // 启动Token过期倒计时
          this.startTokenExpireTimer()
          return true
        } else {
          // Token过期或其他错误
          this.clearAuthState()
          return false
        }
      } catch (error) {
        console.error('Token验证失败:', error)
        this.clearAuthState()
        return false
      }
    }
  }
})