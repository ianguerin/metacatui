"use strict";

define(['es6!views/maps/some-functions'], function ({ hello, goodbye }) {
  var SomeRequireJsModule = Backbone.View.extend({
    initialize() {
      console.log(`${hello()} and ${goodbye()}!`);
    }
  });

  return SomeRequireJsModule;
});
