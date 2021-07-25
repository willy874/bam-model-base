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
 * @property {Function} getParamsString
 * @property {Function} urlParse
 * @property {Function} getQueryString
 * @property {Function} getRequestUrl
 */
export default class RequestConfig {
  constructor () {
    this.baseUrl = ''
    this.path = ''
    this.paramsUrl = ''
    this.requestUrl = ''
    this.params = {}
    this.query = {}
    this.init = {
      headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8' }),
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      redirect: 'follow',
      referrer: 'about:client',
      integrity: '',
      credentials: 'same-origin',
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