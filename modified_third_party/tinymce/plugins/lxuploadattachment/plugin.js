/*
 * @Author: your name
 * @Date: 2021-11-17 15:13:56
 * @LastEditTime: 2022-01-25 15:31:36
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/modified_third_party/tinymce/plugins/lxuploadattachment/plugin.js
 */
(function() {

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var getUploadAttachmentAction = function(editor) {
        return editor.getParam('uploadAttachmentAction')
    }

    var getUploadFromOfficeDocAction = function(editor) {
        return editor.getParam('uploadFromOfficeDocAction')
    }

    var getUploadFromNormalAtt = function(editor) {
        return editor.getParam('uploadFromNormalAtt')
    }

    // var getUploadCloudAttachmentAction = function(editor) {
    //     return editor.getParam('uploadCloudAttachmentAction')
    // }

    function registerCommand(editor) {
        editor.addCommand('uploadAttachmentAction', function() {
            var uploadAttachmentAction = getUploadAttachmentAction(editor);
            uploadAttachmentAction && uploadAttachmentAction({
                clickUploadAttach: true,
                usingCloud: false
            });
        })

        editor.addCommand('uploadCloudAttachmentAction', function() {
            var uploadAttachmentAction = getUploadAttachmentAction(editor);
            uploadAttachmentAction && uploadAttachmentAction({
                clickUploadAttach: true,
                usingCloud: true
            });
        })

        editor.addCommand('uploadFromOfficeDoc', function() {
            var action = getUploadFromOfficeDocAction(editor);
            action && action();
        })

        editor.addCommand('uploadFromNormalAtt', function() {
            var action = getUploadFromNormalAtt(editor);
            action && action();
        })
    }

    function register(editor) {
        function exec(command) {
            return function() {
                editor.execCommand(command)
            }
        }
        // editor.ui.registry.addMenuItem('lxnomalattachment', {
        //     text: '添加附件',
        //     icon: 'none',
        //     onAction: exec('uploadAttachmentAction')
        // })
        // editor.ui.registry.addMenuItem('lxcloudattachment', {
        //     text: '添加为云附件',
        //     icon: 'none',
        //     onAction: exec('uploadCloudAttachmentAction')
        // })
        var itemActions = [exec('uploadAttachmentAction'), exec('uploadCloudAttachmentAction'), exec('uploadFromOfficeDoc'), exec('uploadFromNormalAtt')];
        var uploadAttachmentConfig = editor.getParam('uploadAttachmentConfig');
        var fetchList = [{
                text: 'General attachment',
                type: 'choiceitem', // 必要的 文档没写的 type
                inputFileClasses: ['mac-input-file-attachment2'],
                classes: ['position-group'],
                onFileChange: function(e) {
                    var uploadAttachment = editor.getParam('uploadAttachment');
                    uploadAttachment(e.target.dom.files);
                },
                tooltip: '',
                value: 0,
            },
            {
                text: 'Cloud attachment',
                type: 'choiceitem',
                inputFileClasses: ['mac-input-file-attachment2'],
                classes: ['position-group'],
                onFileChange: function(e) {
                    var uploadAttachment = editor.getParam('uploadAttachment');
                    uploadAttachment(e.target.dom.files, true);
                },
                tooltip: '',
                value: 1,
            },
            {
                text: 'Cloud Documents',
                type: 'choiceitem',
                tooltip: '',
                value: 2,
            },
            {
                text: 'Mail attachment',
                type: 'choiceitem',
                tooltip: '',
                value: 3,
            }
        ];
        if (uploadAttachmentConfig) {
            fetchList = fetchList.filter(item => uploadAttachmentConfig.includes(item.value));
        }
        editor.ui.registry.addSplitButton('lxuploadattachment', {
            text: 'Add attachment',
            icon: 'upload-attachment',
            onAction: exec('uploadAttachmentAction'),
            inputFileClasses: ['mac-input-file-attachment'],
            classes: ['position-group'],
            onFileChange: function(e) {
                var uploadAttachment = editor.getParam('uploadAttachment');
                uploadAttachment(e.target.dom.files);
            },
            fetch: function(callback) {
                return callback(fetchList)
            },
            onItemAction: function(api, item) {
                itemActions[item]();
            },
            tooltip: '',
        })

    }

    function plugin(params) {
        global.add('lxuploadattachment', function(editor) {
            register(editor);
            registerCommand(editor);
        })
    }

    plugin()
})()
