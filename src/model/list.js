import BaseModel from './base.js'

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

    // 後端屬性
    this.$currentPage = entity.$currentPage || 0
    this.$lastPage = entity.$lastPage || 0
    this.$perPage = entity.$perPage || 0
    this.$total = entity.$total || 0

    /**
     * Event
     * submit,reset,invalid
     */
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

  /**
   * @param {*} data 
   * @param {Request} req 
   * @param {*} options 
   * @returns {this}
   */
  requesHandler(data, req, options) {
    return data
  }

  /**
   * @param {*} data 
   * @param {Response} res 
   * @param {*} options 
   * @returns {this}
   */
  responseHandler(data, res, options) {
    return data
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

  reflashData(data) {
    if (Array.isArray(data)) {
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