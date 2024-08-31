/* eslint-disable */
var Cell = function (initial) {
  var value = initial;
  var get = function () {
    return value;
  };
  var set = function (v) {
    value = v;
  };
  return {
    get: get,
    set: set
  };
};
var editorDOMUtils = (function() {
  var DomTreeWalker = function() {
    function DomTreeWalker(startNode, rootNode) {
        this.node = startNode;
        this.rootNode = rootNode;
        this.current = this.current.bind(this);
        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
        this.prev2 = this.prev2.bind(this);
    }
    DomTreeWalker.prototype.current = function() {
        return this.node;
    };
    DomTreeWalker.prototype.next = function(shallow) {
        this.node = this.findSibling(this.node, 'firstChild', 'nextSibling', shallow);
        return this.node;
    };
    DomTreeWalker.prototype.prev = function(shallow) {
        this.node = this.findSibling(this.node, 'lastChild', 'previousSibling', shallow);
        return this.node;
    };
    DomTreeWalker.prototype.prev2 = function(shallow) {
        this.node = this.findPreviousNode(this.node, 'lastChild', 'previousSibling', shallow);
        return this.node;
    };
    DomTreeWalker.prototype.findSibling = function(node, startName, siblingName, shallow) {
        var sibling, parent;
        if (node) {
            if (!shallow && node[startName]) {
                return node[startName];
            }
            if (node !== this.rootNode) {
                sibling = node[siblingName];
                if (sibling) {
                    return sibling;
                }
                for (parent = node.parentNode; parent && parent !== this.rootNode; parent = parent.parentNode) {
                    sibling = parent[siblingName];
                    if (sibling) {
                        return sibling;
                    }
                }
            }
        }
    };
    DomTreeWalker.prototype.findPreviousNode = function(node, startName, siblingName, shallow) {
        var sibling, parent, child;
        if (node) {
            sibling = node[siblingName];
            if (this.rootNode && sibling === this.rootNode) {
                return;
            }
            if (sibling) {
                if (!shallow) {
                    for (child = sibling[startName]; child; child = child[startName]) {
                        if (!child[startName]) {
                            return child;
                        }
                    }
                }
                return sibling;
            }
            parent = node.parentNode;
            if (parent && parent !== this.rootNode) {
                return parent;
            }
        }
    };
    return DomTreeWalker;
  }();
  var blockElementsMap = {};
  ['SUMMARY', 'DETAILS', 'FIGCAPTION', 'OPTGROUP', 'SELECT', 'DATALIST', 'OPTION', 'ISINDEX', 'MENU', 'NOSCRIPT', 
    'DD', 'DT', 'DL', 'CAPTION', 'UL', 'OL', 'LI', 'TD', 'TR', 'TH', 'TFOOT', 'THEAD', 'TBODY', 'TABLE', 'HR', 'FIGURE',
    'NAV', 'MAIN', 'ASIDE', 'HGROUP', 'ADDRESS', 'SECTION', 'ARTICLE', 'FOOTER', 'HEADER', 'FIELDSET', 'DIR', 
    'CENTER', 'BLOCKQUOTE', 'FORM', 'PRE', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].forEach(function(key) {
    blockElementsMap[key] = {};
    blockElementsMap[key.toLowerCase()] = {};
  });
  var shortEndedElementsMap = {};
  ['TRACK', 'WBR', 'SOURCE', 'EMBED', 'PARAM', 'META', 'LINK', 'ISINDEX', 'INPUT', 'IMG', 'HR', 'FRAME', 'COL',
    'BR', 'BASEFONT',  'BASE',  'AREA'].forEach(function(key) {
      shortEndedElementsMap[key] = {};
      shortEndedElementsMap[key.toLowerCase()] = {};
  });
  var whiteSpaceElementsMap = {};
  ['CODE', 'OBJECT', 'IFRAME', 'AUDIO', 'VIDEO', 'TEXTAREA', 'STYLE', 'NOSCRIPT', 'SCRIPT', 'PRE'].forEach(function(key) {
    whiteSpaceElementsMap[key] = {};
    whiteSpaceElementsMap[key.toLowerCase()] = {};
  });
  var isBlock = function(node) {
    if (typeof node === 'string') {
        return !!blockElementsMap[node];
    } else if (node) {
        var type = node.nodeType;
        if (type) {
            return !!(type === 1 && blockElementsMap[node.nodeName]);
        }
    }
    return false;
  };
  var filter = function(xs, pred) {
    var r = [];
    for (var i = 0, len = xs.length; i < len; i++) {
        var x = xs[i];
        if (pred(x, i)) {
            r.push(x);
        }
    }
    return r;
  };
  var get$4 = function(element, key) {
    var v = element.getAttribute(key);
    return v === null ? undefined : v;
  };
  var read = function(element, attr) {
    var value = get$4(element, attr);
    return value === undefined || value === '' ? [] : value.split(' ');
  };
  var removeClass = function(element, id) {
    if (!element[0]) return;
    var nu = filter(read(element[0], 'class'), function(v) {
      return v !== id;
    });
    if (nu.length > 0) {
      element[0].setAttribute('class', nu.join(' ') + '');
    } else {
      element[0].removeAttribute('class');
    }
    return false;
  };

  var addClass = function(element, className) {
    for (var i = 0; i < element.length; i++) {
      var node = element[i];
      var existingClassName = node.className;
      node.className += existingClassName ? ' ' + className : className;
    }
  }

  var create = function(name, attrs) {
    var node = document.createElement(name);
    if (attrs) {
      attrKeys = Object.keys(attrs);
      attrKeys.forEach(function(attrName) {
        node.setAttribute(attrName, attrs[attrName]);
      });
    }
    return node;
  };
  var isNullable = function(a) {
    return a === null || a === undefined;
  };
  var isNodeType = function(type) {
    return function(node) {
        return !!node && node.nodeType === type;
    };
  };
  var isElement$1 = isNodeType(1);
  var isText$1 = isNodeType(3);
  var isComment$1 = isNodeType(8);
  var isDocument$1 = isNodeType(9);
  var isDocumentFragment$1 = isNodeType(11);
  var getParents = function(elm, selector, root, collect) {
    var result = [];
    var node = elm;
    collect = collect === undefined;
    root = root || null;
    while (node) {
        if (node === root || isNullable(node.nodeType) || isDocument$1(node) || isDocumentFragment$1(node)) {
            break;
        }
        if (!selector || typeof selector === 'function' && selector(node)) {
            if (collect) {
                result.push(node);
            } else {
                return [node];
            }
        }
        node = node.parentNode;
    }
    return collect ? result : null;
  };
  var getParent = function(node, selector, root) {
      var parents = getParents(node, selector, root, false);
      return parents && parents.length > 0 ? parents[0] : null;
  };

  var getContentEditable = function(node) {
    if (node && isElement$1(node)) {
        var contentEditable = node.getAttribute('data-mce-contenteditable');
        if (contentEditable && contentEditable !== 'inherit') {
            return contentEditable;
        }
        return node.contentEditable !== 'inherit' ? node.contentEditable : null;
    } else {
        return null;
    }
  };

  var getContentEditableParent = function(node) {
    var state = null;
    for (; node; node = node.parentNode) {
        state = getContentEditable(node);
        if (state !== null) {
            break;
        }
    }
    return state;
  };
  
  return {
    isBlock: isBlock,
    removeClass:removeClass,
    addClass: addClass,
    create: create,
    getParent: getParent,
    shortEndedElementsMap: shortEndedElementsMap,
    getContentEditable: getContentEditable,
    getContentEditableParent: getContentEditableParent,
    whiteSpaceElementsMap: whiteSpaceElementsMap,
    DomTreeWalker: DomTreeWalker
  }
}())
var doFind = function (currentSearchState, data, forward) {
  var __assign = function () {
    __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };

  var noop = function () {
  };
  var constant = function (value) {
    return function () {
      return value;
    };
  };
  var never = constant(false);
  var always = constant(true);

  var punctuationStr = '[!-#%-*,-\\/:;?@\\[-\\]_{}\xA1\xAB\xB7\xBB\xBF;\xB7\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1361-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u3008\u3009\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30\u2E31\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uff3f\uFF5B\uFF5D\uFF5F-\uFF65]';

  var punctuation = constant(punctuationStr);

  var none = function () {
    return NONE;
  };
  var NONE = function () {
    var eq = function (o) {
      return o.isNone();
    };
    var call = function (thunk) {
      return thunk();
    };
    var id = function (n) {
      return n;
    };
    var me = {
      fold: function (n, _s) {
        return n();
      },
      is: never,
      isSome: never,
      isNone: always,
      getOr: id,
      getOrThunk: call,
      getOrDie: function (msg) {
        throw new Error(msg || 'error: getOrDie called on none.');
      },
      getOrNull: constant(null),
      getOrUndefined: constant(undefined),
      or: id,
      orThunk: call,
      map: none,
      each: noop,
      bind: none,
      exists: never,
      forall: always,
      filter: none,
      equals: eq,
      equals_: eq,
      toArray: function () {
        return [];
      },
      toString: constant('none()')
    };
    return me;
  }();
  var some = function (a) {
    var constant_a = constant(a);
    var self = function () {
      return me;
    };
    var bind = function (f) {
      return f(a);
    };
    var me = {
      fold: function (n, s) {
        return s(a);
      },
      is: function (v) {
        return a === v;
      },
      isSome: always,
      isNone: never,
      getOr: constant_a,
      getOrThunk: constant_a,
      getOrDie: constant_a,
      getOrNull: constant_a,
      getOrUndefined: constant_a,
      or: self,
      orThunk: self,
      map: function (f) {
        return some(f(a));
      },
      each: function (f) {
        f(a);
      },
      bind: bind,
      exists: bind,
      forall: bind,
      filter: function (f) {
        return f(a) ? me : NONE;
      },
      toArray: function () {
        return [a];
      },
      toString: function () {
        return 'some(' + a + ')';
      },
      equals: function (o) {
        return o.is(a);
      },
      equals_: function (o, elementEq) {
        return o.fold(never, function (b) {
          return elementEq(a, b);
        });
      }
    };
    return me;
  };
  var from = function (value) {
    return value === null || value === undefined ? NONE : some(value);
  };
  var Optional = {
    some: some,
    none: none,
    from: from
  };

  var punctuation$1 = punctuation;

  var typeOf = function (x) {
    var t = typeof x;
    if (x === null) {
      return 'null';
    } else if (t === 'object' && (Array.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'Array')) {
      return 'array';
    } else if (t === 'object' && (String.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'String')) {
      return 'string';
    } else {
      return t;
    }
  };
  var isType = function (type) {
    return function (value) {
      return typeOf(value) === type;
    };
  };
  var isSimpleType = function (type) {
    return function (value) {
      return typeof value === type;
    };
  };
  var isString = isType('string');
  var isArray = isType('array');
  var isBoolean = isSimpleType('boolean');
  var isNumber = isSimpleType('number');

  var nativeSlice = Array.prototype.slice;
  var nativePush = Array.prototype.push;
  var map = function (xs, f) {
    var len = xs.length;
    var r = new Array(len);
    for (var i = 0; i < len; i++) {
      var x = xs[i];
      r[i] = f(x, i);
    }
    return r;
  };
  var each = function (xs, f) {
    for (var i = 0, len = xs.length; i < len; i++) {
      var x = xs[i];
      f(x, i);
    }
  };
  var eachr = function (xs, f) {
    for (var i = xs.length - 1; i >= 0; i--) {
      var x = xs[i];
      f(x, i);
    }
  };
  var groupBy = function (xs, f) {
    if (xs.length === 0) {
      return [];
    } else {
      var wasType = f(xs[0]);
      var r = [];
      var group = [];
      for (var i = 0, len = xs.length; i < len; i++) {
        var x = xs[i];
        var type = f(x);
        if (type !== wasType) {
          r.push(group);
          group = [];
        }
        wasType = type;
        group.push(x);
      }
      if (group.length !== 0) {
        r.push(group);
      }
      return r;
    }
  };
  var foldl = function (xs, f, acc) {
    each(xs, function (x) {
      acc = f(acc, x);
    });
    return acc;
  };
  var flatten = function (xs) {
    var r = [];
    for (var i = 0, len = xs.length; i < len; ++i) {
      if (!isArray(xs[i])) {
        throw new Error('Arr.flatten item ' + i + ' was not an array, input: ' + xs);
      }
      nativePush.apply(r, xs[i]);
    }
    return r;
  };
  var bind = function (xs, f) {
    return flatten(map(xs, f));
  };
  var sort = function (xs, comparator) {
    var copy = nativeSlice.call(xs, 0);
    copy.sort(comparator);
    return copy;
  };

  var hasOwnProperty = Object.hasOwnProperty;
  var has = function (obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  var DOCUMENT = 9;
  var DOCUMENT_FRAGMENT = 11;
  var ELEMENT = 1;
  var TEXT = 3;

  var type = function (element) {
    return element.dom.nodeType;
  };
  var isType$1 = function (t) {
    return function (element) {
      return type(element) === t;
    };
  };
  var isText = isType$1(TEXT);

  var rawSet = function (elementDom, key, value) {
    if (isString(value) || isBoolean(value) || isNumber(value)) {
      elementDom.setAttribute(key, value + '');
    } else {
      console.error('Invalid call to Attribute.set. Key ', key, ':: Value ', value, ':: Element ', elementDom);
      throw new Error('Attribute value was not simple');
    }
  };
  var set = function (element, key, value) {
    rawSet(element.dom, key, value);
  };

  var compareDocumentPosition = function (a, b, match) {
    return (a.compareDocumentPosition(b) & match) !== 0;
  };
  var documentPositionPreceding = function (a, b) {
    return compareDocumentPosition(a, b, Node.DOCUMENT_POSITION_PRECEDING);
  };

  var fromHtml = function (html, scope) {
    var doc = scope || document;
    var div = doc.createElement('div');
    div.innerHTML = html;
    if (!div.hasChildNodes() || div.childNodes.length > 1) {
      console.error('HTML does not have a single root node', html);
      throw new Error('HTML must have a single root node');
    }
    return fromDom(div.childNodes[0]);
  };
  var fromTag = function (tag, scope) {
    var doc = scope || document;
    var node = doc.createElement(tag);
    return fromDom(node);
  };
  var fromText = function (text, scope) {
    var doc = scope || document;
    var node = doc.createTextNode(text);
    return fromDom(node);
  };
  var fromDom = function (node) {
    if (node === null || node === undefined) {
      throw new Error('Node cannot be null or undefined');
    }
    return { dom: node };
  };
  var fromPoint = function (docElm, x, y) {
    return Optional.from(docElm.dom.elementFromPoint(x, y)).map(fromDom);
  };
  var SugarElement = {
    fromHtml: fromHtml,
    fromTag: fromTag,
    fromText: fromText,
    fromDom: fromDom,
    fromPoint: fromPoint
  };

  var bypassSelector = function (dom) {
    return dom.nodeType !== ELEMENT && dom.nodeType !== DOCUMENT && dom.nodeType !== DOCUMENT_FRAGMENT || dom.childElementCount === 0;
  };
  var all = function (selector, scope) {
    var base = scope === undefined ? document : scope.dom;
    return bypassSelector(base) ? [] : map(base.querySelectorAll(selector), SugarElement.fromDom);
  };

  var parent = function (element) {
    return Optional.from(element.dom.parentNode).map(SugarElement.fromDom);
  };
  var children = function (element) {
    return map(element.dom.childNodes, SugarElement.fromDom);
  };
  var spot = function (element, offset) {
    return {
      element: element,
      offset: offset
    };
  };
  var leaf = function (element, offset) {
    var cs = children(element);
    return cs.length > 0 && offset < cs.length ? spot(cs[offset], 0) : spot(element, offset);
  };

  var before = function (marker, wrapper) {
    var parent$1 = parent(marker);
    parent$1.each(function (v) {
      v.dom.insertBefore(wrapper.dom, marker.dom);
    });
  };
  var append = function (parent, element) {
    parent.dom.appendChild(element.dom);
  };
  var wrap = function (element, wrapper) {
    before(element, wrapper);
    append(wrapper, element);
  };

  var NodeValue = function (is, name) {
    var get = function (element) {
      if (!is(element)) {
        throw new Error('Can only get ' + name + ' value of a ' + name + ' node');
      }
      return getOption(element).getOr('');
    };
    var getOption = function (element) {
      return is(element) ? Optional.from(element.dom.nodeValue) : Optional.none();
    };
    var set = function (element, value) {
      if (!is(element)) {
        throw new Error('Can only set raw ' + name + ' value of a ' + name + ' node');
      }
      element.dom.nodeValue = value;
    };
    return {
      get: get,
      getOption: getOption,
      set: set
    };
  };

  var api = NodeValue(isText, 'text');
  var get = function (element) {
    return api.get(element);
  };

  var descendants = function (scope, selector) {
    return all(selector, scope);
  };

  var isSimpleBoundary = function (node) {
    return editorDOMUtils.isBlock(node) || has(editorDOMUtils.shortEndedElementsMap, node.nodeName);
  };
  var isContentEditableFalse = function (node) {
    return editorDOMUtils.getContentEditable(node) === 'false';
  };
  var isNonSearchDom = function (node) {
    var ignoreHtml = ['style', 'script', 'title']
  }
  var isContentEditableTrueInCef = function (node) {
    return editorDOMUtils.getContentEditable(node) === 'true' && editorDOMUtils.getContentEditableParent(node.parentNode) === 'false';
  };
  var isHidden = function (node) {
    return !editorDOMUtils.isBlock(node) && has(editorDOMUtils.whiteSpaceElementsMap, node.nodeName);
  };
  var isBoundary = function (node) {
    return isSimpleBoundary(node) || isContentEditableFalse(node) || isHidden(node) || isContentEditableTrueInCef(node);
  };
  var isText$1 = function (node) {
    return node.nodeType === 3;
  };
  var nuSection = function () {
    return {
      sOffset: 0,
      fOffset: 0,
      elements: []
    };
  };
  var toLeaf = function (node, offset) {
    return leaf(SugarElement.fromDom(node), offset);
  };
  var walk = function (walkerFn, startNode, callbacks, endNode, skipStart) {
    if (skipStart === void 0) {
      skipStart = true;
    }
    var next = skipStart ? walkerFn(false) : startNode;
    while (next) {
      var isCefNode = isContentEditableFalse(next);
      var nonSearch = isNonSearchDom(next)
      if (isCefNode || isHidden(next)) {
        var stopWalking = isCefNode ? callbacks.cef(next) : callbacks.boundary(next);
        if (stopWalking) {
          break;
        } else {
          next = walkerFn(true);
          continue;
        }
      } else if (isSimpleBoundary(next)) {
        if (callbacks.boundary(next)) {
          break;
        }
      } else if (isText$1(next)) {
        callbacks.text(next);
      }
      if (next === endNode) {
        break;
      } else {
        next = walkerFn(false);
      }
    }
  };
  var collectTextToBoundary = function (section, node, rootNode, forwards) {
    if (isBoundary(node)) {
      return;
    }
    var rootBlock = editorDOMUtils.getParent(rootNode, editorDOMUtils.isBlock);
    var walker = new editorDOMUtils.DomTreeWalker(node, rootBlock);
    var walkerFn = forwards ? walker.next.bind(walker) : walker.prev.bind(walker);
    walk(walkerFn, node, {
      boundary: always,
      cef: always,
      text: function (next) {
        if (forwards) {
          section.fOffset += next.length;
        } else {
          section.sOffset += next.length;
        }
        section.elements.push(SugarElement.fromDom(next));
      }
    });
  };
  var collect = function (rootNode, startNode, endNode, callbacks, skipStart) {
    if (skipStart === void 0) {
      skipStart = true;
    }
    var walker = new editorDOMUtils.DomTreeWalker(startNode, rootNode);
    var sections = [];
    var current = nuSection();
    // 获取 startNode的第一个或者最后一个node并且是 #text
    collectTextToBoundary(current, startNode, rootNode, false);
    var finishSection = function () {
      if (current.elements.length > 0) {
        sections.push(current);
        current = nuSection();
      }
      return false;
    };
    walk(walker.next.bind(walker), startNode, {
      boundary: finishSection,
      cef: function (node) {
        finishSection();
        if (callbacks) {
          sections.push.apply(sections, callbacks.cef(node));
        }
        return false;
      },
      text: function (next) {
        current.elements.push(SugarElement.fromDom(next));
        if (callbacks) {
          callbacks.text(next, current);
        }
      }
    }, endNode, skipStart);
    if (endNode) {
      collectTextToBoundary(current, endNode, rootNode, true);
    }
    finishSection();
    return sections;
  };
  var collectRangeSections = function (rng) {
    var start = toLeaf(rng.startContainer, rng.startOffset);
    var startNode = start.element.dom;
    var end = toLeaf(rng.endContainer, rng.endOffset);
    var endNode = end.element.dom;
    return collect(rng.commonAncestorContainer, startNode, endNode, {
      text: function (node, section) {
        if (node === endNode) {
          section.fOffset += node.length - end.offset;
        } else if (node === startNode) {
          section.sOffset += start.offset;
        }
      },
      cef: function (node) {
        // node 的 contenteditable 为false
        // 但是node的子元素可能存在 contenteditable 为true 所以需要提出再collect
        var sections = bind(descendants(SugarElement.fromDom(node), '*[contenteditable=true]'), function (e) {
          var ceTrueNode = e.dom;
          return collect(ceTrueNode, ceTrueNode);
        });
        return sort(sections, function (a, b) {
          return documentPositionPreceding(a.elements[0].dom, b.elements[0].dom) ? 1 : -1;
        });
      }
    }, false);
  };
  var fromRng = function (rng) {
    return rng.collapsed ? [] : collectRangeSections(rng);
  };
  var fromNode = function (node) {
    var rng = document.createRange();
    rng.selectNode(node);
    return fromRng(rng);
  };

  var find = function (text, pattern, start, finish) {
    if (start === void 0) {
      start = 0;
    }
    if (finish === void 0) {
      finish = text.length;
    }
    var regex = pattern.regex;
    regex.lastIndex = start;
    var results = [];
    var match;
    while (match = regex.exec(text)) {
      var matchedText = match[pattern.matchIndex];
      var matchStart = match.index + match[0].indexOf(matchedText);
      var matchFinish = matchStart + matchedText.length;
      if (matchFinish > finish) {
        break;
      }
      results.push({
        start: matchStart,
        finish: matchFinish
      });
      regex.lastIndex = matchFinish;
    }
    return results;
  };
  var extract = function (elements, matches) {
    var nodePositions = foldl(elements, function (acc, element) {
      var content = get(element);
      var start = acc.last;
      var finish = start + content.length;
      var positions = bind(matches, function (match, matchIdx) {
        if (match.start < finish && match.finish > start) {
          return [{
              element: element,
              start: Math.max(start, match.start) - start,
              finish: Math.min(finish, match.finish) - start,
              matchId: matchIdx
            }];
        } else {
          return [];
        }
      });
      return {
        results: acc.results.concat(positions),
        last: finish
      };
    }, {
      results: [],
      last: 0
    }).results;
    return groupBy(nodePositions, function (position) {
      return position.matchId;
    });
  };

  var find$1 = function (pattern, sections) {
    return bind(sections, function (section) {
      var elements = section.elements;
      var content = map(elements, get).join('');
      var positions = find(content, pattern, section.sOffset, content.length - section.fOffset);
      return extract(elements, positions);
    });
  };
  var mark = function (matches, replacementNode) {
    eachr(matches, function (match, idx) {
      eachr(match, function (pos) {
        var wrapper = SugarElement.fromDom(replacementNode.cloneNode(false));
        set(wrapper, 'data-mce-index', idx + currentSearchState.count);
        var textNode = pos.element.dom;
        if (textNode.length === pos.finish && pos.start === 0) {
          wrap(pos.element, wrapper);
        } else {
          if (textNode.length !== pos.finish) {
            textNode.splitText(pos.finish);
          }
          var matchNode = textNode.splitText(pos.start);
          wrap(SugarElement.fromDom(matchNode), wrapper);
        }
      });
    });
  };
  var findAndMark = function (pattern, node, replacementNode) {
    var textSections = fromNode(node);
    var matches = find$1(pattern, textSections);
    mark(matches, replacementNode);
    return matches.length;
  };

  var getElmIndex = function (elm) {
    var value = elm.getAttribute('data-mce-index');
    if (typeof value === 'number') {
      return '' + value;
    }
    return value;
  };
  var markAllMatches = function (currentSearchState, pattern, inSelection) {
    var marker = editorDOMUtils.create('span', { 'data-mce-bogus': 1 });
    marker.className = 'mce-match-marker';
    var node = document.body;
    done(currentSearchState);
    if (inSelection) {
      // return findAndMarkInSelection(pattern, editor.selection, marker);
    } else {
      return findAndMark(pattern, node, marker);
    }
  };
  var unwrap = function (node) {
    var parentNode = node.parentNode;
    if (node.firstChild) {
      parentNode.insertBefore(node.firstChild, node);
    }
    node.parentNode.removeChild(node);
  };
  var findSpansByIndex = function (index) {
    var spans = [];
    var nodes = document.getElementsByTagName('span');
    if (nodes.length) {
      for (var i = 0; i < nodes.length; i++) {
        var nodeIndex = getElmIndex(nodes[i]);
        if (nodeIndex === null || !nodeIndex.length) {
          continue;
        }
        if (nodeIndex === index.toString()) {
          spans.push(nodes[i]);
        }
      }
    }
    return spans;
  };
  var moveSelection = function (currentSearchState, forward) {
    var searchState = currentSearchState;
    var testIndex = searchState.index;
    forward = forward !== false;
    if (forward) {
      if (testIndex + 1 === searchState.count) {
        testIndex = 0;
      } else {
        testIndex++;
      }
    } else {
      if (testIndex - 1 === -1) {
        testIndex = searchState.count - 1;
      } else {
        testIndex--;
      }
    }
    editorDOMUtils.removeClass(findSpansByIndex(searchState.index), 'mce-match-marker-selected');
    var spans = findSpansByIndex(testIndex);
    if (spans.length) {
      editorDOMUtils.addClass(spans, 'mce-match-marker-selected');
      if (spans[0].scrollIntoViewIfNeeded) {
        spans[0].scrollIntoViewIfNeeded();
      } else {
        spans[0].scrollIntoView();
      }
      return testIndex;
    }
    return -1;
  };
  // 将输入的文本 处理成合适的正则
  var escapeSearchText = function (text, wholeWord) {
    // 特殊字符 . ? ^ 等 需要被转译， 后半部分不知道干嘛用的
    var escapedText = text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\s/g, '[^\\S\\r\\n\\uFEFF]');
    var wordRegex = '(' + escapedText + ')';
    // 是否是整体查询 qwer 中的 we 是否能被检索到 
    return wholeWord ? '(?:^|\\s|' + punctuation$1() + ')' + wordRegex + ('(?=$|\\s|' + punctuation$1() + ')') : wordRegex;
  };
  var find$2 = function (currentSearchState, text, matchCase, wholeWord, inSelection) {
    var escapedText = escapeSearchText(text, wholeWord);
    var pattern = {
      regex: new RegExp(escapedText, matchCase ? 'g' : 'gi'),
      matchIndex: 1
    };
    var count = markAllMatches(currentSearchState, pattern, inSelection);
    if (count) {
      // 第一次 index = -1 newIndex = 0
      // 第二次 index = 0 newIndex = 1
      moveSelection(currentSearchState, true);
      if (currentSearchState.merge) {
        currentSearchState.count += count;
      } else {
        currentSearchState.count = count;
      }
      currentSearchState.index = 0;
      currentSearchState.text = text;
      currentSearchState.matchCase = matchCase;
      currentSearchState.wholeWord = wholeWord;
      currentSearchState.inSelection = inSelection;
    }
    return count;
  };
  var next = function (currentSearchState, forward) {
    var index = moveSelection(currentSearchState, forward);
    if (!currentSearchState.merge) {
      currentSearchState.index = index;
      return;
    }
    if (index !== -1) {
      // index !== -1 表示找到了应该被 selected 的span，currentSearchState.index 会被更新
      // 如果是聚合邮件，如果此时 currentSearchState.index 是上一封邮件的最后一个index，那么在moveSelection+1后
      // 会选中下一封邮件的第一个 span, 造成有两个选中的bug
      // 返回true终止 后面的next
      // 上面的方案有另一个问题，如果选中的是第一封邮件的第一个，上一个选中也就是最后一封邮件的最后一个span的选中没有被删除
      // 这两个问题都是 currentSearchState.index 更新太早，将index返回出去，等所有iframe的find都结束了在给 currentSearchState.index赋值
      return index;
    }
  };
  var done = function (currentSearchState) {
    var nodes = document.getElementsByTagName('span');
    for (var i = 0; i < nodes.length; i++) {
      var nodeIndex = getElmIndex(nodes[i]);
      if (nodeIndex !== null && nodeIndex.length) {
        unwrap(nodes[i]);
        i--;
      }
    }
    if (!currentSearchState.merge) {
      currentSearchState.index = -1;
      currentSearchState.count = 0;
      currentSearchState.text = '';
    }
  };
  if (!data.text) {
    done(currentSearchState);
    currentSearchState.count = 0;
    currentSearchState.index = -1;
    currentSearchState.text = '';
    return -1;
  }
  var last = currentSearchState;
  if (last.text === data.text && last.matchCase === data.matchCase && last.wholeWord === data.wholeWord && !last.firstFind) {
    return next(currentSearchState, forward);
  } else {
    find$2(currentSearchState, data.text, data.matchCase, data.wholeWord, data.inSelection);
    return 0;
  }
};

var searchFind = function(currentSearchState, text, forward) {
  if (!currentSearchState) return;
  var data = {
    index: -1,
    count: 0,
    text: text,
    matchCase: false, // 是否区分大小写
    wholeWord: false, // 是否需要整个单词匹配
    inSelection: false // 是否在选中文本中搜索
  };
  return doFind(currentSearchState, data, forward);
}