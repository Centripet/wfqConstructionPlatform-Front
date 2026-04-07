import request from './request'

export const dataAnalysisApi = {
  dataAnalysisList(data) {
    return request({
      url: '/DataAnalysis/dataAnalysisList',
      method: 'get',
      params: data
    })
  },
  
  dataAnalysisDetail(data) {
    return request({
      url: '/DataAnalysis/dataAnalysisDetail',
      method: 'get',
      params: data
    })
  },
  
  dataAnalysisSubmit(data) {
    return request({
      url: '/DataAnalysis/dataAnalysisSubmit',
      method: 'post',
      data
    })
  },
  
  dataAnalysisModify(data) {
    return request({
      url: '/DataAnalysis/dataAnalysisModify',
      method: 'post',
      data
    })
  },
  
  dataAnalysisDelete(data) {
    return request({
      url: '/DataAnalysis/dataAnalysisDelete',
      method: 'post',
      data
    })
  }
}
