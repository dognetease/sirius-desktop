import PropTypes from 'prop-types';
import React, { PureComponent, createRef } from 'react';
import backwardsCompatibleContext from './utils/backwardsCompatibleContext';
import FocusOnlyComponentManager from './lib/metal/FocusOnlyComponentManager';

const propTypes = {
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
  root: PropTypes.bool
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
      contextType: {hotKeysParentId: undefined},
    }
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
function componentFactory(Component, hotKeysOptions = {}) {
  /**
   * Component that listens to key events when one of its children are in focus and
   * selectively triggers actions (that may be handled by handler functions) when a
   * sequence of events matches a list of pre-defined sequences or combinations
   * @class
   */
  return class HotKeysEnabled extends PureComponent {
    static propTypes = propTypes;

    constructor(props) {
      super(props);
      this.comRef = null;
      this.isFocus = false;
      this.eventForward = this.eventForward.bind(this);

      if(props && props.getEventForward){
        props.getEventForward(this.eventForward);
      }

      this._manager = new FocusOnlyComponentManager(hotKeysOptions, props);
    }

    eventForward (event) {
      // 获取当前焦点元素
      const activeElement = document.activeElement;
      if(document.hasFocus()){
        if(activeElement && this.comRef){
          let inRange = event.path.some(node=>{
            return node === this.comRef
          })
          if(inRange) return;
          this.comRef.focus();
          const {
            altKey,
            bubbles,
            cancelable,
            charCode,
            ctrlKey,
            defaultPrevented,
            detail,
            eventPhase,
            isTrusted,
            key,
            keyCode,
            locale,
            location,
            metaKey,
            repeat,
            shiftKey,
            timeStamp
          } = event;
          const customEvent = new KeyboardEvent('keydown',{
            altKey,
            bubbles,
            cancelable,
            charCode,
            ctrlKey,
            defaultPrevented,
            detail,
            eventPhase,
            isTrusted,
            key,
            keyCode,
            locale,
            location,
            metaKey,
            repeat,
            shiftKey,
            timeStamp
          })
          this.comRef.dispatchEvent(customEvent);
        }
      }else{
        if(this.comRef && this.comRef.focus && this.comRef.dispatchEvent){
          this.comRef.focus();
          const {
            altKey,
            bubbles,
            cancelable,
            charCode,
            ctrlKey,
            defaultPrevented,
            detail,
            eventPhase,
            isTrusted,
            key,
            keyCode,
            locale,
            location,
            metaKey,
            repeat,
            shiftKey,
            timeStamp
          } = event;
          const customEvent = new KeyboardEvent('keydown',{
            altKey,
            bubbles,
            cancelable,
            charCode,
            ctrlKey,
            defaultPrevented,
            detail,
            eventPhase,
            isTrusted,
            key,
            keyCode,
            locale,
            location,
            metaKey,
            repeat,
            shiftKey,
            timeStamp
          })
          this.comRef.dispatchEvent(customEvent);
        }
      }
    }

    componentDidMount() {
      this._manager.addHotKeys(this.context.hotKeysParentId);
    }

    componentDidUpdate() {
      this._manager.updateHotKeys(this.props);
    }

    componentWillUnmount(){
      this._manager.removeKeyMap(this.props);
    }

    render() {
      const {keyMap, handlers, allowChanges, root, ...props} = this.props;

      return (
        <Component
          hotKeys={ this._manager.getComponentProps(this.props) }
          { ...props }
          innerRef={ref => {
            this.comRef = ref;
            // if(ref){
            //   ref.focus();
            // }
            // 兼容原来的props引用，防止内部覆盖
            if( props.innerRef && typeof props.innerRef  == 'function'){
              props.innerRef(ref);
            }
            if(props.innerRef && typeof props.innerRef  == 'object'){
              props.innerRef.current = ref;
            }
          }}
        />
      );
    }
  }
}

function withHotKeys(Component, hotKeysOptions = {}) {
  return provideWithContext(
    componentFactory(Component, hotKeysOptions)
  );
}

export default withHotKeys;
