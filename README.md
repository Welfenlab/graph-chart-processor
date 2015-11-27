# more-markdown / graph-chart-processor

A plugin for `more-markdown` that renders chart graphs.

# Installation

You first need a [more-markdown](https://github.com/Welfenlab/more-markdown) setup.
Then you can install it via:

```
npm install @more-markdown/graph-chart-processor
```

# Usage

```
var moreMarkdown = require('more-markdown');
var chartProcessor = require('@more-markdown/graph-chart-processor');

// create a processor that writes the final html
// to the element with the id 'output'
var proc = moreMarkdown.create('output', processors: [treeProcessor]);

proc.render("```chart" +
"//TODO: add example"
"```");
```
