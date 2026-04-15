// api/request.js
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const request = axios.create({
  baseURL: window.appConfig?.API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

request.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    console.log('请求拦截器 - 当前token:', authStore.token)
    if (authStore.token) {
      config.headers.Authorization = authStore.token
    }
    console.log('请求拦截器 - 最终headers:', config.headers)
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    console.log('响应拦截器 - 完整响应:', response)
    console.log('响应拦截器 - headers:', response.headers)
    
    // 检查响应中是否有Authorization header，有就更新token
    if (response.headers) {
      const authStore = useAuthStore()
      const authorization = response.headers.authorization || response.headers.Authorization
      if (authorization) {
        console.log('响应拦截器 - 检测到新token，更新token:', authorization)
        authStore.updateToken(authorization)
      }
    }
    
    const res = response.data
    if (res.code === 200 || res.code === 0) {
      if (response.config.returnFullResponse) {
        return { 
          success: true, 
          data: res.data, 
          message: res.msg || res.message || '操作成功',
          headers: response.headers
        }
      }
      return { success: true, data: res.data, message: res.msg || res.message || '操作成功' }
    } else {
      return { success: false, data: res.data, message: res.msg || res.message || '操作失败' }
    }
  },
  async error => {
    if (error.response) {
      const { status, config } = error.response
      const authStore = useAuthStore()
      
      // 处理403 Forbidden状态码
      if (status === 403) {
        // 如果是refresh token请求本身失败，则直接跳转登录
        if (config.url?.includes('/auth/refresh')) {
          console.log('refresh token请求失败，跳转登录页')
          authStore.clearAuthState()
          window.location.href = '/login'
          return Promise.reject({ message: '登录已过期，请重新登录' })
        }
        
        // 避免重复刷新token
        if (!isRefreshing) {
          isRefreshing = true
          try {
            console.log('检测到403，尝试刷新token')
            // 直接调用axios请求refresh token，避免使用request造成循环调用
            const refreshResponse = await axios.post(
              `${window.appConfig?.API_BASE_URL || '/api'}/auth/refresh`,
              {},
              { withCredentials: true }
            )
            
            const refreshData = refreshResponse.data
            if (refreshResponse.status === 200 && (refreshData.code === 200 || refreshData.code === 0)) {
              // 刷新成功，更新token
              const authorization = refreshResponse.headers.authorization || refreshResponse.headers.Authorization
              if (authorization) {
                authStore.updateToken(authorization)
                config.headers.Authorization = authorization
              }
              
              // 处理等待中的请求队列
              processQueue(null, authorization)
              
              // 重试原请求
              console.log('token刷新成功，重试原请求')
              return request(config)
            } else {
              // refresh接口返回非200状态码，跳转登录
              console.log('refresh token返回非200状态码，跳转登录页')
              throw new Error('refresh token failed')
            }
          } catch (refreshError) {
            // refresh请求失败，跳转登录
            console.log('refresh token请求失败，跳转登录页:', refreshError)
            processQueue(refreshError, null)
            authStore.clearAuthState()
            window.location.href = '/login'
            return Promise.reject({ message: '登录已过期，请重新登录' })
          } finally {
            isRefreshing = false
          }
        } else {
          // 正在刷新token，将请求加入等待队列
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(token => {
            config.headers.Authorization = token
            return request(config)
          }).catch(err => {
            return Promise.reject(err)
          })
        }
      }
      
      const errorData = error.response.data
      return Promise.reject({
        message: errorData?.msg || errorData?.message || `请求失败: ${status}`
      })
    } else if (error.request) {
      return Promise.reject({ message: '网络连接失败，请检查网络' })
    } else {
      return Promise.reject({ message: error.message || '请求失败' })
    }
  }
)

export default request