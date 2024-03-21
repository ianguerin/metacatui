"use strict";

define([
  "backbone",
  "text!templates/maps/search-input.html",
], (
  Backbone,
  Template,
) => {
  /**
   * @class SearchInputView
   * @classdesc SearchInputView is a shared component for searching information in the
   * map toolbar.
   * @classcategory Views/Maps
   * @name SearchInputView
   * @extends Backbone.View
   * @since x.x.x
   * @constructs SearchInputView
   */
  const SearchInputView = Backbone.View.extend({
    /**
     * The type of View this is
     * @type {string}
     */
    type: "SearchInputView",

    /**
    * The HTML classes to use for this view's element
    * @type {string}
    */
    className: "search-input",

    /**
     * The HTML classes to use for this view's HTML elements.
     * @type {Object<string,string>}
     */
    classNames: {
      searchButton: "search-input__search-button",
      cancelButton: "search-input__cancel-button",
      input: "search-input__input",
      errorInput: "search-input__error-input",
      errorText: "search-input__error-text",
    },

    /** 
     * Values meant to be used by the rendered HTML template.
     */
    templateVars: {
      errorText: "",
      placeholder: "",
      classNames: {},
    },

    /**
    * The events this view will listen to and the associated function to call.
    * @type {Object}
    */
    events() {
      return {
        [`click .${this.classNames.cancelButton}`]: "onCancel",
        [`blur  .${this.classNames.input}`]: 'onBlur',
        [`change  .${this.classNames.input}`]: 'onKeyup',
        [`focus  .${this.classNames.input}`]: 'onFocus',
        [`keydown  .${this.classNames.input}`]: 'onKeydown',
        [`keyup .${this.classNames.input}`]: 'onKeyup',
        [`click .${this.classNames.searchButton}`]: "onSearch",
      };
    },

    /**
     * @typedef {Object} SearchInputViewOptions
     * @property {Function} search A function that takes in a text input and returns
     * a boolean for whether there is a match.
     * @property {Function} keydownCallback A function that receives a key event
     * on keydown.
     * @property {Function} keyupCallback A function that receives a key event
     * on keyup stroke.
     * @property {Function} blurCallback A function that receives an event on
     * blur of the input.
     * @property {Function} focusCallback A function that receives an event on
     * focus of the input.
     * @property {Function} noMatchCallback A callback function to handle a no match
     * situation.
     * @property {String} placeholder The placeholder text for the input box.
     */
    initialize(options) {
      if (typeof (options.search) !== "function") {
        throw new Error("Initializing SearchInputView without a search function.");
      }
      this.search = options.search;
      this.keyupCallback = options.keyupCallback || noop;
      this.keydownCallback = options.keydownCallback || noop;
      this.blurCallback = options.blurCallback || noop;
      this.focusCallback = options.focusCallback || noop;
      this.noMatchCallback = options.noMatchCallback || noop;
      this.templateVars.placeholder = options.placeholder;
      this.templateVars.classNames = this.classNames;
    },

    /**
     * Render the view by updating the HTML of the element.
     * The new HTML is computed from an HTML template that
     * is passed an object with relevant view state.
     * */
    render() {
      this.el.innerHTML = _.template(Template)(this.templateVars);
    },

    /**
     * Event handler for Backbone.View configuration that is called whenever 
     * the user types a key.
     */
    onKeyup(event) {
      if (event.key === "Enter") {
        this.onSearch();
        return;
      }

      this.keyupCallback(event);
    },

    /**
     * Event handler for Backbone.View configuration that is called whenever 
     * the user types a key.
     */
    onKeydown(event) {
      this.keydownCallback(event);
    },

    /**
     * Event handler for Backbone.View configuration that is called whenever 
     * the user focuses the input.
     */
    onFocus(event) {
      this.focusCallback(event);
    },

    /**
     * Event handler for Backbone.View configuration that is called whenever 
     * the user blurs the input.
     */
    onBlur(event) {
      this.blurCallback(event);
    },

    /**
     * Event handler for Backbone.View configuration that is called whenever 
     * the user clicks the search button or hits the Enter key.
     */
    onSearch() {
      this.getError().hide();

      const input = this.getInput();
      const inputValue = this.getInputValue().toLowerCase();
      const matched = this.search(inputValue);
      if (matched) {
        input.removeClass(this.classNames.errorInput);
      } else {
        input.addClass(this.classNames.errorInput);
        if (typeof (this.noMatchCallback) === "function") {
          this.noMatchCallback();
        }
      }

      if (inputValue !== "") {
        this.getSearchButton().hide();
        this.getCancelButton().show();
      } else {
        this.getSearchButton().show();
        this.getCancelButton().hide();
      }
    },

    /**
     * API for the view that conducts the search to toggle on the error message.
     * @param {string} errorText
     */
    setError(errorText) {
      this.getInput().addClass(this.classNames.errorInput);
      const errorTextEl = this.getError();
      if (errorText) {
        errorTextEl.html(errorText);
        errorTextEl.show();
      } else {
        errorTextEl.html('');
        errorTextEl.hide();
      }
    },

    onCancel() {
      this.getInput().val("");
      this.onSearch();
      this.focus();
    },

    focus() {
      this.getInput().trigger("focus");
    },

    blur() {
      this.getInput().trigger("blur");
    },

    getSearchButton() {
      return this.$(`.${this.classNames.searchButton}`);
    },

    getCancelButton() {
      return this.$(`.${this.classNames.cancelButton}`);
    },

    getInput() {
      return this.$(`.${this.classNames.input}`);
    },

    getInputValue() {
      return this.getInput().val();
    },

    setInputValue(value) {
      this.getInput().val(value);
    },

    getError() {
      return this.$(`.${this.classNames.errorText}`);
    },
  });

  // A function that does nothing.
  const noop = () => { };

  return SearchInputView;
});
