/*
 * @Author: your name
 * @Date: 2021-11-03 10:18:46
 * @LastEditTime: 2022-02-23 16:34:27
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /dev-wlj/packages/web/public/tinymce/plugins/lxmailformat/plugin.js
 */
(function() {
    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
  
    var getCaptureScreenAction = function(editor) {
        return editor.getParam('captureScreenAction') || function() {};
    }
  
    function register(editor) {
        var captureScreenAction = getCaptureScreenAction(editor);
        editor.addCommand('comCaptureScreen', function(value) {
          captureScreenAction(editor, value);
        });
        var fetchCallback = [
            {
                text: '截图',
                type: 'choiceitem',
                value: '0',
            },{
                text: '隐藏当前窗口截图',
                type: 'choiceitem',
                value: '1', // 隐藏当前窗口截图
            }
        ];
        editor.ui.registry.addSplitButton('lxcapturescreen', {
            text: '',
            icon: 'capture-screen',
            tooltip: '截图',
            onAction: function () {
              editor.execCommand('comCaptureScreen', 0);
            },
            fetch: function (callback) {
              return callback(fetchCallback);
          },
            onItemAction: function (api, value) {
                editor.execCommand('comCaptureScreen', value);
            }
        })
    }
  
    function plugin(params) {
        global.add('lxcapturescreen', function(editor) {
            register(editor);
        })
    }
  
    plugin()
  })()