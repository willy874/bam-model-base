import BaseModel from '../model/base.js'
import ListModel from '../model/list.js'

const interceptor = {
  requestSuccess: (req, ops) => req,
  requestError: (err, ops) => err,
  responseSuccess: (res, ops) => res,
  responseError: (err, ops) => err,
}

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
 * @interface RequestConfig
 * @property {String} baseUrl
 * @property {String} path
 * @property {String} paramsUrl
 * @property {String} requestUrl
 * @property {*} params
 * @property {*} query
 * @property {RequestInit} init
 * @property {Headers} init.headers
 * @property {String} init.method
 * @property {String} init.mode
 * @property {String} init.cache
 * @property {String} init.redirect
 * @property {String} init.referrer
 * @property {String} init.integrity
 * @property {String} init.credentials
 * @property {*} interceptor
 * @property {Function} interceptor.requestSuccess
 * @property {Function} interceptor.requestError
 * @property {Function} interceptor.responseSuccess
 * @property {Function} interceptor.responseError
 * @property {Function} getParamsString
 * @property {Function} urlParse
 * @property {Function} getQueryString
 * @property {Function} getRequestUrl
 */
export default class RequestConfig {
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
  constructor (options = {}) {
    const { model, query, params, method, mode, cache, redirect, referrer, integrity, credentials, requesHandler } = options
    const defaultData = options.default
    this.baseUrl = model.$baseUrl
    this.path = model.$api
    this.paramsUrl = ''
    this.requestUrl = ''
    this.params = Object.assign({}, defaultData.params ,params)
    this.query = Object.assign({}, defaultData.query ,query)
    this.init = {
      headers: assignHeaders(
        new Headers({ 'Content-Type': 'application/json; charset=utf-8' }),
        defaultData.headers, options.headers
      ),
      method: (method || '').toUpperCase() || (defaultData.method || '').toUpperCase() || 'GET',
      mode: mode || defaultData.mode || 'cors',
      cache: cache || defaultData.cache || 'default',
      redirect: redirect || defaultData.redirect || 'follow',
      referrer: referrer || defaultData.referrer || 'about:client',
      integrity: integrity || defaultData.integrity || '',
      credentials: credentials || defaultData.credentials || 'same-origin',
    }
    this.interceptor = {
      requestSuccess: (req, ops) => {
        if (options.requestSuccess) {
          return options.requestSuccess(interceptor.requestSuccess(req, ops), ops)
        }
        return interceptor.requestSuccess(req, ops)
      },
      requestError: (err, ops) => {
        if (options.requestError) {
          return options.requestError(interceptor.requestError(err, ops), ops)
        }
        return interceptor.requestError(err, ops)
      },
      responseSuccess: (res, ops) => {
        if (options.responseSuccess) {
          return options.responseSuccess(interceptor.responseSuccess(res, ops), ops)
        }
        return interceptor.responseSuccess(res, ops)
      },
      responseError: (err, ops) => {
        if (options.responseError) {
          return options.responseError(interceptor.responseError(err, ops), ops)
        }
        return interceptor.responseError(err, ops)
      },
    }
  }

  static setInterceptor (type, func) {
    interceptor[type] = func
  }

  static getInterceptor () {
    return {
      ...interceptor
    }
  }

  /** @returns {String} */
  getParamsString () {
    return Object.keys(this.params).filter(p =>p).map(key => '/?' + key + ':').join('/')
  }

  /** @returns {String} */
  getQueryString () {
    const isBodyQuery = Boolean(this.init.method === 'GET' || this.init.method === 'DELETE')
    const configQuery = new URLSearchParams(this.query).toString()
    const bodyQuery = new URLSearchParams(this.init.body).toString()
    if (isBodyQuery && bodyQuery) {
      if (configQuery) return '?' + configQuery + '&' + bodyQuery
      return '?' + bodyQuery
    } else {
      if (configQuery) return '?' + configQuery
      return ''
    }
  }

  /**
   * @param {String} str 
   * @returns {String}
   */
  urlParse(str) {
    return str.replace(/\/\:\S*?\?/g, (match) => {
      for (const key in Object.assign({}, model, this.params)) {
        if (match.replace(/^\/:/,'').replace(/\?$/,'') === key) {
          return '/' + this.params[key]
        }
      }
    })
  }

  /** @returns {String} */
  getRequestUrl () {
    this.paramsUrl = `${this.baseUrl}/${this.path}${this.getParamsString()}${this.getQueryString()}`
    this.requestUrl = this.urlParse(this.paramsUrl)
    return this.requestUrl
  }
}