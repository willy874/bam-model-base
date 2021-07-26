import RequestConfig from './api-config.js'

export default async function (options = {}) {
  const { model, requesHandler } = options
  const config = new RequestConfig(options)
  config.init.body = requesHandler ? await requesHandler(model, options) : await model.requesHandler(model, options)
  if (config.init.body instanceof FormData) {
    const nativeMethod = config.init.method
    config.init.method = 'POST'
    if (nativeMethod !== 'POST') {
      config.init.body.append('_method', nativeMethod)
      config.init.headers.set('Content-Type', 'multipart/form-data; charset="utf-8"; boundary=----FormBoundary')
    }
  }
  return config
}