import request from './request'

export const personApi = {
  personList(data) {
    return request({
      url: '/person/personList',
      method: 'get',
      params: data
    })
  },
  
  personDetail(data) {
    return request({
      url: '/person/personDetail',
      method: 'get',
      params: data
    })
  },
  
  personSubmit(data) {
    return request({
      url: '/person/personSubmit',
      method: 'post',
      data
    })
  },
  
  personModify(data) {
    return request({
      url: '/person/personModify',
      method: 'post',
      data
    })
  },
  
  personDelete(data) {
    return request({
      url: '/person/personDelete',
      method: 'post',
      data
    })
  }
}
