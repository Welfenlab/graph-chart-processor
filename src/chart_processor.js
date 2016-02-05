var d3, graphChartProcessor, markdownItGraph, nvd3, uuid

markdownItGraph = require('./md_graph')

d3 = require('d3')
nvd3 = require('nvd3')
uuid = require('node-uuid')
//jailed = require('jailed');
esprima = require('esprima');

parseInput = function (input) {}

defaultTimout = 5000;

getCode = function(input) {
  return '\
      var __plotData__ = [];\
      var _plot = function(input) {\
        if (typeof(input) == "function")\
          return input();\
        return input;\
      };\
      var plot = function() {\
        for(var _i = 0; _i < arguments.length; _i++) {\
          __plotData__.push(_plot(arguments[_i]));\
        }\
      };\
      var start = function (app) {\
        this.application = null;\
        __plotData__ = [];\
        run();\
        app.remote.__data__(__plotData__);\
        app.remote.__finished__();\
      };\
      var run = function () {\
        var start = null;' + input + '\
      };\
      var globalScope;\
      if (typeof(window) === "undefined")\
        globalScope = this;\
      else\
        globalScope = window;\
      start.call(globalScope, application);\
    '
}

graphChartProcessor = function (tokens, graph_template, error_template) {
  parseInput = function (input) {
    return new Promise(function(resolve, reject) {
      console.time("Graph-Chart");
      var working, customApi, disconnect, code;
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
        out = out[0]
        var data = []
        var part, line, xyArray, len, len1, obj0;
        for (var j = 0, len = out.length; j < len; j++) {
          part = out[j]
          line = []
          xyArray = []
          for (var k = 0, len1 = part.length; k < len1; k++) {
            obj0 = part[k]
            xyArray.push({ x: obj0[0], y: obj0[1]})
          }
          data.push({ values: xyArray, seriesIndex: j, key: '' + j })
        }
        //console.log(data)
        //console.log('finished calcs', out, data)
        console.timeEnd("Graph-Chart");
        console.time("Graph-Chart-Plot");
        resolve(data);
        console.timeEnd("Graph-Chart-Plot");
        disconnect()
        return disconnect;
      }

      code = getCode(input);

      try {
        esprima.parse(code);
      } catch (error) {
        console.log(error);
        return;
      }
      runner = new jailed.DynamicPlugin(code, customApi.remote);
      runner.whenFailed(function () {
        console.warn("jailed.DynamicPlugin failed while ploting/calculating");
      });
      disconnect = runner.disconnect.bind(runner);
      if (defaultTimout > 0)
        setTimeout((function() {
          var ref1;
          if (working) {
            console.log("(Graph-Chart-) Sandbox timed out after " + defaultTimout + "ms!");
            console.timeEnd("Graph-Chart");
            reject("Sandbox timed out");
            return runner.disconnect();
          }
        }), defaultTimout);
    });
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
          var id = 'charts-dg-' + uuid.v4()
          postProcessors.registerElemenbById(id, function (elem, done) {
            parseInput(prevCodeStr + inputStr).then(function (data) {
              fnc = function () {
                var chart
                chart = nvd3.models.lineChart()
                chart.useInteractiveGuideline(false) // true => buggy
                d3.select(elem.childNodes[0]).datum(data).call(chart)
                return chart
              }
              nvd3.addGraph(fnc)
              svgElem = elem.getElementsByClassName('output')[0]
              svgHeight = (svgElem != null ? svgElem.getBoundingClientRect().height : void 0) || 0
              elem.style.height = 350
            });

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
