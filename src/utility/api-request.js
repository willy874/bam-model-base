import apiHandle from './api-handle.js'

const getRequest = async (options) => {
  if (options instanceof Request) {
    return options
  } else {
    options.model = model
    const config = await apiHandle(options)
    new Request(config.getRequestUrl(), config.init)
  }
}

export default async function (model, options = {}) {
  return new Promise(async (resolve, reject) => {
    const request = await getRequest(options).catch(error => {
      if (options.requestError) options.requestError(request, options)
      reject(error)
    })
    try {
      model.loading = true
      if (options.requestSuccess) options.requestSuccess(request, options)
      const response = await fetch(request)
      if (/application\/json/.test(response.headers.get('Content-Type'))) {
        response.data = await response.json()
      } else {
        response.data = await response.text()
      }
      if (!response.ok) {
        if (options.responseError) options.responseError(response, options)
        throw response
      }
      if (options.responseSuccess) options.responseSuccess(response, options)
      resolve(response)
    } catch (error) {
      reject(error)
    }
    model.loading = false
  })
}