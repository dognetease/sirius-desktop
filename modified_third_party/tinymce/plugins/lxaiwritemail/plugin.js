// 编辑器ai写信插件
(function() {
  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
  var getAction = function(editor) {
    return editor.getParam('aiWriteMailAction');
  };

  function registerCommand(editor) {
    editor.addCommand('aiWriteMailAction', function() {
      var action = getAction(editor);
      action && action('write');
    });
  }

  function register(editor) {
    function exec(command) {
      return function() {
        editor.execCommand(command);
      };
    }
    editor.ui.registry.addButton('lxaiwritemail', {
      text: 'AI写信',
      tooltip: '',
      classes: ['ai-writemail-btn', 'ai-text-color'],
      // beforeend: '<div class="ai-btn-text-count"><span class="used">10</span>/<span class="total">10</span></div>',
      beforeend: '<div style="font-size:10px;margin-left:2px;background: #3FDE9C;border-radius: 2px;height:14px;text-align:center;color:#fff;line-height:14px;width:28px;">限免</div>',
      icon: 'aiwritemail',
      onAction: exec('aiWriteMailAction')
    });
  }

  function plugin(params) {
    global.add('lxaiwritemail', function(editor) {
      register(editor);
      registerCommand(editor);
    });
  }

  plugin();
})();
