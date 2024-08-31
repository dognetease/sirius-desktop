var network = (function (exports) {
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

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function isDev() {
        return process.env.NODE_ENV === 'development';
    }

    var BASE_URL = isDev() ? 'https://waimao-test1.cowork.netease.com' : 'https://waimao.office.163.com';

    // const host = 'https://waimao-test1.cowork.netease.com';
    // const host = 'https://waimao.cowork.netease.com';
    function agent(url, data, type) {
        return __awaiter(this, void 0, void 0, function () {
            var timeout, controller, id, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timeout = 10000;
                        controller = new AbortController();
                        id = setTimeout(function () {
                            controller.abort();
                            return Promise.resolve({
                                success: false,
                                message: '请求超时'
                            });
                        }, timeout);
                        return [4 /*yield*/, fetch(BASE_URL + url, {
                                method: type || 'post',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data),
                                signal: controller.signal
                            }).then(function (res) { return res.json(); })];
                    case 1:
                        response = _a.sent();
                        clearTimeout(id);
                        return [2 /*return*/, response];
                }
            });
        });
    }
    var user = null;
    function getUserInfo() {
        agent('/cowork/api/biz/enter/accountInfo', undefined, 'get')
            .then(function (res) {
            if (res.data) {
                user = res.data;
                console.log('user', user);
                getVersionInfo();
            }
        });
    }
    function getVersionInfo() {
        if (!user)
            return getUserInfo();
        agent('/privilege/api/biz/account/product/privilege/version?productId=fastmail&productVersionId=professional', undefined, 'get')
            .then(function (res) {
            var _a;
            if (res.data && user) {
                user.version = (_a = res.data) === null || _a === void 0 ? void 0 : _a.version;
                console.log('user with version', user);
            }
        });
    }
    // 注册网络事件
    function registerNetwork() {
        getUserInfo();
        chrome.runtime.onMessage.addListener(function (_a, sender, sendResponse) {
            var type = _a.type, name = _a.name, data = _a.data;
            if (type === 'fetch') {
                // console.log('name', name)
                switch (name) {
                    case 'getUserInfo':
                        agent('/cowork/api/biz/enter/accountInfo', undefined, 'get')
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'getVersionInfo':
                        agent('/privilege/api/biz/account/product/privilege/version?productId=fastmail&productVersionId=professional', undefined, 'get')
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'getWhiteList':
                        agent('/it-plugins/api/biz/plugin/white_list/list', undefined, 'get')
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'getCompanyInfo':
                        agent('/it-plugins/api/biz/plugin/global_search/company_info', data)
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'getContactList':
                        agent('/it-plugins/api/biz/plugin/global_search/contact_page', data)
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'syncSubscribe':
                        var url = data.add
                            ? "/it-plugins/api/biz/plugin/global_search/add_collect?companyId=".concat(data.companyId)
                            : "/it-plugins/api/biz/plugin/global_search/del_collect?collectId=".concat(data.collectId);
                        agent(url, undefined, 'get')
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'importContactList':
                        agent('/customer/api/biz/company/plugin_add_company', data, 'post')
                            .then(function (res) { return sendResponse(res); });
                        break;
                    // 添加联系人(手动)
                    case 'addAddress':
                        agent('/it-plugins/api/biz/plugin/ma_address/add_address', data, 'post')
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'addAddressAuto':
                        agent('/it-plugins/api/biz/plugin/upload_capture_info', data, 'post')
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'getGroupOptions':
                        agent('/it-plugins/api/biz/plugin/ma_address/get_group', data, 'get')
                            .then(function (res) { return sendResponse(res); });
                        break;
                    case 'createGroup':
                        agent('/it-plugins/api/biz/plugin/ma_address/create_group', data, 'post')
                            .then(function (res) { return sendResponse(res); });
                        break;
                }
                return true;
            }
            else if (type === 'ping') {
                sendResponse(user);
            }
        });
    }

    exports.registerNetwork = registerNetwork;

    return exports;

})({});
