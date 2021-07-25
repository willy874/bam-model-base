import * as validators from '../validator/index.js'

export default class Validate {
  constructor (args) {
    const entity = args ||  {}
    this.getModel = () => entity.model
    this.options = entity.options || {}
    this.validators = { ...validators }
    this.errors = {}
  }

  get EMPTY_STRING_REGEXP () {
    return /^\s*$/
  }

  get FORMAT_REGEXP () {
    return /(%?)%\{([^\}]+)\}/g
  }

  valid(...args) {
    const results = this.pruneEmptyErrors(this.runValidations(...args))
    this.errors = this.isEmpty(results) ? undefined : results
  }

  runValidations (param1, param2) {
    const model = this.getModel()
    const rules = param1 || this.model.rules()
    const options = Object.assign({}, this.options, param2)
    const result = {}
    // 尋找指定屬性的規則
    for (const attr in rules) {
      const value = typeof model[attr] === 'object' ? JSON.parse(JSON.stringify(model[attr])) : model[attr]
      const validators = rules[attr]
      if (this.isEmpty(validators)) {
        continue
      }
      // 對驗證器的處理
      result[attr] = Object.keys(validators).map(ruleName => {
        const validator = this.validators[ruleName]
        const validatorOptions = validators[ruleName]
        if (!validator) throw new Error(this.format('Unknown validator %{name}', { name: ruleName }))
        const message = this.result(validator, value, validatorOptions, attr, model, rules) // value, options, attribute, attributes, globalOptions
        if (this.isEmpty(message)) {
          return
        }
        return { model, attr, value, validators, rules, ruleName, options, message }
      })
    }
    return result
  }

  result (...value) {
    const args = value.splice(1)
    if (typeof value[0] === 'function') {
      return value[0](...args);
    }
    return value
  }

  isDefined(obj) {
    return obj !== null && obj !== undefined
  }

  isEmpty (value) {
    if (!this.isDefined(value)) return true
    if (typeof value === 'function') return false
    if (typeof value === 'string') return this.EMPTY_STRING_REGEXP.test(value)
    if (Array.isArray(value)) return value.length === 0
    if (value instanceof Date) return true
    if (typeof value === 'object') return Object.values(value).length === 0
    return false
  }

  format (str, value) {
    if (!typeof str === 'string') {
      return str;
    }
    return str.replace(this.FORMAT_REGEXP, (m0, m1, m2) => {
      if (m1 === '%') {
        return "%{" + m2 + "}";
      } else {
        return String(value[m2]);
      }
    })
  }

  pruneEmptyErrors (err) {
    const result = {}
    for (const key in err) {
      const errors = err[key].filter(p => p)
      if (!this.isEmpty(errors)) {
        result[key] = errors
      }
    }
    return result
  }
}