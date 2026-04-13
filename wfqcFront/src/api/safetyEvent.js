import request from './request'

export const safetyEventApi = {
  safetyEventList(data) {
    return request({
      url: '/SafetyEvent/safetyEventList',
      method: 'get',
      params: data
    })
  },
  
  safetyEventDetail(data) {
    return request({
      url: '/SafetyEvent/safetyEventDetail',
      method: 'get',
      params: data
    })
  },
  
  safetyEventSubmit(data) {
    return request({
      url: '/SafetyEvent/safetyEventSubmit',
      method: 'post',
      data
    })
  },
  
  safetyEventModify(data) {
    return request({
      url: '/SafetyEvent/safetyEventModify',
      method: 'post',
      data
    })
  },
  
  safetyEventDelete(data) {
    return request({
      url: '/SafetyEvent/safetyEventDelete',
      method: 'post',
      data
    })
  },
  
  safetyEventCount(data) {
    return request({
      url: '/SafetyEvent/safetyEventCount',
      method: 'post',
      data
    })
  }
}
