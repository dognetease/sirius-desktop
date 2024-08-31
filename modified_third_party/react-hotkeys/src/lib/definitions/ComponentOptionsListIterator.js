/**
 * Iterates over ComponentOptionList instances
 * @class
 */
class ComponentOptionsListIterator {
  /**
   * Creates a new instance of ComponentOptionsListIterator
   * @param {ComponentOptionsList} list The list to iterate over
   */
  constructor(list) {
    this._list = list;
    this.position = -1;
  }

  /**
   * The component options the iterator is currently pointed at
   * @returns {ComponentOptions} The current component options
   */
  getComponent() {
    return this._list.getAtPosition(this.position);
  }

  /**
   * Move to the next component options in the list, if not already at the end of the
   * list.
   * @returns {ComponentOptionsList|null} The next component options the iterator is now
   *        pointed at. If the iterator is already at the last component options, null
   *        is returned.
   */
  next() {
    if (this.position + 1 < this._list.length) {
      this.position++;

      return this.getComponent();
    } else {
      return null;
    }
  }
}

export default ComponentOptionsListIterator;
