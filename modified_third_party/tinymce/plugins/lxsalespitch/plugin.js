/*
 * @Author: your name
 * @Date: 2021-11-17 15:13:56
 * @LastEditTime: 2022-01-25 15:32:33
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/modified_third_party/tinymce/plugins/lxsalespitch/plugin.js
 */
(function() {

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
  
    function register(editor) {
      function exec(command) {
        return function() {
            editor.execCommand(command)
        }
      }
      editor.ui.registry.addButton('lxsalespitch', {
          text: '跟单话术库',
          tooltip: '',
          icon: 'salespitch',
          onAction: exec('salespitchActionAction')
      })
    }

    var getSalesPitchAction = function(editor) {
      return editor.getParam('salespitchActionAction')
  }

    function registerCommand(editor) {
      editor.addCommand('salespitchActionAction', function() {
        var salesPitchAction = getSalesPitchAction(editor);
        salesPitchAction && salesPitchAction();
      })
    }

    function plugin(params) {
      global.add('lxsalespitch', function(editor) {
          register(editor);
          registerCommand(editor);
      })
    }

    plugin()
})()