// api/auth.js
import request from './request'

export const authApi = {
  // 账号密码登录
  login(data) {
    return request({
      url: '/auth/login',
      method: 'post',
      data
    })
  },
  
  // 验证码登录
  loginCaptcha(data) {
    return request({
      url: '/auth/login-Captcha',
      method: 'post',
      data
    })
  },
  
  // 发送验证码
  sendCaptcha(data) {
    return request({
      url: '/auth/sendCaptcha',
      method: 'post',
      data
    })
  },
  
  // 注册
  register(data) {
    return request({
      url: '/auth/register',
      method: 'post',
      data
    })
  },
  
  // 重置密码
  resetPassword(data) {
    return request({
      url: '/auth/resetPassword',
      method: 'post',
      data
    })
  },
  
  // 刷新Token（通常由拦截器自动调用）
  refreshToken() {
    return request({
      url: '/auth/refresh',
      method: 'post'
    })
  },
  
  // 登出
  logout() {
    return request({
      url: '/auth/logout',
      method: 'post'
    })
  },
  
  // 验证refresh token是否有效
  refreshTokenVerify() {
    return request({
      url: '/auth/refreshTokenVerify',
      method: 'post'
    })
  }
}