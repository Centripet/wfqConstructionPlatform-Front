import request from './request'

export const drawingApi = {
  drawingList(data) {
    return request({
      url: '/Drawing/drawingList',
      method: 'get',
      params: data
    })
  },
  
  drawingDetail(data) {
    return request({
      url: '/Drawing/drawingDetail',
      method: 'get',
      params: data
    })
  },
  
  drawingSubmit(data) {
    return request({
      url: '/Drawing/drawingSubmit',
      method: 'post',
      data
    })
  },
  
  drawingModify(data) {
    return request({
      url: '/Drawing/drawingModify',
      method: 'post',
      data
    })
  },
  
  drawingDelete(data) {
    return request({
      url: '/Drawing/drawingDelete',
      method: 'post',
      data
    })
  }
}
