/*
import { style } from '@/components/Layout/MailBox/components/ReadMail/index.scss';
 * @Author: your name
 * @Date: 2021-10-28 14:44:35
 * @LastEditTime: 2021-11-26 11:30:10
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /dev-wlj/packages/web/public/tinymce/plugins/lxcontact/plugin.js
 */
(function() {

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
    var global$1 = tinymce.util.Tools.resolve('tinymce.util.VK');

    var getLxContactAction = function(editor) {
        return editor.getParam('lxContactShow');
    }

    var getOutTools = function(editor) {
        return editor.getParam('outTools', {});
    }

    var contactAttrs = {
        style: 'color: #386EE7; outline: none; cursor: pointer; display: inline-block;',
        class: 'divNeteaseSiriusATContact',
        'data-mce-contact': true,
        'contenteditable': false
    }

    function insertContact(editor, contactArg) {
        var contactInfo = contactArg[0];
        if (typeof contactInfo === 'string') {
            editor.insertContent(contactInfo);
            return;
        }
        var contactBase = contactArg[1];
        // 将原本中的@删除 让@和联系人成为一个整体
        editor.execCommand('Delete');
        editor.insertContent('');
        contactAttrs['data-mce-contact-id'] = contactInfo.contactItemVal;
        contactAttrs['data-mce-contact-type'] = contactInfo.contactItemType;
        contactAttrs['mail-address'] = contactBase.accountName;
        contactAttrs['id'] = contactInfo.contactId;
        var contactHtml = editor.dom.createHTML('span', contactAttrs, '@' + editor.dom.encode(contactBase.contactName));
        editor.insertContent(contactHtml);
        editor.insertContent(' ');
    }

    function getPosition(editor) {
        var pos = editor.getCursorPoint(editor);
        var clientW = document.body.clientWidth;
        var clientH = document.body.clientHeight;
        // 光标距离浏览器边界位置
        return { top: pos.y, left: pos.x, right: clientW - pos.x, bottom: clientH - pos.y };
    }

    /**
     * @description: 判断左右键移动光标时候要不要跳过 元素
     * @param {*} el
     * @return {*}
     */
    function needSkipEl(el) {
        if (el.tagName === 'SPAN' && el.getAttribute('data-mce-contact') === 'true') {
            return true;
        }
    }

    function register(editor) {
        var outTools = getOutTools(editor);
        var refContactAction = false;
        var lastInputData = '';
        editor.on('input', function(e) {
            if (e.data === '@' && !/[A-Za-z0-9]/.test(lastInputData)) {
                refContactAction = true;
                // 主动触发一次，因为很多时候不需要滚动
                editor.fire('ScrollContent');
            }
            lastInputData = e.data || '';
        });
        // 左右移动鼠标时，跳过联系人
        editor.on('keydown', function(e) {
            if ([global$1.RIGHT, global$1.LEFT].includes(e.keyCode) && !e.isDefaultPrevented()) {
                if (e.shiftKey) {
                    return;
                }
                // 要在所有keydown 的callback结束后才能做这个功能
                setTimeout(function(){
                    var selection = editor.selection;
                    var node = selection.getNode();
                    if (node && needSkipEl(node)) {
                        var pos = editor.CaretPosition.after(node);
                        if (e.keyCode === global$1.LEFT) {
                            pos = editor.CaretPosition.before(node);
                        }
                        var newRange = pos.toRange();
                        editor.selection.setRng(newRange);
                    }
                });
            }
        });
        // 真正@之后需要的操作
        var refContactFn = function() {
                var contactAction = getLxContactAction(editor);
                var position = getPosition(editor);
                contactAction({
                    position
                }, function() {
                    insertContact(editor, arguments);
                });
            }
            // 只在scroll最后一次再触发 也就是如果@发生在浏览器可视范围外，需要先滚动到可视范围再触发@操作
        var scrollContentLast = outTools.debounce(function(params) {
            if (refContactAction) {
                refContactFn();
                refContactAction = false;
            }
        }, 100, { leading: false });
        // 绑定scroll 事件
        editor.on('ScrollContent', scrollContentLast)
        editor.on('click', function(e) {
            // 点击联系人
            const target = e.target;
            const mobileDom = target.tagName.toLowerCase() === 'a' && target.className === 'divNeteaseSiriusATContact';
            const deskDom = target.tagName.toLowerCase() === 'span' && target.getAttribute('data-mce-contact');
            if (mobileDom || deskDom) {
                var offsetX = target.clientWidth + 10;
                var offsetY = target.clientHeight;
                var params = getPosition(editor);
                params.left += offsetX;
                params.right -= offsetX;
                params.bottom -= offsetY;
                params.contactId = target.getAttribute('id');
                params.contactType = target.getAttribute('data-mce-contact-type');
                params.email = target.getAttribute('mail-address');
                if (!params.contactType) {
                    params.contactId = target.getAttribute('mail-address');
                    params.contactType = 'EMAIL';
                }
                editor.fire('clickContact', params)
            }
        })
    }

    function plugin() {
        global.add('lxcontact', function(editor) {
            register(editor);
        })
    }

    plugin()
})()