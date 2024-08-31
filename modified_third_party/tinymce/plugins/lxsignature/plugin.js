/*
 * @Author: your name
 * @Date: 2021-11-17 15:13:56
 * @LastEditTime: 2022-01-25 15:32:33
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/modified_third_party/tinymce/plugins/lxsignature/plugin.js
 */
(function() {

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var getSignatureAction = function(editor) {
        return editor.getParam('signatureActionAction')
    }

    function registerCommand(editor) {
        editor.addCommand('signatureActionAction', function() {
            var signatureAction = getSignatureAction(editor);
            signatureAction && signatureAction();
        })
    }

    function sigContentInsertBefore(elePreMail, sigNode) {
        var elePreMailParent = elePreMail.parentNode;
        if (typeof sigNode === 'string') {
            sigNode = document.createRange().createContextualFragment(sigNode)
        }
        elePreMailParent.insertBefore(sigNode, elePreMail);
    }

    function modifySignatureCallback(editor, params) {
        console.log('modifySignature', params.sigContent);
        var sigContent = '<div><br/></div><div><br /></div>' + params.sigContent;
        var sigNode = document.createRange().createContextualFragment(sigContent)
        var eleSignature = editor.getBody().querySelector('.mail-signature');
        var elePreMail = editor.getBody().querySelector('.pre-mail-content');
        // 新写邮件 没有默认签名 在最末尾加上签名
        if (!eleSignature && !elePreMail) {
            editor.getBody().appendChild(sigNode)
            return;
        }
        // 新写邮件 有签名 替换签名
        if (eleSignature && !elePreMail) {
            eleSignature.innerHTML = sigContent;
            return;
        }
        // 转发回复等有原始内容的邮件 在原始内容的前面加上签名
        if (!eleSignature && elePreMail) {
            sigContentInsertBefore(elePreMail, sigNode);
            return;
        }
        // 转发回复等有原始内容的邮件
        // 1. eleSignature 在原始邮件内 在原始内容的前面加上签名
        // 2. eleSignature 不在原始邮件内 替换eleSignature内容
        if (eleSignature && elePreMail) {
            var eleSignatureParent = eleSignature.parentNode;
            while (eleSignatureParent.nodeName !== 'BODY') {
                if (eleSignatureParent.isEqualNode(elePreMail)) { // 1
                    sigContentInsertBefore(elePreMail, sigContent);
                    return;
                }
                eleSignatureParent = eleSignatureParent.parentNode;
            }
            // 2
            eleSignature.innerHTML = sigContent;
        }
    }

    function allSignatureCallback(editor, params) {
        // 替换企业签名+个人签名
        console.log('allSignature', params.sigContent);
        var sigContent = params.sigContent;
        var sigNode = document.createRange().createContextualFragment('<div></div><div></div>' + sigContent)
        var entEleSignature = editor.getBody().querySelector('.mail-signature-ent');
        var personalEleSignature = editor.getBody().querySelector('.mail-signature');
        var elePreMail = editor.getBody().querySelector('.pre-mail-content');

        // 删除旧的签名
        if (entEleSignature && elePreMail) {
            // 转发回复原邮件
            var notPreMailent = true; //当前签名不是原始邮件的签名
            var entEleSignatureParent = entEleSignature.parentNode;
            while (entEleSignatureParent.nodeName !== 'BODY') {
                if (entEleSignatureParent.isEqualNode(elePreMail)) {
                    notPreMailent = false;
                    break;
                }
                entEleSignatureParent = entEleSignatureParent.parentNode;
            }
            if (notPreMailent) {
                entEleSignature.parentNode.removeChild(entEleSignature);
            }
        } else if (entEleSignature) {
            entEleSignature.parentNode.removeChild(entEleSignature);
        }
        if (personalEleSignature && elePreMail) {
            var notPreMailper = true;
            var personalEleSignatureParent = personalEleSignature.parentNode;
            while (personalEleSignatureParent.nodeName !== 'BODY') {
                if (personalEleSignatureParent.isEqualNode(elePreMail)) {
                    notPreMailper = false;
                    break;
                }
                personalEleSignatureParent = personalEleSignatureParent.parentNode;
            }
            if (notPreMailper) {
                personalEleSignature.parentNode.removeChild(personalEleSignature);
            }
        } else if (personalEleSignature) {
            personalEleSignature.parentNode.removeChild(personalEleSignature);
        }

        // 添加新的签名
        if (elePreMail) {
            // 有转发回复的原邮件
            sigContentInsertBefore(elePreMail, sigNode);
        } else {
            editor.getBody().appendChild(sigNode)
        }
    }

    function register(editor) {
        function exec(command) {
            return function() {
                editor.execCommand(command)
            }
        }
        editor.ui.registry.addButton('lxsignature', {
            text: 'Signature',
            tooltip: '',
            icon: 'signature',
            onAction: exec('signatureActionAction')
        })
        editor.on('modifySignature', function(params) {
            modifySignatureCallback(editor, params);
            editor.insertContent('');
        })
        editor.on('allSignature', function(params) {
            allSignatureCallback(editor, params);
            editor.insertContent('');
        })
    }

    function plugin(params) {
        global.add('lxsignature', function(editor) {
            register(editor);
            registerCommand(editor);
        })
    }

    plugin()
})()