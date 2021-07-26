import BaseModel from './base.js'
import uuid from '../utility/uuid-v4.js'
import apiRequest from '../utility/api-request.js'

/**
 * @interface RequestOptions
 * @property {Function} options.requesHandler
 * @property {Function} options.requestSuccess 該請求成功時的 callback
 * @property {Function} options.requestError 該請求失敗時的 callback
 * @property {Function} options.responseSuccess 該回應成功時的 callback
 * @property {Function} options.responseError 該回應失敗時的 callback
 * @property {Headers} options.headers 該請求的 http headers
 * @property {String} options.method 該請求的 http method
 * @property {Object} options.params 該請求的 http url params
 * @property {Object} options.query 該請求的 http query string
 * @property {String} options.mode Contains the mode of the request.
 * @property {String} options.cache Contains the cache mode of the request.
 * @property {String} options.redirect Contains the mode for how redirects are handled. It may be one of follow, error, or manual.
 * @property {String} options.referrer Contains the referrer of the request.
 * @property {String} options.integrity Contains the subresource integrity value of the request.
 * @property {String} options.credentials Contains the credentials of the request. The default is same-origin.
 */

/**
 * @interface ListModel
 * @property {Function} $ListModel      - ListModel 類型
 * @property {Function} $Model          - data 內的 Model 類型
 * @property {Array<BaseModel>} value   - ListModel 管理的 Model
 * @property {Array<BaseModel>} $cache  - ListModel 管理的快取
 * @property {Number} length            - data 資料數長度
 * @property {Number} total             - 總資料數長度
 * @property {Number} $currentPage      - 當前 ListModel 控制的頁碼
 * @property {Number} $lastPage         - 資料總合的頁數
 * @property {Number} $perPage          - 單頁顯示數
 * @property {Boolean} $loading         - 目前是否為讀取中
 * @property {Object} $query            - 暫存的 route.query
 * @property {String} $primaryKey       - 該資料使用的主 key
 * @property {Object} $api              - 該 model api 的 Url，如果使用 ListModel 的方法建立會往底下繼承該資料
 */
class ListModel {
  constructor(args) {
    let entity
    try {
      entity = this.setterMiddleware(typeof args === 'string' ? JSON.parse(args) : args) || {}
    } catch (error) {
      entity = this.setterMiddleware(args) || {}
    }

    // 資料模型
    Object.defineProperty(this, '$ListModel', {
      value: entity.$ListModel || ListModel,
      enumerable: false,
      writable: true,
    })
    Object.defineProperty(this, '$Model', {
      value: entity.$Model || BaseModel,
      enumerable: false,
      writable: true,
    })
    
    // 資料陣列
    const dataList = entity.data ? entity.data.map((p) => new this.$Model(p)) : []
    Object.defineProperty(this, 'length', {
      value: dataList.length,
      enumerable: false,
      writable: true,
    })
    Object.defineProperty(this, 'value', {
      enumerable: false,
      configurable: false,
      get () {
        return dataList.slice()
      },
      set (data) {
        dataList.splice(0, dataList.length, ...data)
        this.length = dataList.length
      }
    })
    Object.defineProperty(this, 'getNativeValue', {
      value: () => dataList,
      enumerable: false,
      configurable: false,
    })

    // 快取值資料
    const cache = entity.$cache || this.value
    Object.defineProperty(this, '$cacheLength', {
      value: cache.length,
      enumerable: false,
      writable: true,
    })
    Object.defineProperty(this, '$cache', {
      enumerable: false,
      configurable: false,
      get () {
        return cache.slice()
      },
      set (data) {
        cache.splice(0, cache.length, ...data)
        this.$cacheLength = cache.length
      }
    })
    Object.defineProperty(this, 'getNativeCache', {
      value: () => cache,
      enumerable: false,
      configurable: false,
    })

    // 基本屬性
    this.$loading = entity.$loading || false
    this.$query = entity.$query || {}
    this.$primaryKey = entity.$primaryKey || 'id'
    this.$api = entity.$api || 'api'
    ;[
      { key: '$ref', value: null },
      { key: '$uuid', value: uuid() },
      { key: '$mode', value: entity.$mode || 'static' },
      { key: '$loading', value: entity.$loading || false },
      { key: '$baseUrl', value: entity.$baseUrl || location.hostname.origin },
      { key: '$api', value: entity.$api || '' },
      { key: '$query', value: entity.$query || {} },
    ].forEach(obj => {
      Object.defineProperty(this, obj.key, {
        value: obj.value,
        enumerable: false,
        writable: true,
      })
    })

    // 後端屬性
    this.$currentPage = entity.$currentPage || 0
    this.$lastPage = entity.$lastPage || 0
    this.$perPage = entity.$perPage || 0
    this.$total = entity.$total || 0

    Object.defineProperty(this, '$on', {
      value: entity.$on || {},
      enumerable: false,
      writable: true,
    })
  }

  /**
   * @param {*} param 
   * @param {*} value 
   * @typeof param === number   : 取得指定 index 的 model
   * @typeof param === string   : 取得指定 key 符合 value 的 model
   * @typeof param === function : 執行指定 function 使用 value 方法來操作取得回傳，預設 Array.prototype.find
   * @typeof param === object   : 執行 every 或 some (預設 every)，依據符合物件結構搜尋回傳 model
   * @returns {BaseModel} 回傳搜尋到的 Model
   */
   getTarget (param, value) {
    if (typeof param === 'number') {
      return this.value[param]
    }
    if (typeof param === 'string') {
      return this.value.find(p => p[param] === value)
    }
    if (typeof param === 'function') {
      const method = value || 'find'
      return this.value[method](param)
    }
    if (typeof param === 'object') {
      const method = value ? 'some' : 'every'
      const search = Object.keys(param).map(key => ({ value: param[key], key }))
      return this.value.find(p => search[method](s => p[s.key] === s.value))
    }
    return undefined
  }

  setterMiddleware (entity = {}) {
    return {
      ...entity,
      $currentPage: entity.current_page || entity.$currentPage,
      $lastPage: entity.last_page || entity.$lastPage,
      $perPage: entity.per_page || entity.$perPage,
      $total: entity.total || entity.$total
    }
  }

  /**
   * 設定 model property 值
   * @param {*} entity
   * @param {Boolean|Function} middleware
   * @returns {this}
   */
  set(entity, middleware = true) {
    const handler = typeof middleware === 'function' ? options.middleware : this.setterMiddleware
    const model = middleware ? handler(entity) : { ...entity }
    for (const key in model) {
      if (Object.hasOwnProperty.call(this, key)) {
        switch (key) {
          default: this[key] = model[key]
        }
      }
    }
    return this
  }

  pushData(data = []) {
    data.forEach((entity) => {
      const target = this.getTarget(this.$primaryKey, entity[this.$primaryKey])
      if (target) {
        target.set(entity)
      } else {
        const ModelType = this.$Model
        this.push(new ModelType({
          ...entity,
          ListModel: entity.ListModel,
          Model: entity.Model,
        }))
      }
    })
    this.$cache = this.value
    return this
  }

  reflashData(data = []) {
    if (Array.isArray(data) && data.length) {
      const cache = this.$cache
      data.forEach((entity) => {
        const target = cache.find(p => String(p[this.$primaryKey]) === String(entity[this.$primaryKey]))
        if (target) {
          target.set(entity)
        } else {
          const ModelType = this.$Model
          cache.push(new ModelType({
            ...entity,
            ListModel: entity.ListModel,
            Model: entity.Model,
          }))
        }
      })
      this.$cache = cache
      this.value = data
    }
    return this
  }

  /**
   * @param {RequestOptions} options
   * @returns {Promise<Response>}
   */
  request(options = {}) {
    return new Promise((resolve, reject) => {
      apiRequest(this, options).then(resolve).catch(reject)
    })
  }

  /**
   * @param {*} data 
   * @param {RequestOptions} options 
   */
  async requesHandler(data, options) {
    return options.body || undefined
  }

  /**
   * @param {Response} res 
   * @param {RequestOptions} options 
   */
  async responseHandler(res, options) {
    return res || {}
  }

  /**
   * @param {RequestOptions} options 
   * @param {Boolean} push 是否要使用非緩存模式
   * @returns {Promise<Response>}
   */
  readList(options = {}, push = false) {
    options.default = {
      method: 'GET',
    }
    return this.request(options).then(res => {
      const listModel = Array.isArray(res.data) ? { data: res.data } : res.data
      this.set(listModel)
      if (push) {
        this.pushData(listModel.value)
      } else {
        this.reflashData(listModel.value)
      }
    })
  }
}

// 建立陣列原生方法
const arrayMethods = ('at,concat,copyWithin,entries,every,fill,filter,find,findIndex,flat,flatMap,forEach,includes,reverse,'+
'indexOf,join,keys,lastIndexOf,map,reduce,reduceRight,slice,some,sort,toLocaleString,values,toString').split(',')
arrayMethods.forEach(method => {
  Object.defineProperty(ListModel.prototype, method, {
    value (...params) {
      return this.value[method](...params)
    },
    enumerable: false,
    writable: false,
  })
})

const arrayOperates = 'push,unshift,splice,pop,shift'.split(',')
arrayOperates.forEach(method => {
  Object.defineProperty(ListModel.prototype, method, {
    value (...params) {
      const result = this.getNativeValue()[method](...params)
      this.length = this.getNativeValue().length
      if ('push' === method || 'unshift' === method) {
        if (!params.every(p => p instanceof this.$Model)) {
          console.warn(`Operate data type is not ${this.$Model.name}.\ndata:`, params)
        }
        this.$cacheLength = this.getNativeCache().push(...params)
      }
      if ('splice' === method) {
        const arrPushData =  params.splice(2, params.length, ...params) 
        if (!arrPushData.every(p => p instanceof this.$Model)) {
          console.warn(`Operate data type is not ${this.$Model.name}.\ndata:`, arrPushData)
        }
        this.$cacheLength = this.getNativeCache().push(...arrPushData)
      }
      return result
    },
    enumerable: false,
    writable: false,
  })
})

export default ListModel