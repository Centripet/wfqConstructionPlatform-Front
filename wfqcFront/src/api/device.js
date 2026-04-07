import request from './request'

export const deviceApi = {
  deviceList(data) {
    return request({
      url: '/Device/deviceList',
      method: 'get',
      params: data
    })
  },
  
  deviceDetail(data) {
    return request({
      url: '/Device/deviceDetail',
      method: 'get',
      params: data
    })
  },
  
  deviceSubmit(data) {
    return request({
      url: '/Device/deviceSubmit',
      method: 'post',
      data
    })
  },
  
  deviceModify(data) {
    return request({
      url: '/Device/deviceModify',
      method: 'post',
      data
    })
  },
  
  deviceDelete(data) {
    return request({
      url: '/Device/deviceDelete',
      method: 'post',
      data
    })
  }
}
