import request from './request'

export const cooperationApi = {
  cooperationList(data) {
    return request({
      url: '/Cooperation/cooperationList',
      method: 'get',
      params: data
    })
  },
  
  cooperationDetail(data) {
    return request({
      url: '/Cooperation/cooperationDetail',
      method: 'get',
      params: data
    })
  },
  
  cooperationSubmit(data) {
    return request({
      url: '/Cooperation/cooperationSubmit',
      method: 'post',
      data
    })
  },
  
  cooperationModify(data) {
    return request({
      url: '/Cooperation/cooperationModify',
      method: 'post',
      data
    })
  },
  
  cooperationDelete(data) {
    return request({
      url: '/Cooperation/cooperationDelete',
      method: 'post',
      data
    })
  }
}
