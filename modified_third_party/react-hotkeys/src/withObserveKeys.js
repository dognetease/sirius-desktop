import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';

/**
 * Wraps a React component in a ObserveKeys component, which passes down the
 * callbacks and options necessary for React Hotkeys to work as a single prop value,
 * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
 * the wrapped component (e.g. div, span, input, etc) in order for the key events
 * to be recorded.
 */
function withObserveKeys(Component, hotKeysIgnoreOptions = { only: [], except: [] }) {
  return withHotKeysIgnoreOverride(Component, hotKeysIgnoreOptions, 'observeIgnoredEvents');
}

export default withObserveKeys;
