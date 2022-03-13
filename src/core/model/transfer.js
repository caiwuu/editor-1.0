import createElement from './createElement'
export default function (args, state = 0) {
  return {
    args,
    state,
    flat(fn) {
      this.args = getContentMark(this.args)
      if (typeof fn === 'function') {
        this.args = fn(this.args) || this.args
      }
      this.state = 1
      return this
    },
    toJson(fn) {
      this.args = generate({ marks: this.args, keys: ['B', 'I', 'U', 'D', '$FC', '$BG', '$FZ'], tags: null })
      if (typeof fn === 'function') {
        this.args = fn(this.args) || this.args
      }
      this.state = 2
      return this
    },
    toVNode(fn) {
      if (this.state === 1) {
        this.toJson()
      }
      this.args = json2VNode(this.args)
      if (typeof fn === 'function') {
        this.args = fn(this.args) || this.args
      }
      this.state = 0
      return this
    },
  }
}

function json2VNode(list) {
  return list.map((ele) => {
    return createElement(ele.tag, ele.attrs, typeof ele.children === 'string' ? ele.children : json2VNode(ele.children))
  })
}
function getContentMark(vnode, inherit = {}, idx = 0) {
  const marker = idx === 0 ? {} : mark(vnode, inherit)
  idx++
  if (vnode.children.length) {
    return vnode.children.map((i) => getContentMark(i, marker, idx)).flat()
  } else {
    return { content: vnode, mark: marker }
  }
}
function mark(vnode, inherit = {}) {
  if (!vnode.children.length) return inherit
  return {
    B: vnode.tagName === 'strong' || inherit.B,
    I: vnode.tagName === 'em' || inherit.I,
    U: vnode.tagName === 'u' || inherit.U,
    D: vnode.tagName === 'del' || inherit.D,
    $FC: vnode.styles.get('color') || inherit.$FC,
    $BG: vnode.styles.get('background') || inherit.$BG,
    $FZ: vnode.styles.get('font-size') || vnode.styles.get('fontSize') || inherit.$FZ,
  }
}
function divide(group, index = 0, res = []) {
  let counter = {}
  const g = { marks: [], tags: [], keys: [] }
  let prev = null
  let prevMaxLen = 0
  for (index; index < group.marks.length; index++) {
    let copyCounter = { ...counter }
    const current = group.marks[index]
    group.keys.forEach((key) => {
      if (!prev) {
        counter[key] = 0
        current.mark[key] && counter[key]++
      } else {
        if ((current.mark[key] && current.mark[key] === prev.mark[key]) || (current.mark[key] && !prev.mark[key])) {
          counter[key]++
        }
      }
    })
    const len = Math.max(...Object.values(counter))
    if (prev && prevMaxLen === 0 && len > prevMaxLen) {
      counter = copyCounter
      break
    }
    if (prev && len === prevMaxLen && len !== 0) {
      counter = copyCounter
      break
    }
    g.marks.push(current)
    g.tags = Object.entries(counter)
      .filter((ele) => ele[1] && ele[1] === len)
      .map((ele) => ele[0])
    g.keys = group.keys.filter((ele) => !g.tags.includes(ele))
    prevMaxLen = len
    prev = current
  }
  res.push(g)
  if (index < group.marks.length) {
    return divide(group, index, res)
  } else {
    return res
  }
}
const toVnodeOpsMap = {
  B: () => ({ tag: 'strong', attrs: {}, children: [] }),
  I: () => ({ tag: 'em', attrs: {}, children: [] }),
  U: () => ({ tag: 'u', attrs: {}, children: [] }),
  D: () => ({ tag: 'del', attrs: {}, children: [] }),
  $FC: (value) => ({ style: `color:${value};` }),
  $BG: (value) => ({ style: `background:${value};` }),
  $FZ: (value) => ({ style: `font-size:${value};` }),
}
function generate(group) {
  const res = divide(group, 0)
  const obj = res.map((ele) => {
    if (!ele.tags.length) {
      return { tag: 'text', attrs: {}, children: ele.marks.map((ele) => ele.content.context).join('') }
    } else {
      let result = null
      ele.tags.reduce((obj, curr) => {
        if (!obj) {
          if (curr.startsWith('$')) {
            result = {
              tag: 'span',
              attrs: toVnodeOpsMap[curr](ele.marks[0].mark[curr]),
              children: [],
            }
          } else {
            result = toVnodeOpsMap[curr]()
          }
          return result
        } else {
          if (curr.startsWith('$')) {
            const attr = toVnodeOpsMap[curr](ele.marks[0].mark[curr])
            if (!obj.attrs.style) {
              obj.attrs.style = attr.style
            } else {
              obj.attrs.style += attr.style
            }
            return obj
          } else {
            const child = toVnodeOpsMap[curr]()
            obj.children.push(child)
            return child
          }
        }
      }, result)
      if (ele.marks.length) {
        let lastChild = result
        while (lastChild.children.length) {
          lastChild = lastChild.children[0]
        }
        lastChild.children = generate(ele)
      }
      return result
    }
  })
  return obj
}
