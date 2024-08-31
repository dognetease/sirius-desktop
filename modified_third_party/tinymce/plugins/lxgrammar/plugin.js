(function() {

  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

  function register(editor) {
      editor.ui.registry.addButton('lxgrammar', {
          icon: 'grammar',
          tooltip: 'Grammar Correction',
          onAction:function () {
            var grammarAction = editor.getParam('grammarAction');
            grammarAction && grammarAction(editor);
          }
      })
  }

  function plugin() {
      global.add('lxgrammar', function(editor) {
          register(editor);
      })
  }

  plugin()
})()