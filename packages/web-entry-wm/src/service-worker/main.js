(function () {
  var inWindow = typeof window !== 'undefined';
  //$swFileNameTemplate
  function registerServiceWorker() {
    if (navigator.serviceWorker && swNameWithVersion) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        var isAlreadyActive = false;
        for (var i = 0; i < regs.length; ++i) {
          var currReg = regs[i];
          if (currReg.active) {
            var scriptUrl = currReg.active.scriptURL;
            if (scriptUrl && scriptUrl.indexOf(swNameWithVersion) !== -1) {
              isAlreadyActive = true;
              break;
            }
          }
        }

        if (!isAlreadyActive) {
          navigator.serviceWorker
            .register('./' + swNameWithVersion)
            .then(function (res) {
              console.log('service-worker successfully registered');
            })
            .catch(function (err) {
              console.error('service-worker register error', err);
            });
        }
      });
    }
  }

  function unregisterServiceWorker() {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        if (registrations && registrations.length) {
          registrations.forEach(function (regItem) {
            regItem.unregister();
          });
        }
      });
    }
  }

  function getShouldUseServiceWorker() {
    if (!inWindow) {
      return false;
    }
    if (navigator.userAgent && navigator.userAgent.toLocaleLowerCase().indexOf('electron') !== -1) {
      return false;
    }
    var result = true;
    if (window.localStorage) {
      var localStorageKey = 'LX-UseServiceWorker';
      var storageContent = window.localStorage.getItem(localStorageKey);
      result = storageContent !== 'false';
    }
    if (inWindow) {
      var url = window.location.href;
      if (url.toLowerCase().includes('usesericeworker=0')) {
        result = false;
      }
    }
    return result;
  }

  function main() {
    var shouldUseServiceWorker = getShouldUseServiceWorker();
    if (shouldUseServiceWorker) {
      registerServiceWorker();
    } else {
      unregisterServiceWorker();
    }
  }
  //避免第一次争抢资源
  inWindow &&
    window.addEventListener('load', function () {
      setTimeout(function () {
        try {
          main();
        } catch (ex) {
          console.error('main function error', ex);
        }
      }, 10000);
    });
})();
