var d3, graphChartProcessor, markdownItGraph, nvd3, uuid

markdownItGraph = require('./md_graph')

d3 = require('d3')
nvd3 = require('nvd3')
uuid = require('node-uuid')

parseInput = function (input) {}

graphChartProcessor = function (tokens, graph_template, error_template) {
  parseInput = function (input) {
    var code, out,
      code = '\
    function _plot(input) {\
      if (typeof(input) == "function")\
        return input();\
      return input;\
    }\
    function plot() {\
      _plotData = [];\
      for(var _i = 0; _i < arguments.length; _i++) {\
        _plotData.push(_plot(arguments[_i]));\
      }\
      return _plotData;\
    }' + input

    out = []
    try {
      out = eval(code)
    } catch (error) {
      throw 'Failed to parse chart plot javascript<br>' + error
    }
    var data = []
    var part, line, xyArray, len, len1
    for (var j = 0, len = out.length; j < len; j++) {
      part = out[j]
      line = []
      xyArray = []
      for (var k = 0, len1 = part.length; k < len1; k++) {
        i = part[k]
        xyArray.push({ x: i[0], y: i[1]})
      }
      data.push({ values: xyArray, seriesIndex: j, key: '' + j })
    }
    return data
  }
  return {
    parse: parseInput,
    register: function (mdInstance, postProcessors) {
      markdownItGraph(tokens).register(mdInstance, function (inputStr) {
        try {
          var data = parseInput(inputStr)
          var id = 'charts-dg-' + uuid.v4()
          postProcessors.registerElemenbById(id, function (elem, done) {
            var fnc, svgElem, svgHeight
            fnc = function () {
              var chart
              chart = nvd3.models.lineChart()
              chart.useInteractiveGuideline(false) // buggy
              d3.select(elem.childNodes[0]).datum(data).call(chart)
              nvd3.utils.windowResize(chart.update)
              return chart
            }
            nvd3.addGraph(fnc)
            svgElem = elem.getElementsByClassName('output')[0]
            svgHeight = (svgElem != null ? svgElem.getBoundingClientRect().height : void 0) || 0
            console.log(svgElem, elem)
            elem.style.height = 350
            return done()
          })
          return graph_template({
            id: id
          })
        } catch (error1) {
          return error_template({
            error: error1
          })
        }
      })
      return null
    }
  }
}

module.exports = graphChartProcessor
