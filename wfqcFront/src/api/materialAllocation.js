import request from './request'

export const materialAllocationApi = {
  materialAllocationList(data) {
    return request({
      url: '/MaterialAllocation/materialAllocationList',
      method: 'get',
      params: data
    })
  },
  
  materialAllocationDetail(data) {
    return request({
      url: '/MaterialAllocation/materialAllocationDetail',
      method: 'get',
      params: data
    })
  },
  
  materialAllocationSubmit(data) {
    return request({
      url: '/MaterialAllocation/materialAllocationSubmit',
      method: 'post',
      data
    })
  },
  
  materialAllocationModify(data) {
    return request({
      url: '/MaterialAllocation/materialAllocationModify',
      method: 'post',
      data
    })
  },
  
  materialAllocationDelete(data) {
    return request({
      url: '/MaterialAllocation/materialAllocationDelete',
      method: 'post',
      data
    })
  }
}
