const password = (value) => {
  if (/[a-z]+|[A-Z]+/.test(value) && /\d/.test(value)) {
    return true
  }
  return false
}

export default function (value, options) {
  const valid = password(value)
  return valid ? undefined : options.message
}