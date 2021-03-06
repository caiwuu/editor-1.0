import elementVNode from './elementVNode'
import textVNode from './textVNode'
import VNode from './vnode'
import { toRawType, typeValidate } from '../share/utils'
export default function createElement(tagName, attrs = {}, children = []) {
  if (tagName instanceof VNode) return tagName
  if (toRawType(tagName) === 'array') return tagName.map((ele) => createElement(ele, attrs))
  if (toRawType(attrs) !== 'object' || attrs instanceof VNode) {
    children = [attrs].flat()
    attrs = {}
  } else {
    children = [children].flat()
  }
  typeValidate(
    tagName,
    ['string', 'function'],
    "argument 'tagName' expect 'string'|'function'|'vnode'"
  )
  if (typeof tagName === 'function') {
    const mergedAttrs = {
      ...attrs,
      children: children
        .flat()
        .filter((ele) => ele !== '')
        .map((ele) => {
          if (toRawType(ele) === 'string' || toRawType(ele) === 'number') {
            return new textVNode(String(ele))
          } else {
            return ele
          }
        }),
    }
    // 实例化 组件
    if (tagName.isConstructor) {
      const ref = mergedAttrs.ref
      ref && delete mergedAttrs.ref
      const vm = new tagName(mergedAttrs)
      ref && (ref.current = vm)
      const vn = vm._render_(createElement)
      vm.vnode = vn
      if (vn instanceof VNode) vn.vm = vm
      // beforeMounted
      return vn
    } else {
      return tagName(createElement, mergedAttrs)
    }
  }
  if (tagName === 'text' && !!String(children[0])) {
    return new textVNode(String(children[0]))
  } else {
    const vnode = new elementVNode(tagName, attrs)
    children.flat().forEach((ch) => {
      if (ch instanceof VNode) {
        vnode.appendChild(ch)
      } else if (!!String(ch)) {
        vnode.appendChild(new textVNode(String(ch)))
      }
    })
    return vnode
  }
}
