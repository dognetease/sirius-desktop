var CACHE_NAME_PREFIX = 'LingXi-';
//缓存类型
var CACHE_TYPES = {
  ALWAYS_CACHE: 'ALWAYS_CACHE',
  PREV_CACHE: 'PREV_CACHE',
  SESSION_CACHE: 'SESSION_CACHE',
  TIME_CACHE: 'TIME_CACHE',
  VERSION_CACHE: 'VERSION_CACHE',
};

var CACHE_NAMES = {
  ALWAYS_CACHE: CACHE_NAME_PREFIX + 'ALWAYS_CACHE',
  PREV_CACHE: CACHE_NAME_PREFIX + 'PREV_CACHE',
  SESSION_CACHE: CACHE_NAME_PREFIX + 'SESSION_CACHE',
  TIME_CACHE: CACHE_NAME_PREFIX + 'TIME_CACHE',
  VERSION_CACHE: CACHE_NAME_PREFIX + 'VERSION_CACHE',
};

var CACHE_CONFIG = [
  {
    test: /^https:\/\/cowork-storage-public-cdn.lx.netease.com\/lxbg\/.*(.js|.css)$/,
    type: CACHE_TYPES.ALWAYS_CACHE,
    ignoreSearch: true,
  },
  {
    test: /DATracker\.globals[\.\d]+\.js$/,
    type: CACHE_TYPES.ALWAYS_CACHE,
    ignoreSearch: true,
  },
  {
    test: /global-(script|style)-.*(.js|.css)$/,
    type: CACHE_TYPES.ALWAYS_CACHE,
    ignoreSearch: true,
  },
];

//$versionCacheUrls

var versionCacheMap = {};

versionCachesUrls = versionCachesUrls
  .map(function (url) {
    var href = location.search ? location.href.replace(location.search, '') : location.href;
    var pathName = href.indexOf('/') !== -1 ? href.substring(0, href.lastIndexOf('/') + 1) : '';
    if (!pathName) {
      return '';
    }
    var fullUrl = pathName + url.replace('./', '');
    return fullUrl;
  })
  .filter(function (url) {
    return !!url;
  });

versionCachesUrls.forEach(function (fullUrl) {
  versionCacheMap[fullUrl] = true;
});

var CACHE_BLACK_LIST = [/sw-worker.js/];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAMES.VERSION_CACHE).then(function (cache) {
      return cache.keys().then(function (cacheRequests) {
        return new Promise(function (resolve, reject) {
          var cacheUrls = cacheRequests.map(function (cacheRequest) {
            return cacheRequest.url;
          });

          var shouldCacheUrls = versionCachesUrls.filter(function (shouldCacheUrl) {
            if (/(.css|.js)$/.test(shouldCacheUrl)) {
              if (cacheUrls.indexOf(shouldCacheUrl) !== -1) {
                return false;
              }
              return true;
            }
            return false;
          });

          cache
            .addAll(shouldCacheUrls)
            .then(function () {
              resolve(self.skipWaiting());
            })
            .catch(function (err) {
              reject(err);
            });
        });
      });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAMES.VERSION_CACHE)
      .then(function (versionCache) {
        return versionCache.keys().then(function (cacheKeys) {
          return Promise.all(
            cacheKeys.map(function (cacheKey) {
              let url = cacheKey && cacheKey.url;
              if (versionCachesUrls.indexOf(url) === -1) {
                return versionCache.delete(url);
              }
              return Promise.resolve();
            })
          );
        });
      })
      .then(function () {
        return self.clients.claim().then(function () {
          console.log('Claim cleints');
        });
      })
  );
});

function fetchRequest(request, requestOption, currentCache) {
  if (request) {
    return fetch(request.url, requestOption || undefined).then(function (response) {
      if (response && response.ok) {
        currentCache.put(request, response.clone());
      }
      return response;
    });
  }
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request && request.method && request.method.toLowerCase() !== 'get') {
    return;
  }

  var url = request.url;

  var inBlack = CACHE_BLACK_LIST.find(function (urlReg) {
    if (urlReg.test(url)) {
      return true;
    }
    return false;
  });

  if (inBlack) {
    return;
  }

  var cacheConfigItem;
  if (versionCacheMap && versionCacheMap[url]) {
    cacheConfigItem = {
      type: CACHE_TYPES.VERSION_CACHE,
      ignoreSearch: true,
      credentials: 'include',
    };
  }

  if (!cacheConfigItem) {
    cacheConfigItem = CACHE_CONFIG.find(function (cacheConfigItem) {
      const urlReg = cacheConfigItem.test;
      if (urlReg && urlReg.test(url)) {
        return cacheConfigItem.type ? true : false;
      }
      return false;
    });
  }

  if (!cacheConfigItem) {
    return;
  }

  if (cacheConfigItem) {
    var cacheType = cacheConfigItem.type;
    if (cacheType === CACHE_TYPES.ALWAYS_CACHE || cacheType === CACHE_TYPES.PREV_CACHE || cacheType === CACHE_TYPES.VERSION_CACHE) {
      var cacheName = CACHE_NAMES[cacheType];
      if (!cacheName) {
        return;
      }

      var requestOption;
      if (cacheConfigItem.credentials) {
        requestOption = {};
        requestOption.credentials = cacheConfigItem.credentials;
      }

      event.respondWith(
        caches.open(cacheName).then(function (cache) {
          return cache.match(request, { ignoreSearch: !!cacheConfigItem.ignoreSearch }).then(function (cacheResponse) {
            if (cacheResponse && cacheResponse.ok) {
              if (cacheType === CACHE_TYPES.PREV_CACHE) {
                fetchRequest(request, requestOption, cache);
              }
              return cacheResponse;
            } else {
              return fetchRequest(request, requestOption, cache);
            }
          });
        })
      );
    }
  }
});

self.addEventListener('error', function (event) {
  console.error(event);
});

self.addEventListener('unhandledrejection', function (event) {
  console.error(event);
});

if (!Cache.prototype.add) {
  Cache.prototype.add = function add(request) {
    return this.addAll([request]);
  };
}

if (!Cache.prototype.addAll) {
  Cache.prototype.addAll = function addAll(requests) {
    var cache = this;
    return Promise.resolve()
      .then(function () {
        if (arguments.length < 1) throw new TypeError();

        requests = requests.map(function (request) {
          if (request instanceof Request) {
            return request;
          } else {
            return String(request);
          }
        });

        return Promise.all(
          requests.map(function (request) {
            if (typeof request === 'string') {
              request = new Request(request);
            }

            return fetch(request.clone(), { credentials: 'include' });
          })
        );
      })
      .then(function (responses) {
        return Promise.all(
          responses.map(function (response, i) {
            return cache.put(requests[i], response);
          })
        );
      })
      .then(function () {
        return undefined;
      });
  };
}

if (!CacheStorage.prototype.match) {
  CacheStorage.prototype.match = function match(request, opts) {
    var caches = this;
    return caches.keys().then(function (cacheNames) {
      var match;
      return cacheNames.reduce(function (chain, cacheName) {
        return chain.then(function () {
          return (
            match ||
            caches
              .open(cacheName)
              .then(function (cache) {
                return cache.match(request, opts);
              })
              .then(function (response) {
                match = response;
                return match;
              })
          );
        });
      }, Promise.resolve());
    });
  };
}
