/*
 * @Author: your name
 * @Date: 2021-11-03 10:18:46
 * @LastEditTime: 2022-02-17 15:24:38
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /dev-wlj/packages/web/public/tinymce/plugins/lxmailformat/plugin.js
 */

/**
 * ! formatData type
 * {
  * color: string;
  * font-weight: string;
  * font-size: string;
  * font-family: string;
  * font-style: string;
  * text-decoration: string;
  * background: string;
  * text=align: string;
  * list: undefined | { type: ol | ul, listStyle: string }
  * }
 */

 (function() {
  var globalPluginManager = tinymce.util.Tools.resolve('tinymce.PluginManager');

  function isDescendant(target, descendant) {
    var parentEl = descendant.parentElement;
    if (!parentEl) return false;
    if (parentEl === target) return true;
    return isDescendant(target, parentEl);
  }
  /**
   * @description: 拿到每一行最外层的block
   * 例如：选中 UI 和多个 li
   * selection.getSelectedBlocks() 会把 UI 和 li 都返回
   * 最终只返回UI 不会把 li 也返回。
   * 目的是不要重复的DOM， 这样在选择所哟的 textnode 的时候就不会重复
   * @param {*} selection
   * @return {*}
   */
  function getSelectedLineBlocks(selection) {
    var selectedBlocks = selection.getSelectedBlocks();
    if (!selectedBlocks.length) return [];
    var res = [];
    var target = null;
    selectedBlocks.forEach(function (item) {
      // selection.getSelectedBlocks(); 返回的是选中DOM树的深度优先的数组
      // 保证下一项 不是入列项的 descendant
      if (!target || !isDescendant(target, item)) {
        target = item;
        res.push(item);
      }
    })
    return res;
  }

  /** 通过node 判断是否是list，如果是list 拿到 { type: ol | ul, listStyle: string }
   * @description:
   * @param {*} editor
   * @param {*} node
   * @return {*} undefined | { type: ol | ul, listStyle: string }
   */
  function getListFormat(editor, node) {
    var lowerCaseTagName = node.tagName.toLowerCase();
    if (['ol', 'ul'].includes(lowerCaseTagName)) {
      var win = editor.getWin();
      var nodeStyle = win.getComputedStyle(node);
      return {
        type: lowerCaseTagName,
        'list-style': nodeStyle.listStyle
      }
    }
    var parent = node.parentElement;
    if (parent) {
      return getListFormat(editor, parent)
    }
  }

  /**
   * @description: 拿到真实展现的 style
   * 直接使用 getComputedStyle 无法达到预期
   * 例如 <span><strong>内</strong></span> 这种结构 span 上面有背景色
   * 通过 getComputedStyle 拿 strong 的背景色 是拿不到span 的背景色的  但是看起来 strong 是有背景色的
   * 这个背景色 是需要的
   * 目前处理以下常见情况，因为是编辑器内部操作，其他极端情况暂不处理
   * 背景色 为 rgba(0,0,0,0) 是需要往上寻找的
   * 和下划线 需要往上寻找
   * @param {*} key style 的 key
   * @param {*} value 如果和 style.key 相等就往父级寻找
   * @param {*} node
   * @param {*} outBlock 往上寻找的尽头
   * @return {*} 返回整个 style 不是 style[key]
   */
  function getUIStyle(key, value, node, outBlock, win) {
    var nodeStyle = win.getComputedStyle(node);
    var parent = node.parentElement;
    if (nodeStyle[key] !== value) return nodeStyle;
    if (parent === outBlock) { // 最外层返回
      var parentStyle = win.getComputedStyle(parent);
      return parentStyle;
    }
    if (parent) {
      return getUIStyle(key, value, parent, outBlock, win)
    }
    return nodeStyle;
  }

  /**
   * @description: 通过node拿到除了list的所有format
   * @param {*} editor
   * @param {*} node
   * @return {*}
   */
  function getNodeFormat(editor, node, outBlock) {
    var win = editor.getWin();
    var nodeStyle = win.getComputedStyle(node);
    var listStyle = getListFormat(editor, node);
    var nodeStyleBackground = getUIStyle('background-color', 'rgba(0, 0, 0, 0)', node, outBlock, win);
    var nodeStyleTextDecoration = getUIStyle('text-decoration-line', 'none', node, outBlock, win);
    return {
      color: nodeStyle.color,
      'font-weight': nodeStyle.fontWeight,
      'font-size': nodeStyle.fontSize,
      'font-family': nodeStyle.fontFamily,
      'font-style': nodeStyle.fontStyle,
      'text-decoration': nodeStyleTextDecoration.textDecoration,
      background: nodeStyleBackground.background,
      'text-align': nodeStyle.textAlign,
      list: listStyle
    }
  }

  /**
   * @description: collapse 时 获取format data
   * @param {*} editor
   * @return {*}
   */
  function getFormatDataCollapse(editor, selection) {
    var selectNode = selection.getNode();
    var selectedBlocks = getSelectedLineBlocks(selection);
    return getNodeFormat(editor, selectNode, selectedBlocks[0]);
  }

  /**
   * @description: 非 collapse 时 获取format data
   * @param {*} editor
   * @param {*} selection
   * @return {*}
   */
  function getFormatDataNonCollapse(editor, selection) {
    var rng = selection.getRng();
    var startEl = rng.startContainer.parentElement;
    var selectedBlocks = getSelectedLineBlocks(selection);
    return getNodeFormat(editor, startEl, selectedBlocks[0]);
  }

  /**
   * @description: 点击格式刷后 获取format data
   * 1. collapse
   * 2. 非 collapse
   * @param {*} editor
   * @return {*}
   */
  function getFormatData(editor) {
    var selection = editor.selection;
    var rng = selection.getRng();
    var fn = rng.collapsed ? getFormatDataCollapse : getFormatDataNonCollapse
    return fn(editor, selection);
  }

  function getAllTextNode(node, res) {
    if (!res) res = [];
    if (node.nodeType === 3) res.push(node);
    var childNodes = node.childNodes;
    if (childNodes.length > 0) {
      for (var i = 0; i < childNodes.length; i++) {
        getAllTextNode(childNodes[i], res)
      }
    }
    return res;
  }

  /**
   * @description: 去头去尾 剩下的textnode 是从头到尾都选中的
   * @param {*} editor
   * @param {*} allTextNode
   * @return {*}
   */
  function getSelectedTextNode(editor, allTextNode) {
    var selection = editor.selection;
    var sel = selection.getRng();
    var startContainer = sel.startContainer;
    var endContainer = sel.endContainer;
    var startWhile = true;
    var endWhile = true;
    while (startWhile && allTextNode.length) {
      var node = allTextNode.shift();
      if (node === startContainer) {
        startWhile = false;
        allTextNode.unshift(node);
      }
    }
    while (endWhile && allTextNode.length) {
      var node = allTextNode.pop();
      if (node === endContainer) {
        endWhile = false;
        allTextNode.push(node);
      }
    }
    return allTextNode;
  }

  /**
   * @description:
   * @param {*} editor
   * @return {*}
   */
  function getAllTextRng(editor) {
    var res = [];
    var selection = editor.selection;
    var sel = selection.getRng();
    var selectedBlocks = getSelectedLineBlocks(selection);
    var allTextNode = [];
    // 拿到所有textnode 但是要去头去尾
    while (selectedBlocks.length) {
      var blockNode = selectedBlocks.shift();
      getAllTextNode(blockNode, allTextNode);
    }
    var selectedTextNode = getSelectedTextNode(editor, allTextNode.slice());


    // 开始的node
    var startRng = editor.dom.createRng();
    var firstEndOffset = sel.startContainer.length;
    // 如果只有一个选中的text 那么range的就不一定是到text的结尾，可能中间就截断了
    if (selectedTextNode.length === 1) firstEndOffset = sel.endOffset
    startRng.setStart(sel.startContainer, sel.startOffset);
    startRng.setEnd(sel.startContainer, firstEndOffset);
    res.unshift({
      rng: startRng,
      value: sel.startContainer.data.substring(sel.startOffset, firstEndOffset)
    })
    // 中间的node
    selectedTextNode.forEach(function (textNode, index) {
      // 收尾会特殊处理
      if (index === 0 || index === selectedTextNode.length - 1) return;
      var rng = editor.dom.createRng();
      rng.selectNode(textNode);
      res.push({ rng: rng, value: textNode.data });
    });
    // 结束的node
    if (selectedTextNode.length > 1) {
      var endRng = editor.dom.createRng();
      endRng.setStart(sel.endContainer, 0);
      endRng.setEnd(sel.endContainer, sel.endOffset);
      res.push({
        rng: endRng,
        value: sel.endContainer.data.substring(0, sel.endOffset)
      })
    }
    return res;
  }

  function formatTextNode(editor, allTextRng, formatData) {
    var style = '';
    var selection = editor.selection;
    var dom = editor.dom;
    var startId = dom.uniqueId('range');
    var endId = dom.uniqueId('range');
    Object.keys(formatData).forEach(function (key) {
      if (!['list', 'text-align'].includes(key)) {
        style += key + ': ' + formatData[key] + '; '
      }
    })
    allTextRng.forEach(function (item, index){
      // var content = '<span style="'+style+'">'+ item.value +'</span>';
      var className = ''
      if (index === 0) className = startId;
      if (index === allTextRng.length - 1) className = endId;
      var content = dom.createHTML('span', { style: style, class: className }, item.value);
      selection.setRng(item.rng);
      selection.setContent(content);
    })
    // 上面setRng setContent改变了 selection 导致后面再调用 getSelectedBlocks等方法拿不到正确的值
    // 下面设置正确的selection
    var startDom = dom.select('.' + startId)[0];
    var endDom = dom.select('.' + endId)[0];
    startDom = startDom || endDom; // 只有一个range情况
    dom.removeClass(startDom, startId);
    dom.removeClass(endDom, endId);
    var rng = editor.dom.createRng();
    rng.setStartBefore(startDom);
    rng.setEndAfter(endDom);
    selection.setRng(rng);
  }

  /**
   * @description: 刷对齐方式
   * @param {*} editor
   * @param {*} formatData
   * @return {*}
   */
  function formatTextAlign(editor, formatData) {
    var textAlign = formatData['text-align'];
    if(textAlign) {
      var dom = editor.dom;
      var selection = editor.selection;
      var selectedBlocks = selection.getSelectedBlocks();
      selectedBlocks.forEach(function (el){
        dom.setStyle(el, 'text-align', textAlign);
      })
    }
  }

  function renameBlocks(editor) {
    var dom = editor.dom;
    var selection = editor.selection;
    var selectedBlocks = getSelectedLineBlocks(selection);
    var newLis = selectedBlocks.map(function (item) {
      if (['table'].includes(item.tagName.toLowerCase())) return item;
      return dom.rename(item, 'li');
    });
    return newLis
  }

  /**
   * @description: selectedBlocks 前后有list 将selectedBlocks 和list合并
   * @param {*} editor
   * @param {*} parentEle
   * @param {*} referenceNode
   * @return {*}
   */
  function formatListMerge(editor, parentEle, referenceNode) {
    var lis = renameBlocks(editor);
    lis.forEach(function (li){
      parentEle.insertBefore(li, referenceNode);
    })
  }

  function formatListSelfList(editor, listFormatData) {
    var dom = editor.dom;
    var lis = renameBlocks(editor);
    listing = lis.map(function (el){
      return dom.getOuterHTML(el);
    }).join('');
    var outerHtml = dom.createHTML(listFormatData.type, { 'list-style': listFormatData['list-style'] }, listing);
    dom.setOuterHTML(lis[0], outerHtml);
    lis.forEach(function (el){
      dom.remove(el);
    })
  }

  /**
   * @description: 处理list入口
   * @param {*} editor
   * @param {*} formatData
   * @return {*}
   */
  function formatList(editor, formatData) {
    var list = formatData.list;
    if(list) {
      var selection = editor.selection;
      var selectedBlocks = getSelectedLineBlocks(selection);
      var firstBlock = selectedBlocks[0];
      var lastBlock = selectedBlocks[selectedBlocks.length - 1]
      var preEle = firstBlock.previousElementSibling;
      var nextEle = lastBlock.nextElementSibling;
      // 上方是list 合并到上方
      if (preEle && ['ol', 'ul'].includes(preEle.tagName.toLowerCase())) {
        formatListMerge(editor, preEle, null);
        return
      }
      // 下方是list 合并到下方
      if (nextEle && ['ol', 'ul'].includes(nextEle.tagName.toLowerCase())) {
        var firstChild = nextEle.firstElementChild;
        formatListMerge(editor, nextEle, firstChild);
        return
      }
      // firstBlock 是li 合并到 firstBlock 的父级
      if (firstBlock.tagName.toLowerCase() === 'li') {
        formatListMerge(editor, firstBlock.parentElement, null);
        return
      }
      // lastBlock 是li 合并到 lastBlock 的父级
      if (lastBlock.tagName.toLowerCase() === 'li') {
        var firstChild = lastBlock.parentElement.firstElementChild;
        formatListMerge(editor, lastBlock.parentElement, firstChild);
        return
      }

      formatListSelfList(editor, list)
    }
  }

  /**
   * @description: 将format写入选中的rang
   * 1. 先获取所有选中的text节点 转换成range 收尾需要offset
   * 2. 选中range 使用selection.setContent 接口 用 <span style>text</span>替换
   * @param {*} editor
   * @param {*} formatData
   * @return {*}
   */
  function actionFormat(editor, formatData) {
    var allTextRng = getAllTextRng(editor);
    formatTextAlign(editor, formatData);
    formatTextNode(editor, allTextRng, formatData);
    formatList(editor, formatData);
  }

  function register(editor) {
      var bodyOrigStyle = '';
      var body = '';
      var docu = '';
      var dom = '';
      var formatData = null;
      // 触发格式刷
      function setPointer(api) {
        if (bodyOrigStyle) {
          api.setBlur();
          recoverPointer();
          return;
        }
        // format-pointer-cursor
        editor.focus();
        bodyOrigStyle = dom.getAttrib(body, 'style') || ' '; // 加一个空格是为了437行判断，如果不加并且 bodyOrigStyle 为空，在格式刷结束的时候就进不了438行，就无法结束格式刷状态
        var curStyle = bodyOrigStyle + ' cursor: url("data:application/octet-stream;base64,AAACAAEAICAAABUADwCoDAAAFgAAACgAAAAgAAAAQAAAAAEAGAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////8AAAD///////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////8AAAAAAAD///////////8AAAD///////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAAAAAD///8AAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAD///////////////////////////8AAAD///8AAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAD///////////////////////////8AAAD///8AAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////8AAAAAAAAAAAD///////8AAAAAAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAAAAAAAAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAAAAAAAAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAAAAAAAAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAAAAAAAAAAAAAD///8AAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////8AAAAAAAAAAAD///////////8AAAD///////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAAAAAAAAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////8AAAD///////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////////////////////////////Ef///gD/8AMB/+ABx//wAMf/+ADH//gAx//8AEf//ABH//wAR//8AEf//gDH//8Bx///g8f//4PH//+Dx///g8f//8cB///+AP///xH///////////////////////////w=="), auto;'
        dom.setAttrib(body, 'style', curStyle);
        formatData = getFormatData(editor);
        console.log('formatDataformatData', formatData);
        var nonEditableClass = editor.getParam('noneditable_noneditable_class', 'mceNonEditable');
        editor.$(body).find('.' + nonEditableClass).attr('contenteditable', null);
      }
      // 解除格式刷状态
      function recoverPointer(e) {
        if (bodyOrigStyle) {
          dom.setAttrib(body, 'style', bodyOrigStyle);
          var nonEditableClass = editor.getParam('noneditable_noneditable_class', 'mceNonEditable');
          editor.$(body).find('.' + nonEditableClass).attr('contenteditable', false);
          bodyOrigStyle = '';
        }
      }
      // 开始粘贴样式
      function actionPoint() {
        if (bodyOrigStyle) {
          actionFormat(editor, formatData);
          recoverPointer();
        }
      }

      function escRecoverPointer(e) {
        if (e.keyCode === 27) {
          recoverPointer()
        }
      }

      function bindRecoverPointer() {
        dom.bind(body, 'click contextmenu', recoverPointer);
        dom.bind(body, 'mouseup', actionPoint);
        docu.addEventListener('keydown', escRecoverPointer);
        document.body.addEventListener('contextmenu', recoverPointer);
        document.body.addEventListener('click', recoverPointer);
      }

      function unbindRecoverPointer() {
        document.body.removeEventListener('click contextmenu', recoverPointer);
        docu.removeEventListener('keydown', escRecoverPointer);
        dom.unbind(body, 'mouseup', actionPoint);
        dom.unbind(body, 'click', recoverPointer);
        dom.unbind(body, 'contextmenu', recoverPointer);
      }

      editor.ui.registry.addButton('lxformatpainter', {
          icon: 'format-painter',
          tooltip: 'format-painter',
          onAction: function (api) {
            setPointer(api);
          },
          onSetup: function (api) {
            body = editor.getBody();
            docu = editor.getDoc();
            dom = editor.dom;
            bindRecoverPointer();
            return function() {
              unbindRecoverPointer();
            }
          }
      })
  }

  function plugin(params) {
    globalPluginManager.add('lxformatpainter', function(editor) {
      register(editor);
    })
  }

  plugin()
})()
