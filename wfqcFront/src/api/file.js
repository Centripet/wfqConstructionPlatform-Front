import request from './request'

export const fileApi = {
  uploadPolicy(data) {
    return request({
      url: '/file/uploadPolicy',
      method: 'post',
      data
    })
  },

  uploadStatus(data) {
    return request({
      url: '/file/uploadStatus',
      method: 'post',
      data
    })
  },

  fileSubmit(data) {
    return request({
      url: '/file/fileSubmit',
      method: 'post',
      data
    })
  },

  fileUrlsGen(data) {
    return request({
      url: '/file/fileUrlsGen',
      method: 'post',
      data
    })
  }
}

export const uploadToOSS = async (policy, file, onProgress) => {
  const formData = new FormData()
  formData.append('OSSAccessKeyId', policy.ossaccessKeyId)
  formData.append('policy', policy.policy)
  formData.append('Signature', policy.signature)
  formData.append('key', policy.key)
  formData.append('file', file)

  const xhr = new XMLHttpRequest()

  return new Promise((resolve, reject) => {
    xhr.open('POST', policy.host, true)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 204 || xhr.status === 200) {
        resolve()
      } else {
        reject(new Error('上传失败'))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('上传失败'))
    })

    xhr.send(formData)
  })
}
