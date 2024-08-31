class FocusTree {
  constructor() {
    this.id = 0;
  }

  isNewerThan(id) {
    return this.id !== id;
  }

  new() {
    this.id += 1;
  }
}

export default FocusTree;
