({
  'baseUrl': './js',
  'name': 'app',
  'out': 'main-built.js',
  'paths': {
    'es6': '../../node_modules/requirejs-babel/es6',
    babel: '../../node_modules/requirejs-babel/babel-5.8.34.min',
    'babel-plugin-module-resolver': '../../node_modules/babel-plugin-module-resolver-standalone/index',
    'bootstrap': '../components/bootstrap.min',
    jquery: '../components/jquery-1.9.1.min',
    jqueryui: '../components/jquery-ui.min',
    jqueryform: '../components/jquery.form',
    underscore: '../components/underscore-min',
    backbone: '../components/backbone-min',
    localforage: '../components/localforage.min',
    bootstrap: '../components/bootstrap.min',
    text: '../components/require-text',
    jws: '../components/jws-3.2.min',
    jsrasign: '../components/jsrsasign-4.9.0.min',
    async: '../components/async',
    recaptcha: 'https://www.google.com/recaptcha/api/js/recaptcha_ajax',
    nGeohash: '../components/geohash/main',
    fancybox: '../components/fancybox/jquery.fancybox.pack', //v. 2.1.5
    annotator: '../components/annotator/v1.2.10/annotator-full',
    bioportal: '../components/bioportal/jquery.ncbo.tree-2.0.2',
    clipboard: '../components/clipboard.min',
    uuid: '../components/uuid',
    md5: '../components/md5',
    rdflib: '../components/rdflib.min',
    x2js: '../components/xml2json',
    he: '../components/he',
    citation: '../components/citation.min',
    promise: '../components/es6-promise.min',
    metacatuiConnectors: "./js/connectors/Filters-Search",
    // showdown + extensions (used in the MarkdownView to convert markdown to html)
    showdown: '../components/showdown/showdown.min',
    showdownHighlight: '../components/showdown/extensions/showdown-highlight/showdown-highlight',
    highlight: '../components/showdown/extensions/showdown-highlight/highlight.pack',
    showdownFootnotes: '../components/showdown/extensions/showdown-footnotes',
    showdownBootstrap: '../components/showdown/extensions/showdown-bootstrap',
    showdownDocbook: '../components/showdown/extensions/showdown-docbook',
    showdownKatex: '../components/showdown/extensions/showdown-katex/showdown-katex.min',
    showdownCitation: '../components/showdown/extensions/showdown-citation/showdown-citation',
    showdownImages: '../components/showdown/extensions/showdown-images',
    showdownXssFilter: '../components/showdown/extensions/showdown-xss-filter/showdown-xss-filter',
    xss: '../components/showdown/extensions/showdown-xss-filter/xss.min',
    showdownHtags: '../components/showdown/extensions/showdown-htags',
    // woofmark - markdown editor
    woofmark: '../components/woofmark.min',
    // drop zone creates drag and drop areas
    Dropzone: '../components/dropzone-amd-module',
    // Packages that convert between json data to markdown table
    markdownTableFromJson: '../components/markdown-table-from-json.min',
    markdownTableToJson: '../components/markdown-table-to-json',
    // Polyfill required for using dropzone with older browsers
    corejs: '../components/core-js',
    // Searchable multi-select dropdown component
    semanticUItransition: '../components/semanticUI/transition.min',
    semanticUIdropdown: '../components/semanticUI/dropdown.min',
    // To make elements drag and drop, sortable
    sortable: '../components/sortable.min',
    //Cesium
		// cesium: '../components/cesium/Cesium',
		cesium: 'https://cesium.com/downloads/cesiumjs/releases/1.91/Build/Cesium/Cesium',
    //Have a null fallback for our d3 components for browsers that don't support SVG
    d3: '../components/d3.v3.min',
    LineChart: 'views/LineChartView',
    BarChart: 'views/BarChartView',
    CircleBadge: 'views/CircleBadgeView',
    DonutChart: 'views/DonutChartView',
    MetricsChart: 'views/MetricsChartView',
  },
  shim: { /* used for libraries without native AMD support */
    underscore: {
      exports: '_',
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: 'Bootstrap'
    },
    annotator: {
      exports: 'Annotator'
    },
    bioportal: {
      exports: 'Bioportal'
    },
    jws: {
      exports: 'JWS',
      deps: ['jsrasign'],
    },
    nGeohash: {
      exports: "geohash"
    },
    fancybox: {
      deps: ['jquery']
    },
    uuid: {
      exports: 'uuid'
    },
    rdflib: {
      exports: 'rdf'
    },
    xss: {
      exports: 'filterXSS'
    },
    citation: {
      exports: 'citationRequire'
    },
    promise: {
      exports: 'Promise'
    },
    metacatuiConnectors: {
      exports: "FiltersSearchConnector"
    }
  },
  'exclude': ['babel', 'babel-plugin-module-resolver'],
  'optimize': 'none',
  'pragmasOnSave': {
    'excludeBabel': true
  },
  wrap: true,

  findNestedDependencies: true,
})