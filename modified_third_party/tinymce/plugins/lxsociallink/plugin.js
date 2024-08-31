(function () {

  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
  var getSignatureAction = function (editor) {
    return editor.getParam('socialLinkAction')
  }

  function registerCommand(editor) {
    editor.addCommand('socialLinkAction', function () {
      var signatureAction = getSignatureAction(editor);
      signatureAction && signatureAction();
    })
  }

  function register(editor) {
    function exec(command) {
      return function () {
        editor.execCommand(command)
      }
    }
    editor.ui.registry.addButton('lxsociallink', {
      text: '社媒链接',
      tooltip: '',
      icon: 'sociallink',
      onAction: exec('socialLinkAction')
    })
  }

  function plugin(params) {
    global.add('lxsociallink', function (editor) {
      register(editor);
      registerCommand(editor);
    })
  }

  plugin()
})()