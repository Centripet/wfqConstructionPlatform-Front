import request from './request'

export const projectApi = {
  projectList(data) {
    return request({
      url: '/Project/projectList',
      method: 'get',
      params: data
    })
  },
  
  projectDetail(data) {
    return request({
      url: '/Project/projectDetail',
      method: 'get',
      params: data
    })
  },
  
  projectSubmit(data) {
    return request({
      url: '/Project/projectSubmit',
      method: 'post',
      data
    })
  },
  
  projectModify(data) {
    return request({
      url: '/Project/projectModify',
      method: 'post',
      data
    })
  },
  
  projectDelete(data) {
    return request({
      url: '/Project/projectDelete',
      method: 'post',
      data
    })
  }
}
