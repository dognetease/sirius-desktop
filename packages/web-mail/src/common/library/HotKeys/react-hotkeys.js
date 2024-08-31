/* eslint-disable */
// https://github.com/greena13/react-hotkeys
// https://unpkg.com/react-hotkeys@2.0.0/umd/react-hotkeys.js
/**
 * ISC License
 *
 * Copyright (c) 2018, Aleck Greenham
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports, require('prop-types'), require('react'))
    : typeof define === 'function' && define.amd
    ? define(['exports', 'prop-types', 'react'], factory)
    : ((global = global || self), factory((global.ReactHotkeys = {}), global.PropTypes, global.React));
})(this, function (exports, PropTypes, React) {
  'use strict';

  PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;
  var React__default = 'default' in React ? React['default'] : React;

  function _typeof(obj) {
    if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _extends() {
    _extends =
      Object.assign ||
      function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }

        return target;
      };

    return _extends.apply(this, arguments);
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      var ownKeys = Object.keys(source);

      if (typeof Object.getOwnPropertySymbols === 'function') {
        ownKeys = ownKeys.concat(
          Object.getOwnPropertySymbols(source).filter(function (sym) {
            return Object.getOwnPropertyDescriptor(source, sym).enumerable;
          })
        );
      }

      ownKeys.forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    }

    return target;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
      throw new TypeError('Super expression must either be null or a function');
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true,
      },
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf
      ? Object.getPrototypeOf
      : function _getPrototypeOf(o) {
          return o.__proto__ || Object.getPrototypeOf(o);
        };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf =
      Object.setPrototypeOf ||
      function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
      };

    return _setPrototypeOf(o, p);
  }

  function isNativeReflectConstruct() {
    if (typeof Reflect === 'undefined' || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === 'function') return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _construct(Parent, args, Class) {
    if (isNativeReflectConstruct()) {
      _construct = Reflect.construct;
    } else {
      _construct = function _construct(Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var Constructor = Function.bind.apply(Parent, a);
        var instance = new Constructor();
        if (Class) _setPrototypeOf(instance, Class.prototype);
        return instance;
      };
    }

    return _construct.apply(null, arguments);
  }

  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf('[native code]') !== -1;
  }

  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === 'function' ? new Map() : undefined;

    _wrapNativeSuper = function _wrapNativeSuper(Class) {
      if (Class === null || !_isNativeFunction(Class)) return Class;

      if (typeof Class !== 'function') {
        throw new TypeError('Super expression must either be null or a function');
      }

      if (typeof _cache !== 'undefined') {
        if (_cache.has(Class)) return _cache.get(Class);

        _cache.set(Class, Wrapper);
      }

      function Wrapper() {
        return _construct(Class, arguments, _getPrototypeOf(this).constructor);
      }

      Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: false,
          writable: true,
          configurable: true,
        },
      });
      return _setPrototypeOf(Wrapper, Class);
    };

    return _wrapNativeSuper(Class);
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  function _objectWithoutProperties(source, excluded) {
    if (source == null) return {};

    var target = _objectWithoutPropertiesLoose(source, excluded);

    var key, i;

    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }

    return target;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === 'object' || typeof call === 'function')) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }

    return object;
  }

  function _get(target, property, receiver) {
    if (typeof Reflect !== 'undefined' && Reflect.get) {
      _get = Reflect.get;
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);

        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(receiver);
        }

        return desc.value;
      };
    }

    return _get(target, property, receiver || target);
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === '[object Arguments]') return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError('Invalid attempt to spread non-iterable instance');
  }

  function arrayFrom(target) {
    if (Array.isArray(target)) {
      return target;
    } else if (!target) {
      return [];
    } else {
      return [target];
    }
  }

  function nop(element) {
    return element;
  }

  /**
   * @callback DictionaryKeyAdaptor
   * Adapts values to be used as keys in a dictionary
   * @param {*} value to adapt
   * @returns {*} The adapted value to use as a dictionary key
   */
  /**
   * Create a dictionary (map) from an array of values
   * @param {*[]} array Array of values
   * @param {function|*} valueOrAdaptor Function to call on each element in the array to
   *        set the value in the dictionary, or a constant value that all keys in the
   *        dictionary should have
   * @param {DictionaryKeyAdaptor} keyAdaptor Function to call on each element
   * @param {Object} initValue Initial value of the dictionary to add the new entries to
   * @returns {Object.<*,*>} Dictionary created from array elements
   */

  function dictionaryFrom(array) {
    var valueOrAdaptor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var keyAdaptor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : nop;
    var initValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    var _valueAdaptor = (function () {
      if (typeof valueOrAdaptor === 'function') {
        return valueOrAdaptor;
      }

      return function () {
        return valueOrAdaptor;
      };
    })();

    return arrayFrom(array).reduce(function (memo, element) {
      memo[keyAdaptor(element)] = _valueAdaptor(element);
      return memo;
    }, initValue);
  }

  var objectValues = function (object) {
    return Object.keys(object).map(function (key) {
      return object[key];
    });
  };

  /**
   * Default configuration values
   * @private
   */

  var _defaultConfiguration = {
    /**
     * The level of logging of its own behaviour React HotKeys should perform.
     * @type {LogLevel}
     */
    logLevel: 'warn',

    /**
     * Default key event key maps are bound to, if left unspecified
     * @type {KeyEventName}
     */
    defaultKeyEvent: 'keydown',

    /**
     * The default component type to wrap HotKey components' children in, to provide
     * the required focus and keyboard event listening for HotKeys to function
     */
    defaultComponent: 'div',

    /**
     * The default tabIndex value passed to the wrapping component used to contain
     * HotKey components' children. -1 skips focusing the element when tabbing through
     * the DOM, but allows focusing programmatically.
     */
    defaultTabIndex: '-1',

    /**
     * The HTML tags that React HotKeys should ignore key events from. This only works
     * if you are using the default ignoreEventsCondition function.
     * @type {String[]}
     */
    ignoreTags: ['input', 'select', 'textarea'],

    /**
     * Whether to ignore changes to keyMap and handlers props by default (this reduces
     * a significant amount of unnecessarily resetting internal state)
     *
     * @type {boolean}
     */
    ignoreKeymapAndHandlerChangesByDefault: true,

    /**
     * The function used to determine whether a key event should be ignored by React
     * Hotkeys. By default, keyboard events originating elements with a tag name in
     * ignoreTags, or a isContentEditable property of true, are ignored.
     *
     * @type {Function<KeyboardEvent>}
     */
    ignoreEventsCondition: function ignoreEventsCondition(event) {
      var target = event.target;

      if (target && target.tagName) {
        var tagName = target.tagName.toLowerCase();
        return Configuration.option('_ignoreTagsDict')[tagName] || target.isContentEditable;
      } else {
        return false;
      }
    },

    /**
     * Whether to ignore repeated keyboard events when a key is being held down
     * @type {boolean}
     */
    ignoreRepeatedEventsWhenKeyHeldDown: true,

    /**
     * Whether React HotKeys should simulate keypress events for the keys that do not
     * natively emit them.
     * @type {boolean}
     */
    simulateMissingKeyPressEvents: true,

    /**
     * Whether to call stopPropagation() on events after they are handled (preventing
     * the event from bubbling up any further, both within React Hotkeys and any other
     * event listeners bound in React).
     *
     * This does not affect the behaviour of React Hotkeys, but rather what happens to
     * the event once React Hotkeys is done with it (whether it's allowed to propagate
     * any further through the Render tree).
     * @type {boolean}
     */
    stopEventPropagationAfterHandling: true,

    /**
     * Whether to call stopPropagation() on events after they are ignored (preventing
     * the event from bubbling up any further, both within React Hotkeys and any other
     * event listeners bound in React).
     *
     * This does not affect the behaviour of React Hotkeys, but rather what happens to
     * the event once React Hotkeys is done with it (whether it's allowed to propagate
     * any further through the Render tree).
     * @type {boolean}
     */
    stopEventPropagationAfterIgnoring: true,

    /**
     * Whether to allow combination submatches - e.g. if there is an action bound to
     * cmd, pressing shift+cmd will *not* trigger that action when
     * allowCombinationSubmatches is false.
     *
     * @note This option is ignored for combinations involving command (Meta) and
     *      submatches are <i>always</i> allowed because Meta hides keyup events
     *      of other keys, so until Command is released, it's impossible to know
     *      if one of the keys that has also been pressed has been released.
     *      @see https://github.com/greena13/react-hotkeys/pull/207
     * @type {boolean}
     */
    allowCombinationSubmatches: false,

    /**
     * A mapping of custom key codes to key names that you can then use in your
     * key sequences
     * @type {Object.<Number, KeyName>}
     */
    customKeyCodes: {},
  };

  var _configuration = _objectSpread({}, _defaultConfiguration);
  /**
   * Turn our array of tags to ignore into a dictionary, for faster lookup
   */

  _configuration._ignoreTagsDict = dictionaryFrom(_configuration.ignoreTags);
  /**
   * Handles getting and setting global configuration values, that affect how
   * React Hotkeys behaves
   * @class
   */

  var Configuration =
    /*#__PURE__*/
    (function () {
      function Configuration() {
        _classCallCheck(this, Configuration);
      }

      _createClass(Configuration, null, [
        {
          key: 'init',

          /**
           * Merges the specified configuration options with the current values.
           * @see _configuration
           */
          value: function init(configuration) {
            var _this = this;

            var ignoreTags = configuration.ignoreTags,
              customKeyCodes = configuration.customKeyCodes;

            if (ignoreTags) {
              configuration._ignoreTagsDict = dictionaryFrom(configuration.ignoreTags);
            }

            if (customKeyCodes) {
              configuration._customKeyNamesDict = dictionaryFrom(objectValues(configuration.customKeyCodes));
            } // noinspection JSUnresolvedVariable

            Object.keys(configuration).forEach(function (key) {
              _this.set(key, configuration[key]);
            });
          },
          /**
           * Sets a single configuration value by name
           * @param {string} key - Name of the configuration value to set
           * @param {*} value - New value to set
           */
        },
        {
          key: 'set',
          value: function set(key, value) {
            _configuration[key] = value;
          },
        },
        {
          key: 'reset',
          value: function reset(key) {
            _configuration[key] = _defaultConfiguration[key];
          },
          /**
           * Gets a single configuration value by name
           * @param {string} key - Name of the configuration value
           * @returns {*} Configuration value
           */
        },
        {
          key: 'option',
          value: function option(key) {
            return _configuration[key];
          },
        },
      ]);

      return Configuration;
    })();

  /**
   * Modifies in-place and returns a React Component class such that it correctly uses
   * the React context API appropriate for the version of React being used.
   *
   * @see https://reactjs.org/docs/context.html
   *
   * @param {React.Component} Component React component to modify to use the correct
   *        context API
   * @param {Object} options Hash of options that define the shape and default values
   *        of the context to use with descendant components.
   * @param {Object} options.deprecatedAPI Hash of options that satisfy the legacy
   *        or deprecated pre React 16.* API
   * @param {Object} options.deprecatedAPI.contextTypes Context types describing the
   *        shape and type of the context that Component consumes, expressed as React
   *        prop types
   * @param {Object} options.deprecatedAPI.childContextTypes Context types describing the
   *        shape and type of the context that Component makes available to its descendants
   *        to consume, expressed as React prop types
   * @param {Object} options.newAPI Hash of options that satisfy the new context API,
   *        available from React 16.* onwards
   * @param {Object} options.newAPI.contextType Object describing the shape and default
   *        values of the context instance used provide context to descendant components
   * @returns {React.Component} Component that has now had the specified context applied
   */

  function backwardsCompatibleContext(Component, _ref) {
    var _ref$deprecatedAPI = _ref.deprecatedAPI,
      contextTypes = _ref$deprecatedAPI.contextTypes,
      childContextTypes = _ref$deprecatedAPI.childContextTypes,
      contextType = _ref.newAPI.contextType;

    /**
     * React v16.* introduces a new context API and deprecates the previous, experimental one
     */
    if (typeof React__default.createContext === 'undefined') {
      /**
       * We apply the deprecated context if the new createContext method is not defined.
       * @note this uses the new context API for React v16.*, even though it is still
       * available until React v17.*
       */
      // noinspection JSUndefinedPropertyAssignment

      /**
       * The contextTypes and childContextTypes are the same as each react hotkeys component
       * that uses context, both consumes its most direct ancestor's context and modifies
       * the context of its descendants in order to recursively pass down the guid of the
       * most direct ancestor
       */
      Component.contextTypes = contextTypes; // noinspection JSUndefinedPropertyAssignment

      Component.childContextTypes = childContextTypes; // noinspection JSUnresolvedVariable,JSUnusedGlobalSymbols

      Component.prototype.getChildContext = function () {
        return this._manager.childContext;
      };
    } else {
      // noinspection UnnecessaryLocalVariableJS
      var context = React__default.createContext(contextType); // noinspection JSUndefinedPropertyAssignment

      Component.contextType = context; // noinspection JSUnresolvedVariable

      Component.prototype._originalRender = Component.prototype.render; // noinspection JSUnresolvedVariable

      /**
       * We unfortunately have to wrap the original render method of the Component to
       * dynamically add the context Provider component.
       *
       * No ill-effects have been discovered during testing, but if strange occurrences
       * or edge cases start to appear - this may be a great place to start looking.
       */

      Component.prototype.render = function () {
        var result = this._originalRender();

        if (result) {
          return React__default.createElement(
            context.Provider,
            {
              value: this._manager.childContext,
            },
            result
          );
        } else {
          return null;
        }
      };
    }

    return Component;
  }

  function isUndefined(object) {
    return typeof object === 'undefined';
  }

  /**
   * Encapsulates all logging behaviour and provides the ability to specify the level
   * of logging desired.
   * @class
   */
  var Logger =
    /*#__PURE__*/
    (function () {
      _createClass(Logger, [
        {
          key: 'noop',

          /**
           * Icons prefixed to the start of logging statements that cycled through each
           * time a focus tree changes, making it easier to quickly spot events related
           * to the same focus tree.
           */

          /**
           * Icons prefixed to the start of logging statements that cycled through each
           * time a component ID changes, making it easier to quickly spot events related
           * to the same component.
           */

          /**
           * Icons prefixed to the start of logging statements that cycled through each
           * time an event ID changes, making it easier to quickly trace the path of KeyEvent
           * objects as they propagate through multiple components.
           */

          /**
           * The level of logging to perform
           * @typedef {'none'|'error'|'warn'|'info'|'debug'|'verbose'} LogLevel
           */

          /**
           * Levels of log severity - the higher the log level, the greater the amount (and
           * lesser the importance) of information logged to the console about React HotKey's
           * behaviour
           * @enum {number} LogLevel
           */
          value: function noop() {},
          /**
           * By default, calls to all log severities are a no-operation. It's only when the
           * user specifies a log level, are they replaced with logging statements
           * @type {Logger.noop}
           */
        },
      ]);

      function Logger() {
        var logLevel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'warn';

        _classCallCheck(this, Logger);

        _defineProperty(this, 'verbose', this.noop);

        _defineProperty(this, 'debug', this.noop);

        _defineProperty(this, 'info', this.noop);

        _defineProperty(this, 'warn', this.noop);

        _defineProperty(this, 'error', this.noop);

        this.logLevel = this.constructor.levels[logLevel];
        var _arr = ['error', 'warn', 'info', 'debug', 'verbose'];

        for (var _i = 0; _i < _arr.length; _i++) {
          var level = _arr[_i];

          if (this.logLevel < this.constructor.levels[level]) {
            return;
          }

          this[level] = ['debug', 'verbose'].indexOf(level) === -1 ? console[level] : console.log;
        }
      }

      return Logger;
    })();

  _defineProperty(Logger, 'logIcons', ['📕', '📗', '📘', '📙']);

  _defineProperty(Logger, 'componentIcons', ['🔺', '⭐️', '🔷', '🔶', '⬛️']);

  _defineProperty(Logger, 'eventIcons', ['❤️', '💚', '💙', '💛', '💜', '🧡']);

  _defineProperty(Logger, 'levels', {
    none: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    verbose: 5,
  });

  /**
   * @typedef {number} KeyEventType index (0-2) of which position in an event record
   * a particular event is located
   */

  /**
   * Enum for types of key events
   * @readonly
   * @enum {KeyEventType}
   */
  var KeyEventType = {
    keydown: 0,
    keypress: 1,
    keyup: 2,
  };

  /**
   * Enum for index values for KeyEvents
   * @readonly
   * @enum {number}
   */
  var KeyEventSequenceIndex = {
    previous: 0,
    current: 1,
  };

  /**
   * Dictionary of symbols that correspond to keys when pressed with the shift key
   * also held down. Used for combinations involving the shift key and one or more
   * others. (e.g. shift+1)
   */
  var ShiftedKeysDictionary = {
    '`': ['~'],
    1: ['!'],
    2: [
      '@',
      /** UK Keyboard: **/
      '"',
    ],
    3: [
      '#',
      /** UK Keyboard: **/
      '£',
    ],
    4: ['$'],
    5: ['%'],
    6: ['^'],
    7: ['&'],
    8: ['*'],
    9: ['('],
    0: [')'],
    '-': ['_'],
    '=': ['plus'],
    ';': [':'],
    "'": [
      '"',
      /** UK Keyboard: **/
      '@',
    ],
    ',': ['<'],
    '.': ['>'],
    '/': ['?'],
    '\\': ['|'],
    '[': ['{'],
    ']': ['}'],

    /**
     * UK Keyboard:
     */
    '#': ['~'],
  };

  function fallbackToTransformedSelf(dictionary, keyName, transformMethod) {
    return dictionary[keyName] || [keyName.length === 1 ? keyName[transformMethod]() : keyName];
  }

  /**
   * Returns the corresponding symbol or character for a particular key, when it is
   * pressed with the shift key also held down
   * @param {NormalizedKeyName} keyName Name of the key
   * @returns {ReactKeyName[]} Symbol or character for the key, when it is pressed with the
   *          shift key
   */

  function resolveShiftedAlias(keyName) {
    return fallbackToTransformedSelf(ShiftedKeysDictionary, keyName, 'toUpperCase');
  }

  function hasKey(object, key) {
    return object.hasOwnProperty(key);
  }

  function invertArrayDictionary(dictionary) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return Object.keys(dictionary).reduce(function (memo, key) {
      var arrayValue = dictionary[key];
      arrayValue.forEach(function (shiftedKey) {
        if (!hasKey(memo, shiftedKey)) {
          memo[shiftedKey] = [];
        }

        memo[shiftedKey].push(key);
      });

      if (options.includeOriginal) {
        if (!hasKey(memo, key)) {
          memo[key] = [];
        }

        memo[key] = [].concat(_toConsumableArray(memo[key]), _toConsumableArray(arrayValue));
      }

      return memo;
    }, {});
  }

  var UnshiftedKeysDictionary = invertArrayDictionary(ShiftedKeysDictionary);

  /**
   * Returns the name of the key that must be pressed with the shift key, to yield the
   * specified symbol
   * @param {NormalizedKeyName} keyName Name of the key
   * @returns {ReactKeyName[]} Name of the key that must be pressed with the shift key, to
   *          yield the specified symbol
   */

  function resolveUnshiftedAlias(keyName) {
    return fallbackToTransformedSelf(UnshiftedKeysDictionary, keyName, 'toLowerCase');
  }

  /**
   * A dictionary of key aliases to make it easier to specify key maps that work
   * across different keyboard layouts and operating systems - this builds on top
   * of what React already does.
   */
  var KeyOSAndLayoutAliasesDictionary = {};
  var KeyOSAndLayoutAliasesDictionary$1 = invertArrayDictionary(KeyOSAndLayoutAliasesDictionary, {
    includeOriginal: true,
  });

  function isString(object) {
    return typeof object === 'string';
  }

  function stripSuperfluousWhitespace(target) {
    if (isString(target)) {
      return target.trim().replace(/\s+/g, ' ');
    }

    return target;
  }

  /**
   * A mapping between Mousetrap syntax and React syntax to support the use of both
   */
  var MousetrapToReactKeyNamesDictionary = {
    /**
     * Generic
     */
    tab: 'Tab',
    capslock: 'CapsLock',
    shift: 'Shift',
    meta: 'Meta',
    alt: 'Alt',
    ctrl: 'Control',
    space: ' ',
    spacebar: ' ',
    escape: 'Escape',
    esc: 'Escape',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    down: 'ArrowDown',

    /**
     * Mac
     */
    return: 'Enter',
    del: 'Delete',
    command: 'Meta',
    option: 'Alt',

    /**
     * Windows
     */
    enter: 'Enter',
    backspace: 'Backspace',
    ins: 'Insert',
    pageup: 'PageUp',
    pagedown: 'PageDown',
    end: 'End',
    home: 'Home',
    contextmenu: 'ContextMenu',
    numlock: 'Clear',
  };

  /**
   * A mapping between key names and official names
   */
  var KeyShorthandDictionary = {
    cmd: 'Meta',
  };

  /**
   * A dictionary of symbols for each key, when pressed with the alt and shift key also
   * held. Used for combinations that involve the shift and alt key and one or more
   * others (e.g. shift+alt+a)
   */
  var AltShiftedKeysDictionary = {
    '`': ['`'],
    1: ['⁄'],
    2: ['€'],
    3: ['‹'],
    4: ['›'],
    5: ['ﬁ'],
    6: ['ﬂ'],
    7: ['‡'],
    8: ['°'],
    9: ['·'],
    0: ['‚'],
    '-': ['—'],
    '=': ['±'],
    a: ['Å'],
    b: ['ı'],
    c: ['Ç'],
    d: ['Î'],
    e: ['´'],
    f: ['Ï'],
    g: ['˝'],
    h: ['Ó'],
    i: ['ˆ'],
    j: ['Ô'],
    k: [''],
    l: ['Ò'],
    m: ['Â'],
    n: ['˜'],
    o: ['Ø'],
    p: ['π'],
    q: ['Œ'],
    r: ['‰'],
    s: ['Í'],
    t: ['Î'],
    u: ['¨'],
    v: ['◊'],
    w: ['„'],
    x: ['˛'],
    y: ['Á'],
    z: ['¸'],
    '[': ['”'],
    ']': ['’'],
    '\\': ['»'],
    "'": ['Æ'],
    ';': ['Ú'],
    ',': ['¯'],
    '.': ['˘'],
  };

  var UnaltShiftedKeysDictionary = invertArrayDictionary(AltShiftedKeysDictionary);

  /**
   * Returns the name of the key that must be pressed with the shift and alt keys,
   * to yield the specified symbol
   * @param {ReactKeyName} keyName Name of the key
   * @returns {ReactKeyName[]} Name of the key that must be pressed with the alt key, to
   *          yield the specified symbol
   */

  function resolveUnaltShiftedAlias(keyName) {
    return UnaltShiftedKeysDictionary[keyName] || resolveUnshiftedAlias(keyName);
  }

  /**
   * @typedef {string} KeyName Name of the keyboard key
   */

  /**
   * @typedef {string} ReactKeyName Name used by React to refer to key
   */

  /**
   * Returns the name for the specified key used by React. Supports translating key aliases
   * used by mousetrap to their counterparts in React
   * @param {KeyName} keyName Name of the key to resolve to the React equivalent
   * @param {Object} modifierKeys Options of which modifier keys are also pressed
   * @returns {ReactKeyName} Name used by React to refer to the key
   */

  function standardizeKeyName(keyName) {
    var modifierKeys =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : {
            shift: false,
            alt: false,
          };

    var _keyName = keyName.toLowerCase();

    var keyAfterAliases = MousetrapToReactKeyNamesDictionary[_keyName] || KeyShorthandDictionary[_keyName] || (keyName.match(/^f\d+$/) ? keyName.toUpperCase() : keyName);

    if (modifierKeys.shift) {
      if (modifierKeys.alt) {
        return resolveUnaltShiftedAlias(keyAfterAliases);
      } else {
        return resolveUnshiftedAlias(keyAfterAliases);
      }
    }

    return keyAfterAliases;
  }

  /**
   * Translation from legacy `keyCode` to HTML5 `key`
   * Only special keys supported, all others depend on keyboard layout or browser
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
   */
  var translateToKey = {
    8: 'Backspace',
    9: 'Tab',
    12: 'Clear',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    19: 'Pause',
    20: 'CapsLock',
    27: 'Escape',
    32: ' ',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    45: 'Insert',
    46: 'Delete',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'NumLock',
    145: 'ScrollLock',
    224: 'Meta',
  };

  /**
   * Dictionary of keys whose name is not a single symbol or character
   */
  var NonPrintableKeysDictionary = dictionaryFrom(objectValues(translateToKey));

  /**
   * Whether the specified key is a valid key name that is not a single character or
   * symbol
   * @param {ReactKeyName} keyName Name of the key
   * @returns {boolean} Whether the key is a valid special key
   */

  function isNonPrintableKeyName(keyName) {
    return !!NonPrintableKeysDictionary[keyName];
  }

  /**
   * Whether the specified key name is among those defined as custom key codes
   * @param {ReactKeyName} keyName Name of the key
   * @returns {boolean} true if keyName matches a custom key name
   */

  function isCustomKeyName(keyName) {
    return Configuration.option('_customKeyNamesDict')[keyName];
  }

  function isValidKey(keyName) {
    return isNonPrintableKeyName(keyName) || String.fromCharCode(keyName.charCodeAt(0)) === keyName || isCustomKeyName(keyName);
  }

  var InvalidKeyNameError =
    /*#__PURE__*/
    (function (_Error) {
      _inherits(InvalidKeyNameError, _Error);

      function InvalidKeyNameError() {
        var _getPrototypeOf2;

        var _this;

        _classCallCheck(this, InvalidKeyNameError);

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(InvalidKeyNameError)).call.apply(_getPrototypeOf2, [this].concat(args)));

        _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), 'name', 'InvalidKeyNameError');

        return _this;
      }

      return InvalidKeyNameError;
    })(_wrapNativeSuper(Error));

  /**
   * Returns a normalized KeyCombinationString (with the key names in the combination
   * sorted in alphabetical order)
   * @param {Object.<ReactKeyName, Boolean>} keyDictionary Dictionary of key names
   * @returns {NormalizedKeyCombinationString} Normalized KeyCombinationString
   */
  function normalizedCombinationId(keyDictionary) {
    return Object.keys(keyDictionary)
      .sort(function (a, b) {
        if (a.length !== b.length) {
          return b.length - a.length;
        }

        if (a < b) {
          return -1;
        }

        if (a > b) {
          return 1;
        }

        return 0;
      })
      .join('+');
  }

  /**
   * Parses KeySequenceStrings and returns KeySequenceOptions
   *
   * Used primarily to parse strings describing hot key sequences and combinations
   * so that they may be matched with key events when they occur.
   * @class
   */

  var KeySequenceParser =
    /*#__PURE__*/
    (function () {
      function KeySequenceParser() {
        _classCallCheck(this, KeySequenceParser);
      }

      _createClass(KeySequenceParser, null, [
        {
          key: 'parse',

          /**
           * @typedef {Object} BasicKeyCombination Object containing the basic information that
           *          describes a key combination
           * @property {KeyCombinationString} id - String description of keys involved in the key
           *          combination
           * @property {number} size - Number of keys involved in the combination
           * @property {Object.<KeyName, Boolean>} keyDictionary - Dictionary of key names involved
           *           in the key combination
           * @property {KeyEventType} keyEventType - Record index for key event that
           *          the matcher should match on
           */

          /**
           * @typedef {string} KeySequenceString String describing a sequence of one or more key
           * combinations with whitespace separating key combinations in the sequence and '+'
           * separating keys within a key combination.
           */

          /**
           * @typedef {KeySequenceString} NormalizedKeySequenceId key sequence id with all of the
           * combination id's normalized
           */

          /**
           * @typedef {Object} BasicKeySequence Object containing the basic information that
           *          describes a key sequence
           * @property {NormalizedKeySequenceId} prefix - Normalized key sequence id
           * @property {number} size - Number of combinations involved in the sequence
           */

          /**
           * @typedef {Object} KeySequenceObject Object containing description of a key sequence
           *          to compared against key events
           * @property {KeySequenceString} id Id describing key sequence used for matching against
           *            key events
           * @property {ComponentId} componentId Id associated with the HotKeys component
           *          that registered the key sequence
           * @property {BasicKeyCombination[]} sequence A list of key combinations involved in
           *            the sequence
           * @property {number} size Number of key combinations in the key sequence
           * @property {KeyEventType} keyEventType Index that matches key event type
           * @property {ActionName} actionName Name of the action that should be triggered if a
           *           keyboard event matching the sequence and event type occur
           */

          /**
           * @typedef {Object} KeySequenceOptions Object containing the results of parsing a
           *          KeySequenceString
           * @property {BasicKeyCombination} combination Properties of the final combination in
           *        the sequence
           * @property {BasicKeySequence} sequence Properties of the sequence of keys leading
           *        up to the final combination
           */

          /**
           * Parses a KeySequenceString and returns a KeySequenceOptions object containing
           * information about the sequence in a format that is easier to query
           * @param {KeySequenceString} sequenceString String describing a key sequence to
           *        parse
           * @param {Object} options Configuration object describing how the KeySequenceString
           *        should be parsed.
           * @param {KeyEventType} options.keyEventType Event record index indicating
           *        what key event the sequence should match
           * @param {boolean} options.ensureValidKeys Whether to throw an exception if an invalid
           *        key name is found in the key combination string.
           * @returns {KeySequenceOptions} Object containing information about the key
           *        sequence described by the KeySequenceString
           */
          value: function parse(sequenceString) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var trimmedSequenceString = stripSuperfluousWhitespace(sequenceString);
            var keyCombinationsArray = trimmedSequenceString.split(' ');

            try {
              var nonTerminalCombinations = keyCombinationsArray.slice(0, keyCombinationsArray.length - 1);
              var terminalCombination = keyCombinationsArray[keyCombinationsArray.length - 1];
              var prefix = nonTerminalCombinations
                .map(function (keyCombination) {
                  var keysInComboDict = parseCombination(keyCombination, options);
                  return normalizedCombinationId(keysInComboDict);
                })
                .join(' ');
              var keysInComboDict = parseCombination(terminalCombination, options);
              var normalizedComboString = normalizedCombinationId(keysInComboDict);
              var combination = {
                id: normalizedComboString,
                keyDictionary: keysInComboDict,
                keyEventType: options.keyEventType,
                size: Object.keys(keysInComboDict).length,
              };
              return {
                sequence: {
                  prefix: prefix,
                  size: nonTerminalCombinations.length + 1,
                },
                combination: combination,
              };
            } catch (InvalidKeyNameError$$1) {
              return {
                sequence: null,
                combination: null,
              };
            }
          },
        },
      ]);

      return KeySequenceParser;
    })();
  /**
   * @typedef {string} KeyCombinationString String describing a combination of one or more
   * keys separated by '+'
   */

  /**
   * @typedef {KeyCombinationString} NormalizedKeyCombinationString key combination id where
   * the keys have been normalized (sorted in alphabetical order)
   */

  /**
   * @typedef {Object.<ReactKeyName, Boolean>} KeyDictionary Registry of the names
   * of keys in a particular combination, for easy/quick checking if a particular
   * key is in the key combination
   */

  /**
   * Parses a key combination string and returns the corresponding KeyDictionary
   * @param {KeyCombinationString} string Describes key combination
   * @param {Object} options Options hash of how the string should be parsed
   * @param {boolean} options.ensureValidKeys Whether to throw an exception if an invalid
   *        key name is found in the key combination string.
   * @returns {KeyDictionary} Dictionary of keys in the parsed combination
   */

  function parseCombination(string) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var shiftPressed = string.indexOf(/[sS]hift/) !== -1;
    var altPressed = string.indexOf(/[aA]lt/) !== -1;
    return string
      .replace(/^\+|(\s|[^+]\+)\+/, '$1plus')
      .split('+')
      .reduce(function (keyDictionary, keyName) {
        var finalKeyName = standardizeKeyName(keyName, {
          shift: shiftPressed,
          alt: altPressed,
        });

        if (options.ensureValidKeys) {
          if (!isValidKey(finalKeyName)) {
            throw new InvalidKeyNameError();
          }
        }

        keyDictionary[finalKeyName] = true;
        return keyDictionary;
      }, {});
  }

  /**
   * A dictionary of symbols for each key, when pressed with the alt key also held.
   * Used for combinations that involve the alt key and one or more others. (e.g.
   * shift+a)
   */
  var AltedKeysDictionary = {
    '`': ['`'],
    1: ['¡'],
    2: ['™'],
    3: ['£'],
    4: ['¢'],
    5: ['∞'],
    6: ['§'],
    7: ['¶'],
    8: ['•'],
    9: ['ª'],
    0: ['º'],
    '-': ['–'],
    '=': ['≠'],
    a: ['å'],
    b: ['∫'],
    c: ['ç'],
    d: ['∂'],
    e: ['´'],
    f: ['ƒ'],
    g: ['©'],
    h: ['˙'],
    i: ['ˆ'],
    j: ['∆'],
    k: ['˚'],
    l: ['¬'],
    m: ['µ'],
    n: ['˜'],
    o: ['ø'],
    p: ['π'],
    q: ['œ'],
    r: ['®'],
    s: ['ß'],
    t: ['†'],
    u: ['¨'],
    v: ['√'],
    w: ['∑'],
    x: ['≈'],
    y: ['¥'],
    z: ['Ω'],
    '[': ['“'],
    ']': ['‘'],
    '\\': ['«'],
    "'": ['æ'],
    ';': ['…'],
    ',': ['≤'],
    '.': ['≥'],
    '/': ['÷'],
  };

  var UnaltedKeysDictionary = invertArrayDictionary(AltedKeysDictionary);

  /**
   * Returns the name of the key that must be pressed with the alt key, to yield the
   * specified symbol
   * @param {ReactKeyName} keyName Name of the key
   * @returns {ReactKeyName[]} Name of the key that must be pressed with the alt key, to
   *          yield the specified symbol
   */

  function resolveUnaltedAlias(keyName) {
    return UnaltedKeysDictionary[keyName] || [keyName];
  }

  /**
   * Returns the corresponding symbol or character for a particular key, when it is
   * pressed with the alt key also held down
   * @param {NormalizedKeyName} keyName Name of the key
   * @returns {ReactKeyName[]} Symbol or character for the key, when it is pressed with the
   *          alt key
   */

  function resolveAltedAlias(keyName) {
    return AltedKeysDictionary[keyName] || [keyName];
  }

  /**
   * Returns the corresponding symbol or character for a particular key, when it is
   * pressed with the alt and shift keys also held down
   * @param {NormalizedKeyName} keyName Name of the key
   * @returns {ReactKeyName[]} Symbol or character for the key, when it is pressed with the
   *          alt and shit keys
   */

  function resolveAltShiftedAlias(keyName) {
    return AltShiftedKeysDictionary[keyName] || [keyName];
  }

  function isObject(target) {
    return !Array.isArray(target) && _typeof(target) === 'object' && target !== null;
  }

  function size(collection) {
    return isObject(collection) ? Object.keys(collection).length : collection.length;
  }

  function distinct(array) {
    return Object.keys(dictionaryFrom(array));
  }

  function buildShiftedKeyAliases(combinationIncludesAlt, keyName) {
    if (combinationIncludesAlt) {
      return [].concat(_toConsumableArray(resolveAltShiftedAlias(keyName)), _toConsumableArray(resolveUnaltShiftedAlias(keyName)), [keyName]);
    } else {
      return [].concat(_toConsumableArray(resolveShiftedAlias(keyName)), _toConsumableArray(resolveUnshiftedAlias(keyName)), [keyName]);
    }
  }

  function buildAltKeyAliases(keyName) {
    return [].concat(_toConsumableArray(resolveAltedAlias(keyName)), _toConsumableArray(resolveUnaltedAlias(keyName)), [keyName]);
  }

  function buildOSAndKeyboardLayoutAliases(keyName) {
    var osAndLayoutAliases = KeyOSAndLayoutAliasesDictionary$1[keyName];

    if (osAndLayoutAliases) {
      return [keyName].concat(_toConsumableArray(osAndLayoutAliases));
    }

    return [keyName];
  }

  function buildKeyAliasList(keyCombination, keyName) {
    var combinationIncludesShift = keyCombination['Shift'];
    var combinationIncludesAlt = keyCombination['Alt'];

    var aliases = (function () {
      if (combinationIncludesShift) {
        return buildShiftedKeyAliases(combinationIncludesAlt, keyName);
      } else if (combinationIncludesAlt) {
        return buildAltKeyAliases(keyName);
      } else {
        return buildOSAndKeyboardLayoutAliases(keyName);
      }
    })();

    return distinct(aliases);
  }

  function buildKeyCombinationPermutations(keyCombination) {
    return Object.keys(keyCombination).reduce(function (allCombinations, keyName) {
      var keyAliasList = buildKeyAliasList(keyCombination, keyName);

      if (size(allCombinations) === 0) {
        return keyAliasList.map(function (keyAlias) {
          return _defineProperty({}, keyAlias, true);
        });
      }

      return keyAliasList.reduce(function (keyAliasCombinations, keyAlias) {
        return keyAliasCombinations.concat(
          allCombinations.map(function (keyDictionary) {
            return _objectSpread({}, keyDictionary, _defineProperty({}, keyAlias, true));
          })
        );
      }, []);
    }, []);
  }
  /**
   * Serializes instances of KeyCombination to KeyCombinationString.
   *
   * Used primarily to serialize string representations of key events as they happen.
   * @class
   */

  var KeyCombinationSerializer =
    /*#__PURE__*/
    (function () {
      function KeyCombinationSerializer() {
        _classCallCheck(this, KeyCombinationSerializer);
      }

      _createClass(KeyCombinationSerializer, null, [
        {
          key: 'serialize',

          /**
           * Returns a string representation of a single KeyCombination
           * @param {KeyCombination} keyCombination KeyCombination to serialize
           * @returns {string[]} Serialization of KeyCombination
           */
          value: function serialize(keyCombination) {
            /**
             * List of key names in alphabetical order
             * @type {string[]}
             */
            var combinationDictionary = buildKeyCombinationPermutations(keyCombination);
            return combinationDictionary.map(normalizedCombinationId);
          },
          /**
           * Whether the specified key sequence is valid (is of the correct format and contains
           * combinations consisting entirely of valid keys)
           * @param {KeySequenceString} keySequence Key sequence to validate
           * @returns {boolean} Whether the key sequence is valid
           */
        },
        {
          key: 'isValidKeySerialization',
          value: function isValidKeySerialization(keySequence) {
            if (keySequence.length > 0) {
              return !!KeySequenceParser.parse(keySequence, {
                ensureValidKeys: true,
              }).combination;
            } else {
              return false;
            }
          },
        },
      ]);

      return KeyCombinationSerializer;
    })();

  /**
   * Returns a list of accepted aliases for the specified key
   * @param {NormalizedKeyName} keyName Name of the key
   * @returns {ReactKeyName[]} List of key aliases
   */

  function resolveKeyAlias(keyName) {
    return KeyOSAndLayoutAliasesDictionary$1[keyName] || [keyName];
  }

  function applicableAliasFunctions(keyDictionary) {
    if (keyDictionary['Shift']) {
      if (keyDictionary['Alt']) {
        return [resolveAltShiftedAlias, resolveUnaltShiftedAlias];
      }

      return [resolveShiftedAlias, resolveUnshiftedAlias];
    }

    if (keyDictionary['Alt']) {
      return [resolveAltedAlias, resolveUnaltedAlias];
    }

    return [nop$1, nop$1];
  }

  function nop$1(keyName) {
    return [keyName];
  }

  /**
   * @typedef {number} KeyEventState
   */

  /**
   * Enum for different states a key event can be recorded in
   * @readonly
   * @enum {KeyEventState}
   */
  var KeyEventState = {
    unseen: 0,
    seen: 1,
    simulated: 2,
  };

  /**
   * Creates and modifies KeyEvents
   * @class
   */

  var KeyEventStateArrayManager =
    /*#__PURE__*/
    (function () {
      function KeyEventStateArrayManager() {
        _classCallCheck(this, KeyEventStateArrayManager);
      }

      _createClass(KeyEventStateArrayManager, null, [
        {
          key: 'newRecord',

          /**
           * Makes a new KeyEvent with one of the bits set to true
           * @param {KeyEventType=} keyEventType Index of bit to set to true
           * @param {KeyEventState} keyEventState The state to set the key event to
           * @returns {KeyEvent} New key event record with bit set to true
           */
          value: function newRecord(keyEventType, keyEventState) {
            var record = [KeyEventState.unseen, KeyEventState.unseen, KeyEventState.unseen];

            if (!isUndefined(keyEventType)) {
              for (var i = 0; i <= keyEventType; i++) {
                record[i] = keyEventState;
              }
            }

            return record;
          },
          /**
           * Sets a bit in the map to true
           * @param {KeyEvent} record Map to set a bit to true
           * @param {KeyEventType} index Index of bit to set
           * @param {KeyEventState} keyEventState The state to set the key event to
           */
        },
        {
          key: 'setBit',
          value: function setBit(record, index, keyEventState) {
            record[index] = keyEventState;
            return record;
          },
          /**
           * Returns a new record with the same values as the one passed to it
           * @param {KeyEvent} original Record to copy
           * @returns {KeyEvent} Record with the same values as the original
           */
        },
        {
          key: 'clone',
          value: function clone(original) {
            var record = this.newRecord();

            for (var i = 0; i < original.length; i++) {
              record[i] = original[i];
            }

            return record;
          },
        },
      ]);

      return KeyEventStateArrayManager;
    })();

  function isEmpty(target) {
    if (isObject(target)) {
      return Object.keys(target).length === 0;
    } else {
      return !target ? true : target.length === 0;
    }
  }

  function lazyLoadAttribute(target, attributeName, definition) {
    if (!target[attributeName]) {
      target[attributeName] = typeof definition === 'function' ? definition() : definition;
    }

    return target[attributeName];
  }

  var ModifierFlagsDictionary = {
    Shift: ['shiftKey'],
    Meta: ['metaKey'],
    Control: ['ctrlKey'],
    Alt: ['altKey'],
  };

  function stateFromEvent(event) {
    return event.simulated ? KeyEventState.simulated : KeyEventState.seen;
  }

  /**
   * Record of one or more keys pressed together, in a combination
   * @class
   */

  var KeyCombination =
    /*#__PURE__*/
    (function () {
      /**
       * Creates a new KeyCombination instance
       * @param {Object.<ReactKeyName, Array.<KeyEventState[]>>} keys Dictionary
       *        of keys
       * @returns {KeyCombination}
       */
      function KeyCombination() {
        var keys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, KeyCombination);

        this.keyStates = keys;
        /**
         * Whether combination includes key up
         * @type {boolean}
         */

        this.isEnding = false;
        this._keyAliases = undefined;
        this._ids = undefined;
      }
      /********************************************************************************
       * Getters
       *********************************************************************************/

      /**
       * List of ids (serialized representations) for the keys involved in the combination
       * @type {KeySequence[]} List of combination ids
       */

      _createClass(KeyCombination, [
        {
          key: 'getNormalizedKeyName',

          /**
           * A normalized version of the key, achieved by comparing it to the list of known
           * aliases for the keys in the combination
           * @param {ReactKeyName} keyName Name of the key to normalize
           * @returns {ReactKeyName} Normalized key name
           */
          value: function getNormalizedKeyName(keyName) {
            var keyState = this.keyStates[keyName];

            if (keyState) {
              return keyName;
            } else {
              var keyAlias = this.keyAliases[keyName];

              if (keyAlias) {
                return keyAlias;
              } else {
                return keyName;
              }
            }
          },
          /********************************************************************************
           * Query attributes of entire combination
           *********************************************************************************/

          /**
           * Whether there are any keys in the current combination still being pressed
           * @returns {boolean} True if all keys in the current combination are released
           */
        },
        {
          key: 'hasEnded',
          value: function hasEnded() {
            return isEmpty(this.keysStillPressedDict());
          },
          /********************************************************************************
           * Adding & modifying key states
           *********************************************************************************/

          /**
           * Add a new key to the combination (starting with a state of keydown)
           * @param {ReactKeyName} keyName Name of key
           * @param {KeyEventState} keyEventState State key is in
           * @returns {void}
           */
        },
        {
          key: 'addKey',
          value: function addKey(keyName, keyEventState) {
            this._setKeyState(keyName, [KeyEventStateArrayManager.newRecord(), KeyEventStateArrayManager.newRecord(KeyEventType.keydown, keyEventState)]);
          },
          /**
           * Adds a key event to the current key combination (as opposed to starting a new
           * keyboard combination).
           * @param {ReactKeyName} keyName - Name of the key to add to the current combination
           * @param {KeyEventType} recordIndex - Index in record to set to true
           * @param {KeyEventState} keyEventState The state to set the key event to
           */
        },
        {
          key: 'setKeyState',
          value: function setKeyState(keyName, recordIndex, keyEventState) {
            var existingRecord = this._getKeyState(keyName);

            if (this.isKeyIncluded(keyName)) {
              var previous = KeyEventStateArrayManager.clone(existingRecord[1]);
              var current = KeyEventStateArrayManager.clone(previous);
              KeyEventStateArrayManager.setBit(current, recordIndex, keyEventState);

              this._setKeyState(keyName, [previous, current]);
            } else {
              this.addKey(keyName, keyEventState);
            }

            if (recordIndex === KeyEventType.keyup) {
              this.isEnding = true;
            }
          },
          /********************************************************************************
           * Iteration and subsets
           *********************************************************************************/

          /**
           * Returns a new KeyCombination without the keys that have been
           * released (had the keyup event recorded). Essentially, the keys that are
           * currently still pressed down at the time a key event is being handled.
           * @returns {KeyCombination} New KeyCombination with all of the
           *        keys with keyup events omitted
           */
        },
        {
          key: 'keysStillPressedDict',
          value: function keysStillPressedDict() {
            var _this = this;

            return this.keys.reduce(function (memo, keyName) {
              if (_this.isKeyStillPressed(keyName)) {
                memo[keyName] = _this._getKeyState(keyName);
              }

              return memo;
            }, {});
          },
          /********************************************************************************
           * Query individual keys
           *********************************************************************************/

          /**
           * Whether key is in the combination
           * @param {ReactKeyName} keyName Name of key
           * @returns {boolean} true if the key is in the combination
           */
        },
        {
          key: 'isKeyIncluded',
          value: function isKeyIncluded(keyName) {
            return !!this._getKeyState(keyName);
          },
          /**
           * Whether key is in the combination and has yet to be released
           * @param {ReactKeyName} keyName Name of key
           * @returns {boolean} true if the key is in the combination and yet to be released
           */
        },
        {
          key: 'isKeyStillPressed',
          value: function isKeyStillPressed(keyName) {
            return this.isEventTriggered(keyName, KeyEventType.keypress) && !this.isKeyReleased(keyName);
          },
          /**
           * Whether key is in the combination and been released
           * @param {ReactKeyName} keyName Name of key
           * @returns {boolean} true if the key is in the combination and has been released
           */
        },
        {
          key: 'isKeyReleased',
          value: function isKeyReleased(keyName) {
            return this.isEventTriggered(keyName, KeyEventType.keyup);
          },
          /**
           * Whether an event has been recorded for a key yet
           * @param {ReactKeyName} keyName Name of the key
           * @param {KeyEventType} keyEventType Index of the event type
           * @returns {boolean} true if the event has been recorded for the key
           */
        },
        {
          key: 'isEventTriggered',
          value: function isEventTriggered(keyName, keyEventType) {
            return this._getKeyStateType(keyName, KeyEventSequenceIndex.current, keyEventType);
          },
          /**
           * Whether an event has been previously recorded for a key (the second most recent
           * event to occur for the key)
           * @param {ReactKeyName} keyName Name of the key
           * @param {KeyEventType} keyEventType Index of the event type
           * @returns {boolean} true if the event has been previously recorded for the key
           */
        },
        {
          key: 'wasEventPreviouslyTriggered',
          value: function wasEventPreviouslyTriggered(keyName, keyEventType) {
            return this._getKeyStateType(keyName, KeyEventSequenceIndex.previous, keyEventType);
          },
          /**
           * Whether a keypress event is currently being simulated
           * @param {ReactKeyName} keyName Name of the key
           * @returns {boolean} true if the keypress event is currently being simulated for the
           *        key
           */
        },
        {
          key: 'isKeyPressSimulated',
          value: function isKeyPressSimulated(keyName) {
            return this.isEventTriggered(keyName, KeyEventType.keypress) === KeyEventState.simulated;
          },
          /**
           * Whether a keyup event is currently being simulated
           * @param {ReactKeyName} keyName Name of the key
           * @returns {boolean} true if the keyup event is currently being simulated for the
           *        key
           */
        },
        {
          key: 'isKeyUpSimulated',
          value: function isKeyUpSimulated(keyName) {
            return this.isEventTriggered(keyName, KeyEventType.keyup) === KeyEventState.simulated;
          },
          /**
           * Synchronises the key combination history to match the modifier key flag attributes
           * on new key events
           * @param {KeyboardEvent|SyntheticKeyboardEvent} event - Event to check the modifier flags for
           * @param {string} key - Name of key that events relates to
           * @param {KeyEventType} keyEventType - The record index of the current
           *        key event type
           */
        },
        {
          key: 'resolveModifierFlagDiscrepancies',
          value: function resolveModifierFlagDiscrepancies(event, key, keyEventType) {
            var _this2 = this;

            /**
             * If a new key event is received with modifier key flags that contradict the
             * key combination history we are maintaining, we can surmise that some keyup events
             * for those modifier keys have been lost (possibly because the window lost focus).
             * We update the key combination to match the modifier flags
             */
            Object.keys(ModifierFlagsDictionary).forEach(function (modifierKey) {
              /**
               * When a modifier key is being released (keyup), it sets its own modifier flag
               * to false. (e.g. On the keyup event for Command, the metaKey attribute is false).
               * If this the case, we want to handle it using the main algorithm and skip the
               * reconciliation algorithm.
               */
              if (key === modifierKey && keyEventType === KeyEventType.keyup) {
                return;
              }

              var modifierStillPressed = _this2.isKeyStillPressed(modifierKey);

              ModifierFlagsDictionary[modifierKey].forEach(function (attributeName) {
                if (event[attributeName] === false && modifierStillPressed) {
                  _this2.setKeyState(modifierKey, KeyEventType.keyup, stateFromEvent(event));
                }

                if (event[attributeName] === true && !modifierStillPressed) {
                  _this2.setKeyState(modifierKey, KeyEventType.keydown, stateFromEvent(event));
                }
              });
            });
          },
        },
        {
          key: '_getKeyStateType',

          /********************************************************************************
           * Private methods
           *********************************************************************************/
          value: function _getKeyStateType(keyName, keyStage, keyEventType) {
            var keyState = this._getKeyState(keyName);

            return keyState && keyState[keyStage][keyEventType];
          },
        },
        {
          key: '_getKeyState',
          value: function _getKeyState(keyName) {
            var keyState = this.keyStates[keyName];

            if (keyState) {
              return keyState;
            } else {
              var keyAlias = this.keyAliases[keyName];

              if (keyAlias) {
                return this.keyStates[keyAlias];
              }
            }
          },
        },
        {
          key: '_setKeyState',
          value: function _setKeyState(keyName, keyState) {
            var keyAlias = this.getNormalizedKeyName(keyName);
            this.keyStates[keyAlias] = keyState;
            delete this._keyAliases;
            delete this._ids;
          },
        },
        {
          key: 'ids',
          get: function get() {
            var _this3 = this;

            return lazyLoadAttribute(this, '_ids', function () {
              return KeyCombinationSerializer.serialize(_this3.keyStates);
            });
          },
          /**
           * Dictionary mapping keys to their acceptable aliases. This includes "shifted" or
           * "alted" key characters.
           * @returns {Object.<ReactKeyName, ReactKeyName[]>}
           */
        },
        {
          key: 'keyAliases',
          get: function get() {
            var _this4 = this;

            return lazyLoadAttribute(this, '_keyAliases', function () {
              return buildKeyAliases(_this4.keyStates);
            });
          },
        },
        {
          key: 'keys',
          get: function get() {
            return Object.keys(this.keyStates);
          },
        },
      ]);

      return KeyCombination;
    })();

  function buildKeyAliases(keyDictionary) {
    return Object.keys(keyDictionary).reduce(function (memo, keyName) {
      resolveKeyAlias(keyName).forEach(function (normalizedKey) {
        applicableAliasFunctions(keyDictionary).forEach(function (aliasFunction) {
          aliasFunction(normalizedKey).forEach(function (keyAlias) {
            if (keyAlias !== keyName || keyName !== normalizedKey) {
              memo[keyAlias] = keyName;
            }
          });
        });
      });
      return memo;
    }, {});
  }

  var KeyCombinationDecorator =
    /*#__PURE__*/
    (function () {
      function KeyCombinationDecorator(keyCombination) {
        _classCallCheck(this, KeyCombinationDecorator);

        this._keyCombination = keyCombination;
      }
      /**
       * Return a serialized description of the keys in the combination
       * @returns {KeySequence}
       */

      _createClass(KeyCombinationDecorator, [
        {
          key: 'describe',
          value: function describe() {
            return this._keyCombination.ids[0];
          },
          /**
           * Dictionary of keys included in the combination record
           * @returns {Object.<ReactKeyName, boolean>}
           */
        },
        {
          key: 'asKeyDictionary',
          value: function asKeyDictionary() {
            return dictionaryFrom(this._keyCombination.keys);
          },
          /**
           * A plain JavaScript representation of the key combination record, useful for
           * serialization or debugging
           * @returns {Object} Serialized representation of the combination record
           */
        },
        {
          key: 'toJSON',
          value: function toJSON() {
            return {
              keys: this._keyCombination.keyStates,
              ids: this._keyCombination.ids,
              keyAliases: this._keyCombination.keyAliases,
            };
          },
        },
      ]);

      return KeyCombinationDecorator;
    })();

  var KeyCombinationIterator =
    /*#__PURE__*/
    (function () {
      function KeyCombinationIterator(keyCombination) {
        _classCallCheck(this, KeyCombinationIterator);

        this._keyCombination = keyCombination;
      }
      /**
       * Whether there are any keys in the combination
       * @returns {boolean} true if there is 1 or more keys involved in the combination,
       *          else false.
       */

      _createClass(KeyCombinationIterator, [
        {
          key: 'any',
          value: function any() {
            return this._getKeys().length > 0;
          },
          /**
           * Number of keys involved in the combination
           * @type {number} Number of keys
           */
        },
        {
          key: 'forEachKey',

          /**
           * @callback forEachHandler
           * @param {ReactKeyName} keyName Name of a key in the combination
           * @returns {void}
           */

          /**
           * Iterates over every key in the combination, calling an function with each
           * key name
           * @param {forEachHandler} handler Function to call with the name of each key
           *        in the combination
           * @returns {void}
           */
          value: function forEachKey(handler) {
            return this._getKeys().forEach(handler);
          },
          /**
           * @callback evaluator
           * @param {ReactKeyName} keyName Name of a key in the combination
           * @returns {boolean}
           */

          /**
           * Whether at least one of the keys causes a evaluator function to return true
           * @callback {evaluator} evaluator Function to evaluate each key
           * @returns {boolean} Whether at least one key satisfies the evaluator
           */
        },
        {
          key: 'some',
          value: function some(evaluator) {
            return this._getKeys().some(evaluator);
          },
        },
        {
          key: '_getKeys',
          value: function _getKeys() {
            return this._keyCombination.keys;
          },
        },
        {
          key: 'numberOfKeys',
          get: function get() {
            return size(this._getKeys());
          },
        },
      ]);

      return KeyCombinationIterator;
    })();

  /**
   * List of key combinations seen by hot key components
   * @class
   */

  var KeyHistory =
    /*#__PURE__*/
    (function () {
      /**
       * Creates a new KeyHistory instance
       * @param {Number} maxLength Maximum length of the list.
       * @param {KeyCombination} startingPoint Initial state of first combination
       * @returns {KeyHistory}
       */
      function KeyHistory(_ref) {
        var maxLength = _ref.maxLength;
        var startingPoint = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, KeyHistory);

        this._combinations = [];
        this._maxLength = maxLength;

        if (startingPoint) {
          this._push(startingPoint);
        } else {
          this._push(new KeyCombination());
        }
      }
      /**
       * A subset of the most recently press key combinations
       * @param {Number} numberOfCombinations The number of most recent key combinations
       * @returns {KeyCombination[]} List of key combinations
       */

      _createClass(KeyHistory, [
        {
          key: 'getPreviousCombinations',
          value: function getPreviousCombinations(numberOfCombinations) {
            return this._combinations.slice(-(numberOfCombinations + 1), -1);
          },
          /**
           * Whether any keys have been stored in the key history
           * @returns {boolean} true if there is at least one key combination, else false
           */
        },
        {
          key: 'any',
          value: function any() {
            return this._combinations.some(function (keyCombination) {
              return new KeyCombinationIterator(keyCombination).any();
            });
          },
          /**
           * The number of key combinations in the history (limited by the max length)
           * @type {number} Number of key combinations
           */
        },
        {
          key: 'addKeyToCurrentCombination',

          /**
           * Adds a key event to the current key combination (as opposed to starting a new
           * keyboard combination).
           * @param {ReactKeyName} keyName - Name of the key to add to the current combination
           * @param {KeyEventType} recordIndex - Index in record to set to true
           * @param {KeyEventState} keyEventState The state to set the key event to
           */
          value: function addKeyToCurrentCombination(keyName, recordIndex, keyEventState) {
            this._ensureInitialKeyCombination();

            this.currentCombination.setKeyState(keyName, recordIndex, keyEventState);
          },
          /**
           * Sets a new maximum length for the key combination history. Once the number of
           * key combinations exceeds this length, the oldest is dropped.
           * @param {Number} length New maximum length of the key history
           */
        },
        {
          key: 'startNewKeyCombination',

          /**
           * Adds a new KeyCombination to the event history.
           * @param {ReactKeyName} keyName - Name of the keyboard key to add to the new
           *        KeyCombination
           * @param {KeyEventState} keyEventState The state to set the key event to
           */
          value: function startNewKeyCombination(keyName, keyEventState) {
            this._ensureInitialKeyCombination();

            var newCombinationRecord = new KeyCombination(this.currentCombination.keysStillPressedDict());
            newCombinationRecord.addKey(keyName, keyEventState);

            this._push(newCombinationRecord);
          },
          /**
           * A plain JavaScript representation of the key combination history, useful for
           * serialization or debugging
           * @returns {Object[]} Serialized representation of the registry
           */
        },
        {
          key: 'toJSON',
          value: function toJSON() {
            return this._combinations.map(function (keyCombination) {
              return new KeyCombinationDecorator(keyCombination).toJSON();
            });
          },
          /********************************************************************************
           * Private methods
           ********************************************************************************/
        },
        {
          key: '_ensureInitialKeyCombination',
          value: function _ensureInitialKeyCombination() {
            if (this.length === 0) {
              this._push(new KeyCombination());
            }
          },
        },
        {
          key: '_push',
          value: function _push(record) {
            this._trimHistory();

            this._combinations.push(record);
          },
        },
        {
          key: '_trimHistory',
          value: function _trimHistory() {
            while (this.length > this._maxLength) {
              /**
               * We know the longest key sequence registered for the currently focused
               * components, so we don't need to keep a record of history longer than
               * that
               */
              this._shift();
            }
          },
        },
        {
          key: '_shift',
          value: function _shift() {
            this._combinations.shift();
          },
        },
        {
          key: 'length',
          get: function get() {
            return this._combinations.length;
          },
          /**
           * Most recent or current key combination
           * @type {KeyCombination} Key combination record
           */
        },
        {
          key: 'currentCombination',
          get: function get() {
            return this._combinations[this.length - 1];
          },
        },
        {
          key: 'maxLength',
          set: function set(length) {
            this._maxLength = length;

            this._trimHistory();
          },
        },
      ]);

      return KeyHistory;
    })();

  /**
   * Generic registry for storing and retrieving items
   * @class @abstract
   */
  var Registry =
    /*#__PURE__*/
    (function () {
      /**
       * Create a new Registry instance
       * @returns {Registry}
       */
      function Registry() {
        _classCallCheck(this, Registry);

        this._registry = {};
      }
      /**
       * Returns the registry item stored with against an id
       * @param {*} id The key item was registered with
       * @returns {*} Item stored in registry
       */

      _createClass(Registry, [
        {
          key: 'get',
          value: function get(id) {
            return this._registry[id];
          },
          /**
           * Add an item to the registry
           * @param {*} id Key to store the item against
           * @param {*} item Item to store in the registry
           */
        },
        {
          key: 'set',
          value: function set(id, item) {
            this._registry[id] = item;
          },
          /**
           * Remove an item from the registry
           * @param {*} id Key of the item to remove from the registry
           */
        },
        {
          key: 'remove',
          value: function remove(id) {
            delete this._registry[id];
          },
          /**
           * A plain JavaScript representation of the registry, useful for serialization or
           * debugging
           * @returns {Object.<*,*>} Serialized representation of the registry
           */
        },
        {
          key: 'toJSON',
          value: function toJSON() {
            return this._registry;
          },
        },
      ]);

      return Registry;
    })();

  /**
   * Return a new collection, with the same elements as another, with the specified
   * exceptions
   * @param {Object|Array} target The collection to duplicate
   * @param {*} exclusions The attributes to omit when the collection is an object, or
   *        the elements to exclude if the collection is an array
   * @param {Object} options Configuration options
   * @param {boolean} options.stringifyFirst Whether to stringify the elements of the
   *        arrays before comparing them to the exclusion list
   * @returns {Object|Array} Copied collection without the specified elements
   */

  function without(target) {
    var exclusions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var omitDict = dictionaryFrom(arrayFrom(exclusions), function (value) {
      return {
        value: value,
      };
    });

    if (Array.isArray(target)) {
      return target.reduce(function (memo, element) {
        if (!(omitDict[element] && (options.stringifyFirst || omitDict[element].value === element))) {
          memo.push(element);
        }

        return memo;
      }, []);
    } else if (isObject(target)) {
      return Object.keys(target).reduce(function (memo, key) {
        if (!omitDict[key]) {
          memo[key] = target[key];
        }

        return memo;
      }, {});
    } else {
      return target;
    }
  }

  /**
   * @typedef {Object} ComponentRegistryEntry
   * @property {ComponentId[]} childIds List of ids of the children of a component
   * @property {ComponentId|null} parentIds Id of the parent component
   */

  /**
   * Registry of hot keys components, mapping children to their parents and vice versa
   * @class
   */

  var ComponentTree =
    /*#__PURE__*/
    (function (_Registry) {
      _inherits(ComponentTree, _Registry);

      function ComponentTree() {
        var _this;

        _classCallCheck(this, ComponentTree);

        _this = _possibleConstructorReturn(this, _getPrototypeOf(ComponentTree).call(this));

        _this.clearRootId();

        return _this;
      }

      _createClass(ComponentTree, [
        {
          key: 'hasRoot',
          value: function hasRoot() {
            return !this.isRootId(null);
          },
        },
        {
          key: 'isRootId',
          value: function isRootId(componentId) {
            return componentId === this.rootId;
          },
        },
        {
          key: 'clearRootId',
          value: function clearRootId() {
            this.rootId = null;
          },
          /**
           * Register a component
           * @param {ComponentId} componentId Id of the component to register
           * @param {KeyMap} keyMap - Map of actions to key expressions
           * @returns {void}
           */
        },
        {
          key: 'add',
          value: function add(componentId, keyMap) {
            _get(_getPrototypeOf(ComponentTree.prototype), 'set', this).call(this, componentId, {
              childIds: [],
              parentId: null,
              keyMap: keyMap,
            });
          },
          /**
           * Updates an existing component's key map
           * @param {ComponentId} componentId Id of the component to register
           * @param {KeyMap} keyMap - Map of actions to key expressions
           * @returns {void}
           */
        },
        {
          key: 'update',
          value: function update(componentId, keyMap) {
            var component = _get(_getPrototypeOf(ComponentTree.prototype), 'get', this).call(this, componentId);

            _get(_getPrototypeOf(ComponentTree.prototype), 'set', this).call(
              this,
              componentId,
              _objectSpread({}, component, {
                keyMap: keyMap,
              })
            );
          },
          /**
           * Set the parent ID of a component
           * @param {ComponentId} componentId Id of the component
           * @param {ComponentId} parentId Id of the parent
           * @returns {void}
           */
        },
        {
          key: 'setParent',
          value: function setParent(componentId, parentId) {
            if (!isUndefined(parentId)) {
              this.get(componentId).parentId = parentId;

              this._addChildId(parentId, componentId);
            } else {
              this.rootId = componentId;
            }
          },
          /**
           * Deregister a component
           * @param {ComponentId} componentId Id of the component to remove
           * @returns {void}
           */
        },
        {
          key: 'remove',
          value: function remove(componentId) {
            var parentId = this._getParentId(componentId);

            this._removeChildId(parentId, componentId);

            _get(_getPrototypeOf(ComponentTree.prototype), 'remove', this).call(this, componentId);
          },
          /********************************************************************************
           * Private methods
           ********************************************************************************/
        },
        {
          key: '_getParentId',
          value: function _getParentId(componentId) {
            var component = this.get(componentId);
            return component && component.parentId;
          },
        },
        {
          key: '_addChildId',
          value: function _addChildId(parentId, componentId) {
            this.get(parentId).childIds.push(componentId);
          },
        },
        {
          key: '_removeChildId',
          value: function _removeChildId(parentId, childId) {
            var parent = this.get(parentId);

            if (parent) {
              parent.childIds = without(parent.childIds, childId);
            }
          },
        },
      ]);

      return ComponentTree;
    })(Registry);

  function removeAtIndex(array, index) {
    return [].concat(_toConsumableArray(array.slice(0, index)), _toConsumableArray(array.slice(index + 1)));
  }

  /**
   * Iterates over ComponentOptionList instances
   * @class
   */
  var ComponentOptionsListIterator =
    /*#__PURE__*/
    (function () {
      /**
       * Creates a new instance of ComponentOptionsListIterator
       * @param {ComponentOptionsList} list The list to iterate over
       */
      function ComponentOptionsListIterator(list) {
        _classCallCheck(this, ComponentOptionsListIterator);

        this._list = list;
        this.position = -1;
      }
      /**
       * The component options the iterator is currently pointed at
       * @returns {ComponentOptions} The current component options
       */

      _createClass(ComponentOptionsListIterator, [
        {
          key: 'getComponent',
          value: function getComponent() {
            return this._list.getAtPosition(this.position);
          },
          /**
           * Move to the next component options in the list, if not already at the end of the
           * list.
           * @returns {ComponentOptionsList|null} The next component options the iterator is now
           *        pointed at. If the iterator is already at the last component options, null
           *        is returned.
           */
        },
        {
          key: 'next',
          value: function next() {
            if (this.position + 1 < this._list.length) {
              this.position++;
              return this.getComponent();
            } else {
              return null;
            }
          },
        },
      ]);

      return ComponentOptionsListIterator;
    })();

  /**
   * @typedef {Object} ComponentOptions a hotkeys component's options in a normalized
   *          format
   * @property {ActionDictionary} actions The dictionary of actions defined by the
   *           component
   */

  /**
   * A mapping between ActionName and ActionConfiguration
   * @typedef {Object.<ActionName,ActionConfiguration>} ActionDictionary
   */

  /**
   * Standardized format for defining an action
   * @typedef {Object} ActionConfiguration
   * @property {NormalizedKeySequenceId} prefix - String describing the sequence of key
   *          combinations, before the final key combination (an empty string for
   *          sequences that are a single key combination)
   * @property {ActionName} actionName - Name of the action
   * @property {number} sequenceLength - Number of combinations involved in the
   *           sequence
   * @property {KeyCombinationString} id - Serialized description of the key combinations
   *            that make up the sequence
   * @property {Object.<KeyName, Boolean>} keyDictionary - Dictionary of key names involved
   *           in the last key combination of the sequence
   * @property {KeyEventType} keyEventType - Record index for key event that
   *          the matcher should match on
   * @property {number} size - Number of keys involved in the final key combination
   */

  /**
   * List of component options that define the application's currently enabled key
   * maps and handlers, starting from the inner-most (most deeply nested) component,
   * that is closest to the DOM element currently in focus, and ending with the options
   * of the root hotkeys component.
   * @class
   */

  var ComponentOptionsList =
    /*#__PURE__*/
    (function () {
      function ComponentOptionsList() {
        _classCallCheck(this, ComponentOptionsList);

        /**
         * List of ComponentOptions for the actions registered by each hot keys component.
         * @type {ComponentOptions[]}
         */
        this._list = [];
        /**
         * Dictionary mapping the ids of the components defining actions, and their
         * position in the list.
         * @type {Object.<ComponentId, Number>}
         */

        this._idToIndex = {};
        /**
         * Counter for the length of the longest sequence currently enabled.
         * @type {number}
         */

        this.longestSequence = 1;
        /**
         * The id of the component with the longest key sequence
         * @type {ComponentId}
         */

        this._longestSequenceComponentId = null;
        /**
         * Record of whether at least one keymap is bound to each event type (keydown,
         * keypress or keyup)
         * @type {KeyEvent}
         */

        this._keyMapEventRecord = KeyEventStateArrayManager.newRecord();
      }
      /**
       * Return a new iterator that can be used to enumerate the list
       * @returns {ComponentOptionsListIterator}
       */

      _createClass(ComponentOptionsList, [
        {
          key: 'add',

          /**
           * Adds a new hot key component's options, to be parsed and standardised before being
           * added to the list
           * @param {ComponentId} componentId - Id of the component the options belong to
           * @param {KeyMap} actionNameToKeyMap - Map of actions to key maps
           * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handlers
           * @param {Object} options - Hash of options that configure how the key map is built.
           * @param {string} options.defaultKeyEvent - The default key event to use for any
           *        action that does not explicitly define one.
           * @returns {number} The position the component options have in the list
           */
          value: function add(componentId, actionNameToKeyMap, actionNameToHandlersMap, options) {
            if (this.containsId(componentId)) {
              return this.update(componentId, actionNameToKeyMap, actionNameToHandlersMap, options);
            }

            var componentOptions = this._build(componentId, actionNameToKeyMap, actionNameToHandlersMap, options);

            this._list.push(componentOptions);

            var newIndex = this.length - 1;
            return (this._idToIndex[componentId] = newIndex);
          },
          /**
           * Whether the list contains options for a component with the specified id
           * @param {ComponentId} id Id of the component
           * @returns {boolean} True if the list contains options for the component with the
           *        specified id
           */
        },
        {
          key: 'containsId',
          value: function containsId(id) {
            return !!this.getById(id);
          },
          /**
           * Retrieves options for a component from the list
           * @param {ComponentId} id Id of the component to retrieve the options for
           * @returns {ComponentOptions} Options for the component with the specified id
           */
        },
        {
          key: 'getById',
          value: function getById(id) {
            return this.getAtPosition(this.getPositionById(id));
          },
          /**
           * Returns the position of the options belonging to the component with the specified
           * id.
           * @param {ComponentId} id Id of the component to retrieve the options for
           * @returns {number} The position of the component options in the list.
           */
        },
        {
          key: 'getPositionById',
          value: function getPositionById(id) {
            return this._idToIndex[id];
          },
          /**
           * Replaces the options of a component already in the list with new values
           * @param {ComponentId} componentId - Id of the component to replace the options of
           * @param {KeyMap} actionNameToKeyMap - Map of actions to key maps
           * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handlers
           * @param {Object} options - Hash of options that configure how the key map is built.
           * @param {string} options.defaultKeyEvent - The default key event to use for any
           *        action that does not explicitly define one.
           * @returns {number} The position the component options have in the list
           */
        },
        {
          key: 'update',
          value: function update(componentId, actionNameToKeyMap, actionNameToHandlersMap, options) {
            /**
             * We record whether we're building new options for the component that currently
             * has the longest sequence, to decide whether we need to recalculate the longest
             * sequence.
             */
            var isUpdatingLongestSequenceComponent = this._isUpdatingComponentWithLongestSequence(componentId);

            var longestSequenceBefore = this.longestSequence;

            var componentOptions = this._build(componentId, actionNameToKeyMap, actionNameToHandlersMap, options);

            if (isUpdatingLongestSequenceComponent && componentOptions.sequenceLength !== longestSequenceBefore) {
              /**
               * Component with the longest sequence has just had new options registered
               * so we need to reset the longest sequence
               */
              if (componentOptions.sequenceLength > longestSequenceBefore) {
                /**
                 * The same component has registered a longer sequence, so we just
                 * need to update the sequence length to the new, larger number
                 */
                this.longestSequence = componentOptions.sequenceLength;
              } else {
                /**
                 * The component may no longer have the longest sequence, so we need to
                 * recalculate
                 */
                this._recalculateLongestSequence();
              }
            }

            this._list[this.getPositionById(componentId)] = componentOptions;
          },
          /**
           * Removes the options of a component from the list
           * @param {ComponentId} id The id of the component whose options are removed
           * @returns {void}
           */
        },
        {
          key: 'remove',
          value: function remove(id) {
            var isUpdatingLongestSequenceComponent = this._isUpdatingComponentWithLongestSequence(id);

            this.removeAtPosition(this.getPositionById(id));

            if (isUpdatingLongestSequenceComponent) {
              this._recalculateLongestSequence();
            }
          },
          /**
           * Whether a component is the root component (the last one in the list)
           * @param {ComponentId} id Id of the component to query if it is the root
           * @returns {boolean} true if the component is the last in the list
           */
        },
        {
          key: 'isRoot',
          value: function isRoot(id) {
            return this.getPositionById(id) >= this.length - 1;
          },
          /**
           * Whether the list contains at least one component with an action bound to a
           * particular keyboard event type.
           * @param {KeyEventType} keyEventType Index of the keyboard event type
           * @returns {boolean} true when the list contains a component with an action bound
           *          to the event type
           */
        },
        {
          key: 'anyActionsForEventType',
          value: function anyActionsForEventType(keyEventType) {
            return !!this._keyMapEventRecord[keyEventType];
          },
          /**
           * The number of components in the list
           * @type {number} Number of components in the list
           */
        },
        {
          key: 'getAtPosition',

          /**
           * The component options at particular position in the list
           * @param {number} position The position in the list
           * @returns {ComponentOptions} The component options at the position in the list
           */
          value: function getAtPosition(position) {
            return this._list[position];
          },
          /**
           * Remove the component options at a position in the list
           * @param {number} position The position in the list to remove the options
           * return {void}
           */
        },
        {
          key: 'removeAtPosition',
          value: function removeAtPosition(position) {
            this._list = removeAtIndex(this._list, position);
            var counter = position;

            while (counter < this.length) {
              this._idToIndex[this.getAtPosition(counter).componentId] = counter;
              counter++;
            }
          },
          /**
           * A plain JavaScript object representation of the component options list that can
           * be used for serialization or debugging
           * @returns {ComponentOptions[]} plain JavaScript object representation of the list
           */
        },
        {
          key: 'toJSON',
          value: function toJSON() {
            return this._list;
          },
          /**
           * Builds the internal representation that described the options passed to a hot keys
           * component
           * @param {ComponentId} componentId - Id of the component the options belong to
           * @param {KeyMap} actionNameToKeyMap - Map of actions to key maps
           * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handlers
           * @param {Object} options - Hash of options that configure how the key map is built.
           * @returns {ComponentOptions} Options for the specified component
           * @private
           */
        },
        {
          key: '_build',
          value: function _build(componentId, actionNameToKeyMap, actionNameToHandlersMap, options) {
            var actions = this._buildActionDictionary(actionNameToKeyMap, options, componentId);

            return {
              actions: actions,
              handlers: actionNameToHandlersMap,
              componentId: componentId,
              options: options,
            };
          },
        },
        {
          key: '_isUpdatingComponentWithLongestSequence',
          value: function _isUpdatingComponentWithLongestSequence(componentId) {
            return componentId === this._getLongestSequenceComponentId();
          },
        },
        {
          key: '_getLongestSequenceComponentId',
          value: function _getLongestSequenceComponentId() {
            return this._longestSequenceComponentId;
          },
        },
        {
          key: '_recalculateLongestSequence',
          value: function _recalculateLongestSequence() {
            var iterator = this.iterator;

            while (iterator.next()) {
              var _iterator$getComponen = iterator.getComponent(),
                longestSequence = _iterator$getComponen.longestSequence,
                componentId = _iterator$getComponen.componentId;

              if (longestSequence > this.longestSequence) {
                this._longestSequenceComponentId = componentId;
                this.longestSequence = longestSequence;
              }
            }
          },
          /**
           * Returns a mapping between ActionNames and ActionConfiguration
           * @param {KeyMap} actionNameToKeyMap - Mapping of ActionNames to key sequences.
           * @param {Object} options - Hash of options that configure how the key map is built.
           * @param {string} options.defaultKeyEvent - The default key event to use for any
           *        action that does not explicitly define one.
           * @param {ComponentId} componentId Index of the component the matcher belongs to
           * @returns {ActionDictionary} Map from ActionNames to ActionConfiguration
           * @private
           */
        },
        {
          key: '_buildActionDictionary',
          value: function _buildActionDictionary(actionNameToKeyMap, options, componentId) {
            var _this = this;

            return Object.keys(actionNameToKeyMap).reduce(function (memo, actionName) {
              var keyMapConfig = actionNameToKeyMap[actionName];

              var keyMapOptions = (function () {
                if (isObject(keyMapConfig) && hasKey(keyMapConfig, 'sequences')) {
                  return arrayFrom(keyMapConfig.sequences);
                } else {
                  return arrayFrom(keyMapConfig);
                }
              })();

              keyMapOptions.forEach(function (keyMapOption) {
                var _normalizeActionOptio = normalizeActionOptions(keyMapOption, options),
                  keySequence = _normalizeActionOptio.keySequence,
                  keyEventType = _normalizeActionOptio.keyEventType;

                _this._addActionOptions(memo, componentId, actionName, keySequence, keyEventType);
              });
              return memo;
            }, {});
          },
        },
        {
          key: '_addActionOptions',
          value: function _addActionOptions(memo, componentId, actionName, keySequence, keyEventType) {
            var _KeySequenceParser$pa = KeySequenceParser.parse(keySequence, {
                keyEventType: keyEventType,
              }),
              sequence = _KeySequenceParser$pa.sequence,
              combination = _KeySequenceParser$pa.combination;

            if (sequence.size > this.longestSequence) {
              this.longestSequence = sequence.size;
              this._longestSequenceComponentId = componentId;
            }
            /**
             * Record that there is at least one key sequence in the focus tree bound to
             * the keyboard event
             */

            this._keyMapEventRecord[keyEventType] = KeyEventState.seen;

            if (!memo[actionName]) {
              memo[actionName] = [];
            }

            memo[actionName].push(
              _objectSpread(
                {
                  prefix: sequence.prefix,
                  actionName: actionName,
                  sequenceLength: sequence.size,
                },
                combination
              )
            );
          },
        },
        {
          key: 'iterator',
          get: function get() {
            return new ComponentOptionsListIterator(this);
          },
        },
        {
          key: 'length',
          get: function get() {
            return this._list.length;
          },
        },
      ]);

      return ComponentOptionsList;
    })();

  function normalizeActionOptions(keyMapOption, options) {
    if (isObject(keyMapOption)) {
      var sequence = keyMapOption.sequence,
        action = keyMapOption.action;
      return {
        keySequence: sequence,
        keyEventType: isUndefined(action) ? KeyEventType[options.defaultKeyEvent] : KeyEventType[action],
      };
    } else {
      return {
        keySequence: keyMapOption,
        keyEventType: KeyEventType[options.defaultKeyEvent],
      };
    }
  }

  /**
   * Returns the element in an array at a particular index from the end
   * @param {Array.<T>} array Array to iterate over to find the item
   * @param {number} placesFromEnd Number of places from the end of the array to find
   *        the item to return
   * @returns {T} The item found in the array at the particular index
   * @template T
   */
  function indexFromEnd(array, placesFromEnd) {
    return array[array.length - (placesFromEnd + 1)];
  }

  /**
   * Dictionary of keys that, when pressed down with the cmd key, never trigger a keyup
   * event in the browser
   */
  var KeysWithKeyUpHiddenByCmd = {
    Enter: true,
    Backspace: true,
    ArrowRight: true,
    ArrowLeft: true,
    ArrowUp: true,
    ArrowDown: true,

    /**
     * Caps lock is a strange case where it not only fails to trigger a keyup event when,
     * pressed with cmd, but it's keyup event is triggered when caps lock is toggled off
     */
    CapsLock: true,
  };

  for (var i = 1; i < 13; i++) {
    KeysWithKeyUpHiddenByCmd['F'.concat(i)] = true;
  }

  /**
   * Whether the specified key, when pressed down with the cmd key, never triggers a keyup
   * event in the browser
   * @param {NormalizedKeyName} keyName Name of the key
   * @returns {boolean} Whether the key has its keyup event hidden by cmd
   */

  function keyupIsHiddenByCmd(keyName) {
    return keyName.length === 1 || hasKey(KeysWithKeyUpHiddenByCmd, keyName);
  }

  /**
   * Object containing all information necessary to match a handler to a history of
   * key combinations
   * @typedef {Object} MatchingActionConfig
   * @property {NormalizedKeySequenceId} prefix - String describing the sequence of key
   *          combinations, before the final key combination (an empty string for
   *          sequences that are a single key combination)
   * @property {number} sequenceLength - Number of combinations involved in the
   *           sequence
   * @property {KeyCombinationString} id - Serialized description of the key combinations
   *            that make up the sequence
   * @property {Object.<KeyName, Boolean>} keyDictionary - Dictionary of key names involved
   *           in the last key combination of the sequence
   * @property {KeyEventType} keyEventType - Record index for key event that
   *          the matcher should match on
   * @property {number} size - Number of keys involved in the final key combination
   * @property {EventMatchDictionary} events - Dictionary of EventMatches
   */

  /**
   * A dictionary mapping key event types to event matches
   * @typedef {Object.<KeyEventType, EventMatch>} EventMatchDictionary
   */

  /**
   * Object containing information to call a handler if an event type matches a
   * key event
   * @typedef {Object} EventMatch
   * @property {ActionName} actionName - Name of the action
   * @property {Function} handler - Handler to call if event type matches
   */

  /**
   * Matches a KeyCombination to a list of pre-registered ActionConfiguration and their
   * corresponding handler functions
   * @class
   */

  var KeyCombinationMatcher =
    /*#__PURE__*/
    (function () {
      /**
       * Returns a new instance of KeyCombinationMatcher
       * @returns {KeyCombinationMatcher}
       */
      function KeyCombinationMatcher() {
        _classCallCheck(this, KeyCombinationMatcher);

        this._actionConfigs = {};
        this._order = null;
      }
      /**
       * Adds a new ActionConfiguration and handler to those that can be used to match a
       * KeyCombination
       * @param {ActionConfiguration} actionConfig
       * @param {Function} handler Function to call if match is selected
       * @returns {void}
       */

      _createClass(KeyCombinationMatcher, [
        {
          key: 'addMatch',
          value: function addMatch(actionConfig, handler) {
            if (this._includesMatcherForCombination(actionConfig.id)) {
              var keyEventType = actionConfig.keyEventType,
                actionName = actionConfig.actionName,
                id = actionConfig.id;

              this._addHandlerToActionConfig(id, {
                keyEventType: keyEventType,
                actionName: actionName,
                handler: handler,
              });
            } else {
              this._addNewActionConfig(actionConfig, handler);
            }
          },
          /**
           * Finds a MatchingActionConfig for a KeyCombination, ReactKeyName and
           * KeyEventType
           * @param {KeyCombination} keyCombination Record of key combinations
           *         to use in the match
           * @param {ReactKeyName} keyName Name of the key to use in the match
           * @param {KeyEventType} keyEventType The type of key event to use in the match
           * @returns {MatchingActionConfig|null} A MatchingActionOptions that matches the
           *          KeyCombination, ReactKeyName and KeyEventType
           */
        },
        {
          key: 'findMatch',
          value: function findMatch(keyCombination, keyName, keyEventType) {
            var _this = this;

            lazyLoadAttribute(this, 'order', function () {
              return _this._setOrder();
            });
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (
                var _iterator = this._order[Symbol.iterator](), _step;
                !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
                _iteratorNormalCompletion = true
              ) {
                var combinationId = _step.value;
                var actionOptions = this._actionConfigs[combinationId];

                if (this._matchesActionConfig(keyCombination, keyName, keyEventType, actionOptions)) {
                  return actionOptions;
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            return null;
          },
          /********************************************************************************
           * Presentation
           ********************************************************************************/

          /**
           * A plain JavaScript representation of the KeyCombinationMatcher, useful for
           * serialization or debugging
           * @returns {Object} Serialized representation of the key combination matcher
           */
        },
        {
          key: 'toJSON',
          value: function toJSON() {
            return {
              actionConfigs: this._actionConfigs,
              order: this._order,
            };
          },
          /********************************************************************************
           * Private methods
           ********************************************************************************/
        },
        {
          key: '_matchesActionConfig',
          value: function _matchesActionConfig(keyCombination, keyName, eventType, actionOptions) {
            if (!canBeMatched(keyCombination, actionOptions) || !actionOptions.events[eventType]) {
              /**
               * If the combination does not have any actions bound to the key event we are
               * currently processing, we skip checking if it matches the current keys being
               * pressed.
               */
              return false;
            }

            var keyCompletesCombination = false;
            var combinationKeys = Object.keys(actionOptions.keyDictionary);
            var combinationMatchesKeysPressed = combinationKeys.every(function (candidateKeyName) {
              if (!keyCombination.isEventTriggered(candidateKeyName, eventType)) {
                return false;
              }

              if (keyName && keyName === keyCombination.getNormalizedKeyName(candidateKeyName)) {
                keyCompletesCombination = !keyCombination.wasEventPreviouslyTriggered(candidateKeyName, eventType);
              }

              return true;
            });
            return combinationMatchesKeysPressed && keyCompletesCombination;
          },
        },
        {
          key: '_setOrder',
          value: function _setOrder() {
            /**
             * The first time the component that is currently handling the key event has
             * its handlers searched for a match, order the combinations based on their
             * size so that they may be applied in the correct priority order
             */
            var combinationsPartitionedBySize = objectValues(this._actionConfigs).reduce(function (memo, _ref) {
              var id = _ref.id,
                size$$1 = _ref.size;

              if (!memo[size$$1]) {
                memo[size$$1] = [];
              }

              memo[size$$1].push(id);
              return memo;
            }, {});
            this._order = Object.keys(combinationsPartitionedBySize)
              .sort(function (a, b) {
                return b - a;
              })
              .reduce(function (memo, key) {
                return memo.concat(combinationsPartitionedBySize[key]);
              }, []);
          },
        },
        {
          key: '_addNewActionConfig',
          value: function _addNewActionConfig(combinationSchema, handler) {
            var prefix = combinationSchema.prefix,
              sequenceLength = combinationSchema.sequenceLength,
              id = combinationSchema.id,
              keyDictionary = combinationSchema.keyDictionary,
              size$$1 = combinationSchema.size,
              keyEventType = combinationSchema.keyEventType,
              actionName = combinationSchema.actionName;

            this._setCombinationMatcher(id, {
              prefix: prefix,
              sequenceLength: sequenceLength,
              id: id,
              keyDictionary: keyDictionary,
              size: size$$1,
              events: {},
            });

            this._addHandlerToActionConfig(id, {
              keyEventType: keyEventType,
              actionName: actionName,
              handler: handler,
            });
          },
        },
        {
          key: '_addHandlerToActionConfig',
          value: function _addHandlerToActionConfig(id, _ref2) {
            var keyEventType = _ref2.keyEventType,
              actionName = _ref2.actionName,
              handler = _ref2.handler;

            var combination = this._getCombinationMatcher(id);

            this._setCombinationMatcher(
              id,
              _objectSpread({}, combination, {
                events: _objectSpread(
                  {},
                  combination.events,
                  _defineProperty({}, keyEventType, {
                    actionName: actionName,
                    handler: handler,
                  })
                ),
              })
            );
          },
        },
        {
          key: '_setCombinationMatcher',
          value: function _setCombinationMatcher(id, combinationMatcher) {
            this._actionConfigs[id] = combinationMatcher;
          },
        },
        {
          key: '_getCombinationMatcher',
          value: function _getCombinationMatcher(id) {
            return this._actionConfigs[id];
          },
        },
        {
          key: '_includesMatcherForCombination',
          value: function _includesMatcherForCombination(id) {
            return !!this._getCombinationMatcher(id);
          },
        },
      ]);

      return KeyCombinationMatcher;
    })();

  function canBeMatched(keyCombination, combinationMatcher) {
    var combinationKeysNo = size(combinationMatcher.keyDictionary);
    var iterator = new KeyCombinationIterator(keyCombination);
    var cmdIsHidingKeys = combinationMatcher.keyDictionary.Meta && keyUpIsBeingHidden(keyCombination);

    if (Configuration.option('allowCombinationSubmatches') || cmdIsHidingKeys) {
      return iterator.numberOfKeys >= combinationKeysNo;
    } else {
      /**
       * If sub-matches are not allow, the number of keys in the key state and the
       * number of keys in the combination we are attempting to match, must be
       * exactly the same
       */
      return iterator.numberOfKeys === combinationKeysNo;
    }
  }

  function keyUpIsBeingHidden(keyCombination) {
    if (keyCombination.isKeyStillPressed('Meta')) {
      return new KeyCombinationIterator(keyCombination).some(function (keyName) {
        return keyupIsHiddenByCmd(keyName);
      });
    }

    return false;
  }

  function updateIndexCounters(indexCounters, idSizes) {
    /**
     * Cycle through the list of different combination aliases
     */
    var incrementer = 0;
    var carry = true;

    while (carry && incrementer < indexCounters.length) {
      var count = indexFromEnd(indexCounters, incrementer);
      var newIndex = (count + 1) % (indexFromEnd(idSizes, incrementer) || 1);
      indexCounters[indexCounters.length - (incrementer + 1)] = newIndex;
      carry = newIndex === 0;

      if (carry) {
        incrementer++;
      }
    }

    return incrementer === indexCounters.length;
  }
  /**
   * Matches a KeyHistory to a list of pre-registered ActionConfiguration and
   * their corresponding handler functions
   * @class
   */

  var KeyHistoryMatcher =
    /*#__PURE__*/
    (function () {
      /**
       * Returns a new instance of KeyMapMatcher
       * @returns {KeyHistoryMatcher}
       */
      function KeyHistoryMatcher() {
        _classCallCheck(this, KeyHistoryMatcher);

        this._combinationMatchers = {};
        this._eventRecord = KeyEventStateArrayManager.newRecord();
      }
      /**
       * Adds a possible match that can be used to match key combination histories
       * @param {ActionConfiguration} actionConfig The configuration object that
       *        defines the action the possible match represents
       * @param {Function} handler Function to call if the possible match is selected
       *        when matching against a key combination history
       * @returns {void}
       */

      _createClass(KeyHistoryMatcher, [
        {
          key: 'addMatch',
          value: function addMatch(actionConfig, handler) {
            var combinationMatcher = this._getOrCreateCombinationMatcher(actionConfig.prefix);

            combinationMatcher.addMatch(actionConfig, handler);
            /**
             * Merge event records so we can quickly determine if a given component
             * has any handlers bound to particular key events
             */

            KeyEventStateArrayManager.setBit(this._eventRecord, actionConfig.keyEventType, KeyEventState.seen);
            /**
             * Record the longest sequence length so we know to only check for sequences
             * of that length or shorter for a particular component
             */

            if (!this.longestSequence || this.longestSequence < actionConfig.sequenceLength) {
              this.longestSequence = actionConfig.sequenceLength;
            }
          },
          /**
           * Attempts to find a match from the list of possible matches previously registered
           * for a given key event and key combination history
           * @param {KeyHistory} keyHistory History to attempt to
           *        find a match for
           * @param {ReactKeyName} key Name of the key to find a match for
           * @param {KeyEventType} keyEventType Type of event to find a match
           * @returns {MatchingActionConfig|null} First MatchingActionOptions that matches
           */
        },
        {
          key: 'findMatch',
          value: function findMatch(keyHistory, key, keyEventType) {
            var combinationMatcher = this._findCombinationMatcher(keyHistory);

            if (combinationMatcher) {
              return combinationMatcher.findMatch(keyHistory.currentCombination, keyHistory.currentCombination.getNormalizedKeyName(key), keyEventType);
            }

            return null;
          },
          /**
           * Whether a possible match has been registered for a key event type
           * @param {KeyEventType} eventType Type of event
           * @returns {boolean} true if at least one possible match has been registered for
           *        the event
           */
        },
        {
          key: 'hasMatchesForEventType',
          value: function hasMatchesForEventType(eventType) {
            return !!this._eventRecord[eventType];
          },
          /********************************************************************************
           * Presentation
           ********************************************************************************/

          /**
           * A plain JavaScript representation of the KeyMapMatcher, useful for
           * serialization or debugging
           * @returns {Object} Serialized representation of the key map matcher
           */
        },
        {
          key: 'toJSON',
          value: function toJSON() {
            var _this = this;

            return Object.keys(this._combinationMatchers).reduce(function (memo, prefix) {
              var combinationMatcher = _this._combinationMatchers[prefix];
              memo[prefix] = combinationMatcher.toJSON();
              return memo;
            }, {});
          },
          /********************************************************************************
           * Private methods
           ********************************************************************************/
        },
        {
          key: '_getOrCreateCombinationMatcher',
          value: function _getOrCreateCombinationMatcher(prefix) {
            return lazyLoadAttribute(this._combinationMatchers, prefix, function () {
              return new KeyCombinationMatcher();
            });
          },
        },
        {
          key: '_findCombinationMatcher',
          value: function _findCombinationMatcher(keyHistory) {
            var previousCombinations = keyHistory.getPreviousCombinations(this.longestSequence - 1);

            if (previousCombinations.length === 0) {
              return this._combinationMatchers[''];
            }
            /**
             * We need to match a sequence, and therefore try all the aliases involved in
             * each key combination that makes up the sequence, to be sure there isn't a
             * match
             */

            var sequenceIds = previousCombinations.map(function (keyCombination) {
              return keyCombination.ids;
            });
            var idSizes = sequenceIds.map(function (ids) {
              return ids.length;
            });
            /**
             * List of counters
             * @type {number[]}
             */

            var indexCounters = new Array(sequenceIds.length).fill(0);

            do {
              var sequenceIdPermutation = indexCounters.map(function (sequenceIdIndex, index) {
                return sequenceIds[index][sequenceIdIndex];
              });
              var candidateId = sequenceIdPermutation.join(' ');

              if (this._combinationMatchers[candidateId]) {
                return this._combinationMatchers[candidateId];
              }
            } while (!updateIndexCounters(indexCounters, idSizes));

            return this._combinationMatchers[''];
          },
        },
      ]);

      return KeyHistoryMatcher;
    })();

  function printComponent(component) {
    return JSON.stringify(component, componentAttributeSerializer, 4);
  }

  function componentAttributeSerializer(key, value) {
    if (typeof value === 'function') {
      return value.toString();
    }

    return value;
  }

  /**
   * Returns the name of the event at a specified event record index
   * @param {KeyEventType} keyEventType
   * @returns {KeyEventName} Name of the key event
   */
  function describeKeyEventType(keyEventType) {
    switch (parseInt(keyEventType, 10)) {
      case 0:
        return 'keydown';

      case 1:
        return 'keypress';

      default:
        return 'keyup';
    }
  }

  /**
   * Resolves the correct actions to trigger for a list of hotkeys components and a
   * history of key events
   * @class
   */

  var ActionResolver =
    /*#__PURE__*/
    (function () {
      /**
       * Creates a new instance of ActionResolver
       * @param {ComponentOptionsList} componentList List of components
       * @param {AbstractKeyEventStrategy} eventStrategy
       * @param {Logger} logger
       * @returns {ActionResolver}
       */
      function ActionResolver(componentList, eventStrategy, logger) {
        _classCallCheck(this, ActionResolver);

        this.logger = logger;
        this._eventStrategy = eventStrategy;
        /**
         * List of mappings from key sequences to handlers that is constructed on-the-fly
         * as key events propagate up the render tree
         * @type {KeyHistoryMatcher[]}
         */

        this._keyMapMatchers = [];
        /**
         * Array of counters - one for each component - to keep track of how many handlers
         * for that component still need actions assigned to them
         * @type {Array.<Number,Object>}
         */

        this._unmatchedHandlerStatus = [];
        /**
         * A dictionary mapping action names to the position in the list of the components
         * that define handlers for them
         * @type {Object.<ActionName, Number[]>}
         */

        this._handlersDictionary = {};
        /**
         * A dictionary of sequences already encountered in the process of building the
         * list of keyMaps on the fly, as key events propagate up the component tree
         * @type {Object.<MouseTrapKeySequence, Number[]>}
         */

        this._keySequencesDictionary = {};
        var iterator = componentList.iterator;

        while (iterator.next()) {
          var _iterator$getComponen = iterator.getComponent(),
            handlers = _iterator$getComponen.handlers;

          this._unmatchedHandlerStatus.push([Object.keys(handlers).length, {}]);

          this._keyMapMatchers.push(new KeyHistoryMatcher());
        }

        this._componentList = componentList;
        this._componentListIterator = componentList.iterator;
      }
      /**
       * The KeyHistoryMatcher for the component in a particular position
       * @param {number} componentPosition Position of component to find the
       *        KeyHistoryMatcher for
       * @returns {KeyHistoryMatcher} Key combination matcher that corresponds
       *        to the component
       */

      _createClass(ActionResolver, [
        {
          key: 'getKeyHistoryMatcher',
          value: function getKeyHistoryMatcher(componentPosition) {
            if (this._componentHasUnmatchedHandlers(componentPosition)) {
              /**
               * We build the mapping between actions and their closest handlers the
               * first time the key map for the component at <tt>position</tt> is accessed.
               *
               * We must search higher than the current component for actions, as they are
               * often defined in parent components of those that ultimately define their
               * handlers.
               */
              while (this._componentListIterator.next()) {
                this._addHandlersFromComponent();

                this._addActionsFromComponent();
              }
            }

            return this._getKeyHistoryMatcher(componentPosition);
          },
          /**
           * Whether a component has one or more actions bound to an event type
           * @param {number} componentPosition Position of the component
           * @param {KeyEventType} keyEventType
           * @returns {boolean} true if the component has an action bound to the event type
           */
        },
        {
          key: 'componentHasActionsBoundToEventType',
          value: function componentHasActionsBoundToEventType(componentPosition, keyEventType) {
            return this.getKeyHistoryMatcher(componentPosition).hasMatchesForEventType(keyEventType);
          },
          /**
           * Finds matcher for sequence and current key event for a component at a position
           * @param {number} componentPosition Position of the component
           * @param {KeyHistory} keyHistory History of key combinations to match
           *        against actions defined in component
           * @param {ReactKeyName} keyName Name of the key the current event relates to
           * @param {KeyEventType} keyEventType Type of key event
           * @returns {Object|null}
           */
        },
        {
          key: 'findMatchingKeySequenceInComponent',
          value: function findMatchingKeySequenceInComponent(componentPosition, keyHistory, keyName, keyEventType) {
            if (!this.componentHasActionsBoundToEventType(componentPosition, keyEventType)) {
              return null;
            }

            return this.getKeyHistoryMatcher(componentPosition).findMatch(keyHistory, keyName, keyEventType);
          },
        },
        {
          key: 'callClosestMatchingHandler',
          value: function callClosestMatchingHandler(event, keyName, keyEventType, componentPosition, componentSearchIndex) {
            while (componentSearchIndex <= componentPosition) {
              var keyHistoryMatcher = this.getKeyHistoryMatcher(componentSearchIndex);

              var _this$_eventStrategy$ = this._eventStrategy.componentList.getAtPosition(componentSearchIndex),
                componentId = _this$_eventStrategy$.componentId;
              var keyHistory = this._eventStrategy.keyHistory;
              var currentCombination = keyHistory.currentCombination;
              var sequenceMatch = this.findMatchingKeySequenceInComponent(componentSearchIndex, keyHistory, keyName, keyEventType);

              if (sequenceMatch) {
                this._handleMatchFound(currentCombination, sequenceMatch, keyEventType, componentId, event, componentSearchIndex);

                return true;
              }

              this._handleMatchNotFound(currentCombination, componentSearchIndex, keyEventType, componentId);

              componentSearchIndex++;
            }
          },
        },
        {
          key: '_handleMatchNotFound',
          value: function _handleMatchNotFound(currentCombination, componentSearchIndex, keyEventType, componentId) {
            var keyCombinationDecorator = new KeyCombinationDecorator(currentCombination);

            if (this.componentHasActionsBoundToEventType(componentSearchIndex, keyEventType));
          },
        },
        {
          key: '_handleMatchFound',
          value: function _handleMatchFound(currentCombination, sequenceMatch, keyEventType, componentId, event, componentSearchIndex) {
            var keyCombinationDecorator = new KeyCombinationDecorator(currentCombination);
            var eventSchema = sequenceMatch.events[keyEventType];

            if (Configuration.option('allowCombinationSubmatches')) {
              var subMatchDescription = KeyCombinationSerializer.serialize(sequenceMatch.keyDictionary);
            }

            eventSchema.handler(event);

            if (Configuration.option('stopEventPropagationAfterHandling')) {
              this._eventStrategy.stopEventPropagation(event, componentSearchIndex);
            }
          },
          /********************************************************************************
           * Private methods
           *********************************************************************************/
        },
        {
          key: '_getKeyHistoryMatcher',
          value: function _getKeyHistoryMatcher(index) {
            return this._keyMapMatchers[index];
          },
        },
        {
          key: '_addActionsFromComponent',
          value: function _addActionsFromComponent() {
            var _this = this;

            var _this$_componentListI = this._componentListIterator.getComponent(),
              actions = _this$_componentListI.actions;
            /**
             * Iterate over the actions of a component (starting with the current component
             * and working through its ancestors), matching them to the current component's
             * handlers
             */

            Object.keys(actions).forEach(function (actionName) {
              _this._buildActionMatchers(actionName, actions[actionName]);
            });
          },
        },
        {
          key: '_buildActionMatchers',
          value: function _buildActionMatchers(actionName, listOfActionDefinitions) {
            var _this2 = this;

            var handlerPositions = this._positionsOfComponentsWithHandlersFor(actionName);

            if (!handlerPositions) {
              return false;
            }

            this._registerActionWithMatcher(handlerPositions, actionName, listOfActionDefinitions);

            handlerPositions.forEach(function (componentPosition) {
              var handlerStatus = _this2._getUnmatchedHandlerStatus(componentPosition);

              var matchedActionsDictionary = handlerStatus[1];

              if (!matchedActionsDictionary[actionName]) {
                matchedActionsDictionary[actionName] = true;
                /**
                 * Decrement the number of remaining unmatched handlers for the
                 * component currently handling the propagating key event, so we know
                 * when all handlers have been matched to sequences and we can move on
                 * to matching them against the current key event
                 */

                handlerStatus[0]--;
              }
            });
            return true;
          },
        },
        {
          key: '_positionsOfComponentsWithHandlersFor',
          value: function _positionsOfComponentsWithHandlersFor(actionName) {
            return this._handlersDictionary[actionName];
          },
        },
        {
          key: '_registerActionWithMatcher',
          value: function _registerActionWithMatcher(handlerPositions, actionName, listOfActionDefinitions) {
            var _this3 = this;

            var positionOfClosestHandler = handlerPositions[0];

            var closestHandler = this._componentList.getAtPosition(positionOfClosestHandler).handlers[actionName];

            var closestKeyMatcher = this._getKeyHistoryMatcher(positionOfClosestHandler);

            listOfActionDefinitions.forEach(function (actionDefinition) {
              var prefix = actionDefinition.prefix,
                id = actionDefinition.id,
                keyEventType = actionDefinition.keyEventType;
              var sequenceId = [prefix, id].join(' ');

              if (_this3._isClosestHandlerAlreadyFoundFor(sequenceId, keyEventType)) {
                return false;
              }

              closestKeyMatcher.addMatch(actionDefinition, closestHandler);

              _this3._recordHandlerFoundFor(sequenceId, [positionOfClosestHandler, keyEventType]);
            });
            return true;
          },
        },
        {
          key: '_addHandlersFromComponent',
          value: function _addHandlersFromComponent() {
            var _this4 = this;

            var _this$_componentListI2 = this._componentListIterator.getComponent(),
              handlers = _this$_componentListI2.handlers;
            /**
             * Add current component's handlers to the handlersDictionary so we know
             * which component has defined them
             */

            Object.keys(handlers).forEach(function (actionName) {
              _this4._addHandler(actionName);
            });
          },
        },
        {
          key: '_addHandler',
          value: function _addHandler(actionName) {
            lazyLoadAttribute(this._handlersDictionary, actionName, []);

            this._handlersDictionary[actionName].push(this._componentListIterator.position);
          },
        },
        {
          key: '_recordHandlerFoundFor',
          value: function _recordHandlerFoundFor(keySequence, value) {
            /**
             * Record that we have already found a handler for the current action so
             * that we do not override handlers for an action closest to the event target
             * with handlers further up the tree
             */
            lazyLoadAttribute(this._keySequencesDictionary, keySequence, []);

            this._keySequencesDictionary[keySequence].push(value);
          },
        },
        {
          key: '_componentHasUnmatchedHandlers',
          value: function _componentHasUnmatchedHandlers(componentIndex) {
            return this._getUnmatchedHandlerStatus(componentIndex)[0] > 0;
          },
        },
        {
          key: '_getUnmatchedHandlerStatus',
          value: function _getUnmatchedHandlerStatus(index) {
            return this._unmatchedHandlerStatus[index];
          },
        },
        {
          key: '_isClosestHandlerAlreadyFoundFor',
          value: function _isClosestHandlerAlreadyFoundFor(keySequenceId, keyEventType) {
            var keySequence = this._keySequencesDictionary[keySequenceId] || [];
            return keySequence.some(function (dictEntry) {
              return dictEntry[1] === keyEventType;
            });
          },
        },
      ]);

      return ActionResolver;
    })();

  /**
   * Defines common behaviour for key event strategies
   * @abstract
   * @class
   */

  var AbstractKeyEventStrategy =
    /*#__PURE__*/
    (function () {
      /********************************************************************************
       * Init & Reset
       ********************************************************************************/

      /**
       * Creates a new instance of an event strategy (this class is an abstract one and
       * not intended to be instantiated directly).
       * @param {Object} options Options for how event strategy should behave
       * @param {string} options.logLevel The level of severity to log at
       * @param {KeyEventManager} keyEventManager KeyEventManager used for passing
       *        messages between key event strategies
       */
      function AbstractKeyEventStrategy() {
        var keyEventManager = arguments.length > 1 ? arguments[1] : undefined;

        _classCallCheck(this, AbstractKeyEventStrategy);

        /**
         * @typedef {number} ComponentId Unique index associated with every HotKeys component
         * as it becomes active.
         *
         * For focus-only components, this happens when the component is focused. The HotKeys
         * component closest to the DOM element in focus gets the smallest number (0) and
         * those further up the render tree get larger (incrementing) numbers. When a different
         * element is focused (triggering the creation of a new focus tree) all component indexes
         * are reset (de-allocated) and re-assigned to the new tree of HotKeys components that
         * are now in focus.
         *
         * For global components, component indexes are assigned when a HotKeys component is
         * mounted, and de-allocated when it unmounts. The component index counter is never reset
         * back to 0 and just keeps incrementing as new components are mounted.
         */

        /**
         * Should be overridden by children to set a Logger instance
         */
        this.logger = null;
        /**
         * Counter to maintain what the next component index should be
         * @type {ComponentId}
         */

        this.componentId = -1;
        /**
         * Reference to key event manager, so that information may pass between the
         * global strategy and the focus-only strategy
         * @type {KeyEventManager}
         */

        this.keyEventManager = keyEventManager;
        this.componentTree = new ComponentTree();
        /**
         * Expected to be overridden by child class
         * @type {AbstractKeyEventSimulator}
         * @abstract
         */

        this._simulator = null;

        this._reset();

        this.resetKeyHistory();
      }
      /**
       * Resets all strategy state to the values it had when it was first created
       * @protected
       */

      _createClass(AbstractKeyEventStrategy, [
        {
          key: '_reset',
          value: function _reset() {
            this.componentList = new ComponentOptionsList();
            this._actionResolver = null;
          },
        },
        {
          key: '_recalculate',
          value: function _recalculate() {
            this._actionResolver = null;
            this.keyHistory.maxLength = this.componentList.longestSequence;
          },
        },
        {
          key: 'resetKeyHistory',

          /**
           * Reset the state values that record the current and recent state of key events
           * @param {Object} options An options hash
           * @param {boolean} options.force Whether to force a hard reset of the key
           *        combination history.
           */
          value: function resetKeyHistory() {
            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            if (this._simulator) {
              this._simulator.clear();
            }

            if (this.keyHistory.any() && !options.force) {
              this._keyHistory = new KeyHistory(
                {
                  maxLength: this.componentList.longestSequence,
                },
                new KeyCombination(this)
              );
            } else {
              this._keyHistory = this._newKeyHistory();
            }
          },
        },
        {
          key: '_newKeyHistory',
          value: function _newKeyHistory() {
            return new KeyHistory({
              maxLength: this.componentList.longestSequence,
            });
          },
          /********************************************************************************
           * Registering key maps
           ********************************************************************************/

          /**
           * Registers a new mounted component's key map so that it can be included in the
           * application's key map
           * @param {KeyMap} keyMap - Map of actions to key expressions
           * @returns {ComponentId} Unique component ID to assign to the focused HotKeys
           *          component and passed back when handling a key event
           */
        },
        {
          key: 'registerKeyMap',
          value: function registerKeyMap(keyMap) {
            this.componentId += 1;
            this.componentTree.add(this.componentId, keyMap);
            return this.componentId;
          },
          /**
           * Re-registers (updates) a mounted component's key map
           * @param {ComponentId} componentId - Id of the component that the keyMap belongs to
           * @param {KeyMap} keyMap - Map of actions to key expressions
           */
        },
        {
          key: 'reregisterKeyMap',
          value: function reregisterKeyMap(componentId, keyMap) {
            this.componentTree.update(componentId, keyMap);
          },
          /**
           * Registers that a component has now mounted, and declares its parent hot keys
           * component id so that actions may be properly resolved
           * @param {ComponentId} componentId - Id of the component that has mounted
           * @param {ComponentId} parentId - Id of the parent hot keys component
           */
        },
        {
          key: 'registerComponentMount',
          value: function registerComponentMount(componentId, parentId) {
            this.componentTree.setParent(componentId, parentId);
          },
          /**
           * De-registers (removes) a mounted component's key map from the registry
           * @param {ComponentId} componentId - Id of the component that the keyMap
           *        belongs to
           */
        },
        {
          key: 'deregisterKeyMap',
          value: function deregisterKeyMap(componentId) {
            this.componentTree.remove(componentId);

            if (this.componentTree.isRootId(componentId)) {
              this.componentTree.clearRootId();
            }
          },
          /**
           * Registers the hotkeys defined by a HotKeys component
           * @param {ComponentId} componentId - Index of the component
           * @param {KeyMap} actionNameToKeyMap - Definition of actions and key maps defined
           *        in the HotKeys component
           * @param {HandlersMap} actionNameToHandlersMap - Map of ActionNames to handlers
           *        defined in the HotKeys component
           * @param {string} action - Description of the action that triggers the new component
           *        registering a new key map.
           * @param {Object} options - Hash of options that configure how the key map is built.
           * @protected
           */
        },
        {
          key: '_addComponent',
          value: function _addComponent(componentId) {
            var actionNameToKeyMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var actionNameToHandlersMap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var options = arguments.length > 4 ? arguments[4] : undefined;
            this.componentList.add(componentId, actionNameToKeyMap, actionNameToHandlersMap, options);

            this._recalculate();
            this.logger.logComponentOptions(componentId, this.componentList.getById(componentId));
          },
        },
        {
          key: '_updateComponent',
          value: function _updateComponent(componentId, actionNameToKeyMap, actionNameToHandlersMap, options) {
            this.componentList.update(componentId, actionNameToKeyMap, actionNameToHandlersMap, options);

            this._recalculate();

            this.logger.logComponentOptions(componentId, this.componentList.getById(componentId));
          },
          /********************************************************************************
           * Recording key events
           ********************************************************************************/
        },
        {
          key: '_describeCurrentCombination',
          value: function _describeCurrentCombination() {
            var keyCombinationDecorator = new KeyCombinationDecorator(this.currentCombination);
            return keyCombinationDecorator.describe();
          },
        },
        {
          key: '_recordKeyDown',
          value: function _recordKeyDown(event, key, componentId) {
            var keyEventState = stateFromEvent(event);
            var currentCombination = this.currentCombination;

            if (currentCombination.isKeyIncluded(key) || currentCombination.isEnding) {
              this._startAndLogNewKeyCombination(componentId, key, keyEventState);
            } else {
              this._recordNewKeyInCombination(key, KeyEventType.keydown, keyEventState, componentId);
            }
          },
        },
        {
          key: '_startAndLogNewKeyCombination',
          value: function _startAndLogNewKeyCombination(componentId, keyName, keyEventState) {
            this.keyHistory.startNewKeyCombination(keyName, keyEventState);
            this.logger.logKeyHistory(this.keyHistory, componentId);
          },
        },
        {
          key: '_recordNewKeyInCombination',
          value: function _recordNewKeyInCombination(keyName, keyEventType, keyEventState, componentId) {
            this.keyHistory.addKeyToCurrentCombination(keyName, keyEventType, keyEventState);

            this.logger.logKeyHistory(this.keyHistory, componentId);
          },
          /********************************************************************************
           * Matching and calling handlers
           ********************************************************************************/
        },
        {
          key: '_isIgnoringRepeatedEvent',
          value: function _isIgnoringRepeatedEvent(event, key, eventType, componentId) {
            if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
              this.logger.logIgnoredKeyEvent(event, key, eventType, 'it was a repeated event', componentId);
              return true;
            }

            return false;
          },
        },
        {
          key: 'keyHistory',
          get: function get() {
            var _this = this;

            return lazyLoadAttribute(this, '_keyHistory', function () {
              return _this._newKeyHistory();
            });
          },
        },
        {
          key: 'actionResolver',
          get: function get() {
            var _this2 = this;

            return lazyLoadAttribute(this, '_actionResolver', function () {
              return new ActionResolver(_this2.componentList, _this2, _this2.logger);
            });
          },
        },
        {
          key: 'currentCombination',
          get: function get() {
            return this.keyHistory.currentCombination;
          },
        },
      ]);

      return AbstractKeyEventStrategy;
    })();

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the same directory of this source tree.
   */

  /**
   * `charCode` represents the actual "character code" and is safe to use with
   * `String.fromCharCode`. As such, only keys that correspond to printable
   * characters produce a valid `charCode`, the only exception to this is Enter.
   * The Tab-key is considered non-printable and does not have a `charCode`,
   * presumably because it does not produce a tab-character in browsers.
   *
   * @param {object} nativeEvent Native browser event.
   * @returns {number} Normalized `charCode` property.
   */
  function getEventCharCode(nativeEvent) {
    var charCode;
    var keyCode = nativeEvent.keyCode;

    if ('charCode' in nativeEvent) {
      charCode = nativeEvent.charCode; // FF does not set `charCode` for the Enter-key, check against `keyCode`.

      if (charCode === 0 && keyCode === 13) {
        charCode = 13;
      }
    } else {
      // IE8 does not implement `charCode`, but `keyCode` has the correct value.
      charCode = keyCode;
    } // IE and Edge (on Windows) and Chrome / Safari (on Windows and Linux)
    // report Enter as charCode 10 when ctrl is pressed.

    if (charCode === 10) {
      charCode = 13;
    } // Some non-printable keys are reported in `charCode`/`keyCode`, discard them.
    // Must not discard the (non-)printable Enter-key.

    if (charCode >= 32 || charCode === 13) {
      return charCode;
    }

    return 0;
  }

  /**
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the same directory of this source tree.
   *
   * @flow
   */
  /**
   * Normalization of deprecated HTML5 `key` values
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
   */

  var normalizeKey = {
    Esc: 'Escape',
    Spacebar: ' ',
    Left: 'ArrowLeft',
    Up: 'ArrowUp',
    Right: 'ArrowRight',
    Down: 'ArrowDown',
    Del: 'Delete',
    Win: 'OS',
    Menu: 'ContextMenu',
    Apps: 'ContextMenu',
    Scroll: 'ScrollLock',
    MozPrintableKey: 'Unidentified',
  };
  /**
   * @param {object} nativeEvent Native browser event.
   * @returns {string} Normalized `key` property.
   */

  function reactsGetEventKey(nativeEvent) {
    if (nativeEvent.key) {
      // Normalize inconsistent values reported by browsers due to
      // implementations of a working draft specification.
      // FireFox implements `key` but returns `MozPrintableKey` for all
      // printable characters (normalized to `Unidentified`), ignore it.
      var key = normalizeKey[nativeEvent.key] || nativeEvent.key;

      if (key !== 'Unidentified') {
        return key;
      }
    } // Browser does not implement `key`, polyfill as much of it as we can.

    if (nativeEvent.type === 'keypress') {
      var charCode = getEventCharCode(nativeEvent); // The enter-key is technically both printable and non-printable and can
      // thus be captured by `keypress`, no other non-printable key should.

      return charCode === 13 ? 'Enter' : String.fromCharCode(charCode);
    }

    if (nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup') {
      // While user keyboard layout determines the actual meaning of each
      // `keyCode` value, almost all function keys have a universal value.
      return translateToKey[nativeEvent.keyCode] || 'Unidentified';
    }

    return '';
  }

  /**
   * Lowercased string representing a particular keyboard key
   * @typedef {string} NormalizedKeyName
   */

  function keyNameFromEvent(event) {
    var customKeyCodes = Configuration.option('customKeyCodes'); // noinspection JSDeprecatedSymbols

    var keyCode = event.keyCode || event.charCode;

    if (hasKey(customKeyCodes, keyCode)) {
      return customKeyCodes[keyCode];
    }

    if (event.nativeEvent) {
      return event.key;
    } else {
      return reactsGetEventKey(event);
    }
  }
  /**
   * Returns key name from native or React keyboard event
   * @param {SyntheticKeyboardEvent} event - Event containing the key name
   * @returns {NormalizedKeyName} Normalized name of the key
   */

  function getKeyName(event) {
    var keyName = keyNameFromEvent(event);
    return keyName === '+' ? 'plus' : keyName;
  }

  /**
   * Returns whether the current key name matches the command key
   * @param {ReactKeyName} keyName Key name to compare to the command key's
   * @returns {boolean} Whether the key name matches the command key's
   */
  function isCmdKey(keyName) {
    return keyName === 'Meta';
  }

  function describeKeyEvent(event, keyName, keyEventType) {
    var eventDescription = "'".concat(keyName, "' ").concat(describeKeyEventType(keyEventType));

    if (event.simulated) {
      return '(simulated) '.concat(eventDescription);
    }

    return eventDescription;
  }

  /**
   * @typedef {number} EventResponseType
   */

  /**
   * Enum for different ways to respond to a key event
   * @readonly
   * @enum {EventResponseType}
   */
  var EventResponse = {
    unseen: 0,
    ignored: 1,
    seen: 2,
    recorded: 3,
    handled: 4,
  };

  /**
   * Manages the incrementing of a globally unique event id
   * @class
   */

  var KeyEventCounter =
    /*#__PURE__*/
    (function () {
      function KeyEventCounter() {
        _classCallCheck(this, KeyEventCounter);
      }

      _createClass(KeyEventCounter, null, [
        {
          key: 'incrementId',

          /**
           * Increment the current event id
           */
          value: function incrementId() {
            this._id = this.id + 1;
          },
        },
        {
          key: 'id',

          /**
           * Globally unique event id
           * @typedef {number} EventId
           */

          /**
           * Get the current event id
           * @returns {EventId} The current event ID
           */
          get: function get() {
            lazyLoadAttribute(this, '_id', 0);
            return this._id;
          },
        },
      ]);

      return KeyEventCounter;
    })();

  /**
   * Handles the propagation of keyboard events up through the React component tree,
   * starting from the hot keys component closest to the event target
   * @class
   */

  var EventPropagator =
    /*#__PURE__*/
    (function () {
      /**
       * Create a new instance of EventPropagator
       * @param {ComponentOptionsList} componentList List of options of the components
       *        the event is propagating through
       *        each log entry
       * @returns {EventPropagator}
       */
      function EventPropagator(componentList) {
        _classCallCheck(this, EventPropagator);

        this._componentList = componentList;
        this._previousPropagation = null;

        this._reset();
      }

      _createClass(EventPropagator, [
        {
          key: '_reset',
          value: function _reset() {
            /**
             * Position of the component that the event last propagated through
             * @type {number}
             */
            this.previousPosition = -1;
            /**
             * Position of the current component the event is propagating through
             * @type {number}
             */

            this._position = -1;
            /**
             * Flag to record whether the keyboard event matches an action whose handler
             * has already been called
             * @type {boolean}
             */

            this._actionHandled = false;
            /**
             * Flag to record whether the keyboard event should be ignored
             * @type {boolean}
             */

            this._ignoreEvent = false;
            /**
             * Flag to record whether the keyboard event current being handled should be
             * observed, even if matches the ignoreEventCondition
             * @type {boolean}
             */

            this._observeIgnoredEvents = false;
            /**
             * Flag to record whether the event is being stopped from further propagation
             * @type {boolean}
             */

            this._stopping = false;
            /**
             * The id of the component the event is current propagating through
             * @type {ComponentId}
             */

            this._componentId = null;
            /**
             * The name of the key the propagating event relates to
             * @type {ReactKeyName}
             */

            this._key = null;
            /**
             * The type of keyboard event that is propagating
             * @type {KeyEventType}
             */

            this._type = null;
          },
          /********************************************************************************
           * New event propagation
           *********************************************************************************/

          /**
           * Whether the current propagation step is the first one
           * @returns {boolean} true if this is the first propagation step
           */
        },
        {
          key: 'isFirstPropagationStep',
          value: function isFirstPropagationStep() {
            var previousPosition = this.previousPosition;
            return previousPosition === -1 || previousPosition >= this._position;
          },
          /**
           * Whether the propagation is for a particular key
           * @param {ReactKeyName} keyName The name of the key to query
           * @returns {boolean} true if the event propagation is for the key
           */
        },
        {
          key: 'isForKey',
          value: function isForKey(keyName) {
            return this._key === keyName;
          },
          /**
           * The type of keyboard event that is propagating
           * @param {KeyEventType} keyEventType The type of keyboard event to query
           * @returns {boolean} true if the keyboard event propagating is that type
           */
        },
        {
          key: 'isForEventType',
          value: function isForEventType(keyEventType) {
            return this._type === keyEventType;
          },
          /********************************************************************************
           * Propagation steps
           *********************************************************************************/

          /**
           * Begin a new propagation step, called as a before callback. i.e. the first thing
           * after an event has propagated to a new hot keys component
           * @param {ComponentId} componentId The id of the component that has just had the
           *        event propagate up to it
           * @param {SyntheticKeyboardEvent} event The actual KeyboardEvent that is propagating
           * @param {ReactKeyName} key The name of the key the event relates to
           * @param {KeyEventType} type The type of keyboard event
           * @returns {boolean} true if the event should be observed, otherwise false if it
           *        should be ignored.
           */
        },
        {
          key: 'startNewPropagationStep',
          value: function startNewPropagationStep(componentId, event, key, type) {
            this._position = this._componentList.getPositionById(componentId);
            this._componentId = componentId;

            if (this.isFirstPropagationStep()) {
              KeyEventCounter.incrementId();
              this._key = event.key;
              this._type = type;
            }

            if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
              this.ignoreEvent(event);
              return false;
            }

            return true;
          },
          /**
           * Ends handling of a propagation step and performs cleanup. Called as a after callback.
           * @returns {void}
           */
        },
        {
          key: 'finishPropagationStep',
          value: function finishPropagationStep() {
            if (this.isStopped() || this._componentList.isRoot(this._componentId)) {
              this._previousPropagation = this._clone();

              this._reset();
            } else {
              this.previousPosition = this._position;
            }
          },
          /********************************************************************************
           * Previous propagation
           *********************************************************************************/

          /**
           * The previous event propagation, either for an earlier event type of the same key
           * or a different key's event propagation
           * @type {EventPropagator} The propagator for the previous event propagation
           */
        },
        {
          key: 'observeIgnoredEvents',

          /********************************************************************************
           * Ignoring events
           *********************************************************************************/

          /**
           * Set the observeIgnoredEvents flag, to observe (not ignore) keyboard events that
           * match the ignored events filter
           * @returns {void}
           */
          value: function observeIgnoredEvents() {
            this._observeIgnoredEvents = true;
          },
          /**
           * Record that an event is being ignored for the rest of its propagation and, if
           * enabled, stop it from further propagation entirely.
           * @param {SyntheticKeyboardEvent} event Event to ignore
           * @returns {boolean} true if the event was stopped from further propagation,
           *          otherwise false.
           */
        },
        {
          key: 'ignoreEvent',
          value: function ignoreEvent(event) {
            this._ignoreEvent = true;

            if (this.isIgnoringEvent() && Configuration.option('stopEventPropagationAfterIgnoring')) {
              this.stop(event);
              this.finishPropagationStep();
              return true;
            }

            return false;
          },
          /**
           * Whether to ignore the currently propagating event or not
           * @returns {boolean} true if the event is being ignored for the current propagation
           */
        },
        {
          key: 'isIgnoringEvent',
          value: function isIgnoringEvent() {
            return !this._observeIgnoredEvents && this._ignoreEvent;
          },
          /********************************************************************************
           * Stopping propagation
           *********************************************************************************/

          /**
           * Whether the event has been stopped from further propagation
           * @returns {boolean} true if the event is being stopped
           */
        },
        {
          key: 'isStopped',
          value: function isStopped() {
            return this._stopping;
          },
          /**
           * Stop an event from further propagation
           * @param {SyntheticKeyboardEvent} event Event to call stopPropagation() on
           * @returns {boolean} true if the event was stopped and false if it was already
           *          stopped
           */
        },
        {
          key: 'stop',
          value: function stop(event) {
            if (!this.isStopped()) {
              this._stopping = true; // noinspection JSUnresolvedVariable

              if (!event.simulated) {
                event.stopPropagation();
              }

              return true;
            }

            return false;
          },
          /**
           * Whether the keyboard event has yet propagated to the root hot keys component
           * @returns {boolean} true if it still has hotkeys components to propagate to
           *          before being complete.
           */
        },
        {
          key: 'isPendingPropagation',
          value: function isPendingPropagation() {
            var previousPosition = this.previousPosition;
            return previousPosition !== -1 && previousPosition + 1 < this._position;
          },
          /**
           * If the action has already been handled
           * @returns {boolean} true if the action has already been handled
           */
        },
        {
          key: 'isHandled',
          value: function isHandled() {
            return this._actionHandled;
          },
          /**
           * Record that the current propagating event matched and action and its handler
           * has been called.
           * @returns {void}
           */
        },
        {
          key: 'setHandled',
          value: function setHandled() {
            this._actionHandled = true;
          },
          /********************************************************************************
           * Private methods
           ********************************************************************************/
        },
        {
          key: '_clone',
          value: function _clone() {
            var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
              _ref$copyState = _ref.copyState,
              copyState = _ref$copyState === void 0 ? true : _ref$copyState;

            var cloned = new EventPropagator(this._componentList);
            cloned.logger = this.logger;

            if (copyState) {
              Object.assign(cloned, this);
            }

            return cloned;
          },
        },
        {
          key: 'previousPropagation',
          get: function get() {
            var _this = this;

            return lazyLoadAttribute(this, '_previousPropagation', function () {
              return _this._clone({
                copyState: false,
              });
            });
          },
        },
      ]);

      return EventPropagator;
    })();

  /**
   * Whether the specified key name is for a key that has a native keypress event
   * @param {NormalizedKeyName} keyName Name of the key
   * @returns {boolean} Whether the key has a native keypress event
   */

  function hasKeyPressEvent(keyName) {
    return !isNonPrintableKeyName(keyName);
  }

  var AbstractKeyEventSimulator =
    /*#__PURE__*/
    (function () {
      function AbstractKeyEventSimulator(keyEventStrategy) {
        _classCallCheck(this, AbstractKeyEventSimulator);

        this._keyEventStrategy = keyEventStrategy;
        this.clear();
      }

      _createClass(AbstractKeyEventSimulator, [
        {
          key: 'clear',
          value: function clear() {
            this.keypressEventsToSimulate = [];
            this.keyupEventsToSimulate = [];
          },
        },
        {
          key: 'cloneAndMergeEvent',
          value: function cloneAndMergeEvent(event, extra) {
            var eventAttributes = Object.keys(ModifierFlagsDictionary).reduce(function (memo, eventAttribute) {
              memo[eventAttribute] = event[eventAttribute];
              return memo;
            }, {});
            return _objectSpread({}, eventAttributes, extra);
          },
        },
        {
          key: '_shouldSimulate',
          value: function _shouldSimulate(eventType, keyName) {
            var keyHasNativeKeyPress = hasKeyPressEvent(keyName);
            var currentCombination = this._keyEventStrategy.currentCombination;

            if (eventType === KeyEventType.keypress) {
              return !keyHasNativeKeyPress || (keyHasNativeKeyPress && currentCombination.isKeyStillPressed('Meta'));
            } else if (eventType === KeyEventType.keyup) {
              return keyupIsHiddenByCmd(keyName) && currentCombination.isKeyReleased('Meta');
            }

            return false;
          },
        },
      ]);

      return AbstractKeyEventSimulator;
    })();

  var FocusOnlyKeyEventSimulator =
    /*#__PURE__*/
    (function (_AbstractKeyEventSimu) {
      _inherits(FocusOnlyKeyEventSimulator, _AbstractKeyEventSimu);

      function FocusOnlyKeyEventSimulator() {
        _classCallCheck(this, FocusOnlyKeyEventSimulator);

        return _possibleConstructorReturn(this, _getPrototypeOf(FocusOnlyKeyEventSimulator).apply(this, arguments));
      }

      _createClass(FocusOnlyKeyEventSimulator, [
        {
          key: 'handleKeyPressSimulation',
          value: function handleKeyPressSimulation(options) {
            this._handleEventSimulation(
              'keypressEventsToSimulate',
              'simulatePendingKeyPressEvents',
              _objectSpread(
                {
                  eventType: KeyEventType.keypress,
                },
                options
              )
            );
          },
        },
        {
          key: 'handleKeyUpSimulation',
          value: function handleKeyUpSimulation(options) {
            this._handleEventSimulation(
              'keyupEventsToSimulate',
              'simulatePendingKeyUpEvents',
              _objectSpread(
                {
                  eventType: KeyEventType.keyup,
                },
                options
              )
            );
          },
        },
        {
          key: '_handleEventSimulation',
          value: function _handleEventSimulation(listName, handlerName, _ref) {
            var event = _ref.event,
              eventType = _ref.eventType,
              key = _ref.key,
              focusTreeId = _ref.focusTreeId,
              componentId = _ref.componentId,
              options = _ref.options;

            if (this._shouldSimulate(eventType, key) && Configuration.option('simulateMissingKeyPressEvents')) {
              /**
               * If a key does not have a keypress event, we save the details of the keydown
               * event to simulate the keypress event, as the keydown event bubbles through
               * the last focus-only HotKeysComponent
               */
              var _event = this.cloneAndMergeEvent(event, {
                key: key,
                simulated: true,
              });

              this[listName].push({
                event: _event,
                focusTreeId: focusTreeId,
                componentId: componentId,
                options: options,
              });
            }

            if (this._keyEventStrategy.componentList.isRoot(componentId) || this._keyEventStrategy.eventPropagator.isStopped()) {
              if (this._shouldSimulateEventsImmediately()) {
                this._keyEventStrategy[handlerName]();
              }
              /**
               * else, we wait for keydown event to propagate through global strategy
               * before we simulate the keypress
               */
            }
          },
        },
        {
          key: 'simulatePendingKeyPressEvents',
          value: function simulatePendingKeyPressEvents() {
            this._simulatePendingKeyEvents('keypressEventsToSimulate', 'handleKeyPress');
          },
        },
        {
          key: 'simulatePendingKeyUpEvents',
          value: function simulatePendingKeyUpEvents() {
            this._simulatePendingKeyEvents('keyupEventsToSimulate', 'handleKeyUp');
          },
        },
        {
          key: '_simulatePendingKeyEvents',
          value: function _simulatePendingKeyEvents(listName, handlerName) {
            var _this = this;

            if (this[listName].length > 0) {
              KeyEventCounter.incrementId();
            }

            this[listName].forEach(function (_ref2) {
              var event = _ref2.event,
                focusTreeId = _ref2.focusTreeId,
                componentId = _ref2.componentId,
                options = _ref2.options;

              _this._keyEventStrategy[handlerName](event, focusTreeId, componentId, options);
            });
            this[listName] = [];
          },
        },
        {
          key: '_shouldSimulateEventsImmediately',
          value: function _shouldSimulateEventsImmediately() {
            return this._keyEventStrategy.shouldSimulateEventsImmediately();
          },
        },
      ]);

      return FocusOnlyKeyEventSimulator;
    })(AbstractKeyEventSimulator);

  var FocusTree =
    /*#__PURE__*/
    (function () {
      function FocusTree() {
        _classCallCheck(this, FocusTree);

        this.id = 0;
      }

      _createClass(FocusTree, [
        {
          key: 'isNewerThan',
          value: function isNewerThan(id) {
            return this.id !== id;
          },
        },
        {
          key: 'new',
          value: function _new() {
            this.id += 1;
          },
        },
      ]);

      return FocusTree;
    })();

  var EventStrategyLogger =
    /*#__PURE__*/
    (function (_Logger) {
      _inherits(EventStrategyLogger, _Logger);

      function EventStrategyLogger(logLevel, eventStrategy) {
        var _this;

        _classCallCheck(this, EventStrategyLogger);

        _this = _possibleConstructorReturn(this, _getPrototypeOf(EventStrategyLogger).call(this, logLevel));
        _this._eventStrategy = eventStrategy;
        return _this;
      }

      _createClass(EventStrategyLogger, [
        {
          key: 'nonKeyEventPrefix',
          value: function nonKeyEventPrefix(componentId) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            return this.keyEventPrefix(
              componentId,
              _objectSpread({}, options, {
                eventId: false,
              })
            );
          },
        },
        {
          key: 'logComponentOptions',
          value: function logComponentOptions(componentId, componentOptions) {
            this.verbose(this.nonKeyEventPrefix(componentId), 'New component options:\n', printComponent(componentOptions));
          },
        },
        {
          key: 'logKeyHistory',
          value: function logKeyHistory(keyHistory, componentId) {
            this.verbose(this.keyEventPrefix(componentId), 'Key history: '.concat(printComponent(keyHistory.toJSON()), '.'));
          },
        },
      ]);

      return EventStrategyLogger;
    })(Logger);

  var FocusOnlyLogger =
    /*#__PURE__*/
    (function (_EventStrategyLogger) {
      _inherits(FocusOnlyLogger, _EventStrategyLogger);

      function FocusOnlyLogger() {
        _classCallCheck(this, FocusOnlyLogger);

        return _possibleConstructorReturn(this, _getPrototypeOf(FocusOnlyLogger).apply(this, arguments));
      }

      _createClass(FocusOnlyLogger, [
        {
          key: 'keyEventPrefix',
          value: function keyEventPrefix(componentId) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var logIcons = _get(_getPrototypeOf(FocusOnlyLogger.prototype), 'constructor', this).logIcons;

            var eventIcons = _get(_getPrototypeOf(FocusOnlyLogger.prototype), 'constructor', this).eventIcons;

            var componentIcons = _get(_getPrototypeOf(FocusOnlyLogger.prototype), 'constructor', this).componentIcons;

            var base = 'HotKeys (';

            if (options.focusTreeId !== false) {
              var focusTreeId = isUndefined(options.focusTreeId) ? this._eventStrategy.focusTreeId : options.focusTreeId;
              base += 'F'.concat(focusTreeId).concat(logIcons[focusTreeId % logIcons.length], '-');
            }

            base += 'C'.concat(componentId).concat(componentIcons[componentId % componentIcons.length]);

            var position = this._eventStrategy.componentList.getPositionById(componentId);

            if (!isUndefined(position)) {
              base += '-P'.concat(position).concat(componentIcons[position % componentIcons.length]);
            }

            if (options.eventId !== false) {
              var eventId = isUndefined(options.eventId) ? KeyEventCounter.id : options.eventId;
              base += '-E'.concat(eventId).concat(eventIcons[eventId % eventIcons.length]);
            }

            return ''.concat(base, '):');
          },
        },
        {
          key: 'logIgnoredKeyEvent',
          value: function logIgnoredKeyEvent(event, key, eventType, reason, componentId) {
            this.logIgnoredEvent(describeKeyEvent(event, key, eventType), reason, componentId);
          },
        },
        {
          key: 'logIgnoredEvent',
          value: function logIgnoredEvent(eventDescription, reason, componentId) {
            this.debug(this.keyEventPrefix(componentId), 'Ignored '.concat(eventDescription, ' because ').concat(reason, '.'));
          },
        },
        {
          key: 'logAlreadySimulatedEvent',
          value: function logAlreadySimulatedEvent(event, key, eventType, componentId) {
            this.logIgnoredKeyEvent(event, key, eventType, 'it was not expected, and has already been simulated', componentId);
          },
        },
      ]);

      return FocusOnlyLogger;
    })(EventStrategyLogger);

  /**
   * Defines behaviour for dealing with key maps defined in focus-only HotKey components
   * @class
   */

  var FocusOnlyKeyEventStrategy =
    /*#__PURE__*/
    (function (_AbstractKeyEventStra) {
      _inherits(FocusOnlyKeyEventStrategy, _AbstractKeyEventStra);

      /********************************************************************************
       * Init & Reset
       ********************************************************************************/
      function FocusOnlyKeyEventStrategy() {
        var _this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var keyEventManager = arguments.length > 1 ? arguments[1] : undefined;

        _classCallCheck(this, FocusOnlyKeyEventStrategy);

        /******************************************************************************
         * Set state that DOES get cleared on each new focus tree
         ******************************************************************************/
        _this = _possibleConstructorReturn(this, _getPrototypeOf(FocusOnlyKeyEventStrategy).call(this, options, keyEventManager));
        _this.logger = new FocusOnlyLogger(options.logLevel || 'warn', _assertThisInitialized(_assertThisInitialized(_this)));
        _this.eventPropagator.logger = _this.logger;
        /*****************************************************************************
         * State that doesn't get cleared on each new focus tree
         *****************************************************************************/

        /**
         * Unique identifier given to each focus tree - when the focus in the browser
         * changes, and a different tree of elements are focused, a new id is allocated
         * @typedef {number} FocusTreeId
         */

        /**
         * Counter to keep track of what focus tree ID should be allocated next
         * @type {FocusTreeId}
         */

        _this.focusTree = new FocusTree();
        _this._simulator = new FocusOnlyKeyEventSimulator(_assertThisInitialized(_assertThisInitialized(_this)));
        return _this;
      }
      /**
       * Clears the internal state, wiping any history of key events and registered handlers
       * so they have no effect on the next tree of focused HotKeys components
       * @private
       */

      _createClass(FocusOnlyKeyEventStrategy, [
        {
          key: '_reset',
          value: function _reset() {
            _get(_getPrototypeOf(FocusOnlyKeyEventStrategy.prototype), '_reset', this).call(this);

            if (this._simulator) {
              this._simulator.clear();
            }
            /**
             * Increase the unique ID associated with each unique focus tree
             * @type {number}
             */

            if (this.focusTree) {
              this.focusTree.new();
            }

            this.eventPropagator = new EventPropagator(this.componentList);
            this.eventPropagator.logger = this.logger;
          },
          /********************************************************************************
           * Registering key maps and handlers
           ********************************************************************************/

          /**
           * Registers the actions and handlers of a HotKeys component that has gained focus
           * @param {ComponentId} componentId - Id of the component that the keyMap belongs to
           * @param {KeyMap} actionNameToKeyMap - Map of actions to key expressions
           * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handler functions
           * @param {Object} options Hash of options that configure how the actions
           *        and handlers are associated and called.
           * @returns {FocusTreeId|undefined} The current focus tree's ID or undefined if the
           *        the <tt>componentId</tt> has already been registered (shouldn't normally
           *        occur).
           */
        },
        {
          key: 'enableHotKeys',
          value: function enableHotKeys(componentId) {
            var actionNameToKeyMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var actionNameToHandlersMap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var options = arguments.length > 3 ? arguments[3] : undefined;

            if (this.resetOnNextFocus) {
              /**
               * We know components have just lost focus or keymaps have already been built,
               * meaning we are either anticipating a new set of components to be focused or
               * we are receiving notice of a component being focused when we aren't expecting it.
               * In either case, the internal state needs to be reset.
               */
              this._reset();

              this.resetOnNextFocus = false;
            }

            if (this.componentList.containsId(componentId)) {
              /**
               * The <tt>componentId</tt> has already been registered - this occurs when the
               * same component has somehow managed to be focused twice, without being blurred
               * in between.
               *
               * @see https://github.com/greena13/react-hotkeys/issues/173
               */
              return;
            }

            this._addComponent(componentId, actionNameToKeyMap, actionNameToHandlersMap, 'Focused', options);

            return this.focusTree.id;
          },
          /**
           * Handles when a HotKeys component that is in focus updates its props and changes
           * either the keyMap or handlers prop value
           * @param {FocusTreeId} focusTreeId - The ID of the focus tree the component is part of.
           *        Used to identify (and ignore) stale updates.
           * @param {ComponentId} componentId - The component index of the component to
           *        update
           * @param {KeyMap} keyMap - Map of key sequences to action names
           * @param {HandlersMap} handlersMap - Map of action names to handler
           *        functions
           * @param {Object} options Hash of options that configure how the actions
           *        and handlers are associated and called.
           */
        },
        {
          key: 'updateEnabledHotKeys',
          value: function updateEnabledHotKeys(focusTreeId, componentId) {
            var keyMap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var handlersMap = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
            var options = arguments.length > 4 ? arguments[4] : undefined;

            if (this.focusTree.isNewerThan(focusTreeId) || !this.componentList.containsId(componentId)) {
              return;
            }

            this._updateComponent(componentId, keyMap, handlersMap, options);
          },
          /**
           * Handles when a component loses focus by resetting the internal state, ready to
           * receive the next tree of focused HotKeys components
           * @param {FocusTreeId} focusTreeId - Id of focus tree component thinks it's
           *        apart of
           * @param {ComponentId} componentId - Index of component that is blurring
           * @returns {boolean} Whether the component still has event propagation yet to handle
           */
        },
        {
          key: 'disableHotKeys',
          value: function disableHotKeys(focusTreeId, componentId) {
            this.resetOnNextFocus = true;
            var outstandingEventPropagation = this.eventPropagator.isPendingPropagation();
            return outstandingEventPropagation;
          },
          /********************************************************************************
           * Recording key events
           ********************************************************************************/

          /**
           * @typedef {KeyboardEvent} SyntheticKeyboardEvent
           * @property {KeyboardEvent} nativeEvent The native event the SyntheticEvent is wrapping
           * @property {function} persist
           */

          /**
           * Records a keydown keyboard event and matches it against the list of pre-registered
           * event handlers, calling the first matching handler with the highest priority if
           * one exists.
           *
           * This method is called many times as a keyboard event bubbles up through the React
           * render tree. The event is only registered the first time it is seen and results
           * of some calculations are cached. The event is matched against the handlers registered
           * at each component level, to ensure the proper handler declaration scoping.
           * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
           * @param {FocusTreeId} focusTreeId - Id of focus tree component thinks it's apart of
           * @param {ComponentId} componentId - The id of the component that is currently handling
           *        the keyboard event as it bubbles towards the document root.
           * @param {Object} options - Hash of options that configure how the event is handled.
           * @returns {boolean} Whether the event was discarded because it was part of an old focus tree
           */
        },
        {
          key: 'handleKeyDown',
          value: function handleKeyDown(event, focusTreeId, componentId) {
            var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
            var key = getKeyName(event);

            if (this.focusTree.isNewerThan(focusTreeId)) {
              this.logger.logIgnoredKeyEvent(event, key, KeyEventType.keydown, 'it had an old focus tree id: '.concat(focusTreeId), componentId);
              this.eventPropagator.ignoreEvent(event);
              return true;
            } else if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keydown, componentId)) {
              return false;
            }

            if (this.eventPropagator.startNewPropagationStep(componentId, event, key, KeyEventType.keydown)) {
              var responseAction = this._howToHandleKeyEvent(event, focusTreeId, componentId, key, options, KeyEventType.keydown);

              if (responseAction === EventResponse.handled) {
                this._recordKeyDown(event, key, componentId);

                this._callHandlerIfActionNotHandled(event, key, KeyEventType.keydown, componentId, focusTreeId);
              }

              this._simulator.handleKeyPressSimulation({
                event: event,
                key: key,
                focusTreeId: focusTreeId,
                componentId: componentId,
                options: options,
              });

              this.eventPropagator.finishPropagationStep();
            }

            return false;
          },
        },
        {
          key: '_howToHandleKeyEvent',
          value: function _howToHandleKeyEvent(event, focusTreeId, componentId, key, options, keyEventType) {
            if (this.eventPropagator.isFirstPropagationStep()) {
              if (options.ignoreEventsCondition(event) && this.eventPropagator.ignoreEvent(event)) {
                return this._eventIsToBeIgnored(event, componentId, key, keyEventType);
              }
              this.currentCombination.resolveModifierFlagDiscrepancies(event, key, keyEventType);
            } else if (this.eventPropagator.isIgnoringEvent()) {
              return this._eventIsToBeIgnored(event, componentId, key, keyEventType);
            }

            return EventResponse.handled;
          },
        },
        {
          key: '_eventIsToBeIgnored',
          value: function _eventIsToBeIgnored(event, componentId, key, keyEventType) {
            this.logger.logIgnoredKeyEvent(event, key, keyEventType, 'ignoreEventsFilter rejected it', componentId);
            return EventResponse.ignored;
          },
          /**
           * Records a keypress keyboard event and matches it against the list of pre-registered
           * event handlers, calling the first matching handler with the highest priority if
           * one exists.
           *
           * This method is called many times as a keyboard event bubbles up through the React
           * render tree. The event is only registered the first time it is seen and results
           * of some calculations are cached. The event is matched against the handlers registered
           * at each component level, to ensure the proper handler declaration scoping.
           * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
           * @param {FocusTreeId} focusTreeId Id - of focus tree component thinks it's apart of
           * @param {ComponentId} componentId - The index of the component that is currently handling
           *        the keyboard event as it bubbles towards the document root.
           * @param {Object} options - Hash of options that configure how the event
           *        is handled.
           * @returns {boolean} Whether the HotKeys component should discard its current focus
           *        tree Id, because it belongs to an old focus tree.
           */
        },
        {
          key: 'handleKeyPress',
          value: function handleKeyPress(event, focusTreeId, componentId, options) {
            var key = getKeyName(event);

            if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keypress, componentId)) {
              return false;
            } else if (this.currentCombination.isKeyPressSimulated(key)) {
              this._ignoreAlreadySimulatedEvent(event, key, KeyEventType.keypress, componentId);

              return false;
            }

            var shouldDiscardFocusTreeId = this.focusTree.isNewerThan(focusTreeId);

            if (this.eventPropagator.startNewPropagationStep(componentId, event, key, KeyEventType.keypress)) {
              /**
               * We first decide if the keypress event should be handled (to ensure the correct
               * order of logging statements)
               */
              var responseAction = this._howToHandleKeyEvent(event, focusTreeId, componentId, key, options, KeyEventType.keypress);

              if (this.eventPropagator.isFirstPropagationStep(componentId) && this.currentCombination.isKeyIncluded(key)) {
                this._recordNewKeyInCombination(key, KeyEventType.keypress, stateFromEvent(event), componentId);
              }
              /**
               * We attempt to find a handler of the event, only if it has not already been
               * handled and should not be ignored
               */

              if (responseAction === EventResponse.handled) {
                this._callHandlerIfActionNotHandled(event, key, KeyEventType.keypress, componentId, focusTreeId);
              }

              this.eventPropagator.finishPropagationStep();
            }

            return shouldDiscardFocusTreeId;
          },
          /**
           * Records a keyup keyboard event and matches it against the list of pre-registered
           * event handlers, calling the first matching handler with the highest priority if
           * one exists.
           *
           * This method is called many times as a keyboard event bubbles up through the React
           * render tree. The event is only registered the first time it is seen and results
           * of some calculations are cached. The event is matched against the handlers registered
           * at each component level, to ensure the proper handler declaration scoping.
           * @param {SyntheticKeyboardEvent} event Event containing the key name and state
           * @param {FocusTreeId} focusTreeId Id of focus tree component thinks it's apart of
           * @param {ComponentId} componentId The index of the component that is currently handling
           *        the keyboard event as it bubbles towards the document root.
           * @param {Object} options Hash of options that configure how the event
           *        is handled.
           * @returns {boolean} Whether HotKeys component should discard its current focusTreeId
           *        because it's stale (part of an old focus tree)
           */
        },
        {
          key: 'handleKeyUp',
          value: function handleKeyUp(event, focusTreeId, componentId, options) {
            var key = getKeyName(event);

            if (this.currentCombination.isKeyUpSimulated(key)) {
              this._ignoreAlreadySimulatedEvent(event, key, KeyEventType.keyup, componentId);

              return false;
            }

            var shouldDiscardFocusId = this.focusTree.isNewerThan(focusTreeId);
            var propagator = this.eventPropagator;

            if (propagator.startNewPropagationStep(componentId, event, key, KeyEventType.keyup)) {
              /**
               * We first decide if the keyup event should be handled (to ensure the correct
               * order of logging statements)
               */
              var responseAction = this._howToHandleKeyEvent(event, focusTreeId, componentId, key, options, KeyEventType.keyup);
              /**
               * We then add the keyup to our current combination - regardless of whether
               * it's to be handled or not. We need to do this to ensure that if a handler
               * function changes focus to a context that ignored events, the keyup event
               * is not lost (leaving react hotkeys thinking the key is still pressed).
               */

              if (propagator.isFirstPropagationStep(componentId) && this.currentCombination.isKeyIncluded(key)) {
                this._recordNewKeyInCombination(key, KeyEventType.keyup, stateFromEvent(event), componentId);
              }
              /**
               * We attempt to find a handler of the event, only if it has not already been
               * handled and should not be ignored
               */

              if (responseAction === EventResponse.handled) {
                this._callHandlerIfActionNotHandled(event, key, KeyEventType.keyup, componentId, focusTreeId);
              }
              /**
               * We simulate any hidden keyup events hidden by the command key, regardless
               * of whether the event should be ignored or not
               */

              this._simulateKeyUpEventsHiddenByCmd(event, key, focusTreeId, componentId, options);

              propagator.finishPropagationStep();
            }

            return shouldDiscardFocusId;
          },
        },
        {
          key: '_ignoreAlreadySimulatedEvent',
          value: function _ignoreAlreadySimulatedEvent(event, key, eventType, componentId) {
            this.logger.logAlreadySimulatedEvent(event, key, eventType, componentId);
            this.eventPropagator.ignoreEvent(event);
          },
          /**
           * Closes any hanging key combinations that have not received the key event indicated
           * by recordIndex.
           * @param {KeyName} keyName The name of the key whose state should be updated if it
           *        is currently set to keydown or keypress.
           * @param {KeyEventType} recordIndex Index of key event to move the key state
           *        up to.
           */
        },
        {
          key: 'closeHangingKeyCombination',
          value: function closeHangingKeyCombination(keyName, recordIndex) {
            var currentCombination = this.currentCombination;

            if (currentCombination.isKeyIncluded(keyName) && !currentCombination.isEventTriggered(keyName, recordIndex)) {
              /**
               * If the key is in the current combination and recorded as still being pressed
               * down (as either keydown or keypress), then we update the state
               * to keypress or keyup (depending on the value of recordIndex).
               */
              currentCombination.setKeyState(keyName, recordIndex, KeyEventState.simulated);
            }
          },
        },
        {
          key: '_simulateKeyUpEventsHiddenByCmd',
          value: function _simulateKeyUpEventsHiddenByCmd(event, key, focusTreeId, componentId, options) {
            var _this2 = this;

            if (isCmdKey(key)) {
              var iterator = new KeyCombinationIterator(this.currentCombination);
              iterator.forEachKey(function (keyName) {
                if (isCmdKey(keyName)) {
                  return;
                }

                _this2._simulator.handleKeyUpSimulation({
                  event: event,
                  key: keyName,
                  focusTreeId: focusTreeId,
                  componentId: componentId,
                  options: options,
                });
              });
            }
          },
        },
        {
          key: 'stopEventPropagation',
          value: function stopEventPropagation(event, componentId) {
            if (this.eventPropagator.stop(event));
          },
          /********************************************************************************
           * Event simulation
           ********************************************************************************/
        },
        {
          key: 'simulatePendingKeyPressEvents',
          value: function simulatePendingKeyPressEvents() {
            this._simulator.simulatePendingKeyPressEvents();
          },
        },
        {
          key: 'simulatePendingKeyUpEvents',
          value: function simulatePendingKeyUpEvents() {
            this._simulator.simulatePendingKeyUpEvents();
          },
        },
        {
          key: 'shouldSimulateEventsImmediately',
          value: function shouldSimulateEventsImmediately() {
            return !this.keyEventManager.isGlobalListenersBound();
          },
          /********************************************************************************
           * Matching and calling handlers
           ********************************************************************************/

          /**
           * Calls the first handler that matches the current key event if the action has not
           * already been handled in a more deeply nested component
           * @param {SyntheticKeyboardEvent} event Keyboard event object to be passed to the handler
           * @param {NormalizedKeyName} keyName Normalized key name
           * @param {KeyEventType} keyEventType The record index of the current key event type
           * @param {FocusTreeId} focusTreeId Id of focus tree component thinks it's apart of
           * @param {ComponentId} componentId Index of the component that is currently handling
           *        the keyboard event
           * @private
           */
        },
        {
          key: '_callHandlerIfActionNotHandled',
          value: function _callHandlerIfActionNotHandled(event, keyName, keyEventType, componentId, focusTreeId) {
            var eventName = describeKeyEventType(keyEventType);

            var combinationName = this._describeCurrentCombination();

            if (!this.componentList.anyActionsForEventType(keyEventType)) {
              this.logger.logIgnoredEvent("'".concat(combinationName, "' ").concat(eventName), "it doesn't have any ".concat(eventName, ' handlers'), componentId);
              return;
            }

            if (this.eventPropagator.isHandled()) {
              this.logger.logIgnoredEvent("'".concat(combinationName, "' ").concat(eventName), 'it has already been handled', componentId);
            } else {
              var previousPosition = this.eventPropagator.previousPosition;
              var componentPosition = this.componentList.getPositionById(componentId);
              var handlerWasCalled = this.actionResolver.callClosestMatchingHandler(
                event,
                keyName,
                keyEventType,
                componentPosition,
                previousPosition === -1 ? 0 : previousPosition
              );

              if (handlerWasCalled) {
                this.eventPropagator.setHandled();
              }
            }
          },
        },
      ]);

      return FocusOnlyKeyEventStrategy;
    })(AbstractKeyEventStrategy);

  function findableCollectionContains(collection, item, options) {
    if (options.stringifyFirst) {
      return !isUndefined(
        collection.find(function (collectionItem) {
          return collectionItem.toString() === item.toString();
        })
      );
    } else {
      return collection.indexOf(item) !== -1;
    }
  }

  function nonCollectionContains(collection, item, options) {
    if (options.stringifyFirst) {
      return collection.toString() === item.toString();
    } else {
      return collection === item;
    }
  }
  /**
   * Whether a collection contains an item
   * @param {Object|Array} collection The collection query
   * @param {*} item The item to establish membership for
   * @param {Object} options Configuration options
   * @param {boolean} options.stringifyFirst Whether to stringify the elements of the
   *        collection before performing the equality check
   * @returns {boolean} true if the item is in the collection
   */

  function contains(collection, item) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (Array.isArray(collection) || isString(collection)) {
      return findableCollectionContains(collection, item, options);
    }

    if (isObject(collection)) {
      return hasKey(collection, item);
    }

    return nonCollectionContains(collection, item, options);
  }

  var GlobalKeyEventSimulator =
    /*#__PURE__*/
    (function (_AbstractKeyEventSimu) {
      _inherits(GlobalKeyEventSimulator, _AbstractKeyEventSimu);

      function GlobalKeyEventSimulator() {
        _classCallCheck(this, GlobalKeyEventSimulator);

        return _possibleConstructorReturn(this, _getPrototypeOf(GlobalKeyEventSimulator).apply(this, arguments));
      }

      _createClass(GlobalKeyEventSimulator, [
        {
          key: 'handleKeyPressSimulation',
          value: function handleKeyPressSimulation(options) {
            this._handleEventSimulation(
              'handleKeyPress',
              _objectSpread(
                {
                  eventType: KeyEventType.keypress,
                },
                options
              )
            );
          },
        },
        {
          key: 'handleKeyUpSimulation',
          value: function handleKeyUpSimulation(options) {
            this._handleEventSimulation(
              'handleKeyUp',
              _objectSpread(
                {
                  eventType: KeyEventType.keyup,
                },
                options
              )
            );
          },
        },
        {
          key: '_handleEventSimulation',
          value: function _handleEventSimulation(handlerName, _ref) {
            var event = _ref.event,
              eventType = _ref.eventType,
              key = _ref.key;

            if (this._shouldSimulate(eventType, key) && Configuration.option('simulateMissingKeyPressEvents')) {
              /**
               * If a key does not have a keypress event, we simulate one immediately after
               * the keydown event, to keep the behaviour consistent across all keys
               */
              var _event = this.cloneAndMergeEvent(event, {
                key: key,
                simulated: true,
              });

              this._keyEventStrategy[handlerName](_event);
            }
          },
        },
      ]);

      return GlobalKeyEventSimulator;
    })(AbstractKeyEventSimulator);

  function capitalize(string) {
    return string.replace(/\b\w/g, function (l) {
      return l.toUpperCase();
    });
  }

  function normalizeEventName(eventName) {
    return ''.concat(capitalize(eventName.slice(0, 3))).concat(capitalize(eventName.slice(3)));
  }

  var GlobalEventListenerAdaptor =
    /*#__PURE__*/
    (function () {
      function GlobalEventListenerAdaptor(strategy, _ref) {
        var logger = _ref.logger;

        _classCallCheck(this, GlobalEventListenerAdaptor);

        /**
         * Whether the global key event handlers have been bound to document yet or not
         * @type {boolean}
         */
        this._listenersBound = false;
        this.logger = logger;
        this._eventStrategy = strategy;
      }

      _createClass(GlobalEventListenerAdaptor, [
        {
          key: 'isListenersBound',
          value: function isListenersBound() {
            return this._listenersBound;
          },
        },
        {
          key: 'unbindListeners',
          value: function unbindListeners() {
            var _this = this;

            objectValues(KeyEventType).forEach(function (recordIndex) {
              var eventName = describeKeyEventType(recordIndex);
              delete document['on'.concat(eventName)];

              _this._logHandlerStateChange('Removed', eventName);
            });
            this._listenersBound = false;
          },
        },
        {
          key: 'bindListeners',
          value: function bindListeners() {
            var _this2 = this;

            objectValues(KeyEventType).forEach(function (recordIndex) {
              var eventName = describeKeyEventType(recordIndex);

              document['on'.concat(eventName)] = function (keyEvent) {
                _this2._eventStrategy['handle'.concat(normalizeEventName(eventName))](keyEvent);
              };

              _this2._logHandlerStateChange('Bound', eventName);
            });
            this._listenersBound = true;
          },
        },
        {
          key: '_logHandlerStateChange',
          value: function _logHandlerStateChange(action, eventName) {},
        },
      ]);

      return GlobalEventListenerAdaptor;
    })();

  var GlobalLogger =
    /*#__PURE__*/
    (function (_EventStrategyLogger) {
      _inherits(GlobalLogger, _EventStrategyLogger);

      function GlobalLogger() {
        _classCallCheck(this, GlobalLogger);

        return _possibleConstructorReturn(this, _getPrototypeOf(GlobalLogger).apply(this, arguments));
      }

      _createClass(GlobalLogger, [
        {
          key: 'keyEventPrefix',
          value: function keyEventPrefix(componentId) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var eventIcons = _get(_getPrototypeOf(GlobalLogger.prototype), 'constructor', this).eventIcons;

            var componentIcons = _get(_getPrototypeOf(GlobalLogger.prototype), 'constructor', this).componentIcons;

            var base = 'HotKeys (GLOBAL';

            if (!isUndefined(componentId)) {
              return ''
                .concat(base, '-C')
                .concat(componentId)
                .concat(componentIcons[componentId % componentIcons.length], '):');
            }

            if (options.eventId === false) {
              return ''.concat(base, '):');
            } else {
              var eventId = isUndefined(options.eventId) ? KeyEventCounter.id : options.eventId;
              return ''
                .concat(base, '-E')
                .concat(eventId)
                .concat(eventIcons[eventId % eventIcons.length], '):');
            }
          },
        },
        {
          key: 'logIgnoredKeyEvent',
          value: function logIgnoredKeyEvent(event, key, eventType, reason, componentId) {
            this.logIgnoredEvent(describeKeyEvent(event, key, eventType), reason, componentId);
          },
        },
        {
          key: 'logIgnoredEvent',
          value: function logIgnoredEvent(eventDescription, reason, componentId) {
            this.debug(this.keyEventPrefix(componentId), 'Ignored '.concat(eventDescription, ' because ').concat(reason, '.'));
          },
        },
        {
          key: 'logEventRejectedByFilter',
          value: function logEventRejectedByFilter(event, key, eventType, componentId) {
            this.logIgnoredKeyEvent(event, key, eventType, 'ignoreEventsFilter rejected it', componentId);
          },
        },
        {
          key: 'logEventAlreadySimulated',
          value: function logEventAlreadySimulated(event, key, eventType, componentId) {
            this.logIgnoredKeyEvent(event, key, eventType, 'it was not expected, and has already been simulated', componentId);
          },
        },
      ]);

      return GlobalLogger;
    })(EventStrategyLogger);

  /**
   * Defines behaviour for dealing with key maps defined in global HotKey components
   * @class
   */

  var GlobalKeyEventStrategy =
    /*#__PURE__*/
    (function (_AbstractKeyEventStra) {
      _inherits(GlobalKeyEventStrategy, _AbstractKeyEventStra);

      /********************************************************************************
       * Init & Reset
       ********************************************************************************/
      function GlobalKeyEventStrategy() {
        var _this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var keyEventManager = arguments.length > 1 ? arguments[1] : undefined;

        _classCallCheck(this, GlobalKeyEventStrategy);

        /**
         * Set state that gets cleared every time a component gets mounted or unmounted
         */
        _this = _possibleConstructorReturn(this, _getPrototypeOf(GlobalKeyEventStrategy).call(this, options, keyEventManager));
        _this.logger = new GlobalLogger(options.logLevel || 'warn', _assertThisInitialized(_assertThisInitialized(_this)));
        /**
         * Set state that doesn't get cleared each time a new new component is mounted
         * or unmounted
         * @type {number}
         */

        _this.eventOptions = {
          ignoreEventsCondition: Configuration.option('ignoreEventsCondition'),
        };
        /**
         * Dictionary of listener functions - currently only intended to house
         * keyCombinationListener
         */

        _this.listeners = new Registry();
        _this._simulator = new GlobalKeyEventSimulator(_assertThisInitialized(_assertThisInitialized(_this)));
        _this._listenerAdaptor = new GlobalEventListenerAdaptor(_assertThisInitialized(_assertThisInitialized(_this)), {
          logger: _this.logger,
        });
        return _this;
      }
      /********************************************************************************
       * Enabling key maps and handlers
       ********************************************************************************/

      /**
       * Registers the actions and handlers of a HotKeys component that has mounted
       * @param {ComponentId} componentId - Id of the component that the keyMap belongs to
       * @param {KeyMap} actionNameToKeyMap - Map of actions to key expressions
       * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handler functions
       * @param {Object} options Hash of options that configure how the actions
       *        and handlers are associated and called.
       * @param {Object} eventOptions - Options for how the event should be handled
       */

      _createClass(GlobalKeyEventStrategy, [
        {
          key: 'enableHotKeys',
          value: function enableHotKeys(componentId) {
            var actionNameToKeyMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var actionNameToHandlersMap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var options = arguments.length > 3 ? arguments[3] : undefined;
            var eventOptions = arguments.length > 4 ? arguments[4] : undefined;
            this.eventOptions = eventOptions;

            this._addComponent(componentId, actionNameToKeyMap, actionNameToHandlersMap, 'Mounted', options);
          },
          /**
           * Handles when a mounted global HotKeys component updates its props and changes
           * either the keyMap or handlers prop value
           * @param {ComponentId} componentId - The component index of the component to
           *        update
           * @param {KeyMap} keyMap - Map of actions to key expressions
           * @param {HandlersMap} handlersMap - Map of actions to handler functions
           * @param {Object} options Hash of options that configure how the actions
           *        and handlers are associated and called.
           * @param {Object} eventOptions - Options for how the event should be handled
           */
        },
        {
          key: 'updateEnabledHotKeys',
          value: function updateEnabledHotKeys(componentId) {
            var keyMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var handlersMap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var options = arguments.length > 3 ? arguments[3] : undefined;
            var eventOptions = arguments.length > 4 ? arguments[4] : undefined;
            this.eventOptions = eventOptions;

            this._updateComponent(componentId, keyMap, handlersMap, options);
          },
          /**
           * Handles when a component is unmounted
           * @param {ComponentId} componentId - Index of component that is being unmounted
           */
        },
        {
          key: 'disableHotKeys',
          value: function disableHotKeys(componentId) {
            /**
             * Manually update the registered key map state, usually reset using
             * _resetRegisteredKeyMapsState() method
             */
            this.componentList.remove(componentId);

            this._recalculate();
          },
        },
        {
          key: '_recalculate',
          value: function _recalculate() {
            _get(_getPrototypeOf(GlobalKeyEventStrategy.prototype), '_recalculate', this).call(this);

            this._updateDocumentHandlers();
          },
        },
        {
          key: '_updateDocumentHandlers',
          value: function _updateDocumentHandlers() {
            var listenersShouldBeBound = this._shouldListenersBeBound();

            var listenersAreBound = this.isListenersBound();

            if (!listenersAreBound && listenersShouldBeBound) {
              this._listenerAdaptor.bindListeners();
            } else if (listenersAreBound && !listenersShouldBeBound) {
              this._listenerAdaptor.unbindListeners();
            }
          },
        },
        {
          key: 'isListenersBound',
          value: function isListenersBound() {
            return this._listenerAdaptor.isListenersBound();
          },
          /**
           * Whether the document listeners should be bound, to record key events. Basically a check
           * to see if there are any global key maps, or whether the user is currently rebinding to
           * a new key combination.
           * @returns {boolean} True if the document listeners should be bound
           * @private
           */
        },
        {
          key: '_shouldListenersBeBound',
          value: function _shouldListenersBeBound() {
            return this.componentList.length !== 0 || this.listeners.get('keyCombination');
          },
          /********************************************************************************
           * Recording key events
           ********************************************************************************/

          /**
           * Records a keydown keyboard event and matches it against the list of pre-registered
           * event handlers, calling the first matching handler with the highest priority if
           * one exists.
           *
           * This method is called once when a keyboard event bubbles up to document, and checks
           * the keymaps for all of the mounted global HotKey components.
           * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
           */
        },
        {
          key: 'handleKeyDown',
          value: function handleKeyDown(event) {
            var key = getKeyName(event);

            if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keydown)) {
              return;
            }

            this.currentCombination.resolveModifierFlagDiscrepancies(event, key, KeyEventType.keydown);

            var reactAppResponse = this._howReactAppRespondedTo(event, key, KeyEventType.keydown);

            if (reactAppResponse === EventResponse.unseen && this.eventOptions.ignoreEventsCondition(event)) {
              this.logger.logEventRejectedByFilter(event, key, KeyEventType.keydown);
              return;
            }

            if (reactAppResponse !== EventResponse.ignored) {
              this._recordKeyDown(event, key);
            }

            this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keydown);

            this.keyEventManager.simulatePendingKeyPressEvents();

            this._simulator.handleKeyPressSimulation({
              event: event,
              key: key,
            });
          },
        },
        {
          key: '_howReactAppRespondedTo',
          value: function _howReactAppRespondedTo(event, key, keyEventType) {
            var reactAppHistoryWithEvent = this.keyEventManager.reactAppHistoryWithEvent(key, keyEventType);

            switch (reactAppHistoryWithEvent) {
              case EventResponse.handled:
                this.logger.logIgnoredKeyEvent(event, key, keyEventType, 'React app has already handled it');
                break;

              case EventResponse.ignored:
                this.logger.logIgnoredKeyEvent(event, key, keyEventType, 'React app has declared it should be ignored');
                break;

              case EventResponse.seen:
                break;

              default:
                KeyEventCounter.incrementId();
            }

            return reactAppHistoryWithEvent;
          },
          /**
           * Records a keypress keyboard event and matches it against the list of pre-registered
           * event handlers, calling the first matching handler with the highest priority if
           * one exists.
           *
           * This method is called once when a keyboard event bubbles up to document, and checks
           * the keymaps for all of the mounted global HotKey components.
           * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
           */
        },
        {
          key: 'handleKeyPress',
          value: function handleKeyPress(event) {
            var key = getKeyName(event);

            if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keypress)) {
              return;
            } else if (this.currentCombination.isKeyPressSimulated(key)) {
              this.logger.logEventAlreadySimulated(event, key, KeyEventType.keypress);
              return;
            }
            /**
             * We first decide if the keypress event should be handled (to ensure the correct
             * order of logging statements)
             */

            var reactAppResponse = this._howReactAppRespondedTo(event, key, KeyEventType.keypress);
            /**
             * Add new key event to key combination history
             */

            if (this.currentCombination.isKeyIncluded(key)) {
              this._recordNewKeyInCombination(key, KeyEventType.keypress, stateFromEvent(event));
            }

            if (reactAppResponse === EventResponse.unseen) {
              /**
               * If the key event has not been seen by the React application, we ensure that
               * it's not still waiting for it. This occurs when action handlers bound to keydown
               * move the focus outside of the react app before it can record the keypress or
               * keyup
               */
              this.keyEventManager.closeHangingKeyCombination(key, KeyEventType.keypress);

              if (this.eventOptions.ignoreEventsCondition(event)) {
                this.logger.logEventRejectedByFilter(event, key, KeyEventType.keypress);
                return;
              }
            }

            this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keypress);
          },
        },
        {
          key: '_callHandlerIfNeeded',
          value: function _callHandlerIfNeeded(reactAppResponse, event, key, eventType) {
            if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
              this._callHandlerIfExists(event, key, eventType);
            }
          },
          /**
           * Records a keyup keyboard event and matches it against the list of pre-registered
           * event handlers, calling the first matching handler with the highest priority if
           * one exists.
           *
           * This method is called once when a keyboard event bubbles up to document, and checks
           * the keymaps for all of the mounted global HotKey components.
           * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
           */
        },
        {
          key: 'handleKeyUp',
          value: function handleKeyUp(event) {
            var key = getKeyName(event);

            if (this.currentCombination.isKeyUpSimulated(key)) {
              this.logger.logEventAlreadySimulated(event, key, KeyEventType.keyup);
              return;
            }
            /**
             * We first decide if the keyup event should be handled (to ensure the correct
             * order of logging statements)
             */

            var reactAppResponse = this._howReactAppRespondedTo(event, key, KeyEventType.keyup);
            /**
             * We then add the keyup to our current combination - regardless of whether
             * it's to be handled or not. We need to do this to ensure that if a handler
             * function changes focus to a context that ignored events, the keyup event
             * is not lost (leaving react hotkeys thinking the key is still pressed).
             */

            if (this.currentCombination.isKeyIncluded(key)) {
              this._recordNewKeyInCombination(key, KeyEventType.keyup, stateFromEvent(event));
            }

            if (reactAppResponse === EventResponse.unseen) {
              /**
               * If the key event has not been seen by the React application, we ensure that
               * it's not still waiting for it. This occurs when action handlers bound to keydown
               * or keypress move the focus outside of the react app before it can record the keyup
               */
              this.keyEventManager.closeHangingKeyCombination(key, KeyEventType.keyup);

              if (this.eventOptions.ignoreEventsCondition(event)) {
                this.logger.logIgnoredKeyEvent(event, key, KeyEventType.keyup, 'ignoreEventsFilter rejected it');
              } else {
                this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keyup);
              }
            } else {
              this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keyup);
            }
            /**
             * We simulate any hidden keyup events hidden by the command key, regardless
             * of whether the event should be ignored or not
             */

            this._simulateKeyUpEventsHiddenByCmd(event, key);

            this._callKeyCombinationCallbackIfDefined();
          },
        },
        {
          key: '_simulateKeyUpEventsHiddenByCmd',
          value: function _simulateKeyUpEventsHiddenByCmd(event, key) {
            var _this2 = this;

            if (isCmdKey(key)) {
              /**
               * We simulate pending key events in the React app before we do it globally
               */
              this.keyEventManager.simulatePendingKeyUpEvents();
              var iterator = new KeyCombinationIterator(this.currentCombination);
              iterator.forEachKey(function (keyName) {
                if (isCmdKey(keyName)) {
                  return;
                }

                _this2._simulator.handleKeyUpSimulation({
                  event: event,
                  key: keyName,
                });
              });
            }
          },
        },
        {
          key: '_callKeyCombinationCallbackIfDefined',
          value: function _callKeyCombinationCallbackIfDefined() {
            if (this.listeners.get('keyCombination') && this.currentCombination.hasEnded()) {
              var keyCombinationDecorator = new KeyCombinationDecorator(this.currentCombination);
              this.listeners.get('keyCombination')({
                keys: keyCombinationDecorator.asKeyDictionary(),
                id: keyCombinationDecorator.describe(),
              });
            }
          },
          /********************************************************************************
           * Matching and calling handlers
           ********************************************************************************/
        },
        {
          key: '_callHandlerIfExists',
          value: function _callHandlerIfExists(event, keyName, keyEventType) {
            var eventName = describeKeyEventType(keyEventType);

            var combinationName = this._describeCurrentCombination();

            if (!this.componentList.anyActionsForEventType(keyEventType)) {
              /**
               * If there are no handlers registered for the particular key event type
               * (keydown, keypress, keyup) then skip trying to find a matching handler
               * for the current key combination
               */
              this.logger.logIgnoredEvent("'".concat(combinationName, "' ").concat(eventName), "it doesn't have any ".concat(eventName, ' handlers'));
              return;
            }
            /**
             * If there is at least one handler for the specified key event type (keydown,
             * keypress, keyup), then attempt to find a handler that matches the current
             * key combination
             */

            this._callClosestMatchingHandler(event, keyName, keyEventType);
          },
        },
        {
          key: '_callClosestMatchingHandler',
          value: function _callClosestMatchingHandler(event, keyName, keyEventType) {
            var componentListIterator = this.componentList.iterator;

            while (componentListIterator.next()) {
              var matchFound = this.actionResolver.callClosestMatchingHandler(event, keyName, keyEventType, componentListIterator.position, 0);

              if (matchFound) {
                return;
              }
            }
          },
        },
        {
          key: 'stopEventPropagation',
          value: function stopEventPropagation(event, componentId) {
            if (!event.simulated) {
              event.stopPropagation();
            }
          },
          /********************************************************************************
           * Recording key combination
           ********************************************************************************/

          /**
           * Add a new key combination listener function to be called the next time a key
           * combination completes (assuming the cancel function is not called).
           * @param {keyCombinationListener} callbackFunction Function to call with the next
           *        completed key combination
           * @returns {function} Function to call to cancel listening for the next key
           *        combination
           */
        },
        {
          key: 'addKeyCombinationListener',
          value: function addKeyCombinationListener(callbackFunction) {
            var _this3 = this;

            var cancel = function cancel() {
              _this3.listeners.remove('keyCombination');
            };

            this.listeners.set('keyCombination', function (keyCombination) {
              callbackFunction(keyCombination);
              cancel();
            });

            this._updateDocumentHandlers();

            return cancel;
          },
        },
      ]);

      return GlobalKeyEventStrategy;
    })(AbstractKeyEventStrategy);

  /**
   * Copies a list of attributes and their values from a source object to a target object.
   * The attributes are only copied if they exist on the source object.
   * @param {Object} source Object to copy the attributes from
   * @param {Object} target Object to copy the attributes to
   * @param {String[]} attributes List of attributes to copy
   * @returns {Object} The target object, now with the copied attributes
   */

  function copyAttributes(source, target, attributes) {
    attributes.forEach(function (attributeName) {
      if (hasKey(source, attributeName)) {
        target[attributeName] = source[attributeName];
      }
    });
    return target;
  }

  var SEQUENCE_ATTRIBUTES = ['sequence', 'action'];
  var KEYMAP_ATTRIBUTES = ['name', 'description', 'group'];

  function createSequenceFromConfig(keyMapConfig) {
    return arrayFrom(keyMapConfig).map(function (sequenceOrKeyMapOptions) {
      if (isObject(sequenceOrKeyMapOptions)) {
        /**
         * Support syntax:
         * [
         *   { sequence: 'a+b', action: 'keyup' },
         *   { sequence: 'c' }
         * ]
         */
        return copyAttributes(sequenceOrKeyMapOptions, {}, SEQUENCE_ATTRIBUTES);
      } else {
        /**
         * Support syntax:
         * 'a+b'
         */
        return {
          sequence: sequenceOrKeyMapOptions,
        };
      }
    });
  }

  function normalizeActionDefinition(keyMap, actionName, keyMapSummary) {
    var keyMapConfig = keyMap[actionName];
    keyMapSummary[actionName] = {};

    if (isObject(keyMapConfig)) {
      if (hasKey(keyMapConfig, 'sequences')) {
        /**
         * Support syntax:
         *  {
         *    sequences: [ {sequence: 'a+b', action: 'keyup' }],
         *    name: 'My keymap',
         *    description: 'Key to press for something special',
         *    group: 'Vanity'
         *  }
         */
        copyAttributes(keyMapConfig, keyMapSummary[actionName], KEYMAP_ATTRIBUTES);
        keyMapSummary[actionName].sequences = createSequenceFromConfig(keyMapConfig.sequences);
      } else {
        /**
         * Support syntax:
         * {
         *   sequence: 'a+b', action: 'keyup',
         *   name: 'My keymap',
         *   description: 'Key to press for something special',
         *   group: 'Vanity'
         * }
         */
        copyAttributes(keyMapConfig, keyMapSummary[actionName], KEYMAP_ATTRIBUTES);
        keyMapSummary[actionName].sequences = [copyAttributes(keyMapConfig, {}, SEQUENCE_ATTRIBUTES)];
      }
    } else {
      keyMapSummary[actionName].sequences = createSequenceFromConfig(keyMapConfig);
    }
  }

  var ApplicationKeyMapBuilder =
    /*#__PURE__*/
    (function () {
      function ApplicationKeyMapBuilder(componentTree) {
        _classCallCheck(this, ApplicationKeyMapBuilder);

        this._componentTree = componentTree;
      }

      _createClass(ApplicationKeyMapBuilder, [
        {
          key: 'build',
          value: function build() {
            if (!this._componentTree.hasRoot()) {
              return {};
            }

            return this._build([this._componentTree.rootId], {});
          },
        },
        {
          key: '_build',
          value: function _build(componentIds, keyMapSummary) {
            var _this = this;

            componentIds.forEach(function (componentId) {
              var _this$_componentTree$ = _this._componentTree.get(componentId),
                childIds = _this$_componentTree$.childIds,
                keyMap = _this$_componentTree$.keyMap;

              if (keyMap) {
                Object.keys(keyMap).forEach(function (actionName) {
                  normalizeActionDefinition(keyMap, actionName, keyMapSummary);
                });
              }

              _this._build(childIds, keyMapSummary);
            });
            return keyMapSummary;
          },
        },
      ]);

      return ApplicationKeyMapBuilder;
    })();

  /**
   * Provides a registry for keyboard sequences and events, and the handlers that should
   * be called when they are detected. Also contains the interface for processing and
   * matching keyboard events against its list of registered actions and handlers.
   * @class
   */

  var KeyEventManager =
    /*#__PURE__*/
    (function () {
      _createClass(KeyEventManager, null, [
        {
          key: 'getInstance',

          /**
           * Creates a new KeyEventManager instance if one does not already exist or returns the
           * instance that already exists.
           * @param {Object} configuration Configuration object
           * @param {Logger} configuration.logger Logger instance
           * @returns {KeyEventManager} The key event manager instance
           */
          value: function getInstance() {
            var configuration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            return lazyLoadAttribute(this, 'instance', function () {
              return new KeyEventManager(configuration);
            });
          },
        },
        {
          key: 'getFocusOnlyEventStrategy',
          value: function getFocusOnlyEventStrategy() {
            return this.getInstance().focusOnlyEventStrategy;
          },
        },
        {
          key: 'getGlobalEventStrategy',
          value: function getGlobalEventStrategy() {
            return this.getInstance().globalEventStrategy;
          },
          /**
           * Creates a new KeyEventManager instance. It is expected that only a single instance
           * will be used with a render tree.
           */
        },
      ]);

      function KeyEventManager() {
        var configuration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, KeyEventManager);

        var logLevel = Configuration.option('logLevel');
        this.logger = configuration.logger || new Logger(logLevel);
        this.focusOnlyEventStrategy = new FocusOnlyKeyEventStrategy(
          {
            configuration: configuration,
            logLevel: logLevel,
          },
          this
        );
        this.globalEventStrategy = new GlobalKeyEventStrategy(
          {
            configuration: configuration,
            logLevel: logLevel,
          },
          this
        );
        this.mountedComponentsCount = 0;
        this._blurHandler = this._clearKeyHistory.bind(this);
      }
      /********************************************************************************
       * Generating key maps
       ********************************************************************************/

      /**
       * Returns a mapping of all of the application's actions and the key sequences
       * needed to trigger them.
       *
       * @type {ApplicationKeyMap} The application's key map
       */

      _createClass(KeyEventManager, [
        {
          key: 'registerComponentMount',

          /********************************************************************************
           * Registering key maps
           ********************************************************************************/

          /**
           * Registers that a component has now mounted, and declares its parent HotKeys
           * component id so that actions may be properly resolved
           * @param {ComponentId} componentId - Id of the component that has mounted
           * @param {ComponentId} parentId - Id of the parent HotKeys component
           */
          value: function registerComponentMount(componentId, parentId) {
            this._incrementComponentCount();

            return this.focusOnlyEventStrategy.registerComponentMount(componentId, parentId);
          },
        },
        {
          key: 'registerComponentUnmount',
          value: function registerComponentUnmount() {
            this._decrementComponentCount();
          },
        },
        {
          key: '_incrementComponentCount',
          value: function _incrementComponentCount() {
            var preMountedComponentCount = this.mountedComponentsCount;
            this.mountedComponentsCount += 1;

            if (preMountedComponentCount === 0 && this.mountedComponentsCount === 1) {
              window.addEventListener('blur', this._blurHandler);
            }
          },
        },
        {
          key: '_decrementComponentCount',
          value: function _decrementComponentCount() {
            var preMountedComponentCount = this.mountedComponentsCount;
            this.mountedComponentsCount -= 1;

            if (preMountedComponentCount === 1 && this.mountedComponentsCount === 0) {
              window.removeEventListener('blur', this._blurHandler);
            }
          },
        },
        {
          key: '_clearKeyHistory',
          value: function _clearKeyHistory() {
            this.focusOnlyEventStrategy.resetKeyHistory({
              force: true,
            });
            this.globalEventStrategy.resetKeyHistory({
              force: true,
            });
          },
        },
        {
          key: 'registerGlobalComponentUnmount',
          value: function registerGlobalComponentUnmount() {
            this._decrementComponentCount();
          },
          /**
           * Registers that a component has now mounted, and declares its parent GlobalHotKeys
           * component id so that actions may be properly resolved
           * @param {ComponentId} componentId - Id of the component that has mounted
           * @param {ComponentId} parentId - Id of the parent GlobalHotKeys component
           */
        },
        {
          key: 'registerGlobalComponentMount',
          value: function registerGlobalComponentMount(componentId, parentId) {
            this._incrementComponentCount();

            return this.globalEventStrategy.registerComponentMount(componentId, parentId);
          },
          /********************************************************************************
           * Recording key combination
           ********************************************************************************/

          /**
           * Adds a listener function that will be called the next time a key combination completes
           * @param {keyCombinationListener} callbackFunction Listener function to be called
           * @returns {function} Function to call to cancel listening to the next key combination
           */
        },
        {
          key: 'addKeyCombinationListener',
          value: function addKeyCombinationListener(callbackFunction) {
            return this.globalEventStrategy.addKeyCombinationListener(callbackFunction);
          },
          /********************************************************************************
           * Global key events
           ********************************************************************************/

          /**
           * Ignores the next keyboard event immediately, rather than waiting for it to
           * match the ignoreEventsCondition
           * @param {SyntheticKeyboardEvent} event keyboard event to ignore
           * @see Configuration.ignoreEventsCondition
           */
        },
        {
          key: 'ignoreEvent',
          value: function ignoreEvent(event) {
            this.focusOnlyEventStrategy.eventPropagator.ignoreEvent(event);
          },
          /**
           * Forces the observation of the next keyboard event immediately, disregarding whether
           * the event matches the ignoreKeyEventsCondition
           * @param {SyntheticKeyboardEvent} event keyboard event to force the observation of
           * @see Configuration.ignoreEventsCondition
           */
        },
        {
          key: 'observeIgnoredEvents',
          value: function observeIgnoredEvents(event) {
            this.focusOnlyEventStrategy.eventPropagator.observeIgnoredEvents(event);
          },
          /**
           * Closes any hanging key combinations that have not received the key event indicated
           * by recordIndex.
           * @param {KeyName} keyName The name of the key whose state should be updated if it
           *        is currently set to keydown or keypress.
           * @param {KeyEventType} recordIndex Index of key event to move the key state
           *        up to.
           */
        },
        {
          key: 'closeHangingKeyCombination',
          value: function closeHangingKeyCombination(keyName, recordIndex) {
            this.focusOnlyEventStrategy.closeHangingKeyCombination(keyName, recordIndex);
          },
        },
        {
          key: 'reactAppHistoryWithEvent',
          value: function reactAppHistoryWithEvent(key, type) {
            var previousPropagation = this.focusOnlyEventStrategy.eventPropagator.previousPropagation;

            if (previousPropagation.isForKey(key) && previousPropagation.isForEventType(type)) {
              if (previousPropagation.isHandled()) {
                return EventResponse.handled;
              } else if (previousPropagation.isIgnoringEvent()) {
                return EventResponse.ignored;
              } else {
                return EventResponse.seen;
              }
            } else {
              return EventResponse.unseen;
            }
          },
        },
        {
          key: 'simulatePendingKeyPressEvents',
          value: function simulatePendingKeyPressEvents() {
            this.focusOnlyEventStrategy.simulatePendingKeyPressEvents();
          },
        },
        {
          key: 'simulatePendingKeyUpEvents',
          value: function simulatePendingKeyUpEvents() {
            this.focusOnlyEventStrategy.simulatePendingKeyUpEvents();
          },
        },
        {
          key: 'isGlobalListenersBound',
          value: function isGlobalListenersBound() {
            return this.globalEventStrategy.isListenersBound();
          },
        },
        {
          key: 'applicationKeyMap',
          get: function get() {
            return [this.globalEventStrategy, this.focusOnlyEventStrategy].reduce(function (memo, strategy) {
              var builder = new ApplicationKeyMapBuilder(strategy.componentTree);
              var keyMap = builder.build();
              return _objectSpread({}, memo, keyMap);
            }, {});
          },
        },
      ]);

      return KeyEventManager;
    })();

  function wrapPropInFunction(prop, func) {
    if (typeof prop === 'function') {
      return function (event) {
        prop(event);
        func(event);
      };
    } else {
      return func;
    }
  }

  function getComponentOptions() {
    return {
      defaultKeyEvent: Configuration.option('defaultKeyEvent'),
    };
  }

  function getEventOptions() {
    return {
      ignoreEventsCondition: Configuration.option('ignoreEventsCondition'),
    };
  }

  var FocusOnlyComponentManager =
    /*#__PURE__*/
    (function () {
      function FocusOnlyComponentManager(hotKeysOptions, _ref) {
        var keyMap = _ref.keyMap;

        _classCallCheck(this, FocusOnlyComponentManager);

        this._hotKeysOptions = hotKeysOptions;
        this.id = KeyEventManager.getFocusOnlyEventStrategy().registerKeyMap(keyMap);
        /**
         * We maintain a separate instance variable to contain context that will be
         * passed down to descendants of this component so we can have a consistent
         * reference to the same object, rather than instantiating a new one on each
         * render, causing unnecessary re-rendering of descendant components that
         * consume the context.
         *
         * @see https://reactjs.org/docs/context.html#caveats
         */

        this.childContext = {
          hotKeysParentId: this.id,
        };
        this._focusTreeIds = [];
      }

      _createClass(FocusOnlyComponentManager, [
        {
          key: 'getComponentProps',
          value: function getComponentProps(props) {
            var _this = this;

            var componentProps = {
              onFocus: wrapPropInFunction(props.onFocus, function () {
                return _this.enableHotKeys(props);
              }),
              onBlur: wrapPropInFunction(props.onBlur, function () {
                return _this.disableHotKeys(props);
              }),
              tabIndex: Configuration.option('defaultTabIndex'),
            };

            if (this._shouldBindKeyListeners(props)) {
              componentProps.onKeyDown = function (event) {
                return _this._delegateEventToManager(event, 'handleKeyDown');
              };

              componentProps.onKeyPress = function (event) {
                return _this._delegateEventToManager(event, 'handleKeyPress');
              };

              componentProps.onKeyUp = function (event) {
                return _this._delegateEventToManager(event, 'handleKeyUp');
              };
            }

            return componentProps;
          },
        },
        {
          key: '_shouldBindKeyListeners',
          value: function _shouldBindKeyListeners(props) {
            var keyMap = this._getKeyMap(props);

            return !isEmpty(keyMap) || props.root;
          },
          /************************************************************************************
           * Registering key maps
           ************************************************************************************/
        },
        {
          key: 'addHotKeys',
          value: function addHotKeys(parentId) {
            var keyEventManager = KeyEventManager.getInstance();
            keyEventManager.registerComponentMount(this.id, parentId);
          },
          /**
           * Handles when the component gains focus by calling onFocus prop, if defined, and
           * registering itself with the KeyEventManager
           * @private
           */
        },
        {
          key: 'enableHotKeys',
          value: function enableHotKeys(props) {
            if (props.onFocus) {
              props.onFocus.apply(props, arguments);
            }

            var focusTreeId = KeyEventManager.getFocusOnlyEventStrategy().enableHotKeys(this.id, this._getKeyMap(props), this._getHandlers(props), getComponentOptions());

            if (!isUndefined(focusTreeId)) {
              /**
               * focusTreeId should never normally be undefined, but this return state is
               * used to indicate that a component with the same componentId has already
               * registered as focused/enabled (again, a condition that should not normally
               * occur, but apparently can for as-yet unknown reasons).
               *
               * @see https://github.com/greena13/react-hotkeys/issues/173
               */
              this._focusTreeIdsPush(focusTreeId);
            }

            this._setFocused(true);
          },
        },
        {
          key: 'updateHotKeys',
          value: function updateHotKeys(props) {
            var keyEventManager = KeyEventManager.getFocusOnlyEventStrategy();
            keyEventManager.reregisterKeyMap(this.id, props.keyMap);

            if (this._componentIsFocused() && (props.allowChanges || !Configuration.option('ignoreKeymapAndHandlerChangesByDefault'))) {
              var keyMap = props.keyMap,
                handlers = props.handlers;
              keyEventManager.updateEnabledHotKeys(this.focusTreeId, this.id, keyMap, handlers, getComponentOptions());
            }
          },
          /**
           * Handles when the component loses focus by calling the onBlur prop, if defined
           * and removing itself from the KeyEventManager
           * @private
           */
        },
        {
          key: 'disableHotKeys',
          value: function disableHotKeys(props) {
            if (props.onBlur) {
              props.onBlur.apply(props, arguments);
            }

            var retainCurrentFocusTreeId = KeyEventManager.getFocusOnlyEventStrategy().disableHotKeys(this.focusTreeId, this.id);

            if (!retainCurrentFocusTreeId) {
              this._focusTreeIdsShift();
            }

            this._setFocused(false);
          },
        },
        {
          key: 'removeKeyMap',
          value: function removeKeyMap(props) {
            var keyEventManager = KeyEventManager.getFocusOnlyEventStrategy();
            keyEventManager.deregisterKeyMap(this.id);
            KeyEventManager.getInstance().registerComponentUnmount();
            this.disableHotKeys(props);
          },
          /************************************************************************************
           * Focus and focus tree management
           ************************************************************************************/
        },
        {
          key: '_componentIsFocused',
          value: function _componentIsFocused() {
            return this._focused === true;
          },
        },
        {
          key: '_focusTreeIdsPush',
          value: function _focusTreeIdsPush(componentId) {
            this._focusTreeIds.push(componentId);
          },
        },
        {
          key: '_focusTreeIdsShift',
          value: function _focusTreeIdsShift() {
            this._focusTreeIds.shift();
          },
        },
        {
          key: '_setFocused',
          value: function _setFocused(focused) {
            this._focused = focused;
          },
        },
        {
          key: '_delegateEventToManager',
          value: function _delegateEventToManager(event, methodName) {
            var discardFocusTreeId = KeyEventManager.getFocusOnlyEventStrategy()[methodName](event, this.focusTreeId, this.id, getEventOptions());

            if (discardFocusTreeId) {
              this._focusTreeIdsShift();
            }
          },
        },
        {
          key: '_mergeWithOptions',
          value: function _mergeWithOptions(key, props) {
            return _objectSpread({}, this._hotKeysOptions[key] || {}, props[key] || {});
          },
        },
        {
          key: '_getHandlers',
          value: function _getHandlers(props) {
            return this._mergeWithOptions('handlers', props);
          },
        },
        {
          key: '_getKeyMap',
          value: function _getKeyMap(props) {
            return this._mergeWithOptions('keyMap', props);
          },
        },
        {
          key: 'focusTreeId',
          get: function get() {
            return this._focusTreeIds[0];
          },
        },
      ]);

      return FocusOnlyComponentManager;
    })();

  var propTypes = {
    /**
     * A unique key to associate with KeyEventMatchers that allows associating handler
     * functions at a later stage
     * @typedef {string} ActionName
     */

    /**
     * Name of a key event
     * @typedef {'keyup'|'keydown'|'keypress'} KeyEventName
     */

    /**
     * A string or list of strings, that represent a sequence of one or more keys
     * @typedef {String | Array.<String>} MouseTrapKeySequence
     * @see {@link https://craig.is/killing/mice} for support key sequences
     */

    /**
     * Options for the mapping of a key sequence and event
     * @typedef {Object} KeyEventOptions
     * @property {MouseTrapKeySequence} sequence - The key sequence required to satisfy a
     *           KeyEventDescription
     * @property {KeyEventName} action - The keyboard state required to satisfy a
     *           KeyEventDescription
     * @property {string} name - The name of the action, to be displayed to the end user
     * @property {string} description - A description of the action, to be displayed to
     *           the end user
     * @property {string} group - A group the action belongs to, to aid in showing similar
     *           actions to the user
     */

    /**
     * A description of key sequence of one or more key combinations
     * @typedef {MouseTrapKeySequence|KeyEventOptions|Array.<MouseTrapKeySequence>} KeyEventDescription
     */

    /**
     * A mapping from ActionName to KeyEventDescription
     * @typedef {Object.<ActionName, KeyEventDescription>} KeyMap
     */

    /**
     * A map from action names to Mousetrap or Browser key sequences
     * @type {KeyMap}
     */
    keyMap: PropTypes.object,

    /**
     * A map from action names to event handler functions
     * @typedef {Object.<ActionName, Function>} HandlersMap
     */

    /**
     * A map from action names to event handler functions
     * @type {HandlersMap}
     */
    handlers: PropTypes.object,

    /**
     * Function to call when this component gains focus in the browser
     * @type {function}
     */
    onFocus: PropTypes.func,

    /**
     * Function to call when this component loses focus in the browser
     * @type {function}
     */
    onBlur: PropTypes.func,

    /**
     * Whether the keyMap or handlers are permitted to change after the
     * component mounts. If false, changes to the keyMap and handlers
     * props will be ignored
     */
    allowChanges: PropTypes.bool,

    /**
     * Whether this is the root HotKeys node - this enables some special behaviour
     */
    root: PropTypes.bool,
  };

  function provideWithContext(HotKeysEnabled) {
    return backwardsCompatibleContext(HotKeysEnabled, {
      deprecatedAPI: {
        contextTypes: {
          hotKeysParentId: PropTypes.number,
        },
        childContextTypes: {
          hotKeysParentId: PropTypes.number,
        },
      },
      newAPI: {
        contextType: {
          hotKeysParentId: undefined,
        },
      },
    });
  }
  /**
   * Wraps a React component in a HotKeysEnabled component, which passes down the
   * callbacks and options necessary for React Hotkeys to work as a single prop value,
   * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
   * the wrapped component (e.g. div, span, input, etc) in order for the key events
   * to be recorded.
   *
   * @param {React.ComponentClass} Component - Component class to wrap
   * @param {Object} hotKeysOptions - Options that become the wrapping component's
   *                 default prop values
   * @returns {React.ComponentClass} Wrapped component that is passed all of the React hotkeys
   * props in a single value, hotkeys.
   */

  function componentFactory(Component) {
    var _class, _temp;

    var hotKeysOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    /**
     * Component that listens to key events when one of its children are in focus and
     * selectively triggers actions (that may be handled by handler functions) when a
     * sequence of events matches a list of pre-defined sequences or combinations
     * @class
     */
    return (
      (_temp = _class =
        /*#__PURE__*/
        (function (_PureComponent) {
          _inherits(HotKeysEnabled, _PureComponent);

          function HotKeysEnabled(props) {
            var _this;

            _classCallCheck(this, HotKeysEnabled);

            _this = _possibleConstructorReturn(this, _getPrototypeOf(HotKeysEnabled).call(this, props));
            _this.comRef = null;
            _this.isFocus = false;
            _this.eventForward = _this.eventForward.bind(_assertThisInitialized(_assertThisInitialized(_this)));

            if (props && props.getEventForward) {
              props.getEventForward(_this.eventForward);
            }

            _this._manager = new FocusOnlyComponentManager(hotKeysOptions, props);
            return _this;
          }

          _createClass(HotKeysEnabled, [
            {
              key: 'eventForward',
              value: function eventForward(event) {
                var _this2 = this;

                // 获取当前焦点元素
                var activeElement = document.activeElement;

                if (document.hasFocus()) {
                  if (activeElement && this.comRef) {
                    var inRange = event.path.some(function (node) {
                      return node === _this2.comRef;
                    });
                    if (inRange) return;
                    this.comRef.focus();
                    var altKey = event.altKey,
                      bubbles = event.bubbles,
                      cancelable = event.cancelable,
                      charCode = event.charCode,
                      ctrlKey = event.ctrlKey,
                      defaultPrevented = event.defaultPrevented,
                      detail = event.detail,
                      eventPhase = event.eventPhase,
                      isTrusted = event.isTrusted,
                      key = event.key,
                      keyCode = event.keyCode,
                      locale = event.locale,
                      location = event.location,
                      metaKey = event.metaKey,
                      repeat = event.repeat,
                      shiftKey = event.shiftKey,
                      timeStamp = event.timeStamp;
                    var customEvent = new KeyboardEvent('keydown', {
                      altKey: altKey,
                      bubbles: bubbles,
                      cancelable: cancelable,
                      charCode: charCode,
                      ctrlKey: ctrlKey,
                      defaultPrevented: defaultPrevented,
                      detail: detail,
                      eventPhase: eventPhase,
                      isTrusted: isTrusted,
                      key: key,
                      keyCode: keyCode,
                      locale: locale,
                      location: location,
                      metaKey: metaKey,
                      repeat: repeat,
                      shiftKey: shiftKey,
                      timeStamp: timeStamp,
                    });
                    this.comRef.dispatchEvent(customEvent);
                  }
                } else {
                  if (this.comRef && this.comRef.focus && this.comRef.dispatchEvent) {
                    this.comRef.focus();
                    var _altKey = event.altKey,
                      _bubbles = event.bubbles,
                      _cancelable = event.cancelable,
                      _charCode = event.charCode,
                      _ctrlKey = event.ctrlKey,
                      _defaultPrevented = event.defaultPrevented,
                      _detail = event.detail,
                      _eventPhase = event.eventPhase,
                      _isTrusted = event.isTrusted,
                      _key = event.key,
                      _keyCode = event.keyCode,
                      _locale = event.locale,
                      _location = event.location,
                      _metaKey = event.metaKey,
                      _repeat = event.repeat,
                      _shiftKey = event.shiftKey,
                      _timeStamp = event.timeStamp;

                    var _customEvent = new KeyboardEvent('keydown', {
                      altKey: _altKey,
                      bubbles: _bubbles,
                      cancelable: _cancelable,
                      charCode: _charCode,
                      ctrlKey: _ctrlKey,
                      defaultPrevented: _defaultPrevented,
                      detail: _detail,
                      eventPhase: _eventPhase,
                      isTrusted: _isTrusted,
                      key: _key,
                      keyCode: _keyCode,
                      locale: _locale,
                      location: _location,
                      metaKey: _metaKey,
                      repeat: _repeat,
                      shiftKey: _shiftKey,
                      timeStamp: _timeStamp,
                    });

                    this.comRef.dispatchEvent(_customEvent);
                  }
                }
              },
            },
            {
              key: 'componentDidMount',
              value: function componentDidMount() {
                this._manager.addHotKeys(this.context.hotKeysParentId);
              },
            },
            {
              key: 'componentDidUpdate',
              value: function componentDidUpdate() {
                this._manager.updateHotKeys(this.props);
              },
            },
            {
              key: 'componentWillUnmount',
              value: function componentWillUnmount() {
                this._manager.removeKeyMap(this.props);
              },
            },
            {
              key: 'render',
              value: function render() {
                var _this3 = this;

                var _this$props = this.props,
                  keyMap = _this$props.keyMap,
                  handlers = _this$props.handlers,
                  allowChanges = _this$props.allowChanges,
                  root = _this$props.root,
                  props = _objectWithoutProperties(_this$props, ['keyMap', 'handlers', 'allowChanges', 'root']);

                return React__default.createElement(
                  Component,
                  _extends(
                    {
                      hotKeys: this._manager.getComponentProps(this.props),
                    },
                    props,
                    {
                      innerRef: function innerRef(ref) {
                        _this3.comRef = ref; // if(ref){
                        //   ref.focus();
                        // }
                        // 兼容原来的props引用，防止内部覆盖

                        if (props.innerRef && typeof props.innerRef == 'function') {
                          props.innerRef(ref);
                        }

                        if (props.innerRef && _typeof(props.innerRef) == 'object') {
                          props.innerRef.current = ref;
                        }
                      },
                    }
                  )
                );
              },
            },
          ]);

          return HotKeysEnabled;
        })(React.PureComponent)),
      _defineProperty(_class, 'propTypes', propTypes),
      _temp
    );
  }

  function withHotKeys(Component) {
    var hotKeysOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return provideWithContext(componentFactory(Component, hotKeysOptions));
  }

  /**
   * @see HotKeysEnabled
   */

  var HotKeysWrapper =
    /*#__PURE__*/
    (function (_Component) {
      _inherits(HotKeysWrapper, _Component);

      function HotKeysWrapper() {
        _classCallCheck(this, HotKeysWrapper);

        return _possibleConstructorReturn(this, _getPrototypeOf(HotKeysWrapper).apply(this, arguments));
      }

      _createClass(HotKeysWrapper, [
        {
          key: 'render',
          value: function render() {
            var _this$props = this.props,
              hotKeys = _this$props.hotKeys,
              innerRef = _this$props.innerRef,
              component = _this$props.component,
              remainingProps = _objectWithoutProperties(_this$props, ['hotKeys', 'innerRef', 'component']);

            var DefaultComponent = component || Configuration.option('defaultComponent');
            return React__default.createElement(
              DefaultComponent,
              _objectSpread(
                {},
                hotKeys,
                {
                  ref: innerRef,
                },
                remainingProps
              )
            );
          },
        },
      ]);

      return HotKeysWrapper;
    })(React.Component);

  var HotKeys = withHotKeys(HotKeysWrapper);
  HotKeys.propTypes = {
    /**
     * A ref to add to the underlying DOM-mountable node
     */
    innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  };

  var GlobalComponentManager =
    /*#__PURE__*/
    (function () {
      _createClass(GlobalComponentManager, null, [
        {
          key: '_getComponentOptions',
          value: function _getComponentOptions() {
            return {
              defaultKeyEvent: Configuration.option('defaultKeyEvent'),
            };
          },
        },
        {
          key: '_getEventOptions',
          value: function _getEventOptions() {
            return {
              ignoreEventsCondition: Configuration.option('ignoreEventsCondition'),
            };
          },
        },
      ]);

      function GlobalComponentManager(keyMap) {
        _classCallCheck(this, GlobalComponentManager);

        this.id = KeyEventManager.getGlobalEventStrategy().registerKeyMap(keyMap);
        /**
         * We maintain a separate instance variable to contain context that will be
         * passed down to descendants of this component so we can have a consistent
         * reference to the same object, rather than instantiating a new one on each
         * render, causing unnecessary re-rendering of descendant components that
         * consume the context.
         *
         * @see https://reactjs.org/docs/context.html#caveats
         */

        this.childContext = {
          globalHotKeysParentId: this.id,
        };
      }

      _createClass(GlobalComponentManager, [
        {
          key: 'addHotKeys',
          value: function addHotKeys(props, context) {
            var keyMap = props.keyMap,
              handlers = props.handlers;
            var globalHotKeysParentId = context.globalHotKeysParentId;
            KeyEventManager.getInstance().registerGlobalComponentMount(this.id, globalHotKeysParentId);
            KeyEventManager.getGlobalEventStrategy().enableHotKeys(
              this.id,
              keyMap,
              handlers,
              GlobalComponentManager._getComponentOptions(),
              GlobalComponentManager._getEventOptions()
            );
          },
        },
        {
          key: 'updateHotKeys',
          value: function updateHotKeys(props) {
            var keyEventManager = KeyEventManager.getGlobalEventStrategy();
            keyEventManager.reregisterKeyMap(this.id, props.keyMap);

            if (props.allowChanges || !Configuration.option('ignoreKeymapAndHandlerChangesByDefault')) {
              var keyMap = props.keyMap,
                handlers = props.handlers;
              /**
               * Component defines global hotkeys, so any changes to props may have changes
               * that should have immediate effect
               */

              keyEventManager.updateEnabledHotKeys(this.id, keyMap, handlers, GlobalComponentManager._getComponentOptions(), GlobalComponentManager._getEventOptions());
            }
          },
        },
        {
          key: 'removeKeyMap',
          value: function removeKeyMap() {
            var keyEventManager = KeyEventManager.getGlobalEventStrategy();
            keyEventManager.deregisterKeyMap(this.id);
            keyEventManager.disableHotKeys(this.id);
            KeyEventManager.getInstance().registerGlobalComponentUnmount();
          },
        },
      ]);

      return GlobalComponentManager;
    })();

  var GlobalHotKeys =
    /*#__PURE__*/
    (function (_Component) {
      _inherits(GlobalHotKeys, _Component);

      function GlobalHotKeys(props) {
        var _this;

        _classCallCheck(this, GlobalHotKeys);

        _this = _possibleConstructorReturn(this, _getPrototypeOf(GlobalHotKeys).call(this, props));
        _this._manager = new GlobalComponentManager(props.keyMap);
        return _this;
      }

      _createClass(GlobalHotKeys, [
        {
          key: 'render',
          value: function render() {
            return this.props.children || null;
          },
        },
        {
          key: 'componentDidMount',
          value: function componentDidMount() {
            this._manager.addHotKeys(this.props, this.context);
          },
        },
        {
          key: 'componentDidUpdate',
          value: function componentDidUpdate() {
            this._manager.updateHotKeys(this.props);
          },
        },
        {
          key: 'componentWillUnmount',
          value: function componentWillUnmount() {
            this._manager.removeKeyMap();
          },
        },
      ]);

      return GlobalHotKeys;
    })(React.Component);

  _defineProperty(GlobalHotKeys, 'propTypes', {
    /**
     * A map from action names to Mousetrap or Browser key sequences
     * @type {KeyMap}
     */
    keyMap: PropTypes.object,

    /**
     * A map from action names to event handler functions
     * @typedef {Object.<ActionName, Function>} HandlersMap
     */

    /**
     * A map from action names to event handler functions
     * @type {HandlersMap}
     */
    handlers: PropTypes.object,

    /**
     * Whether the keyMap or handlers are permitted to change after the
     * component mounts. If false, changes to the keyMap and handlers
     * props will be ignored
     */
    allowChanges: PropTypes.bool,
  });

  var GlobalHotKeys$1 = backwardsCompatibleContext(GlobalHotKeys, {
    deprecatedAPI: {
      contextTypes: {
        globalHotKeysParentId: PropTypes.number,
      },
      childContextTypes: {
        globalHotKeysParentId: PropTypes.number,
      },
    },
    newAPI: {
      contextType: {
        globalHotKeysParentId: undefined,
      },
    },
  });

  var HotKeysIgnoreOverrideManager =
    /*#__PURE__*/
    (function () {
      function HotKeysIgnoreOverrideManager(eventManagerMethod) {
        _classCallCheck(this, HotKeysIgnoreOverrideManager);

        this._handleKeyEvent = this._handleKeyEvent.bind(this);
        this._eventManagerMethod = eventManagerMethod;
      }

      _createClass(HotKeysIgnoreOverrideManager, [
        {
          key: 'getComponentProps',
          value: function getComponentProps(accessor) {
            var _this = this;

            return {
              onKeyDown: this._handleKeyEvent,
              onKeyPress: this._handleKeyEvent,
              onKeyUp: this._handleKeyEvent,
              onFocus: function onFocus() {
                return _this._reloadDictionaries(accessor());
              },
            };
          },
        },
        {
          key: '_reloadDictionaries',
          value: function _reloadDictionaries(_ref) {
            var only = _ref.only,
              except = _ref.except;
            this._onlyDict = keyDictionary(only);
            this._exceptDict = keyDictionary(except);
          },
        },
        {
          key: '_handleKeyEvent',
          value: function _handleKeyEvent(event) {
            if (this._shouldIgnoreEvent(event)) {
              KeyEventManager.getInstance()[this._eventManagerMethod](event);
            }
          },
        },
        {
          key: '_shouldIgnoreEvent',
          value: function _shouldIgnoreEvent(_ref2) {
            var key = _ref2.key;

            if (isEmpty(this._onlyDict)) {
              if (isEmpty(this._exceptDict)) {
                return true;
              }

              return !hasKey(this._exceptDict, key);
            }

            if (isEmpty(this._exceptDict)) {
              return hasKey(this._onlyDict, key);
            }

            return hasKey(this._onlyDict, key) && !hasKey(this._exceptDict, key);
          },
        },
      ]);

      return HotKeysIgnoreOverrideManager;
    })();

  function keyDictionary(list) {
    return arrayFrom(list).reduce(function (memo, keyName) {
      var finalKeyName = standardizeKeyName(keyName);

      if (!isValidKey(finalKeyName)) {
        throw new InvalidKeyNameError(keyName);
      }

      dictionaryFrom(
        [resolveAltShiftedAlias, resolveUnaltShiftedAlias, resolveShiftedAlias, resolveUnshiftedAlias, resolveAltedAlias, resolveUnaltedAlias],
        true,
        function (func) {
          return func(finalKeyName);
        },
        memo
      );
      return memo;
    }, {});
  }

  var propTypes$1 = {
    /**
     * The whitelist of keys that keyevents should be ignored. i.e. if you place
     * a key in this list, all events related to it will be ignored by react hotkeys
     */
    only: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),

    /**
     * The blacklist of keys that keyevents should be not ignored. i.e. if you place
     * a key in this list, all events related to it will be still be observed by react
     * hotkeys
     */
    except: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  };
  /**
   * Wraps a React component in a HotKeysIgnoreOverride component, which passes down the
   * callbacks and options necessary for React Hotkeys to work as a single prop value,
   * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
   * the wrapped component (e.g. div, span, input, etc) in order for the key events
   * to be recorded.
   *
   * @param {React.ComponentClass} Component - Component class to wrap
   * @param {Object} hotKeysIgnoreOptions - Options that become the wrapping component's
   *                 default prop values
   * @param {string} eventManagerMethod - Name of EventManager method to use to handle a
   *        key event
   * @returns {React.ComponentClass} Wrapped component that is passed all of the React
   * hotkeys props in a single value, hotkeys.
   */

  function withHotKeysIgnoreOverride(Component) {
    var _class, _temp;

    var hotKeysIgnoreOptions =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : {
            only: [],
            except: [],
          };
    var eventManagerMethod = arguments.length > 2 ? arguments[2] : undefined;

    /**
     * A component that causes React Hotkeys to ignore the results of
     * Configuration.ignoreEventCondition and instead either force the event to be
     * ignored or observed. By default, this is all key events, but you can use
     * the only prop to provide a whitelist, or the except prop to pass a blacklist.
     * @class
     */
    return (
      (_temp = _class =
        /*#__PURE__*/
        (function (_PureComponent) {
          _inherits(HotKeysIgnoreOverride, _PureComponent);

          function HotKeysIgnoreOverride(props) {
            var _this;

            _classCallCheck(this, HotKeysIgnoreOverride);

            _this = _possibleConstructorReturn(this, _getPrototypeOf(HotKeysIgnoreOverride).call(this, props));
            _this._manager = new HotKeysIgnoreOverrideManager(eventManagerMethod);
            return _this;
          }

          _createClass(HotKeysIgnoreOverride, [
            {
              key: 'render',
              value: function render() {
                var _this2 = this;

                var _this$props = this.props,
                  only = _this$props.only,
                  except = _this$props.except,
                  props = _objectWithoutProperties(_this$props, ['only', 'except']);

                return React__default.createElement(
                  Component,
                  _extends(
                    {
                      hotKeys: this._manager.getComponentProps(function () {
                        return _this2.props;
                      }),
                    },
                    props
                  )
                );
              },
            },
          ]);

          return HotKeysIgnoreOverride;
        })(React.PureComponent)),
      _defineProperty(_class, 'propTypes', propTypes$1),
      _defineProperty(_class, 'defaultProps', hotKeysIgnoreOptions),
      _temp
    );
  }

  function overrideComponent(displayName) {
    var _class, _temp;

    return (
      (_temp = _class =
        /*#__PURE__*/
        (function (_Component) {
          _inherits(OverrideComponent, _Component);

          function OverrideComponent() {
            _classCallCheck(this, OverrideComponent);

            return _possibleConstructorReturn(this, _getPrototypeOf(OverrideComponent).apply(this, arguments));
          }

          _createClass(OverrideComponent, [
            {
              key: 'render',
              value: function render() {
                var _this$props = this.props,
                  hotKeys = _this$props.hotKeys,
                  remainingProps = _objectWithoutProperties(_this$props, ['hotKeys']);

                var DefaultComponent = remainingProps.component || Configuration.option('defaultComponent');
                return React__default.createElement(DefaultComponent, _objectSpread({}, hotKeys, remainingProps));
              },
            },
          ]);

          return OverrideComponent;
        })(React.Component)),
      _defineProperty(_class, 'displayName', displayName),
      _temp
    );
  }

  /**
   * A component that causes React Hotkeys to ignore all matching key events
   * triggered by its children. By default, this is all key events, but you can use
   * the only prop to provide a whitelist, or the except prop to pass a blacklist (and
   * cause HotKeys components to still observe these events).
   *
   * @see HotKeysIgnoreOverride
   */

  var IgnoreKeys = withHotKeysIgnoreOverride(overrideComponent('IgnoreKeys'), {}, 'ignoreEvent');

  /**
   * A component that forces React Hotkeys to observe all matching key events
   * triggered by its children, even if they are matched by Configuration.ignoreEventsCondition.
   * By default, this is all key events, but you can use the only prop to provide a
   * whitelist, or the except prop to pass a blacklist.
   *
   * @see HotKeysIgnoreOverride
   */

  var ObserveKeys = withHotKeysIgnoreOverride(overrideComponent('ObserveKeys'), {}, 'observeIgnoredEvents');

  /**
   * Wraps a React component in a HotKeysIgnored component, which passes down the
   * callbacks and options necessary for React Hotkeys to work as a single prop value,
   * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
   * the wrapped component (e.g. div, span, input, etc) in order for the key events
   * to be recorded.
   */

  function withIgnoreKeys(Component) {
    var hotKeysIgnoreOptions =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : {
            only: [],
            except: [],
          };
    return withHotKeysIgnoreOverride(Component, hotKeysIgnoreOptions, 'ignoreEvent');
  }

  /**
   * Wraps a React component in a ObserveKeys component, which passes down the
   * callbacks and options necessary for React Hotkeys to work as a single prop value,
   * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
   * the wrapped component (e.g. div, span, input, etc) in order for the key events
   * to be recorded.
   */

  function withObserveKeys(Component) {
    var hotKeysIgnoreOptions =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : {
            only: [],
            except: [],
          };
    return withHotKeysIgnoreOverride(Component, hotKeysIgnoreOptions, 'observeIgnoredEvents');
  }

  /**
   * Configure the behaviour of HotKeys
   * @param {Object} configuration Configuration object
   * @see Configuration.init
   */

  function configure() {
    var configuration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    Configuration.init(configuration);
  }

  /**
   * @typedef {Object.<ActionName, KeyEventDescription[]>} ApplicationKeyMap
   */

  /**
   * Generates and returns the application's key map, including not only those
   * that are live in the current focus, but all the key maps from all the
   * HotKeys and GlobalHotKeys components that are currently mounted
   * @returns {ApplicationKeyMap} The application's key map
   */

  function getApplicationKeyMap() {
    return KeyEventManager.getInstance().applicationKeyMap;
  }

  /**
   * @callback keyCombinationListener
   */

  /**
   * Adds a listener function that will be called the next time a key combination completes
   * @param {keyCombinationListener} callbackFunction Listener function to be called
   * @returns {function} Function to call to cancel listening to the next key combination
   */

  function recordKeyCombination(callbackFunction) {
    var eventManager = KeyEventManager.getInstance();
    return eventManager.addKeyCombinationListener(callbackFunction);
  }

  exports.HotKeys = HotKeys;
  exports.GlobalHotKeys = GlobalHotKeys$1;
  exports.IgnoreKeys = IgnoreKeys;
  exports.ObserveKeys = ObserveKeys;
  exports.withHotKeys = withHotKeys;
  exports.withIgnoreKeys = withIgnoreKeys;
  exports.withObserveKeys = withObserveKeys;
  exports.configure = configure;
  exports.getApplicationKeyMap = getApplicationKeyMap;
  exports.recordKeyCombination = recordKeyCombination;

  Object.defineProperty(exports, '__esModule', { value: true });
});
