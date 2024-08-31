/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 *
 * Version: 5.7.0 (2021-02-10)
 */
(function() {
    'use strict';

    var Cell = function(initial) {
        var value = initial;
        var get = function() {
            return value;
        };
        var set = function(v) {
            value = v;
        };
        return {
            get: get,
            set: set
        };
    };

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
    var global$trim = tinymce.util.Tools.resolve('tinymce.trim');

    var hasProPlugin = function(editor) {
        if (editor.hasPlugin('powerpaste', true)) {
            if (typeof window.console !== 'undefined' && window.console.log) {
                window.console.log('PowerPaste is incompatible with Paste plugin! Remove \'paste\' from the \'plugins\' option.');
            }
            return true;
        } else {
            return false;
        }
    };

    var get = function(clipboard, quirks) {
        return {
            clipboard: clipboard,
            quirks: quirks
        };
    };

    var noop = function() {};
    var constant = function(value) {
        return function() {
            return value;
        };
    };
    var never = constant(false);
    var always = constant(true);

    var none = function() {
        return NONE;
    };
    var NONE = function() {
        var eq = function(o) {
            return o.isNone();
        };
        var call = function(thunk) {
            return thunk();
        };
        var id = function(n) {
            return n;
        };
        var me = {
            fold: function(n, _s) {
                return n();
            },
            is: never,
            isSome: never,
            isNone: always,
            getOr: id,
            getOrThunk: call,
            getOrDie: function(msg) {
                throw new Error(msg || 'error: getOrDie called on none.');
            },
            getOrNull: constant(null),
            getOrUndefined: constant(undefined),
            or: id,
            orThunk: call,
            map: none,
            each: noop,
            bind: none,
            exists: never,
            forall: always,
            filter: none,
            equals: eq,
            equals_: eq,
            toArray: function() {
                return [];
            },
            toString: constant('none()')
        };
        return me;
    }();
    var some = function(a) {
        var constant_a = constant(a);
        var self = function() {
            return me;
        };
        var bind = function(f) {
            return f(a);
        };
        var me = {
            fold: function(n, s) {
                return s(a);
            },
            is: function(v) {
                return a === v;
            },
            isSome: always,
            isNone: never,
            getOr: constant_a,
            getOrThunk: constant_a,
            getOrDie: constant_a,
            getOrNull: constant_a,
            getOrUndefined: constant_a,
            or: self,
            orThunk: self,
            map: function(f) {
                return some(f(a));
            },
            each: function(f) {
                f(a);
            },
            bind: bind,
            exists: bind,
            forall: bind,
            filter: function(f) {
                return f(a) ? me : NONE;
            },
            toArray: function() {
                return [a];
            },
            toString: function() {
                return 'some(' + a + ')';
            },
            equals: function(o) {
                return o.is(a);
            },
            equals_: function(o, elementEq) {
                return o.fold(never, function(b) {
                    return elementEq(a, b);
                });
            }
        };
        return me;
    };
    var from = function(value) {
        return value === null || value === undefined ? NONE : some(value);
    };
    var Optional = {
        some: some,
        none: none,
        from: from
    };

    var isSimpleType = function(type) {
        return function(value) {
            return typeof value === type;
        };
    };
    var isNullable = function(a) {
        return a === null || a === undefined;
    };
    var isNonNullable = function(a) {
        return !isNullable(a);
    };
    var isFunction = isSimpleType('function');

    var nativeSlice = Array.prototype.slice;
    var exists = function(xs, pred) {
        for (var i = 0, len = xs.length; i < len; i++) {
            var x = xs[i];
            if (pred(x, i)) {
                return true;
            }
        }
        return false;
    };
    var map = function(xs, f) {
        var len = xs.length;
        var r = new Array(len);
        for (var i = 0; i < len; i++) {
            var x = xs[i];
            r[i] = f(x, i);
        }
        return r;
    };
    var each = function(xs, f) {
        for (var i = 0, len = xs.length; i < len; i++) {
            var x = xs[i];
            f(x, i);
        }
    };
    var filter = function(xs, pred) {
        var r = [];
        for (var i = 0, len = xs.length; i < len; i++) {
            var x = xs[i];
            if (pred(x, i)) {
                r.push(x);
            }
        }
        return r;
    };
    var foldl = function(xs, f, acc) {
        each(xs, function(x) {
            acc = f(acc, x);
        });
        return acc;
    };
    var from$1 = isFunction(Array.from) ? Array.from : function(x) {
        return nativeSlice.call(x);
    };

    var value = function() {
        var subject = Cell(Optional.none());
        var clear = function() {
            return subject.set(Optional.none());
        };
        var set = function(s) {
            return subject.set(Optional.some(s));
        };
        var isSet = function() {
            return subject.get().isSome();
        };
        var on = function(f) {
            return subject.get().each(f);
        };
        return {
            clear: clear,
            set: set,
            isSet: isSet,
            on: on
        };
    };

    var checkRange = function(str, substr, start) {
        return substr === '' || str.length >= substr.length && str.substr(start, start + substr.length) === substr;
    };
    var startsWith = function(str, prefix) {
        return checkRange(str, prefix, 0);
    };
    var endsWith = function(str, suffix) {
        return checkRange(str, suffix, str.length - suffix.length);
    };
    var repeat = function(s, count) {
        return count <= 0 ? '' : new Array(count + 1).join(s);
    };

    var global$1 = tinymce.util.Tools.resolve('tinymce.Env');

    var global$2 = tinymce.util.Tools.resolve('tinymce.util.Delay');

    var global$3 = tinymce.util.Tools.resolve('tinymce.util.Promise');

    var global$4 = tinymce.util.Tools.resolve('tinymce.util.VK');

    var global$ImageUploader = tinymce.util.Tools.resolve('tinymce.util.ImageUploader');

    var firePastePreProcess = function(editor, html, internal, isWordHtml) {
        return editor.fire('PastePreProcess', {
            content: html,
            internal: internal,
            wordContent: isWordHtml
        });
    };
    var firePastePostProcess = function(editor, node, internal, isWordHtml) {
        return editor.fire('PastePostProcess', {
            node: node,
            internal: internal,
            wordContent: isWordHtml
        });
    };
    var firePastePlainTextToggle = function(editor, state) {
        return editor.fire('PastePlainTextToggle', { state: state });
    };
    var firePaste = function(editor, ieFake) {
        return editor.fire('paste', { ieFake: ieFake });
    };

    var global$5 = tinymce.util.Tools.resolve('tinymce.util.Tools');

    var shouldBlockDrop = function(editor) {
        return editor.getParam('paste_block_drop', false);
    };
    var shouldPasteDataImages = function(editor) {
        return editor.getParam('paste_data_images', false);
    };
    var shouldFilterDrop = function(editor) {
        return editor.getParam('paste_filter_drop', true);
    };
    var getPreProcess = function(editor) {
        return editor.getParam('paste_preprocess');
    };
    var getPostProcess = function(editor) {
        return editor.getParam('paste_postprocess');
    };
    var getWebkitStyles = function(editor) {
        return editor.getParam('paste_webkit_styles');
    };
    var getJuice = function(editor) {
        return editor.getParam('juice');
    };
    var getRecognizeDiskUrl = function(editor) {
        return editor.getParam('recognizeDiskUrl');
    };
    var getDefaultStyle = function(editor) {
        return editor.getParam('defaultStyle');
    };
    var shouldRemoveWebKitStyles = function(editor) {
        return editor.getParam('paste_remove_styles_if_webkit', true);
    };
    var shouldMergeFormats = function(editor) {
        return editor.getParam('paste_merge_formats', true);
    };
    var isSmartPasteEnabled = function(editor) {
        return editor.getParam('smart_paste', true);
    };
    var isPasteAsTextEnabled = function(editor) {
        return editor.getParam('paste_as_text', false);
    };
    var getRetainStyleProps = function(editor) {
        return editor.getParam('paste_retain_style_properties');
    };
    var getWordValidElements = function(editor) {
        var defaultValidElements = '-strong/b,-em/i,-u,-span,-p,-ol,-ul,-li,-h1,-h2,-h3,-h4,-h5,-h6,' + '-p/div,-a[href|name],sub,sup,strike,br,del,table[width],tr,' + 'td[colspan|rowspan|width],th[colspan|rowspan|width],thead,tfoot,tbody';
        return editor.getParam('paste_word_valid_elements', defaultValidElements);
    };
    var shouldConvertWordFakeLists = function(editor) {
        return editor.getParam('paste_convert_word_fake_lists', true);
    };
    var shouldUseDefaultFilters = function(editor) {
        return editor.getParam('paste_enable_default_filters', true);
    };
    var getValidate = function(editor) {
        return editor.getParam('validate');
    };
    var getAllowHtmlDataUrls = function(editor) {
        return editor.getParam('allow_html_data_urls', false, 'boolean');
    };
    var getPasteDataImages = function(editor) {
        return editor.getParam('paste_data_images', false, 'boolean');
    };
    var getImagesDataImgFilter = function(editor) {
        return editor.getParam('images_dataimg_filter');
    };
    var getClipboard = function(editor) {
        return editor.getParam('clipboard');
    };
    var getImagesReuseFilename = function(editor) {
        return editor.getParam('images_reuse_filename');
    };
    var getForcedRootBlock = function(editor) {
        return editor.getParam('forced_root_block');
    };
    var getForcedRootBlockAttrs = function(editor) {
        return editor.getParam('forced_root_block_attrs');
    };
    var getTabSpaces = function(editor) {
        return editor.getParam('paste_tab_spaces', 4, 'number');
    };
    var getAllowedImageFileTypes = function(editor) {
        var defaultImageFileTypes = 'jpeg,jpg,jpe,jfi,jif,jfif,png,gif,bmp,webp';
        return global$5.explode(editor.getParam('images_file_types', defaultImageFileTypes, 'string'));
    };
    var getHandleCopyImg = function(editor) {
        return editor.getParam('handleCopyImg');
    };
    var getUploadAttachmentWithFiles = function(editor) {
        var defaultFn = function() {};
        return editor.getParam('uploadAttachmentWithFiles', defaultFn);
    };

    var internalMimeType = 'x-tinymce/html';
    var internalMark = '<!-- ' + internalMimeType + ' -->';
    var mark = function(html) {
        return internalMark + html;
    };
    var unmark = function(html) {
        return html.replace(internalMark, '');
    };
    var isMarked = function(html) {
        return html.indexOf(internalMark) !== -1;
    };
    var internalHtmlMime = function() {
        return internalMimeType;
    };

    var global$6 = tinymce.util.Tools.resolve('tinymce.html.Entities');

    var isPlainText = function(text) {
        return !/<(?:\/?(?!(?:div|p|br|span)>)\w+|(?:(?!(?:span style="white-space:\s?pre;?">)|br\s?\/>))\w+\s[^>]+)>/i.test(text);
    };
    var toBRs = function(text) {
        return text.replace(/\r?\n/g, '<br>');
    };
    var openContainer = function(rootTag, rootAttrs) {
        var key;
        var attrs = [];
        var tag = '<' + rootTag;
        if (typeof rootAttrs === 'object') {
            for (key in rootAttrs) {
                if (rootAttrs.hasOwnProperty(key)) {
                    attrs.push(key + '="' + global$6.encodeAllRaw(rootAttrs[key]) + '"');
                }
            }
            if (attrs.length) {
                tag += ' ' + attrs.join(' ');
            }
        }
        return tag + '>';
    };
    var toBlockElements = function(text, rootTag, rootAttrs) {
        var blocks = text.split(/\n\n/);
        var tagOpen = openContainer(rootTag, rootAttrs);
        var tagClose = '</' + rootTag + '>';
        var paragraphs = global$5.map(blocks, function(p) {
            return p.split(/\n/).join('<br />');
        });
        var stitch = function(p) {
            return tagOpen + p + tagClose;
        };
        return paragraphs.length === 1 ? paragraphs[0] : global$5.map(paragraphs, stitch).join('');
    };
    var convert = function(text, rootTag, rootAttrs) {
        return rootTag ? toBlockElements(text, rootTag === true ? 'p' : rootTag, rootAttrs) : toBRs(text);
    };

    var global$7 = tinymce.util.Tools.resolve('tinymce.html.DomParser');

    var global$8 = tinymce.util.Tools.resolve('tinymce.html.Serializer');

    var nbsp = '\xA0';

    var global$9 = tinymce.util.Tools.resolve('tinymce.html.Node');

    var global$a = tinymce.util.Tools.resolve('tinymce.html.Schema');

    var filter$1 = function(content, items) {
        global$5.each(items, function(v) {
            if (v.constructor === RegExp) {
                content = content.replace(v, '');
            } else {
                content = content.replace(v[0], v[1]);
            }
        });
        return content;
    };
    var innerText = function(html) {
        var schema = global$a();
        var domParser = global$7({}, schema);
        var text = '';
        var shortEndedElements = schema.getShortEndedElements();
        var ignoreElements = global$5.makeMap('script noscript style textarea video audio iframe object', ' ');
        var blockElements = schema.getBlockElements();
        var walk = function(node) {
            var name = node.name,
                currentNode = node;
            if (name === 'br') {
                text += '\n';
                return;
            }
            if (name === 'wbr') {
                return;
            }
            if (shortEndedElements[name]) {
                text += ' ';
            }
            if (ignoreElements[name]) {
                text += ' ';
                return;
            }
            if (node.type === 3) {
                text += node.value;
            }
            if (!node.shortEnded) {
                if (node = node.firstChild) {
                    do {
                        walk(node);
                    } while (node = node.next);
                }
            }
            if (blockElements[name] && currentNode.next) {
                text += '\n';
                if (name === 'p') {
                    text += '\n';
                }
            }
        };
        html = filter$1(html, [/<!\[[^\]]+\]>/g]);
        walk(domParser.parse(html));
        return text;
    };
    var trimHtml = function(html) {
        var trimSpaces = function(all, s1, s2) {
            if (!s1 && !s2) {
                return ' ';
            }
            return nbsp;
        };
        // 原写法如下正则
        // /^[\s\S]*<body[^>]*>\s*|\s*<\/body[^>]*>[\s\S]*$/ig 只保留body里面的内容
        // 性能消耗极大
        // 换成split方式去删除body标签前后的东西
        // 如果不删除body \r\n 会被删除
        // 6w+字符 耗时从 20558 ms 到 2.3ms 性能提高万倍
        // 1.26 /<body[^>]*>/ => /<body[^>]*>\s*/ 多个 \s* 如果没有这个会出现复制的内容会多出空格 SIRIUS-3501 
        // '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body style="line-height: 1.5;"> \x3C!--StartFragment-->试测\x3C!--EndFragment-->  </body></html>'
        // 上文会有多余的空格
        html = html.split(/<body[^>]*>\s*/).pop();
        html = html.split(/\s*<\/body[^>]*>/).shift();
        html = filter$1(html, [
            // /^[\s\S]*<body[^>]*>\s*|\s*<\/body[^>]*>[\s\S]*$/ig,
            /<!--StartFragment-->|<!--EndFragment-->/g, [
                /( ?)<span class="Apple-converted-space">\u00a0<\/span>( ?)/g,
                trimSpaces
            ],
            /<br class="Apple-interchange-newline">/g,
            /<br>$/i
        ]);
        return html;
    };
    var createIdGenerator = function(prefix) {
        var count = 0;
        return function() {
            return prefix + count++;
        };
    };
    var getImageMimeType = function(ext) {
        var lowerExt = ext.toLowerCase();
        var mimeOverrides = {
            jpg: 'jpeg',
            jpe: 'jpeg',
            jfi: 'jpeg',
            jif: 'jpeg',
            jfif: 'jpeg',
            pjpeg: 'jpeg',
            pjp: 'jpeg',
            svg: 'svg+xml'
        };
        return global$5.hasOwn(mimeOverrides, lowerExt) ? 'image/' + mimeOverrides[lowerExt] : 'image/' + lowerExt;
    };

    var isWordContent = function(content) {
        return /<font face="Times New Roman"|class="?Mso|style="[^"]*\bmso-|style='[^']*\bmso-|w:WordDocument/i.test(content) || /class="OutlineElement/.test(content) || /id="?docs\-internal\-guid\-/.test(content);
    };
    var isNumericList = function(text) {
        var found;
        var patterns = [
            /^[IVXLMCD]{1,2}\.[ \u00a0]/,
            /^[ivxlmcd]{1,2}\.[ \u00a0]/,
            /^[a-z]{1,2}[\.\)][ \u00a0]/,
            /^[A-Z]{1,2}[\.\)][ \u00a0]/,
            /^[0-9]+\.[ \u00a0]/,
            /^[\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d]+\.[ \u00a0]/,
            /^[\u58f1\u5f10\u53c2\u56db\u4f0d\u516d\u4e03\u516b\u4e5d\u62fe]+\.[ \u00a0]/
        ];
        text = text.replace(/^[\u00a0 ]+/, '');
        global$5.each(patterns, function(pattern) {
            if (pattern.test(text)) {
                found = true;
                return false;
            }
        });
        return found;
    };
    var isBulletList = function(text) {
        return /^[\s\u00a0]*[\u2022\u00b7\u00a7\u25CF]\s*/.test(text);
    };
    var convertFakeListsToProperLists = function(node) {
        var currentListNode, prevListNode, lastLevel = 1;
        var getText = function(node) {
            var txt = '';
            if (node && node.type === 3) {
                return node.value;
            }
            if (node = node.firstChild) {
                do {
                    txt += getText(node);
                } while (node = node.next);
            }
            return txt;
        };
        var trimListStart = function(node, regExp) {
            if (node && node.type === 3) {
                if (regExp.test(node.value)) {
                    node.value = node.value.replace(regExp, '');
                    return false;
                }
            }
            if (node = node.firstChild) {
                do {
                    if (!trimListStart(node, regExp)) {
                        return false;
                    }
                } while (node = node.next);
            }
            return true;
        };
        var removeIgnoredNodes = function(node) {
            if (node._listIgnore) {
                node.remove();
                return;
            }
            if (node = node.firstChild) {
                do {
                    removeIgnoredNodes(node);
                } while (node = node.next);
            }
        };
        var convertParagraphToLi = function(paragraphNode, listName, start) {
            var level = paragraphNode._listLevel || lastLevel;
            if (level !== lastLevel) {
                if (level < lastLevel) {
                    if (currentListNode) {
                        currentListNode = currentListNode.parent.parent;
                    }
                } else {
                    prevListNode = currentListNode;
                    currentListNode = null;
                }
            }
            if (!currentListNode || currentListNode.name !== listName) {
                prevListNode = prevListNode || currentListNode;
                currentListNode = new global$9(listName, 1);
                if (start > 1) {
                    currentListNode.attr('start', '' + start);
                }
                paragraphNode.wrap(currentListNode);
            } else {
                currentListNode.append(paragraphNode);
            }
            paragraphNode.name = 'li';
            if (level > lastLevel && prevListNode) {
                prevListNode.lastChild.append(currentListNode);
            }
            lastLevel = level;
            removeIgnoredNodes(paragraphNode);
            trimListStart(paragraphNode, /^\u00a0+/);
            trimListStart(paragraphNode, /^\s*([\u2022\u00b7\u00a7\u25CF]|\w+\.)/);
            trimListStart(paragraphNode, /^\u00a0+/);
        };
        var elements = [];
        var child = node.firstChild;
        while (typeof child !== 'undefined' && child !== null) {
            elements.push(child);
            child = child.walk();
            if (child !== null) {
                while (typeof child !== 'undefined' && child.parent !== node) {
                    child = child.walk();
                }
            }
        }
        for (var i = 0; i < elements.length; i++) {
            node = elements[i];
            if (node.name === 'p' && node.firstChild) {
                var nodeText = getText(node);
                if (isBulletList(nodeText)) {
                    convertParagraphToLi(node, 'ul');
                    continue;
                }
                if (isNumericList(nodeText)) {
                    var matches = /([0-9]+)\./.exec(nodeText);
                    var start = 1;
                    if (matches) {
                        start = parseInt(matches[1], 10);
                    }
                    convertParagraphToLi(node, 'ol', start);
                    continue;
                }
                if (node._listLevel) {
                    convertParagraphToLi(node, 'ul', 1);
                    continue;
                }
                currentListNode = null;
            } else {
                prevListNode = currentListNode;
                currentListNode = null;
            }
        }
    };
    var filterStyles = function(editor, validStyles, node, styleValue) {
        var outputStyles = {},
            matches;
        var styles = editor.dom.parseStyle(styleValue);
        global$5.each(styles, function(value, name) {
            switch (name) {
                case 'mso-list':
                    matches = /\w+ \w+([0-9]+)/i.exec(styleValue);
                    if (matches) {
                        node._listLevel = parseInt(matches[1], 10);
                    }
                    if (/Ignore/i.test(value) && node.firstChild) {
                        node._listIgnore = true;
                        node.firstChild._listIgnore = true;
                    }
                    break;
                case 'horiz-align':
                    name = 'text-align';
                    break;
                case 'vert-align':
                    name = 'vertical-align';
                    break;
                case 'font-color':
                case 'mso-foreground':
                    name = 'color';
                    break;
                case 'mso-background':
                case 'mso-highlight':
                    name = 'background';
                    break;
                case 'font-weight':
                case 'font-style':
                    if (value !== 'normal') {
                        outputStyles[name] = value;
                    }
                    return;
                case 'mso-element':
                    if (/^(comment|comment-list)$/i.test(value)) {
                        node.remove();
                        return;
                    }
                    break;
            }
            if (name.indexOf('mso-comment') === 0) {
                node.remove();
                return;
            }
            if (name.indexOf('mso-') === 0) {
                return;
            }
            if (getRetainStyleProps(editor) === 'all' || validStyles && validStyles[name]) {
                outputStyles[name] = value;
            }
        });
        if (/(bold)/i.test(outputStyles['font-weight'])) {
            delete outputStyles['font-weight'];
            node.wrap(new global$9('b', 1));
        }
        if (/(italic)/i.test(outputStyles['font-style'])) {
            delete outputStyles['font-style'];
            node.wrap(new global$9('i', 1));
        }
        outputStyles = editor.dom.serializeStyle(outputStyles, node.name);
        if (outputStyles) {
            return outputStyles;
        }
        return null;
    };
    var filterWordContent = function(editor, content) {
        var validStyles;
        var retainStyleProperties = getRetainStyleProps(editor);
        if (retainStyleProperties) {
            validStyles = global$5.makeMap(retainStyleProperties.split(/[, ]/));
        }
        content = filter$1(content, [
            /<br class="?Apple-interchange-newline"?>/gi,
            /<b[^>]+id="?docs-internal-[^>]*>/gi,
            /<!--[\s\S]+?-->/gi,
            /<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|img|meta|link|style|\w:\w+)(?=[\s\/>]))[^>]*>/gi, [
                /<(\/?)s>/gi,
                '<$1strike>'
            ],
            [
                /&nbsp;/gi,
                nbsp
            ],
            [
                /<span\s+style\s*=\s*"\s*mso-spacerun\s*:\s*yes\s*;?\s*"\s*>([\s\u00a0]*)<\/span>/gi,
                function(str, spaces) {
                    return spaces.length > 0 ? spaces.replace(/./, ' ').slice(Math.floor(spaces.length / 2)).split('').join(nbsp) : '';
                }
            ]
        ]);
        var validElements = getWordValidElements(editor);
        var schema = global$a({
            valid_elements: validElements,
            valid_children: '-li[p]'
        });
        global$5.each(schema.elements, function(rule) {
            if (!rule.attributes.class) {
                rule.attributes.class = {};
                rule.attributesOrder.push('class');
            }
            if (!rule.attributes.style) {
                rule.attributes.style = {};
                rule.attributesOrder.push('style');
            }
        });
        var domParser = global$7({}, schema);
        domParser.addAttributeFilter('style', function(nodes) {
            var i = nodes.length,
                node;
            while (i--) {
                node = nodes[i];
                node.attr('style', filterStyles(editor, validStyles, node, node.attr('style')));
                if (node.name === 'span' && node.parent && !node.attributes.length) {
                    node.unwrap();
                }
            }
        });
        domParser.addAttributeFilter('class', function(nodes) {
            var i = nodes.length,
                node, className;
            while (i--) {
                node = nodes[i];
                className = node.attr('class');
                if (/^(MsoCommentReference|MsoCommentText|msoDel)$/i.test(className)) {
                    node.remove();
                }
                node.attr('class', null);
            }
        });
        domParser.addNodeFilter('del', function(nodes) {
            var i = nodes.length;
            while (i--) {
                nodes[i].remove();
            }
        });
        domParser.addNodeFilter('a', function(nodes) {
            var i = nodes.length,
                node, href, name;
            while (i--) {
                node = nodes[i];
                href = node.attr('href');
                name = node.attr('name');
                if (href && href.indexOf('#_msocom_') !== -1) {
                    node.remove();
                    continue;
                }
                if (href && href.indexOf('file://') === 0) {
                    href = href.split('#')[1];
                    if (href) {
                        href = '#' + href;
                    }
                }
                if (!href && !name) {
                    node.unwrap();
                } else {
                    if (name && !/^_?(?:toc|edn|ftn)/i.test(name)) {
                        node.unwrap();
                        continue;
                    }
                    node.attr({
                        href: href,
                        name: name
                    });
                }
            }
        });
        var rootNode = domParser.parse(content);
        if (shouldConvertWordFakeLists(editor)) {
            convertFakeListsToProperLists(rootNode);
        }
        content = global$8({ validate: getValidate(editor) }, schema).serialize(rootNode);
        return content;
    };
    var preProcess = function(editor, content) {
        return shouldUseDefaultFilters(editor) ? filterWordContent(editor, content) : content;
    };

    var preProcess$1 = function(editor, html) {
        var parser = global$7({}, editor.schema);
        parser.addNodeFilter('meta', function(nodes) {
            global$5.each(nodes, function(node) {
                node.remove();
            });
        });
        var fragment = parser.parse(html, {
            forced_root_block: false,
            isRootContent: true
        });
        return global$8({ validate: getValidate(editor) }, editor.schema).serialize(fragment);
    };
    var processResult = function(content, cancelled) {
        return {
            content: content,
            cancelled: cancelled
        };
    };
    var postProcessFilter = function(editor, html, internal, isWordHtml) {
        var tempBody = editor.dom.create('div', { style: 'display:none' }, html);
        var postProcessArgs = firePastePostProcess(editor, tempBody, internal, isWordHtml);
        return processResult(postProcessArgs.node.innerHTML, postProcessArgs.isDefaultPrevented());
    };
    var filterContent = function(editor, content, internal, isWordHtml) {
        var preProcessArgs = firePastePreProcess(editor, content, internal, isWordHtml);
        var filteredContent = preProcess$1(editor, preProcessArgs.content);
        // 避免对粘贴进来的东西进行修改 fix QIYE163-24328
        // force: boolean, 如果注册了paste_preprocess 并且 args添加了force 参数，
        // 即使用钩子内修改后的content
        // if (preProcessArgs && preProcessArgs.force) {
        //   content = preProcessArgs.content;
        // }
        // var filteredContent = preProcess$1(editor, content);
        if (editor.hasEventListeners('PastePostProcess') && !preProcessArgs.isDefaultPrevented()) {
            return postProcessFilter(editor, filteredContent, internal, isWordHtml);
        } else {
            return processResult(filteredContent, preProcessArgs.isDefaultPrevented());
        }
    };
    var process = function(editor, html, internal) {
        var isWordHtml = isWordContent(html);
        var content = isWordHtml ? preProcess(editor, html) : html;
        return filterContent(editor, content, internal, isWordHtml);
    };

    var uploadImage = function(editor, blobInfo) {
        return global$ImageUploader(editor).upload([blobInfo], false).then(function(results) {
            if (results.length === 0) {
                return global$3.reject('Failed to upload image');
            } else if (results[0].status === false) {
                return global$3.reject(results[0].error);
            } else {
                return results[0];
            }
        });
    };

    var blobToDataUri = function(blob) {
        return new global$3(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function() {
                resolve(reader.result);
            };
            reader.onerror = function() {
                reject(reader.error.message);
            };
            reader.readAsDataURL(blob);
        });
    };

    var createBlobCache = function(editor, file, dataUrl) {
        return editor.editorUpload.blobCache.create({
            blob: file,
            // blobUri: blobUri,
            name: file.name ? file.name.replace(/\.[^\.]+$/, '') : null,
            filename: file.name,
            base64: dataUrl.split(',')[1]
        });
    };

    var uniqueImgId = createIdGenerator('pasteImgId' + new Date().getTime());
    var base64ImgReg = /<img[^\/>]* src=['|"]data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64),(([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?)['|"][^>]+\/>/i;
    var base64SrcReg = / src=['|"]data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64),(([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?)['|"]/i;
    var outLinkImgReg = /<img[^\/>]* src=['"](blob:)?((https?)|(sirius)):\/\/([\s\w.\/]+\/?)\S*['"][^>]+\/>/i;
    var outLinkSrcReg = / src=['"]((blob:)?((https?)|(sirius)):\/\/([\s\w.\/]+\/?)\S*)['"]/i;
    var blobLinkImgReg = /<img[^\/>]* src=['"](blob:)file:\/\/\/?\/?([\s\w.\/]+\/?)\S*['"][^>]+\/>/i;
    var blobLinkSrcReg = / src=['"]((blob:)file:\/\/\/?\/?([\s\w.\/]+\/?)\S*)['"]/i;
    var fileLinkSrcReg = / src=['"](file:\/\/\/?\/?(([\s\w.\/]+\/?)\S*))['"]/i;
    var nonHostLinkImgReg = /<img[^\/>]* src=['"](?!data:|https?:|sirius:|blob:|file:|ftp:)([\s\w.\/]+\/?)\S*['"][^>]+\/>/i;
    var nonHostLinkSrcReg = / src=['"]((?!data:|https?:|sirius:|blob:|file:|ftp:)([\s\w.\/]+\/?)\S*)['"]/i;
    // data: https?:// sirius:// blob: file:// ftp://
    var imgUploadStatus = function(editor) {
        return function(img) {
            return editor.dom.createHTML('div', { class: "paste-img-wrapper", style: '' }, img);
        }
    }

    var hasNonHostImg = function(editor, html) {
        var res = nonHostLinkImgReg.test(html);
        var htmlTransfer = html;
        var newReg = new RegExp(nonHostLinkImgReg, 'g');
        if (res) {
            htmlTransfer = html.replace(newReg, imgUploadStatus(editor));
        }
        return { res: res, html: htmlTransfer };
    }

    var hasBase64Img = function(editor, html) {
        var res = base64ImgReg.test(html);
        var htmlTransfer = html;
        var newReg = new RegExp(base64ImgReg, 'g');
        var replaceReal = imgUploadStatus(editor);
        if (res) {
            // htmlTransfer = html.replace(newReg, imgUploadStatus(editor));
            htmlTransfer = html.replace(newReg, function(img) {
                // 用长度判断base64是不是一个icon ppt word 的icon长度是1570以下，所以此处估算了一个3000
                // 如果是icon就不处理，因为云文档链接的icon如果处理了会有样式问题
                if (img.length < 3000) {
                    return img;
                }
                return replaceReal(img);
            });
        }
        return { res: res, html: htmlTransfer };
    }

    var hasOutLinkImg = function(editor, html) {
        var res = outLinkImgReg.test(html);
        var htmlTransfer = html;
        var newReg = new RegExp(outLinkImgReg, 'g');
        if (res) {
            htmlTransfer = html.replace(newReg, imgUploadStatus(editor));
        }
        return { res: res, html: htmlTransfer };
    }

    var hasFileLinkImg = function(editor, html) {
        var res = blobLinkImgReg.test(html);
        var htmlTransfer = html;
        var newReg = new RegExp(blobLinkImgReg, 'g');
        if (res) {
            htmlTransfer = html.replace(newReg, imgUploadStatus(editor));
        }
        return { res: res, html: htmlTransfer };
    }

    var base64DataToFile = function(data, type) {
        var bstr = atob(data);
        var n = bstr.length;
        var u8Array = new Uint8Array(n);
        while (n--) {
            u8Array[n] = bstr.charCodeAt(n);
        }
        return new File([u8Array], 'picture.png', { type })
    }

    var uploadSucc = function(editor, res, id) {
        editor.undoManager.transact(function() {
            var src = res.url;
            var originUrl = res.originUrl;
            var el = editor.getBody().querySelector('[upload-id='+ id +']');
            el.setAttribute('data-timedate', new Date().getTime() + '');
            el.removeAttribute('upload-id');
            el.setAttribute('wirte-origin-src', originUrl);
            // el.setAttribute('data-mce-src', src);
            return el.setAttribute('src', src);
        });
    }

    var btnWrapperClick = function(e, restartFn, delFn) {
        var target = e.target;
        if (!target) return;
        if (target.className.includes('paste-img-restart')) {
            restartFn();
        } else if (target.className.includes('paste-img-del')) {
            delFn();
        }
    }

    var uploadImg = function(editor, file, id) {
        blobToDataUri(file).then(function(dataUrl) {
            var imgEl = editor.dom.select('[upload-id='+ id +']')[0];
            if (!imgEl) return;
            var parent = imgEl.parentElement;
            if (parent.className.indexOf('paste-img-wrapper') === -1) return;
            var icon = editor.ui.registry.getAll().icons['upload-error'];
            var title = editor.dom.createHTML('div', { class: "paste-img-title" }, icon + '图片上传失败...');

            var load = document.createElement('div');
            load.className = 'paste-img-load load-instance';
            load.setAttribute('contenteditable', false);
            load.innerHTML = '图片上传中.....';
            var reload = document.createElement('div');
            reload.className = 'paste-img-load paste-img-reload hide';
            reload.setAttribute('contenteditable', false);
            reload.innerHTML = title;
            var holder = document.createElement('div');
            holder.className = 'holder';
            holder.setAttribute('style', 'height: 70px; width: 200px');

            parent.appendChild(holder);
            parent.appendChild(load);
            parent.appendChild(reload);
            // 以上代码是给图片加上遮罩层 和 上传失败的遮罩提醒
            function delLoad() {
                editor.dom.remove(parent);
                parent = null;
            }
            editor.dom.removeClass(load, 'hide');
            load.addEventListener('DOMNodeRemoved', delLoad);
            var blobInfo = createBlobCache(editor, file, dataUrl);
            uploadImage(editor, blobInfo).then(function(result) {
                if (!parent) return;
                load.removeEventListener('DOMNodeRemoved', delLoad);
                var parentNode = parent.parentNode;
                if (parent.firstChild) {
                parentNode.insertBefore(parent.firstChild, parent);
                }
                parentNode.removeChild(parent);
                // uploadSucc 只能放在最下面，否则后面的dom 都发生变化了，之前的引用(reload load holder) 等都不再指向最新的dom
                uploadSucc(editor, result.url, id);
                // editor.fire('blur');
            }).catch(function(err) {
                if (!parent) return;
                load.removeEventListener('DOMNodeRemoved', delLoad);
                imgUploadFail(editor, id, function() { uploadImg(editor, file, id); });
            });
        });
    }

    var imgUploadFail = function(editor, id, restart) {
        // 图片上传失败后 重传 和 删除操作
        var imgEl = editor.dom.select('[upload-id='+ id +']')[0];
        if (!imgEl) return;
        var parent = imgEl.parentElement;
        var load = editor.dom.select('.load-instance', parent);
        var holder = editor.dom.select('.holder', parent)[0];
        editor.dom.addClass(load, 'hide');
        var reload = editor.dom.select('.paste-img-reload', parent)[0];
        editor.dom.removeClass(reload, 'hide');
        if (reload && reload.childElementCount < 2) {
            var wrapperContent = '<span class="btn paste-img-restart">重试</span><span class="btn paste-img-del">删除</span>';
            var wrapper = editor.dom.create('div', { class: 'btn-wrapper' }, wrapperContent);
            wrapper.addEventListener('click', function(e) {
                btnWrapperClick(e, function() {
                    editor.dom.removeClass(load, 'hide');
                    editor.dom.addClass(reload, 'hide');
                    if (restart) {
                        restart();
                    }
                }, function() {
                    if (reload) editor.dom.remove(reload); // 偶现 删除 parent 后 reload holder没有删完 出现没有上传失败的图片，但是提醒失败导致不能发信
                    if (load) editor.dom.remove(load); // 偶现 删除 parent 后 reload holder没有删完 出现没有上传失败的图片，但是提醒失败导致不能发信
                    if (holder) editor.dom.remove(holder); // 偶现 删除 parent 后 reload holder没有删完 出现没有上传失败的图片，但是提醒失败导致不能发信
                    editor.dom.remove(parent);
                    editor.insertContent(' ');
                });
            });
            reload.appendChild(wrapper);
        }
    }

    var fetchImage = function(url) {
        return new global$3(function(resolve, reject) {
            const im = new Image();
            im.crossOrigin = 'Anonymous';
            im.onload = function() {
                resolve(im);
            }
            im.onerror = function(e) {
                reject();
            }
            // 复制的链接存在 xxx?id=xxx&amp;name=xxx  在解析时候会成为 xxx?id=xxx&&name=xxx
            im.src = url.replace(/amp;/g, '');
            fetch(url)
                .then(function(response) {
                    // debugger;
                    return response.blob();
                })
        })
    }

    var getBlobData = function(url) {
        return new global$3(function(resolve, reject) {
            fetchImage(url).then(function(img) {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png', 1);
            }).catch(function(err) {
                reject(err)
            })
        })
    }

    var urlToFile = function(url) {
        return getBlobData(url).then(function(blob) {
            var file = new File([blob], 'picture.png', { type: 'image/png' });
            return file;
        }).catch(function(err) {
            reject(err)
        })
    }

    var transferBase64Img = function(editor, html) {
        return html.replace(new RegExp(base64SrcReg, 'g'), function() {
            var base64Data = arguments[4];
            var type = arguments[1];
            var src = arguments[0];
            // 这地方和方法 hasBase64Img 里面一样 长度估算是不是 icon
            // 因为复制的内容可能同时存在icon 和 需要转换的图片
            if (src.length < 3000) return src;
            var id = uniqueImgId();
            uploadImg(editor, base64DataToFile(base64Data, type), id)
            return src + ' upload-id="' + id + '"'
        })
    }

    var outLinkImgUpload = function(editor, url, id) {
        urlToFile(url).then(function(file) {
            uploadImg(editor, file, id);
        }).catch(function(err) {
            imgUploadFail(editor, id, function() { outLinkImgUpload(editor, url, id) })
            // var inElectron = editor.getParam('in_electron', false)
            // var img = editor.dom.select('[upload-id='+ id +']')[0];
            // if (!inElectron && img) {
            //     var node = img.parentNode;
            //     var parentNode = node.parentNode;
            //     parentNode.insertBefore(img, node);
            //     parentNode.removeChild(node);
            // } else {
            //     imgUploadFail(editor, id, function() { outLinkImgUpload(editor, url, id) })
            // }
        })
    }

    var fileLinkImgUpload = function(editor, url, id) {
        var inElectron = editor.getParam('in_electron', false)
        if (!inElectron) {
            setTimeout(function() {
                imgUploadFail(editor, id, function() { fileLinkImgUpload(editor, url, id) });
            })
            return
        }
        window.electronLib.fsManage.readFile(url).then(function(file) {
            uploadImg(editor, file, id);
        }).catch(function(err) {
            imgUploadFail(editor, id, function() { fileLinkImgUpload(editor, url, id) })
        })
    }

    var transferOutLinkImg = function name(editor, html) {
        const getToken = editor.getParam('getToken', function() { return '' });
        const token = getToken();
        return html.replace(new RegExp(outLinkSrcReg, 'g'), function() {
            var url = arguments[1];
            if (url.includes('https://cospread.office.163.com') && token) {
                url += `&QIYE_TOKEN=${token}`
            }
            var src = arguments[0];
            var id = uniqueImgId();
            outLinkImgUpload(editor, url, id);
            return src + ' upload-id="' + id + '"'
        })
    }

    var transferNonHostImg = function (editor, html) {
        return html.replace(new RegExp(nonHostLinkSrcReg, 'g'), function() {
            var url = arguments[1];
            var src = arguments[0];
            var id = uniqueImgId();
            outLinkImgUpload(editor, url, id);
            return src + ' upload-id="' + id + '"'
        })
    }

    var transferFileLinkImg = function (editor, html) {
        return html.replace(new RegExp(blobLinkSrcReg, 'g'), function() {
            var url = arguments[1];
            var src = arguments[0];
            var id = uniqueImgId();
            fileLinkImgUpload(editor, url, id);
            return src + ' upload-id="' + id + '"'
        })
    }

    // 给需要上传的图片 加上loading
    var wrapperImgHtml = function(editor, html) {
        var localFileHtml = html.replace(new RegExp(fileLinkSrcReg, 'g'), function() {
            var url = arguments[2];
            return ' src="sirius://sirius.file/' + decodeURIComponent(url) + '"';
        })
        var hasOutLinkImgRes = hasOutLinkImg(editor, localFileHtml);
        var hasBase64ImgRes = hasBase64Img(editor, hasOutLinkImgRes.html);
        var hasFileLinkImgRes = hasFileLinkImg(editor, hasBase64ImgRes.html);
        var hasNonHostImgRes = hasNonHostImg(editor, hasFileLinkImgRes.html);
        return {
            // 取最后一个顺便别乱了
            html: hasNonHostImgRes.html,
            hasOutLinkImg: hasOutLinkImgRes.res,
            hasBase64Img: hasBase64ImgRes.res,
            hasFileLinkImg: hasFileLinkImgRes.res,
            hasNonHostImg: hasNonHostImgRes.res
        }
    }

    var pasteHtml = function(editor, html) {
        var wrapperHtml = wrapperImgHtml(editor, html);
        var transferHtml = wrapperHtml.html;
        if (wrapperHtml.hasBase64Img) {
            transferHtml = transferBase64Img(editor, transferHtml);
        }
        if (wrapperHtml.hasOutLinkImg) {
            transferHtml = transferOutLinkImg(editor, transferHtml);
        }
        if (wrapperHtml.hasFileLinkImg) {
            transferHtml = transferFileLinkImg(editor, transferHtml);
        }
        if (wrapperHtml.hasNonHostImg) {
            transferHtml = transferNonHostImg(editor, transferHtml);
        }
        editor.insertContent(transferHtml, {
            merge: shouldMergeFormats(editor),
            paste: true
        });
        editor.fire('afterRenderContent', {after: function() {
            var selection = editor.selection;
            var bookmark = selection.getBookmark();
            var marker = editor.dom.get(bookmark.id + '_start');
            selection.scrollIntoView(marker, true);
        // 滚动条在最上面，两次有一次不行
        }})
        return true;
    };
    var isAbsoluteUrl = function(url) {
        return /^https?:\/\/[\w\?\-\/+=.&%@~#]+$/i.test(url);
    };
    var isImageUrl = function(editor, url) {
        return isAbsoluteUrl(url) && exists(getAllowedImageFileTypes(editor), function(type) {
            return endsWith(url.toLowerCase(), '.' + type.toLowerCase());
        });
    };
    var createImage = function(editor, url, pasteHtmlFn) {
        editor.undoManager.extra(function() {
            pasteHtmlFn(editor, url);
        }, function() {
            editor.insertContent('<img src="' + url + '">');
        });
        return true;
    };
    var createLink = function(editor, url, pasteHtmlFn) {
        editor.undoManager.extra(function() {
            pasteHtmlFn(editor, url);
        }, function() {
            editor.execCommand('mceInsertLink', false, url);
        });
        return true;
    };
    var linkSelection = function(editor, html, pasteHtmlFn) {
        return editor.selection.isCollapsed() === false && isAbsoluteUrl(html) ? createLink(editor, html, pasteHtmlFn) : false;
    };
    var insertImage = function(editor, html, pasteHtmlFn) {
        return isImageUrl(editor, html) ? createImage(editor, html, pasteHtmlFn) : false;
    };
    var smartInsertContent = function(editor, html) {
        global$5.each([
            linkSelection,
            insertImage,
            pasteHtml
        ], function(action) {
            return action(editor, html, pasteHtml) !== true;
        });
    };
    var insertContent = function(editor, html, pasteAsText) {
        if (pasteAsText || isSmartPasteEnabled(editor) === false) {
            pasteHtml(editor, html);
        } else {
            smartInsertContent(editor, html);
        }
    };

    var isCollapsibleWhitespace = function(c) {
        return ' \f\t\x0B'.indexOf(c) !== -1;
    };
    var isNewLineChar = function(c) {
        return c === '\n' || c === '\r';
    };
    var isNewline = function(text, idx) {
        return idx < text.length && idx >= 0 ? isNewLineChar(text[idx]) : false;
    };
    var normalizeWhitespace = function(editor, text) {
        var tabSpace = repeat(' ', getTabSpaces(editor));
        var normalizedText = text.replace(/\t/g, tabSpace);
        var result = foldl(normalizedText, function(acc, c) {
            if (isCollapsibleWhitespace(c) || c === nbsp) {
                if (acc.pcIsSpace || acc.str === '' || acc.str.length === normalizedText.length - 1 || isNewline(normalizedText, acc.str.length + 1)) {
                    return {
                        pcIsSpace: false,
                        str: acc.str + nbsp
                    };
                } else {
                    return {
                        pcIsSpace: true,
                        str: acc.str + ' '
                    };
                }
            } else {
                return {
                    pcIsSpace: isNewLineChar(c),
                    str: acc.str + c
                };
            }
        }, {
            pcIsSpace: false,
            str: ''
        });
        return result.str;
    };

    var doPaste = function(editor, content, internal, pasteAsText) {
        var args = process(editor, content, internal);
        if (args.cancelled === false) {
            insertContent(editor, args.content, pasteAsText);
            // insertContent(editor, content, pasteAsText);
        }
    };
    var pasteHtml$1 = function(editor, html, internalFlag) {
        var internal = internalFlag ? internalFlag : isMarked(html);
        doPaste(editor, unmark(html), internal, false);
    };
    var pasteText = function(editor, text) {
        var encodedText = editor.dom.encode(text).replace(/\r\n/g, '\n');
        var normalizedText = normalizeWhitespace(editor, encodedText);
        var html = convert(normalizedText, getForcedRootBlock(editor), getForcedRootBlockAttrs(editor));
        doPaste(editor, html, false, true);
    };
    var getDataTransferItems = function(dataTransfer) {
        var items = {};
        var mceInternalUrlPrefix = 'data:text/mce-internal,';
        if (dataTransfer) {
            if (dataTransfer.getData) {
                var legacyText = dataTransfer.getData('Text');
                if (legacyText && legacyText.length > 0) {
                    if (legacyText.indexOf(mceInternalUrlPrefix) === -1) {
                        items['text/plain'] = legacyText;
                    }
                }
            }
            if (dataTransfer.types) {
                for (var i = 0; i < dataTransfer.types.length; i++) {
                    var contentType = dataTransfer.types[i];
                    try {
                        items[contentType] = dataTransfer.getData(contentType);
                    } catch (ex) {
                        items[contentType] = '';
                    }
                }
            }
        }
        return items;
    };
    var getClipboardContent = function(editor, clipboardEvent) {
        return getDataTransferItems(clipboardEvent.clipboardData || editor.getDoc().dataTransfer);
    };
    var hasContentType = function(clipboardContent, mimeType) {
        return mimeType in clipboardContent && clipboardContent[mimeType] && clipboardContent[mimeType].length > 0;
    };
    var hasHtmlOrText = function(content) {
        return hasContentType(content, 'text/html') || hasContentType(content, 'text/plain');
    };
    var parseDataUri = function(uri) {
        var matches = /data:([^;]+);base64,([a-z0-9\+\/=]+)/i.exec(uri);
        if (matches) {
            return {
                type: matches[1],
                // todo Maximum 1
                data: decodeURIComponent(matches[2])
            };
        } else {
            return {
                type: null,
                data: null
            };
        }
    };
    var isValidDataUriImage = function(editor, imgElm) {
        var filter = getImagesDataImgFilter(editor);
        return filter ? filter(imgElm) : true;
    };
    var extractFilename = function(editor, str) {
        var m = str.match(/([\s\S]+?)(?:\.[a-z0-9.]+)$/i);
        return isNonNullable(m) ? editor.dom.encode(m[1]) : null;
    };
    var uniqueId = createIdGenerator('mceclip');
    var pasteImage = function(editor, imageItem) {
        var _a = parseDataUri(imageItem.uri),
            base64 = _a.data,
            type = _a.type;
        var id = uniqueId();
        var file = imageItem.blob;
        var img = new Image();
        img.src = imageItem.uri;
        if (isValidDataUriImage(editor, img)) {
            var blobCache = editor.editorUpload.blobCache;
            var blobInfo = void 0;
            var existingBlobInfo = blobCache.getByData(base64, type);
            if (!existingBlobInfo) {
                var useFileName = getImagesReuseFilename(editor) && isNonNullable(file.name);
                var name_1 = useFileName ? extractFilename(editor, file.name) : id;
                var filename = useFileName ? file.name : undefined;
                blobInfo = blobCache.create(id, file, base64, name_1, filename);
                blobCache.add(blobInfo);
            } else {
                blobInfo = existingBlobInfo;
            }
            pasteHtml$1(editor, '<img src="' + blobInfo.blobUri() + '">', false);
        } else {
            pasteHtml$1(editor, '<img src="' + imageItem.uri + '">', false);
        }
    };
    var isClipboardEvent = function(event) {
        return event && event.type === 'paste';
    };
    var isDataTransferItem = function(item) {
        return isNonNullable(item.getAsFile);
    };
    var readFilesAsDataUris = function(items) {
        return global$3.all(map(items, function(item) {
            return new global$3(function(resolve) {
                var blob = isDataTransferItem(item) ? item.getAsFile() : item;
                var reader = new window.FileReader();
                reader.onload = function() {
                    resolve({
                        blob: blob,
                        uri: reader.result
                    });
                };
                reader.readAsDataURL(blob);
            });
        }));
    };
    var isImage = function(editor) {
        var allowedExtensions = getAllowedImageFileTypes(editor);
        return function(file) {
            if (!file) return false;
            return startsWith(file.type, 'image/') && exists(allowedExtensions, function(extension) {
                return getImageMimeType(extension) === file.type;
            });
        };
    };
    var getImagesFromDataTransfer = function(editor, dataTransfer) {
        var items = dataTransfer.items ? map(from$1(dataTransfer.items), function(item) {
            return item.getAsFile();
        }) : [];
        var files = dataTransfer.files ? from$1(dataTransfer.files) : [];
        return filter(items.length > 0 ? items : files, isImage(editor));
    };
    var pasteImageData = function(editor, e, rng) {
        var dataTransfer = isClipboardEvent(e) ? e.clipboardData : e.dataTransfer;
        if (getPasteDataImages(editor) && dataTransfer) {
            var images = getImagesFromDataTransfer(editor, dataTransfer);
            if (images.length > 0) {
                e.preventDefault();
                readFilesAsDataUris(images).then(function(fileResults) {
                    if (rng) {
                        editor.selection.setRng(rng);
                    }
                    each(fileResults, function(result) {
                        pasteImage(editor, result);
                    });
                });
                return true;
            }
        }
        if (dataTransfer) {
            if (dataTransfer.items !== undefined) {
                var pasteFiles = [];
                // Chrome有items属性，对Chrome的单独处理
                for (let i = 0; i < dataTransfer.items.length; i++) {
                    const item = dataTransfer.items[i];
                    // 用webkitGetAsEntry禁止上传文件夹
                    if (item.kind === 'file' && item.webkitGetAsEntry().isFile) {
                        const file = item.getAsFile();
                        pasteFiles.push(file);
                    }
                }
                if (pasteFiles.length !== dataTransfer.files.length) {
                    var AntdMessage = editor.getParam('AntdMessage', {});
                    AntdMessage.error && AntdMessage.error('附件不支持上传文件夹');
                } else {
                    var uploadAttachmentWithFiles = getUploadAttachmentWithFiles(editor);
                    uploadAttachmentWithFiles(dataTransfer.files);
                }
                e.preventDefault();
                return true;
            }
        }
        return false;
    };
    var isBrokenAndroidClipboardEvent = function(e) {
        var clipboardData = e.clipboardData;
        return navigator.userAgent.indexOf('Android') !== -1 && clipboardData && clipboardData.items && clipboardData.items.length === 0;
    };
    var isKeyboardPasteEvent = function(e) {
        return global$4.metaKeyPressed(e) && e.keyCode === 86 || e.shiftKey && e.keyCode === 45;
    };
    var registerEventHandlers = function(editor, pasteBin, pasteFormat) {
        var keyboardPasteEvent = value();
        var keyboardPastePressed = value();
        var keyboardPastePlainTextState;
        editor.on('keyup', keyboardPastePressed.clear);
        editor.on('keydown', function(e) {
            var removePasteBinOnKeyUp = function(e) {
                if (isKeyboardPasteEvent(e) && !e.isDefaultPrevented()) {
                    pasteBin.remove();
                }
            };
            if (isKeyboardPasteEvent(e) && !e.isDefaultPrevented()) {
                keyboardPastePlainTextState = e.shiftKey && e.keyCode === 86;
                if (keyboardPastePlainTextState && global$1.webkit && navigator.userAgent.indexOf('Version/') !== -1) {
                    return;
                }
                e.stopImmediatePropagation();
                keyboardPasteEvent.set(e);
                keyboardPastePressed.set(true);
                if (global$1.ie && keyboardPastePlainTextState) {
                    e.preventDefault();
                    firePaste(editor, true);
                    return;
                }
                pasteBin.remove();
                pasteBin.create();
                editor.once('keyup', removePasteBinOnKeyUp);
                editor.once('paste', function() {
                    editor.off('keyup', removePasteBinOnKeyUp);
                });
            }
        });
        var insertClipboardContent = function(editor, clipboardContent, isKeyBoardPaste, plainTextMode, internal) {
            var content;
            if (hasContentType(clipboardContent, 'text/html')) {
                content = clipboardContent['text/html'];
            } else {
                content = pasteBin.getHtml();
                internal = internal ? internal : isMarked(content);
                if (pasteBin.isDefaultContent(content)) {
                    plainTextMode = true;
                }
            }
            // !important trimHtml 这里会将内容改变
            content = trimHtml(content);
            pasteBin.remove();
            var isPlainTextHtml = internal === false && isPlainText(content);
            var isImage = isImageUrl(editor, content);
            if (!content.length || isPlainTextHtml && !isImage) {
                plainTextMode = true;
            }
            if (plainTextMode || isImage) {
                if (hasContentType(clipboardContent, 'text/plain') && isPlainTextHtml) {
                    content = clipboardContent['text/plain'];
                } else {
                    content = innerText(content);
                }
            }
            if (pasteBin.isDefaultContent(content)) {
                if (!isKeyBoardPaste) {
                    editor.windowManager.alert('Please use Ctrl+V/Cmd+V keyboard shortcuts to paste contents.');
                }
                return;
            }
            if (plainTextMode) {
                pasteText(editor, content);
            } else {
                pasteHtml$1(editor, content, internal);
            }
        };
        var getLastRng = function() {
            return pasteBin.getLastRng() || editor.selection.getRng();
        };
        // 默认给表格加上边框
        var setDefaultStyle = function(str) {
            // excel 复制过来的表格 style='border-collapse:\r\n collapse;width:130pt'
            // 有个\r\n 在serializer.serializeToString(doc) 的时候会变成
            // style="border-collapse:&#10; collapse;width:130pt"
            // 在当前编辑器没问题，但在其他iframe里面展示 border-collapse属性就会失效了， 没有 collapse 导致表格边框变成2px 变粗
            // var newStr = str.replace(/\r\n/g, '') 这样从Word复制来的东西又有问题(如下)，坑爹的的office
            // word 复制过来的HTML 会存在 <b\r\nstyle='mso-bidi-font-weight:normal'> 标签直接挨着\r\n
            // 直接把、\r\n 替换成空就形成了一个 <bstyle 标签。无法识别
            // office这么喜欢\r\n原因是什么
            var newStr = str.replace(/\r\n/g, ' ');
            // .xl65 {mso-number-format:"\\@";} 从Excel复制过来的表格如果有数字超过11位会使用科学计数法，巴拉巴拉。总之会带上这个 css样式
            // 但是这个 \\@ 在服务端会被查杀 导致整个style标签的内容都没了，所以需要处理一下
            var newStr = newStr.replace(/\\@/g, '');
            // mac mso-number-format:"\\#\\,\\#\\#0\\.00_\\)\\;\\[Red\\]\\\\\\(\\#\\,\\#\\#0\\.00\\\\\\)"
            // mso-number-format:"\#\,\#\#0\.00_ ;\[Red\]\\-\#\,\#\#0\.00\\"
            // 从Excel复制过来的string 会有各种奇怪的 \\ 导致作为信件内容会被服务端查杀
            var newStr = newStr.replaceAll('mso-number-format:"\\#\\,\\#\\#0\\.00_\\)\\;\\[Red\\]\\\\\\(\\#\\,\\#\\#0\\.00\\\\\\)"', '');
            var newStr = newStr.replaceAll(/mso-number-format:"[^"]+"/g, '');
            var parser = new DOMParser();
            var doc = parser.parseFromString(newStr, 'text/html');
            var serializer = new XMLSerializer();
            var styleDiv = document.createElement('style');
            styleDiv.setAttribute('type', 'text/css');
            var defaultStyle = getDefaultStyle(editor);
            styleDiv.innerHTML = defaultStyle;
            doc.querySelector('head').appendChild(styleDiv);
            var resStr = serializer.serializeToString(doc);
            return resStr;
        }
        editor.on('paste', function(e) {
            var isKeyboardPaste = keyboardPasteEvent.isSet() || keyboardPastePressed.isSet();
            if (isKeyboardPaste) {
                keyboardPasteEvent.clear();
            }
            var clipboardContent = getClipboardContent(editor, e);
            var recognizeDiskUrl = getRecognizeDiskUrl(editor);
            if (recognizeDiskUrl && recognizeDiskUrl(editor, clipboardContent)) {
                pasteBin.remove();
                e.preventDefault();
                return;
            }
            var juice = getJuice(editor);
            // juice 将style标签里面的样式转成行内样式
            var textHtmlContent = clipboardContent['text/html'];
            if (textHtmlContent) {
                // .replace('\'t', 't') 这个操作因为从文档复制过来的内容存在一下情况
                // Don't 的单引号和 data-content = 后面的单引号被认为是一对。。。 导致内容显示不全
                // 如果直接原生粘贴 浏览器倒是会帮助解决，但是内容也会被拆了乱七八糟，反正是和预期差别很大
                // 所以此处的解决方案是 把Don't 的'替换掉
                // <article data-content = '"nodes":[{"type":"text","id":"cGhG-1651155142627","leaves":[{"text":"主题：Don't
                clipboardContent['text/html'] = juice(setDefaultStyle(textHtmlContent.replace('\'t', 't')));
            }
            var plainTextMode = pasteFormat.get() === 'text' || keyboardPastePlainTextState;
            var internal = hasContentType(clipboardContent, internalHtmlMime());
            keyboardPastePlainTextState = false;
            if (e.isDefaultPrevented() || isBrokenAndroidClipboardEvent(e)) {
                pasteBin.remove();
                return;
            }
            if (!hasHtmlOrText(clipboardContent) && pasteImageData(editor, e, getLastRng())) {
                pasteBin.remove();
                return;
            }
            if (!isKeyboardPaste) {
                e.preventDefault();
            }
            if (global$1.ie && (!isKeyboardPaste || e.ieFake) && !hasContentType(clipboardContent, 'text/html')) {
                pasteBin.create();
                editor.dom.bind(pasteBin.getEl(), 'paste', function(e) {
                    e.stopPropagation();
                });
                editor.getDoc().execCommand('Paste', false, null);
                clipboardContent['text/html'] = pasteBin.getHtml();
            }
            if (hasContentType(clipboardContent, 'text/html')) {
                e.preventDefault();
                if (!internal) {
                    internal = isMarked(clipboardContent['text/html']);
                }
                insertClipboardContent(editor, clipboardContent, isKeyboardPaste, plainTextMode, internal);
            } else {
                global$2.setEditorTimeout(editor, function() {
                    insertClipboardContent(editor, clipboardContent, isKeyboardPaste, plainTextMode, internal);
                }, 0);
            }
        });
    };
    var registerEventsAndFilters = function(editor, pasteBin, pasteFormat) {
        registerEventHandlers(editor, pasteBin, pasteFormat);
        var src;
        editor.parser.addNodeFilter('img', function(nodes, name, args) {
            var isPasteInsert = function(args) {
                return args.data && args.data.paste === true;
            };
            var remove = function(node) {
                if (!node.attr('data-mce-object') && src !== global$1.transparentSrc) {
                    node.remove();
                }
            };
            var isWebKitFakeUrl = function(src) {
                return src.indexOf('webkit-fake-url') === 0;
            };
            var isDataUri = function(src) {
                return src.indexOf('data:') === 0;
            };
            if (!getPasteDataImages(editor) && isPasteInsert(args)) {
                var i = nodes.length;
                while (i--) {
                    src = nodes[i].attr('src');
                    if (!src) {
                        continue;
                    }
                    if (isWebKitFakeUrl(src)) {
                        remove(nodes[i]);
                    } else if (!getAllowHtmlDataUrls(editor) && isDataUri(src)) {
                        remove(nodes[i]);
                    }
                }
            }
        });
    };

    var getPasteBinParent = function(editor) {
        return global$1.ie && editor.inline ? document.body : editor.getBody();
    };
    var isExternalPasteBin = function(editor) {
        return getPasteBinParent(editor) !== editor.getBody();
    };
    var delegatePasteEvents = function(editor, pasteBinElm, pasteBinDefaultContent) {
        if (isExternalPasteBin(editor)) {
            editor.dom.bind(pasteBinElm, 'paste keyup', function(_e) {
                if (!isDefault(editor, pasteBinDefaultContent)) {
                    editor.fire('paste');
                }
            });
        }
    };
    var create = function(editor, lastRngCell, pasteBinDefaultContent) {
        var dom = editor.dom,
            body = editor.getBody();
        lastRngCell.set(editor.selection.getRng());
        var pasteBinElm = editor.dom.add(getPasteBinParent(editor), 'div', {
            'id': 'mcepastebin',
            'class': 'mce-pastebin',
            'contentEditable': true,
            'data-mce-bogus': 'all',
            'style': 'position: fixed; top: 50%; width: 10px; height: 10px; overflow: hidden; opacity: 0'
        }, pasteBinDefaultContent);
        if (global$1.ie || global$1.gecko) {
            dom.setStyle(pasteBinElm, 'left', dom.getStyle(body, 'direction', true) === 'rtl' ? 65535 : -65535);
        }
        dom.bind(pasteBinElm, 'beforedeactivate focusin focusout', function(e) {
            e.stopPropagation();
        });
        delegatePasteEvents(editor, pasteBinElm, pasteBinDefaultContent);
        pasteBinElm.focus();
        editor.selection.select(pasteBinElm, true);
    };
    var remove = function(editor, lastRngCell) {
        if (getEl(editor)) {
            var pasteBinClone = void 0;
            var lastRng = lastRngCell.get();
            while (pasteBinClone = editor.dom.get('mcepastebin')) {
                editor.dom.remove(pasteBinClone);
                editor.dom.unbind(pasteBinClone);
            }
            if (lastRng) {
                editor.selection.setRng(lastRng);
            }
        }
        lastRngCell.set(null);
    };
    var getEl = function(editor) {
        return editor.dom.get('mcepastebin');
    };
    var getHtml = function(editor) {
        var copyAndRemove = function(toElm, fromElm) {
            toElm.appendChild(fromElm);
            editor.dom.remove(fromElm, true);
        };
        var pasteBinClones = global$5.grep(getPasteBinParent(editor).childNodes, function(elm) {
            return elm.id === 'mcepastebin';
        });
        var pasteBinElm = pasteBinClones.shift();
        global$5.each(pasteBinClones, function(pasteBinClone) {
            copyAndRemove(pasteBinElm, pasteBinClone);
        });
        var dirtyWrappers = editor.dom.select('div[id=mcepastebin]', pasteBinElm);
        for (var i = dirtyWrappers.length - 1; i >= 0; i--) {
            var cleanWrapper = editor.dom.create('div');
            pasteBinElm.insertBefore(cleanWrapper, dirtyWrappers[i]);
            copyAndRemove(cleanWrapper, dirtyWrappers[i]);
        }
        return pasteBinElm ? pasteBinElm.innerHTML : '';
    };
    var getLastRng = function(lastRng) {
        return lastRng.get();
    };
    var isDefaultContent = function(pasteBinDefaultContent, content) {
        return content === pasteBinDefaultContent;
    };
    var isPasteBin = function(elm) {
        return elm && elm.id === 'mcepastebin';
    };
    var isDefault = function(editor, pasteBinDefaultContent) {
        var pasteBinElm = getEl(editor);
        return isPasteBin(pasteBinElm) && isDefaultContent(pasteBinDefaultContent, pasteBinElm.innerHTML);
    };
    var PasteBin = function(editor) {
        var lastRng = Cell(null);
        var pasteBinDefaultContent = '%MCEPASTEBIN%';
        return {
            create: function() {
                return create(editor, lastRng, pasteBinDefaultContent);
            },
            remove: function() {
                return remove(editor, lastRng);
            },
            getEl: function() {
                return getEl(editor);
            },
            getHtml: function() {
                return getHtml(editor);
            },
            getLastRng: function() {
                return getLastRng(lastRng);
            },
            isDefault: function() {
                return isDefault(editor, pasteBinDefaultContent);
            },
            isDefaultContent: function(content) {
                return isDefaultContent(pasteBinDefaultContent, content);
            }
        };
    };

    var Clipboard = function(editor, pasteFormat) {
        var pasteBin = PasteBin(editor);
        editor.on('PreInit', function() {
            return registerEventsAndFilters(editor, pasteBin, pasteFormat);
        });
        return {
            pasteFormat: pasteFormat,
            pasteHtml: function(html, internalFlag) {
                return pasteHtml$1(editor, html, internalFlag);
            },
            pasteText: function(text) {
                return pasteText(editor, text);
            },
            pasteImageData: function(e, rng) {
                return pasteImageData(editor, e, rng);
            },
            getDataTransferItems: getDataTransferItems,
            hasHtmlOrText: hasHtmlOrText,
            hasContentType: hasContentType
        };
    };

    var togglePlainTextPaste = function(editor, clipboard) {
        if (clipboard.pasteFormat.get() === 'text') {
            clipboard.pasteFormat.set('html');
            firePastePlainTextToggle(editor, false);
        } else {
            clipboard.pasteFormat.set('text');
            firePastePlainTextToggle(editor, true);
        }
        editor.focus();
    };

    var register = function(editor, clipboard) {
        editor.addCommand('mceTogglePlainTextPaste', function() {
            togglePlainTextPaste(editor, clipboard);
        });
        editor.addCommand('mceInsertClipboardContent', function(ui, value) {
            if (value.content) {
                clipboard.pasteHtml(value.content, value.internal);
            }
            if (value.text) {
                clipboard.pasteText(value.text);
            }
        });
    };

    var hasWorkingClipboardApi = function(clipboardData) {
        return global$1.iOS === false && typeof(clipboardData === null || clipboardData === void 0 ? void 0 : clipboardData.setData) === 'function';
    };
    var setHtml5Clipboard = function(clipboardData, html, text) {
        if (hasWorkingClipboardApi(clipboardData)) {
            try {
                clipboardData.clearData();
                clipboardData.setData('text/html', html);
                clipboardData.setData('text/plain', text);
                clipboardData.setData(internalHtmlMime(), html);
                return true;
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    };
    var setClipboardData = function(evt, data, fallback, done, editor) {
        if (/^<img [^\/>]*src=['"]([\s\w.\/]+\/?)\S*['"][^>]+\/>$/i.test(data.html)) {
            var handleCopyImg = getHandleCopyImg(editor);
            var url = data.html.match(/src=['"](([\s\w.\/]+\/?)\S*)['"]/i)[1] || '';
            var url = url.replace(/amp;/g, '');
            handleCopyImg('', url);
            evt.preventDefault();
            done();
            return
        }
        if (setHtml5Clipboard(evt.clipboardData, data.html, data.text)) {
            evt.preventDefault();
            done();
        } else {
            fallback(data.html, done);
        }
    };
    var fallback = function(editor) {
        return function(html, done) {
            var markedHtml = mark(html);
            var outer = editor.dom.create('div', {
                'contenteditable': 'false',
                'data-mce-bogus': 'all'
            });
            var inner = editor.dom.create('div', { contenteditable: 'true' }, markedHtml);
            editor.dom.setStyles(outer, {
                position: 'fixed',
                top: '0',
                left: '-3000px',
                width: '1000px',
                overflow: 'hidden'
            });
            outer.appendChild(inner);
            editor.dom.add(editor.getBody(), outer);
            var range = editor.selection.getRng();
            inner.focus();
            var offscreenRange = editor.dom.createRng();
            offscreenRange.selectNodeContents(inner);
            editor.selection.setRng(offscreenRange);
            global$2.setTimeout(function() {
                editor.selection.setRng(range);
                outer.parentNode.removeChild(outer);
                done();
            }, 0);
        };
    };
    var getData = function(editor) {
        return {
            html: editor.selection.getContent({ contextual: true }),
            text: editor.selection.getContent({ format: 'text' })
        };
    };
    var isTableSelection = function(editor) {
        return !!editor.dom.getParent(editor.selection.getStart(), 'td[data-mce-selected],th[data-mce-selected]', editor.getBody());
    };
    var hasSelectedContent = function(editor) {
        return !editor.selection.isCollapsed() || isTableSelection(editor);
    };
    var cut = function(editor) {
        return function(evt) {
            if (hasSelectedContent(editor)) {
                setClipboardData(evt, getData(editor), fallback(editor), function() {
                    if (global$1.browser.isChrome() || global$1.browser.isFirefox()) {
                        var rng_1 = editor.selection.getRng();
                        global$2.setEditorTimeout(editor, function() {
                            editor.selection.setRng(rng_1);
                            editor.execCommand('Delete');
                        }, 0);
                    } else {
                        editor.execCommand('Delete');
                    }
                }, editor);
            }
        };
    };
    var copy = function(editor) {
        return function(evt) {
            if (hasSelectedContent(editor)) {
                setClipboardData(evt, getData(editor), fallback(editor), noop, editor);
            }
        };
    };
    var register$1 = function(editor) {
        editor.on('cut', cut(editor));
        editor.on('copy', copy(editor));
    };

    var global$b = tinymce.util.Tools.resolve('tinymce.dom.RangeUtils');

    var getCaretRangeFromEvent = function(editor, e) {
        return global$b.getCaretRangeFromPoint(e.clientX, e.clientY, editor.getDoc());
    };
    var isPlainTextFileUrl = function(content) {
        var plainTextContent = content['text/plain'];
        return plainTextContent ? plainTextContent.indexOf('file://') === 0 : false;
    };
    var setFocusedRange = function(editor, rng) {
        editor.focus();
        editor.selection.setRng(rng);
    };
    var setup = function(editor, clipboard, draggingInternallyState) {
        if (shouldBlockDrop(editor)) {
            editor.on('dragend dragover draggesture dragdrop drop drag', function(e) {
                e.preventDefault();
                e.stopPropagation();
            });
        }
        if (!shouldPasteDataImages(editor)) {
            editor.on('drop', function(e) {
                var dataTransfer = e.dataTransfer;
                if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
                    e.preventDefault();
                }
            });
        }
        editor.on('drop', function(e) {
            var rng = getCaretRangeFromEvent(editor, e);
            if (e.isDefaultPrevented() || draggingInternallyState.get()) {
                return;
            }
            var dropContent = clipboard.getDataTransferItems(e.dataTransfer);
            var internal = clipboard.hasContentType(dropContent, internalHtmlMime());
            if ((!clipboard.hasHtmlOrText(dropContent) || isPlainTextFileUrl(dropContent)) && clipboard.pasteImageData(e, rng)) {
                return;
            }
            if (rng && shouldFilterDrop(editor)) {
                var content_1 = dropContent['mce-internal'] || dropContent['text/html'] || dropContent['text/plain'];
                if (content_1) {
                    e.preventDefault();
                    global$2.setEditorTimeout(editor, function() {
                        editor.undoManager.transact(function() {
                            if (dropContent['mce-internal']) {
                                editor.execCommand('Delete');
                            }
                            setFocusedRange(editor, rng);
                            content_1 = trimHtml(content_1);
                            if (!dropContent['text/html']) {
                                clipboard.pasteText(content_1);
                            } else {
                                clipboard.pasteHtml(content_1, internal);
                            }
                        });
                    });
                }
            }
        });
        editor.on('dragstart', function(_e) {
            draggingInternallyState.set(true);
        });
        editor.on('dragover dragend', function(e) {
            if (shouldPasteDataImages(editor) && draggingInternallyState.get() === false) {
                e.preventDefault();
                setFocusedRange(editor, getCaretRangeFromEvent(editor, e));
            }
            if (e && e.type === 'dragend') {
                draggingInternallyState.set(false);
            }
        });
    };

    var setup$1 = function(editor) {
        var plugin = editor.plugins.paste;
        var preProcess = getPreProcess(editor);
        if (preProcess) {
            editor.on('PastePreProcess', function(e) {
                preProcess.call(plugin, plugin, e);
            });
        }
        var postProcess = getPostProcess(editor);
        if (postProcess) {
            editor.on('PastePostProcess', function(e) {
                postProcess.call(plugin, plugin, e);
            });
        }
    };

    var addPreProcessFilter = function(editor, filterFunc) {
        editor.on('PastePreProcess', function(e) {
            e.content = filterFunc(editor, e.content, e.internal, e.wordContent);
        });
    };
    var addPostProcessFilter = function(editor, filterFunc) {
        editor.on('PastePostProcess', function(e) {
            filterFunc(editor, e.node);
        });
    };
    var removeExplorerBrElementsAfterBlocks = function(editor, html) {
        if (!isWordContent(html)) {
            return html;
        }
        var blockElements = [];
        global$5.each(editor.schema.getBlockElements(), function(block, blockName) {
            blockElements.push(blockName);
        });
        var explorerBlocksRegExp = new RegExp('(?:<br>&nbsp;[\\s\\r\\n]+|<br>)*(<\\/?(' + blockElements.join('|') + ')[^>]*>)(?:<br>&nbsp;[\\s\\r\\n]+|<br>)*', 'g');
        html = filter$1(html, [
            [
                explorerBlocksRegExp,
                '$1'
            ]
        ]);
        html = filter$1(html, [
            [
                /<br><br>/g,
                '<BR><BR>'
            ],
            [
                /<br>/g,
                ' '
            ],
            [
                /<BR><BR>/g,
                '<br>'
            ]
        ]);
        return html;
    };
    var removeWebKitStyles = function(editor, content, internal, isWordHtml) {
        if (isWordHtml || internal) {
            return content;
        }
        var webKitStylesSetting = getWebkitStyles(editor);
        var webKitStyles;
        if (shouldRemoveWebKitStyles(editor) === false || webKitStylesSetting === 'all') {
            return content;
        }
        if (webKitStylesSetting) {
            webKitStyles = webKitStylesSetting.split(/[, ]/);
        }
        if (webKitStyles) {
            var dom_1 = editor.dom,
                node_1 = editor.selection.getNode();
            content = content.replace(/(<[^>]+) style="([^"]*)"([^>]*>)/gi, function(all, before, value, after) {
                var inputStyles = dom_1.parseStyle(dom_1.decode(value));
                var outputStyles = {};
                if (webKitStyles === 'none') {
                    return before + after;
                }
                for (var i = 0; i < webKitStyles.length; i++) {
                    var inputValue = inputStyles[webKitStyles[i]],
                        currentValue = dom_1.getStyle(node_1, webKitStyles[i], true);
                    if (/color/.test(webKitStyles[i])) {
                        inputValue = dom_1.toHex(inputValue);
                        currentValue = dom_1.toHex(currentValue);
                    }
                    if (currentValue !== inputValue) {
                        outputStyles[webKitStyles[i]] = inputValue;
                    }
                }
                outputStyles = dom_1.serializeStyle(outputStyles, 'span');
                if (outputStyles) {
                    return before + ' style="' + outputStyles + '"' + after;
                }
                return before + after;
            });
        } else {
            content = content.replace(/(<[^>]+) style="([^"]*)"([^>]*>)/gi, '$1$3');
        }
        content = content.replace(/(<[^>]+) data-mce-style="([^"]+)"([^>]*>)/gi, function(all, before, value, after) {
            return before + ' style="' + value + '"' + after;
        });
        return content;
    };
    var removeUnderlineAndFontInAnchor = function(editor, root) {
        editor.$('a', root).find('font,u').each(function(i, node) {
            editor.dom.remove(node, true);
        });
    };
    var setup$2 = function(editor) {
        if (global$1.webkit) {
            // addPreProcessFilter(editor, removeWebKitStyles);
        }
        if (global$1.ie) {
            // addPreProcessFilter(editor, removeExplorerBrElementsAfterBlocks);
            addPostProcessFilter(editor, removeUnderlineAndFontInAnchor);
        }
    };

    var makeSetupHandler = function(editor, clipboard) {
        return function(api) {
            if (api.setActive) {
                api.setActive(clipboard.pasteFormat.get() === 'text');
                var pastePlainTextToggleHandler = function(e) {
                    return api.setActive(e.state);
                };
            }
            editor.on('PastePlainTextToggle', pastePlainTextToggleHandler);
            return function() {
                return editor.off('PastePlainTextToggle', pastePlainTextToggleHandler);
            };
        };
    };
    var register$2 = function(editor, clipboard) {
        editor.ui.registry.addToggleButton('pastetext', {
          active: false,
          icon: 'paste-text',
          tooltip: 'Paste as text',
          onAction: function() {
              // editor.fire('paste');
              return editor.execCommand('mceTogglePlainTextPaste');
          },
          onSetup: makeSetupHandler(editor, clipboard)
        });
        editor.ui.registry.addMenuItem('pastetext', {
            text: 'Paste as text',
            // icon: 'paste-text',
            onAction: function() {
                editor.execCommand('mceTogglePlainTextPaste');
                editor.execCommand('Paste');
                editor.execCommand('mceTogglePlainTextPaste');
                return
            },
            onSetup: makeSetupHandler(editor, clipboard)
        });
    };

    function Plugin() {
        global.add('paste', function(editor) {
            if (hasProPlugin(editor) === false) {
                var draggingInternallyState = Cell(false);
                var pasteFormat = Cell(isPasteAsTextEnabled(editor) ? 'text' : 'html');
                var clipboard = Clipboard(editor, pasteFormat);
                var quirks = setup$2(editor);
                register$2(editor, clipboard);
                register(editor, clipboard);
                setup$1(editor);
                register$1(editor);
                setup(editor, clipboard, draggingInternallyState);
                editor.pasteHtml = pasteHtml;
                return get(clipboard, quirks);
            }
        });
    }

    Plugin();

}());
