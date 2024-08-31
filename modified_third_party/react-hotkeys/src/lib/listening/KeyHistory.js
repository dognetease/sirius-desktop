import KeyCombination from './KeyCombination';
import KeyCombinationDecorator from './KeyCombinationDecorator';
import KeyCombinationIterator from './KeyCombinationIterator';

/**
 * List of key combinations seen by hot key components
 * @class
 */
class KeyHistory {
  /**
   * Creates a new KeyHistory instance
   * @param {Number} maxLength Maximum length of the list.
   * @param {KeyCombination} startingPoint Initial state of first combination
   * @returns {KeyHistory}
   */
  constructor({ maxLength }, startingPoint = null) {
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
  getPreviousCombinations(numberOfCombinations) {
    return this._combinations.slice(-(numberOfCombinations+1), -1);
  }

  /**
   * Whether any keys have been stored in the key history
   * @returns {boolean} true if there is at least one key combination, else false
   */
  any() {
    return this._combinations.some((keyCombination) => new KeyCombinationIterator(keyCombination).any());
  }

  /**
   * The number of key combinations in the history (limited by the max length)
   * @type {number} Number of key combinations
   */
  get length() {
    return this._combinations.length;
  }

  /**
   * Most recent or current key combination
   * @type {KeyCombination} Key combination record
   */
  get currentCombination() {
    return this._combinations[this.length - 1];
  }

  /**
   * Adds a key event to the current key combination (as opposed to starting a new
   * keyboard combination).
   * @param {ReactKeyName} keyName - Name of the key to add to the current combination
   * @param {KeyEventType} recordIndex - Index in record to set to true
   * @param {KeyEventState} keyEventState The state to set the key event to
   */
  addKeyToCurrentCombination(keyName, recordIndex, keyEventState) {
    this._ensureInitialKeyCombination();

    this.currentCombination.setKeyState(keyName, recordIndex, keyEventState);
  }

  /**
   * Sets a new maximum length for the key combination history. Once the number of
   * key combinations exceeds this length, the oldest is dropped.
   * @param {Number} length New maximum length of the key history
   */
  set maxLength(length) {
    this._maxLength = length;
    this._trimHistory();
  }

  /**
   * Adds a new KeyCombination to the event history.
   * @param {ReactKeyName} keyName - Name of the keyboard key to add to the new
   *        KeyCombination
   * @param {KeyEventState} keyEventState The state to set the key event to
   */
  startNewKeyCombination(keyName, keyEventState) {
    this._ensureInitialKeyCombination();

    const newCombinationRecord =
      new KeyCombination(this.currentCombination.keysStillPressedDict());

    newCombinationRecord.addKey(keyName, keyEventState);

    this._push(newCombinationRecord);
  }

  /**
   * A plain JavaScript representation of the key combination history, useful for
   * serialization or debugging
   * @returns {Object[]} Serialized representation of the registry
   */
  toJSON() {
    return this._combinations.map((keyCombination) => new KeyCombinationDecorator(keyCombination).toJSON() );
  }

  /********************************************************************************
   * Private methods
   ********************************************************************************/

  _ensureInitialKeyCombination() {
    if (this.length === 0) {
      this._push(new KeyCombination())
    }
  }

  _push(record) {
    this._trimHistory();

    this._combinations.push(record);
  }

  _trimHistory() {
    while (this.length > this._maxLength) {
      /**
       * We know the longest key sequence registered for the currently focused
       * components, so we don't need to keep a record of history longer than
       * that
       */
      this._shift();
    }
  }

  _shift() {
    this._combinations.shift();
  }
}

export default KeyHistory;
