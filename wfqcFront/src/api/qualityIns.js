import request from './request'

export const qualityInsApi = {
  qualityInsList(data) {
    return request({
      url: '/QualityIns/qualityInsList',
      method: 'get',
      params: data
    })
  },
  
  qualityInsDetail(data) {
    return request({
      url: '/QualityIns/qualityInsDetail',
      method: 'get',
      params: data
    })
  },
  
  qualityInsSubmit(data) {
    return request({
      url: '/QualityIns/qualityInsSubmit',
      method: 'post',
      data
    })
  },
  
  qualityInsModify(data) {
    return request({
      url: '/QualityIns/qualityInsModify',
      method: 'post',
      data
    })
  },
  
  qualityInsDelete(data) {
    return request({
      url: '/QualityIns/qualityInsDelete',
      method: 'post',
      data
    })
  }
}
