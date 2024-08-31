(function() {

  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

  function register(editor) {
      editor.ui.registry.addButton('lxsplitline', {
          icon: 'split-line',
          tooltip: 'Insert line',
          onAction:function () {
            editor.insertContent('<hr>')
          }
      })
  }

  function plugin() {
      global.add('lxsplitline', function(editor) {
          register(editor);
      })
  }

  plugin()
})()