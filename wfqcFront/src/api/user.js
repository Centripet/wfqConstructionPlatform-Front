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
  
  // 用户信息
  userDetail: (params) => {
    return request({
      url: '/user/userDetail',
      method: 'get',
      params
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
