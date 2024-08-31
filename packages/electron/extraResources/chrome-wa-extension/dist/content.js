(function () {
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

    // 接收端
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.method === 'getInnerHTML') {
            sendResponse({
                data: document.all[0].innerHTML,
                linkedInData: getLinkedInData(),
                method: 'getInnerHTML'
            });
        }
    });
    function getLinkedInData() {
        var _a, _b, _c, _d, _e, _f, _g;
        var data = {
            email: (_a = document.querySelector('.pv-contact-info__contact-type.ci-email .pv-contact-info__contact-link')) === null || _a === void 0 ? void 0 : _a.innerText,
            contactName: (_b = document.querySelector("#pv-contact-info")) === null || _b === void 0 ? void 0 : _b.innerText,
            companyName: (_c = document.querySelector(".pv-text-details__right-panel > li > button > span")) === null || _c === void 0 ? void 0 : _c.innerText,
            linkedinPage: (_d = document.querySelector('.pv-contact-info__contact-type.ci-vanity-url .pv-contact-info__contact-link')) === null || _d === void 0 ? void 0 : _d.innerText,
            telephones: (_f = (_e = document.querySelector('.pv-contact-info__contact-type.ci-phone .t-normal')) === null || _e === void 0 ? void 0 : _e.innerText) === null || _f === void 0 ? void 0 : _f.trim(),
            job: (_g = document.querySelector('.ember-view > div.ph5.pb5 > div.mt2.relative > div:nth-child(1) > div.text-body-medium.break-words')) === null || _g === void 0 ? void 0 : _g.innerText,
        };
        if (!data.email) {
            return;
        }
        return data;
    }

})();
