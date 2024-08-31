var whatsappInject = (function (exports) {
    'use strict';

    (function() {
        const env = {};
        try {
            if (process) {
                process.env = Object.assign({}, process.env);
                Object.assign(process.env, env);
                return;
            }
        } catch (e) {} // avoid ReferenceError: process is not defined
        globalThis.process = { env:env };
    })();

    function consoleLog() {
        return console.log.apply(console, ['__chrome_extension__'].concat(Array.from(arguments)));
    }

    var COMMANDS;
    (function (COMMANDS) {
        COMMANDS["GET_SNS_INFO"] = "GET_SNS_INFO";
        COMMANDS["GET_MESSAGE_LIST"] = "GET_MESSAGE_LIST";
    })(COMMANDS || (COMMANDS = {}));
    var PromisifyMessageHandler = /** @class */ (function () {
        function PromisifyMessageHandler(handlers) {
            var _this = this;
            this.handlers = new Map();
            window.addEventListener('message', function (e) {
                if (e.data.from === 'waContentScript' && e.data.cmd === 'connect') {
                    _this.port2 = e.ports[0];
                }
                _this.port2.postMessage({
                    from: 'waInjectScript',
                    cmd: 'connect'
                });
                _this.port2.onmessage = _this.handleMessage.bind(_this);
            });
            if (handlers) {
                this.configHandler(handlers);
            }
        }
        PromisifyMessageHandler.prototype.handleMessage = function (e) {
            consoleLog('recieve Cmd ', e.data);
            var port2 = this.port2;
            if (e.data.tick && e.data.cmd) {
                var handler = this.handlers.get(e.data.cmd);
                if (handler) {
                    var ret = handler(e.data.params);
                    if (ret && typeof ret.then === 'function') {
                        ret.then(function (data) {
                            port2.postMessage({
                                tick: e.data.tick,
                                cmd: e.data.cmd,
                                data: data,
                            });
                        });
                    }
                    else {
                        port2.postMessage({
                            tick: e.data.tick,
                            cmd: e.data.cmd,
                            data: ret,
                        });
                    }
                }
            }
        };
        PromisifyMessageHandler.prototype.register = function (cmd, callback) {
            if (this.handlers.has(cmd)) {
                throw new Error("cmd ".concat(cmd, " has been register"));
            }
            this.handlers.set(cmd, callback);
            return this;
        };
        PromisifyMessageHandler.prototype.configHandler = function (handlers) {
            var _this = this;
            Object.keys(handlers).forEach(function (key) { return _this.register(key, handlers[key]); });
            return this;
        };
        return PromisifyMessageHandler;
    }());

    var _a;
    var defaultUser = {
        snsId: '',
        nickname: '',
        avatar: '',
    };
    function findReactProps(el) {
        return Object.keys(el).find(function (key) { return key.includes('reactProps'); });
    }
    function getSnsInfo() {
        var _a, _b, _c, _d;
        var header = document.querySelector('#main header');
        var titleEl = header.querySelector('div[title][role="button"]');
        var propsKey;
        if (titleEl && (propsKey = findReactProps(titleEl)) && ((_a = titleEl[propsKey].children) === null || _a === void 0 ? void 0 : _a.props)) {
            // react props中获取
            var props = (_b = titleEl[propsKey].children) === null || _b === void 0 ? void 0 : _b.props.chat;
            var $txt = header.querySelector('[data-testid="conversation-info-header-chat-title"]');
            var nickname = $txt ? $txt.textContent : '';
            // console.log(propsKey, props);
            var img = header.querySelector('img');
            if (props && !props.isGroup) {
                return {
                    snsId: (_c = props.id) === null || _c === void 0 ? void 0 : _c.user,
                    avatar: img ? img.src : '',
                    nickname: nickname || props.formattedTitle || props.user || '',
                };
            }
        }
        else {
            // todo: 联系人多时，whatsapp使用虚拟列表
            // 侧边聊天窗口获取昵称、头像，msg列表获取id
            var $activeChat = document.querySelector('div[data-testid="chat-list"] div[aria-selected="true"]');
            var img = $activeChat.querySelector('img');
            if ($activeChat && (propsKey = findReactProps($activeChat.parentElement))) {
                var props = $activeChat.parentElement[propsKey].children ? $activeChat.parentElement[propsKey].children[1].props.chat : undefined;
                if (props) {
                    if (!props.isGroup) {
                        return {
                            snsId: (_d = props.id) === null || _d === void 0 ? void 0 : _d.user,
                            avatar: img ? img.src : '',
                            nickname: props.formattedTitle || props.user || '',
                        };
                    }
                }
                else {
                    // todo from dom
                    return {};
                }
            }
        }
        return defaultUser;
    }
    function getMessageListFromDom() {
        var $messages = Array.from(document.querySelectorAll('#main [data-id]')).filter(function ($msg) {
            var _a;
            return !((_a = $msg.dataset) === null || _a === void 0 ? void 0 : _a.id.includes('grouped-sticker-'));
        });
        return $messages.map(parseMessage);
    }
    function parseMessage($msg) {
        var _a, _b, _c;
        var tmp = $msg.dataset.id.split('@c.us_');
        var msgId = tmp.length > 1 ? tmp[1] : $msg.dataset.id;
        var sendType = $msg.getAttribute('data-id').split('_')[0] === 'true' ? 'out' : 'in';
        var $msgTimeTag = $msg.querySelector('div[data-pre-plain-text]').nextElementSibling;
        if (!$msgTimeTag) {
            console.warn('can not found timeTag element', $msgTimeTag, msgId);
        }
        var reactPropsKey = findReactProps($msgTimeTag);
        var reactProps = (_c = (_b = (_a = $msgTimeTag[reactPropsKey]) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b.props) === null || _c === void 0 ? void 0 : _c.msg;
        if (!reactProps) {
            console.warn('can not found reactProps for el', $msgTimeTag, msgId);
            return;
        }
        var sendTime = reactProps.t;
        var body;
        console.log('type', reactProps, reactProps.type);
        if (reactProps) {
            switch (reactProps.type) {
                case 'chat':
                    // 文本、表情、模板消息
                    // todo: footer button等发情支持
                    body = { content: reactProps.body };
                    break;
                case 'image':
                    body = parseImageFromProps(reactProps);
                    break;
                case 'document':
                    body = parseDocumentFromProps(reactProps);
                    break;
                case 'ptt':
                    body = parsePttFromProps(reactProps);
                    break;
                case 'video':
                    body = parseVideoFromProps(reactProps);
                    break;
                case 'location':
                    body = parseLocationFromProps(reactProps);
                    break;
                case 'multi_vcard':
                    body = { vcardList: reactProps.vcardList };
                    break;
                case 'vcard':
                    body = { vcard: reactProps.vcard };
                    break;
            }
        }
        return {
            msgId: msgId,
            sendType: sendType,
            sendTime: sendTime,
            type: reactProps.type,
            body: body
        };
    }
    function parseImageFromProps(props) {
        var _a;
        var mediaObject = ((_a = props === null || props === void 0 ? void 0 : props.asImage) === null || _a === void 0 ? void 0 : _a.mediaObject) || (props === null || props === void 0 ? void 0 : props.mediaObject);
        var info = mediaObject === null || mediaObject === void 0 ? void 0 : mediaObject.contentInfo;
        var entity = mediaObject === null || mediaObject === void 0 ? void 0 : mediaObject.entries.entries[0];
        if (info && entity) {
            return {
                aspectRatio: info.aspectRatio,
                fullHeight: info.fullHeight,
                fullWidth: info.fullWidth,
                mimeType: props.mimetype,
                hash: props.filehash,
                mmsUrl: entity.deprecatedMms3Url,
                directPath: entity.directPath,
                encFileHash: entity.encFilehash,
                sendTime: props.t,
                mediaKey: entity.mediaKey
            };
        }
    }
    function parseDocumentFromProps(props) {
        var _a, _b;
        var mediaObject = ((_a = props === null || props === void 0 ? void 0 : props.asDoc) === null || _a === void 0 ? void 0 : _a.mediaObject) || (props === null || props === void 0 ? void 0 : props.mediaObject);
        var entity = (_b = mediaObject === null || mediaObject === void 0 ? void 0 : mediaObject.entries) === null || _b === void 0 ? void 0 : _b.entries[0];
        if (entity) {
            return {
                filename: props.filename,
                size: mediaObject.size,
                sendTime: props.t,
                mimeType: props.mimetype,
                hash: props.filehash,
                coverImage: props.body,
                mmsUrl: entity.deprecatedMms3Url,
                directPath: entity.directPath,
                encFileHash: entity.encFilehash,
                mediaKey: entity.mediaKey
            };
        }
    }
    function parsePttFromProps(props) {
        var _a, _b;
        var mediaObject = ((_a = props === null || props === void 0 ? void 0 : props.asPtt) === null || _a === void 0 ? void 0 : _a.mediaObject) || (props === null || props === void 0 ? void 0 : props.mediaObject);
        var info = mediaObject === null || mediaObject === void 0 ? void 0 : mediaObject.contentInfo;
        var entity = (_b = mediaObject === null || mediaObject === void 0 ? void 0 : mediaObject.entries) === null || _b === void 0 ? void 0 : _b.entries[0];
        if (info && entity) {
            return {
                duration: info.duration,
                sendTime: props.t,
                mimeType: props.mimetype,
                hash: props.filehash,
                mmsUrl: entity.deprecatedMms3Url,
                directPath: entity.directPath,
                encFileHash: entity.encFilehash,
                mediaKey: entity.mediaKey
            };
        }
    }
    function parseVideoFromProps(props) {
        var _a, _b, _c;
        var mediaObject = ((_a = props === null || props === void 0 ? void 0 : props.asVideo) === null || _a === void 0 ? void 0 : _a.mediaObject) || (props === null || props === void 0 ? void 0 : props.mediaObject);
        var info = mediaObject === null || mediaObject === void 0 ? void 0 : mediaObject.contentInfo;
        var entity = (_b = mediaObject === null || mediaObject === void 0 ? void 0 : mediaObject.entries) === null || _b === void 0 ? void 0 : _b.entries[0];
        if (info && entity) {
            return {
                duration: info.duration,
                size: mediaObject.size,
                aspectRatio: info.aspectRatio,
                fullHeight: info.fullHeight,
                fullWidth: info.fullWidth,
                coverImage: ((_c = (info.fullPreviewData || info.preview)) === null || _c === void 0 ? void 0 : _c._b64) || props.body,
                sendTime: props.t,
                mimeType: props.mimetype,
                hash: props.filehash,
                mmsUrl: entity.deprecatedMms3Url,
                directPath: entity.directPath,
                encFileHash: entity.encFilehash,
                mediaKey: entity.mediaKey
            };
        }
    }
    function parseLocationFromProps(props) {
        return {
            lat: props.lat,
            lng: props.lng,
            coverImage: props.body
        };
    }
    new PromisifyMessageHandler((_a = {},
        _a[COMMANDS.GET_SNS_INFO] = function () {
            return getSnsInfo();
        },
        _a[COMMANDS.GET_MESSAGE_LIST] = function () {
            try {
                var msg = getMessageListFromDom();
                return msg;
            }
            catch (e) {
                return [];
            }
        },
        _a));
    // whatspp 聊天输入框一直获取焦点，导致父级页面窗口无法输入
    function blurChatEditor() {
        window.addEventListener('blur', function () {
            var $editor = getEditorDom();
            if ($editor) {
                $editor.setAttribute("contenteditable", 'false');
                $editor.removeAttribute("tabindex");
                $editor.addEventListener('click', function () {
                    $editor.setAttribute('contenteditable', 'true');
                }, { once: true });
            }
        });
    }
    function getEditorDom() {
        var e = document.querySelector('.selectable-text[spellcheck="true"][role="textbox"][dir="ltr"]');
        var a = document.querySelector("#main footer > .copyable-area .selectable-text");
        if (e) {
            return e;
        }
        return ('P' === (a === null || a === void 0 ? void 0 : a.tagName) ? a.parentElement : a);
    }
    function start() {
        blurChatEditor();
    }
    start();

    exports.findReactProps = findReactProps;
    exports.getSnsInfo = getSnsInfo;

    return exports;

})({});
