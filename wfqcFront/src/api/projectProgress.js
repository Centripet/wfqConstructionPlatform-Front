import request from './request'

export const projectProgressApi = {
  projectProgressList(data) {
    return request({
      url: '/ProjectProgress/projectProgressList',
      method: 'get',
      params: data
    })
  },
  
  projectProgressDetail(data) {
    return request({
      url: '/ProjectProgress/projectProgressDetail',
      method: 'get',
      params: data
    })
  },
  
  projectProgressSubmit(data) {
    return request({
      url: '/ProjectProgress/projectProgressSubmit',
      method: 'post',
      data
    })
  },
  
  projectProgressModify(data) {
    return request({
      url: '/ProjectProgress/projectProgressModify',
      method: 'post',
      data
    })
  },
  
  projectProgressDelete(data) {
    return request({
      url: '/ProjectProgress/projectProgressDelete',
      method: 'post',
      data
    })
  }
}
