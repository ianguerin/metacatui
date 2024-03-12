'use strict';

define(
  [
    'underscore',
    'backbone',
    'views/maps/viewfinder/ZoomPresetView',
  ],
  (_, Backbone, ZoomPresetView) => {
    // The base classname to use for this View's template elements.
    const BASE_CLASS = 'viewfinder-zoom-presets';

    /**
     * @class ZoomPresetsListView
     * @classdesc Allow user to zoom to a preset location with certain data
     * layers enabled.
     * @classcategory Views/Maps/Viewfinder
     * @name ZoomPresetsListView
     * @extends Backbone.View
     * // TODO(ianguerin): fill in this screenshot
     * @screenshot views/maps/viewfinder/ZoomPresetsListView.png
     * @since x.x.x
     * @constructs ZoomPresetsListView
     */
    var ZoomPresetsListView = Backbone.View.extend({
      /**
       * The type of View this is
       * @type {string}
       */
      type: 'ZoomPresetsListView',

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

      /** Values meant to be used by the rendered HTML template. */
      templateVars: {
        classNames: {},
      },

      /**
       * @typedef {Object} ZoomPresetsListViewOptions
       * @property {ViewfinderModel} The model associated with the parent view.
       */
      initialize({ viewfinderModel }) {
        this.children = [];
        this.templateVars.classNames = this.classNames;
        this.viewfinderModel = viewfinderModel;
      },

      /** Setup all event listeners on ViewfinderModel. */
      setupListeners() {
        // TODO(ianguerin):delete if empty.
      },

      /**
       * Render the view by updating the HTML of the element.
       * The new HTML is computed from an HTML template that
       * is passed an object with relevant view state.
       * */
      render() {
        this.children = this.viewfinderModel.get('zoomPresets').map(preset => {
          const view = new ZoomPresetView({
            selectCallback: () => {
              console.log("Select callback");
              this.viewfinderModel.selectZoomPreset(preset);
            },
            preset,
          });
          view.render();
          return view;
        });

        this.$el.html(this.children.map(view => view.el));
      },
    });

    return ZoomPresetsListView;
  });