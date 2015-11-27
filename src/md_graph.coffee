
typeIsArray = Array.isArray || ( value ) -> return {}.toString.call( value ) is '[object Array]'

module.exports = (codeTypes) ->
  if !typeIsArray codeTypes
    codeTypes = [codeTypes]
  {
    register: (md, genElement) ->
      origFence = md.renderer.rules.fence
      md.renderer.rules.fence = (tokens, idx) =>
        fenceToken = tokens[idx]
        if (codeTypes.indexOf fenceToken.info) > -1
          code = fenceToken.content
          origFence.apply this, arguments
          return genElement code
        origFence.apply this, arguments
  }
