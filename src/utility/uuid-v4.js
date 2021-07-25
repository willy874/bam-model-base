
let getRandomValues
const rnds8 = new Uint8Array(16)
function rng() {
  if (!getRandomValues) {
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto)
    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported')
    }
  }
  return getRandomValues(rnds8);
}

function stringify(arr, offset = 0) {
  const byteToHex = []
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).substr(1))
  }
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase()
  const REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
  function validate(uuid) {
    return typeof uuid === 'string' && REGEX.test(uuid)
  }
  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid')
  }
  return uuid
}

export default function (options, buf, offset) {
  options = options || {}
  const rnds = options.random || (options.rng || rng)()
  rnds[6] = rnds[6] & 0x0f | 0x40
  rnds[8] = rnds[8] & 0x3f | 0x80
  if (buf) {
    offset = offset || 0
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i]
    }
    return buf
  }
  return stringify(rnds)
}