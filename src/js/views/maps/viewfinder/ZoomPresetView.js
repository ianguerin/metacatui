'use strict';

define(
  [
    'underscore',
    'backbone',
    'text!templates/maps/viewfinder/viewfinder-zoom-preset.html',
  ],
  (_, Backbone, Template) => {
    //TODO(ianguerin): fixe the classnames.
    // The base classname to use for this View's template elements.
    const BASE_CLASS = 'viewfinder-zoom-presets';

    /**
     * @class ZoomPresetView
     * @classdesc Allow user to zoom to a preset location with certain data
     * layers enabled.
     * @classcategory Views/Maps/Viewfinder
     * @name ZoomPresetView
     * @extends Backbone.View
     * // TODO(ianguerin): fill in this screenshot
     * @screenshot views/maps/viewfinder/ZoomPresetView.png
     * @since x.x.x
     * @constructs ZoomPresetView
     */
    var ZoomPresetView = Backbone.View.extend({
      /**
       * The type of View this is
       * @type {string}
       */
      type: 'ZoomPresetView',

      /**
       * The HTML class to use for this view's outermost element.
       * @type {string}
       */
      className: BASE_CLASS,

      /**
       * The HTML classes to use for this view's HTML elements.
       * @type {Object<string,string>}
       */
      classNames: {
        preset: `${BASE_CLASS}__preset`,
      },

      /**
      * The events this view will listen to and the associated function to call.
      * @type {Object}
      */
      events() {
        return {
          [`click .${this.classNames.preset}`]: 'select',
        };
      },

      select() {
        this.selectCallback();
      },

      /** Values meant to be used by the rendered HTML template. */
      templateVars: {
        classNames: {},
        preset: {},
      },

      /**
       * @typedef {Object} ZoomPresetViewOptions
       * @property {ViewfinderModel} The model associated with the parent view.
       */
      initialize({ preset, selectCallback }) {
        this.templateVars.classNames = this.classNames;
        this.selectCallback = selectCallback;
        this.templateVars.preset = preset;
      },

      /**
       * Render the view by updating the HTML of the element.
       * The new HTML is computed from an HTML template that
       * is passed an object with relevant view state.
       * */
      render() {
        this.el.innerHTML = _.template(Template)(this.templateVars);
      },
    });

    return ZoomPresetView;
  });