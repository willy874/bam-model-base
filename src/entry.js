import ListModel from './model/list'
import BaseModel from './model/base'

console.dir(ListModel)
console.dir(BaseModel)
const list = new ListModel()
const base = new BaseModel({ created_at: new Date() })
console.log(list)
console.log(base)