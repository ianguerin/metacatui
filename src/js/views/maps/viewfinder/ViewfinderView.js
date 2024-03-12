'use strict';

define(
  [
    'underscore',
    'backbone',
    'text!templates/maps/viewfinder/viewfinder.html',
    'views/maps/viewfinder/SearchView',
    'models/maps/viewfinder/ViewfinderModel',
  ],
  (_, Backbone, Template, SearchView, ViewfinderModel) => {
    // The base classname to use for this View's template elements.
    const BASE_CLASS = 'viewfinder';

    /**
     * @class ViewfinderView
     * @classdesc ViewfinderView allows a user to search for
     * a latitude and longitude in the map view, and find suggestions
     * for places related to their search terms.
     * @classcategory Views/Maps
     * @name ViewfinderView
     * @extends Backbone.View
     * @screenshot views/maps/viewfinder/ViewfinderView.png
     * @since x.x.x
     * @constructs ViewfinderView
     */
    var ViewfinderView = Backbone.View.extend({
      /**
       * The type of View this is
       * @type {string}
       */
      type: 'ViewfinderView',

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
        searchView: `${BASE_CLASS}__search`,
      },

      /** 
       * Values meant to be used by the rendered HTML template.
       */
      templateVars: {
        classNames: {},
      },

      /**
       * @typedef {Object} ViewfinderViewOptions
       * @property {Map} The Map model associated with this view allowing control
       * of panning to different locations on the map. 
       */
      initialize({ model: mapModel }) {
        this.templateVars.classNames = this.classNames;
        this.viewfinderModel = new ViewfinderModel({ mapModel });
      },

      /** Call focus on child SearchView.  */
      focusInput(){
        this.searchView?.focusInput();
      },

      /** Render child SearchView and append to DOM. */
      renderSearchView() {
        this.searchView = new SearchView({
          viewfinderModel: this.viewfinderModel,
        });
        this.searchView.render();
        this.$el.find(`.${this.classNames.searchView}`).append(this.searchView.el);
      },

      /**
       * Render the view by updating the HTML of the element.
       * The new HTML is computed from an HTML template that
       * is passed an object with relevant view state.
       * */
      render() {
        this.el.innerHTML = _.template(Template)(this.templateVars);

        this.renderSearchView();
      },
    });

    return ViewfinderView;
  });