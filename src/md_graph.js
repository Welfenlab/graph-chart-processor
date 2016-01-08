var typeIsArray

typeIsArray = Array.isArray || function (value) {
    return {}.toString.call(value) === '[object Array]'
}

module.exports = function (codeTypes) {
  if (!typeIsArray(codeTypes)) {
    codeTypes = [codeTypes]
  }
  return {
    register: function (md, genElement) {
      var origFence
      origFence = md.renderer.rules.fence
      return md.renderer.rules.fence = (function (_this) {
        return function (tokens, idx) {
          var code, fenceToken
          fenceToken = tokens[idx]
          if ((codeTypes.indexOf(fenceToken.info)) > -1) {
            code = fenceToken.content
            origFence.apply(_this, arguments)
            return genElement(code, tokens)
          }
          return origFence.apply(_this, arguments)
        }
      })(this)
    }
  }
}
