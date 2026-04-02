// api/request.js
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true  // 重要：允许携带Cookie
})

// 是否正在刷新Token
let isRefreshing = false
// 刷新Token期间挂起的请求队列
let pendingRequests = []

// 处理挂起请求
const onRefreshed = (token) => {
  pendingRequests.forEach(callback => callback(token))
  pendingRequests = []
}

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 统一处理响应格式
    if (res.code === 200 || res.code === 0) {
      // 成功响应
      return { success: true, data: res.data, message: res.msg || res.message || '操作成功' }
    } else {
      // 业务错误响应
      return { success: false, data: res.data, message: res.msg || res.message || '操作失败' }
    }
  },
  async error => {
    // 网络错误或HTTP错误
    if (error.response) {
      // 服务器返回了错误状态码
      const errorData = error.response.data
      return Promise.reject({
        message: errorData?.msg || errorData?.message || `请求失败: ${error.response.status}`
      })
    } else if (error.request) {
      // 请求发出但没有收到响应
      return Promise.reject({ message: '网络连接失败，请检查网络' })
    } else {
      // 其他错误
      return Promise.reject({ message: error.message || '请求失败' })
    }
  }
)

// 退出登录处理
const handleLogout = () => {
  CookieUtil.delete('refresh_token')
  // 触发store的登出动作（需要在main.js中全局处理）
  window.dispatchEvent(new CustomEvent('auth:logout'))
}

export default request