// api/request.js
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true
})

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
      const errorData = error.response.data
      return Promise.reject({
        message: errorData?.msg || errorData?.message || `请求失败: ${error.response.status}`
      })
    } else if (error.request) {
      return Promise.reject({ message: '网络连接失败，请检查网络' })
    } else {
      return Promise.reject({ message: error.message || '请求失败' })
    }
  }
)

export default request