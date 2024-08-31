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

    if (window.detailData) {
        document.dispatchEvent(new CustomEvent('ProductDetailCustomEvent', {
            detail: window.detailData
        }));
    }

})();
