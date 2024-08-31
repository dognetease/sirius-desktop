(function() {

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
    var CommandKey = 'appendVar';
    var ParamsKey = 'lxAppendVar';
    var defaultParams = {
        text: '变量',
        var: 'name',
        prefix: '#{',
        subfix: '}',
        // variableList?: []
        // onClick: function() {}
    };

    function registerCommand(editor, params) {
        editor.addCommand(CommandKey, function(ui, value) {
            console.log('lxAppendVar', arguments);
            var elm = editor.selection.getNode();
            if (elm && elm.nodeName.toUpperCase() === 'SPAN' && elm.classList.contains('mce-lx-var')) {
                editor.execCommand('mceRemoveNode', false, elm);
            } else {
                var variable = params.prefix + value + params.subfix;
                editor.undoManager.transact(function() {
                    editor.insertContent('<span class="mce-lx-var mceNonEditable">' + variable + '</span>');
                });
            }
            typeof params.onClick === 'function' && params.onClick();
        });
    }

    function register(editor, params) {
        function exec(command) {
            return function() {
                editor.execCommand(command)
            }
        }
        editor.ui.registry.addButton('lxappendvar', {
            text: '变量',
            icon: 'varibleIcon',
            onAction: function(p1, p2, p3) {
              const rect = p2.getBoundingClientRect()
              var onVaribleClickAction = editor.getParam('onVaribleClickAction');
              onVaribleClickAction({ top: rect.top, left: rect.right });
            }
        });
    }

    function plugin() {
        global.add('lxappendvar', function(editor) {
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
