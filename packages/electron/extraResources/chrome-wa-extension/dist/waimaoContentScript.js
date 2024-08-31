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

    function consoleLog() {
        return console.log.apply(console, ['__chrome_extension__'].concat(Array.from(arguments)));
    }

    (function () {
        function start() {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.id = 'extension_hidden_value';
            input.value = 'closed';
            var button = document.createElement('button');
            button.style.display = 'none';
            button.id = 'clear_service_worker';
            // 开关状态
            var STORAGE_KEY = 'whatsAppAssistantOpening';
            chrome.storage.local.onChanged.addListener(function (changes) {
                if (STORAGE_KEY in changes) {
                    input.value = [true, undefined].includes(changes[STORAGE_KEY].newValue) ? 'opened' : 'closed';
                    input.dispatchEvent(new CustomEvent('ValueChanged', { detail: input.value }));
                    consoleLog('storagechanged', changes, input.value);
                }
            });
            chrome.storage.local.get([STORAGE_KEY], function (result) {
                consoleLog('whatsAppAssistantOpening is ' + result.whatsAppAssistantOpening);
                input.value = [true, undefined].includes(result.whatsAppAssistantOpening) ? 'opened' : 'closed';
            });
            button.onclick = function () {
                chrome.runtime.sendMessage({
                    type: 'clearServiceWorker',
                }, function () {
                    consoleLog('clear whatsapp service worker data');
                });
            };
            // 加载后清除一次
            button.click();
            document.body.append(input);
            document.body.append(button);
        }
        start();
    })();

})();
