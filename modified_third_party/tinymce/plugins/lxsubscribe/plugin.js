(function () {

  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
  var CommandKey = 'subscribe';
  var ParamsKey = 'lxsubscribe';
  var defaultParams = {
    text: '订阅',
    var: 'name',
    prefix: '#{',
    subfix: '}',
    // variableList?: []
    // onClick: function() {}
  };

  function registerCommand(editor, params) {
    editor.addCommand(CommandKey, function (ui, value) {
      console.log('lxsubscribe', arguments);
      var elm = editor.selection.getNode();
      if (elm && elm.nodeName.toUpperCase() === 'SPAN' && elm.classList.contains('mce-lx-var')) {
        editor.execCommand('mceRemoveNode', false, elm);
      } else {
        var variable = params.prefix + value + params.subfix;
        editor.undoManager.transact(function () {
          editor.insertContent('<span class="mce-lx-var mceNonEditable">' + variable + '</span>');
        });
      }
      typeof params.onClick === 'function' && params.onClick();
    });
  }

  function register(editor, params) {
    function exec(command) {
      return function () {
        editor.execCommand(command)
      }
    }
    editor.ui.registry.addButton('lxsubscribe', {
      text: '订阅',
      icon: 'subscribeIcon',
      onAction: function (p1, p2, p3) {
        const rect = p2.getBoundingClientRect()
        var onSubscribeClickAction = editor.getParam('onSubscribeClickAction');
        onSubscribeClickAction({ top: rect.top, left: rect.right });
      }
    });
    editor.ui.registry.addButton('lxsubscribetip', {
      text: '',
      tooltip: '收件人点击订阅按钮，系统会记录并展示在任务详情页-打开人数列表中。',
      icon: 'attention',
      onAction: function (p1, p2, p3) {
      }
    });
  }

  function plugin() {
    global.add('lxsubscribe', function (editor) {
      var params = editor.getParam(ParamsKey);
      var pluginParams = {
        ...defaultParams,
        ...params
      };
      register(editor, pluginParams);
      registerCommand(editor, pluginParams);
    })
  }

  plugin()
})()
