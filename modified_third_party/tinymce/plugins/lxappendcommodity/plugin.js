/**
 * 外贸场景下， 在普通邮件添加插入入口，可以插入商品信息
 */

(function() {
    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
    var ParamsKey = 'lxAppendCommodity';
    var defaultParams = {
        text: 'Insert',
        var: 'name',
        prefix: '#{',
        subfix: '}',
    };
    
    function register(editor, params) {
        editor.ui.registry.addMenuButton('lxappendcommodity', {
            text: params.text,
            icon: 'add-contact-name',
            fetch: function(callback) {
                var mainItems = [
                    {
                        type: 'menuitem',
                        text: '商品信息',
                        onAction: function() {
                            params.onSettingProduct && params.onSettingProduct();
                        }
                    },
                    
                ];
                callback(mainItems);
            }
        });
    }

    function plugin() {
        global.add('lxappendcommodity', function(editor) {
            var params = editor.getParam(ParamsKey);
            var pluginParams = {
                ...defaultParams,
                ...params
            };
            register(editor, pluginParams);
        });
    }

    plugin()
})()