import apiHandle from './api-handle.js'

export default function (model, options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      options.model = model
      const config = await apiHandle(options)
      const request = new Request(config.getRequestUrl(), config.init)
      model.loading = true
      try {
        const response = await fetch(config.interceptor.requestSuccess(request, options))
        if (/application\/json/.test(response.headers.get('Content-Type'))) {
          response.data = await response.json()
        } else {
          response.data = await response.text()
        }
        if (!response.ok) {
          throw response
        }
        resolve(config.interceptor.responseSuccess(response, options))
      } catch (error) {
        reject(config.interceptor.responseError(error, options))
      }
    } catch (error) {
      reject(config.interceptor.requestError(error, options))
    }
    model.loading = false
  })
}