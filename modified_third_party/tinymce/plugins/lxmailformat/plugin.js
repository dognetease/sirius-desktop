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

    var getMailFormatAction = function(editor) {
        return editor.getParam('mailFormatAction')
    }

    var getComMailFormatAction = function(editor) {
        return editor.getParam('comMailFormatAction')
    }

    function registerCommand(editor) {
        editor.addCommand('mailFormatAction', function() {
            var mailFormatAction = getMailFormatAction(editor);
            mailFormatAction && mailFormatAction();
        });

        editor.addCommand('comMailFormatAction', function(formatId) {
            var comMailFormatAction = getComMailFormatAction(editor);
            comMailFormatAction && comMailFormatAction(formatId);
        });
    }

    function register(editor) {
        function exec(command) {
            return function(formatId) {
                editor.execCommand(command, formatId)
            }
        }
        // 是一个数组
        var templateConfig = editor.getParam('templateConfig');
        // var itemActions = [exec('comMailFormatAction'), exec('mailFormatAction')];
        var fetchCallback = [
            {
                text: 'Personal templates',
                type: 'choiceitem',
                cmd: 'comMailFormatAction',
                value: 2,
            },{
                text: 'Corporate templates',
                type: 'choiceitem',
                cmd: 'comMailFormatAction',
                value: 4,
            },{
                text: 'Recommended templates',
                type: 'choiceitem',
                cmd: 'comMailFormatAction',
                value: 3,
            },{
                text: '从营销任务选择',
                type: 'choiceitem',
                cmd: 'comMailFormatAction',
                value: -100,
            }
            // ,{
            //     text: '图片模板',
            //     type: 'choiceitem',
            //     cmd: 'mailFormatAction',
            //     value: 0,
            // }

        ];
        // 根据传入的参数配置 fetchCallback
        if (templateConfig) {
            fetchCallback = fetchCallback.filter(item => templateConfig.includes(item.value));
        }
        editor.ui.registry.addSplitButton('lxmailformat', {
            text: 'Templates',
            icon: 'mail-format',
            tooltip: '',
            onAction: exec('comMailFormatAction'),
            fetch: function (callback) {
                var currentFetchCallback = fetchCallback.slice(0, fetchCallback.length - 1)
                if (location.href.includes('#edm') || location.href.includes('#intelliMarketing')) { // 如果是营销
                    currentFetchCallback = fetchCallback;
                }
                return callback(currentFetchCallback);
            },
            onItemAction: function (api, value) {
                var item = fetchCallback.find(function (i) { return i.value === value });
                exec(item.cmd)(value);
                // itemActions[item]();
            }
        })
    }

    function plugin(params) {
        global.add('lxmailformat', function(editor) {
            register(editor);
            registerCommand(editor);
        })
    }

    plugin()
})()