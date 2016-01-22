var d3, graphChartProcessor, markdownItGraph, nvd3, uuid

markdownItGraph = require('./md_graph')

d3 = require('d3')
nvd3 = require('nvd3')
uuid = require('node-uuid')
//jailed = require('jailed');

parseInput = function (input) {}

graphChartProcessor = function (tokens, graph_template, error_template) {
  parseInput = function (input) {
    var working, customApi, disconnect;
    var out = [];

    working = true
    customApi = {}
    customApi.remote = {}
    disconnect = null
    customApi.remote["__data__"] = function (remoteData) {
      out.push(remoteData)
    }
    customApi.remote["__finished__"] = function () {
        working = false
        console.log('finished calcs ', out)
        disconnect()
    }

    code2 = '\
      var run = function () {\
        var start = null;' + input +
      '}\
      var start = function (app) {\
        this.application = null;\
        var _plot = function(input) {\
          if (typeof(input) == "function")\
            return input();\
          return input;\
        }\
        var __plotData__ = []\
        var plot = function() {\
          for(var _i = 0; _i < arguments.length; _i++) {\
            __plotData__.push(_plot(arguments[_i]));\
          }\
        }\
        run();\
        app.remote.__data__(__plotData__);\
        app.remote.__finished__();\
      }\
      var globalScope;\
      if (typeof(window) === "undefined")\
        globalScope = this\
      else\
        globalScope = window\
      start.call(globalScope, application);\
      '

    runner = new jailed.DynamicPlugin(code2, customApi.remote);
    disconnect = runner.disconnect.bind(runner);

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
      markdownItGraph(tokens).register(mdInstance, function (inputStr, tokens) {
        var prevJSToken = 0
        var prevCodeStr = ""
        for (var i = 0; i < tokens.length; i++) {
          if (tokens[i].content == inputStr)
            break;
          if (tokens[i].info == 'js')
            prevJSToken = i
        };
        // just use the last js token content
        prevCodeStr += tokens[prevJSToken].content;

        try {
          var data = parseInput(prevCodeStr + inputStr)
          var id = 'charts-dg-' + uuid.v4()
          postProcessors.registerElemenbById(id, function (elem, done) {
            var fnc, svgElem, svgHeight
            fnc = function () {
              var chart
              chart = nvd3.models.lineChart()
              chart.useInteractiveGuideline(false) // buggy
              d3.select(elem.childNodes[0]).datum(data).call(chart)
              return chart
            }
            nvd3.addGraph(fnc)
            svgElem = elem.getElementsByClassName('output')[0]
            svgHeight = (svgElem != null ? svgElem.getBoundingClientRect().height : void 0) || 0
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
