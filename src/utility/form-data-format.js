export default function (data, exclude = []) {
  const fomat = (value, keys = []) => {
    Object.keys(value).forEach((key) => {
      const formName = [...keys, key].map((k, i) => (i ? `[${k}]` : k)).join('')
      if (value[key] === null || isNaN(value[key]) || exclude.includes(key)) {
        return undefined
      } else if (value[key] instanceof Blob) {
        formData.append(formName, value[key], value[key].name)
      } else if (typeof value[key] === 'object') {
        fomat(value[key], [...keys, key])
      } else if (value[key] !== undefined && value[key] !== '') {
        if (/^data:(\w)*\/(\w)*;base64,/.test(formName)) {
          return
        }
        formData.append(formName, value[key])
      }
    })
  }
  const formData = new FormData()
  fomat(data)
  return formData
}