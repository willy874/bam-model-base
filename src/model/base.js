import Validate from '../utility/validate.js'
import uuid from '../utility/uuid-v4.js'
import apiRequest from '../utility/api-request.js'

/**
 * @interface BaseModel
 * @property {Number} id             - 該筆資料唯一索引
 * @property {String} created_at     - 該筆資料建立時間
 * @property {String} updated_at     - 該筆資料最後編輯時間
 * @property {String} deleted_at     - 該筆資料刪除時間
 * @property {Validate} $validate    - 目前產生的錯誤訊息
 * @property {HTMLElement} $ref      - 生成後被綁定的實體
 * @property {Boolean} $loading      - 目前是否為讀取中
 * @property {UUID} $modelId         -
 * @property {String} $mode          - ["static", "created", "edited", "deleted", "active"]
 * @property {String} $api           - 該 model api 的 Url
 * @property {String} $baseUrl       -
 * @property {String} $primaryKey    -
 * @property {String} $dayFormat     - 在時間參數格式化時的預設值
 * @property {String} $arrayModel    - 陣列建立時預設使用的 model
 */
export default class BaseModel {
  /** @param {*} args 若為 JSON 字串則會經過轉型 */
  constructor(args) {
    let entity
    try {
      entity = this.setterMiddleware(typeof args === 'string' ? JSON.parse(args) : args) || {}
    } catch (error) {
      entity = this.setterMiddleware(args) || {}
    }
    this.id = entity.id || 0
    ;[
      { key: '$validate', value: new Validate({ model: this, options: {} }) },
      { key: '$ref', value: null },
      { key: '$modelId', value: uuid() },
      { key: '$arrayModel', value: {} },
      { key: '$mode', value: entity.$mode || 'static' },
      { key: '$loading', value: entity.$loading || false },
      { key: '$primaryKey', value: entity.$primaryKey || 'id' },
      { key: '$dayFormat', value: entity.$dayFormat || 'YYYY/MM/DD HH:mm:ss' },
      { key: '$baseUrl', value: entity.$baseUrl || location.hostname.origin },
      { key: '$api', value: entity.$api || '' },
    ].forEach(obj => {
      Object.defineProperty(this, obj.key, {
        value: obj.value,
        enumerable: false,
        writable: true,
      })
    })
    this.created_at = entity.created_at || undefined
    this.updated_at = entity.updated_at || undefined
    this.deleted_at = entity.deleted_at || undefined
  }

  setterMiddleware (entity) {
    return { ...entity }
  }

  /**
   * 取得當前錯誤訊息
   * @param {string} field 指定的 model key
   * @return {object} 取得指定的錯誤訊息
   */
  hasError(field, index = 0) {
    const errors = this.$validate.errors[field]
    if (errors) {
      return errors[index].message
    }
    return ''
  }

  /**
   * 進行 model 的驗證
   * @param {Object} setRules 要改變的驗證規則
   * @return {Object} 取得所有錯誤訊息
   */
  valid(setRules, options = {}) {
    this.$validate.valid(setRules, options)
    return this.$validate.errors || false
  }

  /**
   * 設定 model property 值
   * @param {*} entity
   */
  set(data = {}) {
    const entity = this.setterMiddleware(data)
    Object.keys(entity).forEach((key) => {
      if (this[key] instanceof BaseModel) {
        const Model = this[key].constructor
        this[key] = new Model({ ...entity[key], api: this.api })
      } else if (Array.isArray(entity[key]) && Object.keys(this.$arrayModel).includes(key)) {
        const Model = this.$arrayModel[key]
        this[key] = entity[key].map((m) => new Model({ ...m }))
      } else {
        this[key] = entity[key]
      }
    })
    return this
  }

  rules() {
    return {}
  }

  /**
   * @param {Request} options
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
   * @returns {Promise<Response>}
   */
  request(options = {}) {
    return new Promise((resolve, reject) => {
      apiRequest(this, options).then(resolve).catch(reject)
    })
  }

  /**
   * @param {*} data 
   * @param {*} options 
   */
  async requesHandler(data, options) {
    return options.body || undefined
  }

  /**
   * @param {Response} res 
   * @param {*} options 
   */
  async responseHandler(res, options) {
    return res || {}
  }

  readData(options = {}) {
    options.default = {
      method: 'GET',
      params: {
        [this.primaryKey]: this[this.primaryKey]
      }
    }
    return this.request(options).then(res => {
      const handleData = options.responseHandler ? options.responseHandler(res.data, options) : this.responseHandler(res.data, options)
      this.set(handleData, options)
    })
  }

  createData(options = {}) {
    options.default = {
      method: 'POST'
    }
    return this.request(options).then(res => {
      const handleData = options.responseHandler ? options.responseHandler(res.data, options) : this.responseHandler(res.data, options)
      this.set(handleData, options)
    })
  }

  updateData(options = {}) {
    options.default = {
      method: 'PUT',
      params: {
        [this.primaryKey]: this[this.primaryKey]
      }
    }
    return this.request(options)
  }

  deleteData(options = {}) {
    options.default = {
      method: 'DELETE',
      params: {
        [this.primaryKey]: this[this.primaryKey]
      }
    }
    return this.request(options).then(res => {
      this.$mode = 'deleted'
      // this.deleted_at = new Date
    })
  }
}