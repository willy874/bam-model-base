import BaseModel from '../model/base.js'
import ListModel from '../model/list.js'
import RequestConfig from './api-config.js'

/**
 * @param  {Headers} target 
 * @param  {...Headers} headers 
 * @returns {Headers}
 */
const assignHeaders = (target ,...headers) => {
  return headers.reduce((header, item) => {
    if (item instanceof Headers) {
      item.forEach((value, key) => {
        target.set(key, value)
      })
    } else {
      for (const key in item) {
        target.set(key, item[key])
      }
    }
    return header
  }, target)
}

/**
 * @param {Request} options
 * @param {BaseModel|ListModel} options.model
 * @param {Function} options.requesHandler
 * @param {Function} options.requestSuccess 該請求成功時的 callback
 * @param {Function} options.requestError 該請求失敗時的 callback
 * @param {Function} options.responseSuccess 該回應成功時的 callback
 * @param {Function} options.responseError 該回應失敗時的 callback
 * @param {Headers} options.headers 該請求的 http headers
 * @param {String} options.method 該請求的 http method
 * @param {Object} options.params 該請求的 http url params
 * @param {Object} options.query 該請求的 http query string
 * @param {String} options.mode Contains the mode of the request.
 * @param {String} options.cache Contains the cache mode of the request.
 * @param {String} options.redirect Contains the mode for how redirects are handled. It may be one of follow, error, or manual.
 * @param {String} options.referrer Contains the referrer of the request.
 * @param {String} options.integrity Contains the subresource integrity value of the request.
 * @param {String} options.credentials Contains the credentials of the request. The default is same-origin.
 * @returns {RequestConfig}
 */
export default async function (options = {}) {
  const { model, query, params, method, mode, cache, redirect, referrer, integrity, credentials, requesHandler } = options
  const defaultData = options.default
  const config = new RequestConfig()
  config.baseUrl = model.$baseUrl
  config.path = model.$api
  config.params = Object.assign({}, defaultData.params ,params)
  config.query = Object.assign({}, defaultData.query ,query)
  config.init.headers = assignHeaders(config.init.headers, defaultData.headers, options.headers)
  config.init.method = (method || '').toUpperCase() || (defaultData.method || '').toUpperCase() || config.init.method
  config.init.mode = mode || defaultData.mode || config.init.mode
  config.init.cache = cache || defaultData.cache || config.init.cache
  config.init.redirect = redirect || defaultData.redirect || config.init.redirect
  config.init.referrer = referrer || defaultData.referrer || config.init.referrer
  config.init.integrity = integrity || defaultData.integrity || config.init.integrity
  config.init.credentials = credentials || defaultData.credentials || config.init.credentials
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