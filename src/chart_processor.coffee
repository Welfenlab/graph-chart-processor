markdownItGraph = require './md_graph'
d3 = require 'd3'
Plotly = require 'plotly.js'
#nvd3 = require 'nvd3'
uuid = require 'node-uuid'

graphChartProcessor = (tokens, graph_template, error_template) ->
  register: (mdInstance, postProcessors) ->
    markdownItGraph(tokens).register mdInstance, (inputStr) ->
      try        
        code = "
        function _plot(input) {
          if (typeof(input) == 'function')
            return input();
          return input;
        }
        function plot() {
          _plotData = [];
          for(var _i = 0; _i < arguments.length; _i++) {
            _plotData.push(_plot(arguments[_i]));
          }
          return _plotData;
        }
        #{inputStr}"
        
        out = []
        try
          out = eval code
        catch e
          console.log e
        
        data = []
        for part in out
           line = []
           xArray = []
           yArray = []
           for i in part
             xArray.push(i[0])
             yArray.push(i[1])

           data.push({
             x : xArray,
             y : yArray,
             type: 'scatter'
           })

        id = "tree-dg-" + uuid.v4()
        postProcessors.registerElemenbById id, (elem, done) ->
            Plotly.newPlot(elem, data);
            
            svgElem = elem.getElementsByClassName('output')[0]
            svgHeight = svgElem?.getBoundingClientRect().height || 0
            elem.style.height = svgHeight + 22

            done()

        # graph was parsed succesful
        return graph_template id: id

      # parsing errors..
      catch e
        return error_template error: e

    return null

module.exports = graphChartProcessor