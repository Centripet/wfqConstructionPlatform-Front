import request from './request'

export const userApi = {
  // 修改用户信息
  userModify: (data) => {
    return request({
      url: '/user/userModify',
      method: 'post',
      data
    })
  },
  
  // 用户列表搜索
  userList: (params) => {
    return request({
      url: '/user/userList',
      method: 'get',
      params
    })
  },
  
  // 用户个人信息
  userSelfDetail: () => {
    return request({
      url: '/user/userSelfDetail',
      method: 'get'
    })
  },

  // 重置密码
  resetPassword(data) {
    return request({
      url: '/user/resetPassword',
      method: 'post',
      data
    })
  }

  
}
