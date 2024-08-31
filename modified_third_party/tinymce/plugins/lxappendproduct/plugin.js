/**
 * 外贸营销邮件编辑器「商品」按钮
 */
(function () {
  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

  function registerCommand(editor) {
    // 打开选择商品弹窗
    editor.addCommand('appendProductAction', function () {
      var action = editor.getParam('appendProductAction');
      action && action();
    });
    // 打开功能介绍面板
    editor.addCommand('showProductTipAction', function () {
      var action = editor.getParam('showProductTipAction');
      action && action();
    });
  }

  function register(editor) {
    function exec(command) {
      return function () {
        editor.execCommand(command);
      };
    }
    editor.ui.registry.addButton('lxappendproduct', {
      text: 'Product',
      tooltip: '',
      icon: 'product',
      classes: ['lxappendproduct'],
      onAction: exec('appendProductAction')
    });
    editor.ui.registry.addButton('lxproducttip', {
      text: '',
      tooltip: '',
      icon: 'attention',
      onAction: exec('showProductTipAction')
    });
  }

  function plugin(params) {
    global.add('lxappendproduct', function (editor) {
      register(editor);
      registerCommand(editor);
    });
  }

  plugin();
})();
