const isEmpty = (value) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'function') return false
  if (typeof value === 'string') return this.EMPTY_STRING_REGEXP.test(value)
  if (Array.isArray(value)) return value.length === 0
  if (value instanceof Date) return true
  if (typeof value === 'object') return Object.values(value).length === 0
  return false
}

export default function (value, options) {
  return !isEmpty(value) ? undefined : options.message
}