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

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

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

    function arrayToMap(arr) {
        const map = {};
        arr.forEach(k => map[k] = 1);
        return map;
    }

    var MEDIA_HKDF_KEY_MAPPING = {
        'audio': 'Audio',
        'document': 'Document',
        'gif': 'Video',
        'image': 'Image',
        'ppic': '',
        'product': 'Image',
        'ptt': 'Audio',
        'sticker': 'Image',
        'video': 'Video',
        'thumbnail-document': 'Document Thumbnail',
        'thumbnail-image': 'Image Thumbnail',
        'thumbnail-video': 'Video Thumbnail',
        'thumbnail-link': 'Link Thumbnail',
        'md-msg-hist': 'History',
        'md-app-state': 'App State',
        'product-catalog-image': '',
        'payment-bg-image': 'Payment Background',
    };
    var AES_CHUNK_SIZE = 16;
    var toSmallestChunkSize = function (num) {
        return Math.floor(num / AES_CHUNK_SIZE) * AES_CHUNK_SIZE;
    };
    function b64ToBuffer(b64) {
        b64 = b64
            .replace(/_/g, '/')
            .replace(/-/g, '+');
        b64 += '==='.slice((b64.length + 3) % 4);
        var b = atob(b64)
            .split('')
            .map(function (s) { return s.charCodeAt(0); });
        return new Uint8Array(b);
    }
    function hkdf(key, info, length) {
        if (length === void 0) { length = 112 * 8; }
        return __awaiter(this, void 0, void 0, function () {
            var bufferKey, baseKey, deriveKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bufferKey = b64ToBuffer(key);
                        return [4 /*yield*/, crypto.subtle.importKey('raw', bufferKey, 'HKDF', false, ['deriveKey'])];
                    case 1:
                        baseKey = _a.sent();
                        return [4 /*yield*/, crypto.subtle.deriveKey({ name: 'HKDF', info: new TextEncoder().encode(info), hash: 'SHA-256', salt: new Uint8Array(0) }, baseKey, { name: 'HMAC', hash: 'SHA-256', length: length }, true, ['sign'])];
                    case 2:
                        deriveKey = _a.sent();
                        return [2 /*return*/, crypto.subtle.exportKey('raw', deriveKey)];
                }
            });
        });
    }
    function getMediaKeys(mediaKey, mediaType) {
        var type = MEDIA_HKDF_KEY_MAPPING[mediaType] || (mediaType.slice(0, 1).toUpperCase() + mediaType.slice(1));
        return hkdf(mediaKey, "WhatsApp ".concat(type, " Keys"));
    }
    function decryptMedia(buffer, mediaKey, mediaType) {
        return __awaiter(this, void 0, void 0, function () {
            var hkdfKey, iv, cipherKey, decryptLegnth, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getMediaKeys(mediaKey, mediaType)];
                    case 1:
                        hkdfKey = _a.sent();
                        iv = hkdfKey.slice(0, 16);
                        cipherKey = hkdfKey.slice(16, 48);
                        decryptLegnth = toSmallestChunkSize(buffer.byteLength);
                        return [4 /*yield*/, crypto.subtle.importKey('raw', cipherKey, {
                                name: 'AES-CBC',
                                length: 256
                            }, false, ['decrypt'])];
                    case 2:
                        key = _a.sent();
                        return [2 /*return*/, crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv, length: 256 }, key, buffer.slice(0, decryptLegnth))];
                }
            });
        });
    }

    var domain;

    // This constructor is used to store event handlers. Instantiating this is
    // faster than explicitly calling `Object.create(null)` to get a "clean" empty
    // object (tested with v8 v4.9).
    function EventHandlers() {}
    EventHandlers.prototype = Object.create(null);

    function EventEmitter() {
      EventEmitter.init.call(this);
    }

    // nodejs oddity
    // require('events') === require('events').EventEmitter
    EventEmitter.EventEmitter = EventEmitter;

    EventEmitter.usingDomains = false;

    EventEmitter.prototype.domain = undefined;
    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;

    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    EventEmitter.defaultMaxListeners = 10;

    EventEmitter.init = function() {
      this.domain = null;
      if (EventEmitter.usingDomains) {
        // if there is an active domain, then attach to it.
        if (domain.active ) ;
      }

      if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
        this._events = new EventHandlers();
        this._eventsCount = 0;
      }

      this._maxListeners = this._maxListeners || undefined;
    };

    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== 'number' || n < 0 || isNaN(n))
        throw new TypeError('"n" argument must be a positive number');
      this._maxListeners = n;
      return this;
    };

    function $getMaxListeners(that) {
      if (that._maxListeners === undefined)
        return EventEmitter.defaultMaxListeners;
      return that._maxListeners;
    }

    EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
      return $getMaxListeners(this);
    };

    // These standalone emit* functions are used to optimize calling of event
    // handlers for fast cases because emit() itself often has a variable number of
    // arguments and can be deoptimized because of that. These functions always have
    // the same number of arguments and thus do not get deoptimized, so the code
    // inside them can execute faster.
    function emitNone(handler, isFn, self) {
      if (isFn)
        handler.call(self);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self);
      }
    }
    function emitOne(handler, isFn, self, arg1) {
      if (isFn)
        handler.call(self, arg1);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1);
      }
    }
    function emitTwo(handler, isFn, self, arg1, arg2) {
      if (isFn)
        handler.call(self, arg1, arg2);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2);
      }
    }
    function emitThree(handler, isFn, self, arg1, arg2, arg3) {
      if (isFn)
        handler.call(self, arg1, arg2, arg3);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2, arg3);
      }
    }

    function emitMany(handler, isFn, self, args) {
      if (isFn)
        handler.apply(self, args);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].apply(self, args);
      }
    }

    EventEmitter.prototype.emit = function emit(type) {
      var er, handler, len, args, i, events, domain;
      var doError = (type === 'error');

      events = this._events;
      if (events)
        doError = (doError && events.error == null);
      else if (!doError)
        return false;

      domain = this.domain;

      // If there is no 'error' event listener then throw.
      if (doError) {
        er = arguments[1];
        if (domain) {
          if (!er)
            er = new Error('Uncaught, unspecified "error" event');
          er.domainEmitter = this;
          er.domain = domain;
          er.domainThrown = false;
          domain.emit('error', er);
        } else if (er instanceof Error) {
          throw er; // Unhandled 'error' event
        } else {
          // At least give some kind of context to the user
          var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
          err.context = er;
          throw err;
        }
        return false;
      }

      handler = events[type];

      if (!handler)
        return false;

      var isFn = typeof handler === 'function';
      len = arguments.length;
      switch (len) {
        // fast cases
        case 1:
          emitNone(handler, isFn, this);
          break;
        case 2:
          emitOne(handler, isFn, this, arguments[1]);
          break;
        case 3:
          emitTwo(handler, isFn, this, arguments[1], arguments[2]);
          break;
        case 4:
          emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
          break;
        // slower
        default:
          args = new Array(len - 1);
          for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];
          emitMany(handler, isFn, this, args);
      }

      return true;
    };

    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = target._events;
      if (!events) {
        events = target._events = new EventHandlers();
        target._eventsCount = 0;
      } else {
        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener) {
          target.emit('newListener', type,
                      listener.listener ? listener.listener : listener);

          // Re-assign `events` because a newListener handler could have caused the
          // this._events to be assigned to a new object
          events = target._events;
        }
        existing = events[type];
      }

      if (!existing) {
        // Optimize the case of one listener. Don't need the extra array object.
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === 'function') {
          // Adding the second element, need to change to array.
          existing = events[type] = prepend ? [listener, existing] :
                                              [existing, listener];
        } else {
          // If we've already got an array, just append.
          if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
        }

        // Check for listener leak
        if (!existing.warned) {
          m = $getMaxListeners(target);
          if (m && m > 0 && existing.length > m) {
            existing.warned = true;
            var w = new Error('Possible EventEmitter memory leak detected. ' +
                                existing.length + ' ' + type + ' listeners added. ' +
                                'Use emitter.setMaxListeners() to increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            emitWarning(w);
          }
        }
      }

      return target;
    }
    function emitWarning(e) {
      typeof console.warn === 'function' ? console.warn(e) : console.log(e);
    }
    EventEmitter.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.prependListener =
        function prependListener(type, listener) {
          return _addListener(this, type, listener, true);
        };

    function _onceWrap(target, type, listener) {
      var fired = false;
      function g() {
        target.removeListener(type, g);
        if (!fired) {
          fired = true;
          listener.apply(target, arguments);
        }
      }
      g.listener = listener;
      return g;
    }

    EventEmitter.prototype.once = function once(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };

    EventEmitter.prototype.prependOnceListener =
        function prependOnceListener(type, listener) {
          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');
          this.prependListener(type, _onceWrap(this, type, listener));
          return this;
        };

    // emits a 'removeListener' event iff the listener was removed
    EventEmitter.prototype.removeListener =
        function removeListener(type, listener) {
          var list, events, position, i, originalListener;

          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');

          events = this._events;
          if (!events)
            return this;

          list = events[type];
          if (!list)
            return this;

          if (list === listener || (list.listener && list.listener === listener)) {
            if (--this._eventsCount === 0)
              this._events = new EventHandlers();
            else {
              delete events[type];
              if (events.removeListener)
                this.emit('removeListener', type, list.listener || listener);
            }
          } else if (typeof list !== 'function') {
            position = -1;

            for (i = list.length; i-- > 0;) {
              if (list[i] === listener ||
                  (list[i].listener && list[i].listener === listener)) {
                originalListener = list[i].listener;
                position = i;
                break;
              }
            }

            if (position < 0)
              return this;

            if (list.length === 1) {
              list[0] = undefined;
              if (--this._eventsCount === 0) {
                this._events = new EventHandlers();
                return this;
              } else {
                delete events[type];
              }
            } else {
              spliceOne(list, position);
            }

            if (events.removeListener)
              this.emit('removeListener', type, originalListener || listener);
          }

          return this;
        };

    EventEmitter.prototype.removeAllListeners =
        function removeAllListeners(type) {
          var listeners, events;

          events = this._events;
          if (!events)
            return this;

          // not listening for removeListener, no need to emit
          if (!events.removeListener) {
            if (arguments.length === 0) {
              this._events = new EventHandlers();
              this._eventsCount = 0;
            } else if (events[type]) {
              if (--this._eventsCount === 0)
                this._events = new EventHandlers();
              else
                delete events[type];
            }
            return this;
          }

          // emit removeListener for all listeners on all events
          if (arguments.length === 0) {
            var keys = Object.keys(events);
            for (var i = 0, key; i < keys.length; ++i) {
              key = keys[i];
              if (key === 'removeListener') continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = new EventHandlers();
            this._eventsCount = 0;
            return this;
          }

          listeners = events[type];

          if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
          } else if (listeners) {
            // LIFO order
            do {
              this.removeListener(type, listeners[listeners.length - 1]);
            } while (listeners[0]);
          }

          return this;
        };

    EventEmitter.prototype.listeners = function listeners(type) {
      var evlistener;
      var ret;
      var events = this._events;

      if (!events)
        ret = [];
      else {
        evlistener = events[type];
        if (!evlistener)
          ret = [];
        else if (typeof evlistener === 'function')
          ret = [evlistener.listener || evlistener];
        else
          ret = unwrapListeners(evlistener);
      }

      return ret;
    };

    EventEmitter.listenerCount = function(emitter, type) {
      if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };

    EventEmitter.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;

      if (events) {
        var evlistener = events[type];

        if (typeof evlistener === 'function') {
          return 1;
        } else if (evlistener) {
          return evlistener.length;
        }
      }

      return 0;
    }

    EventEmitter.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
    };

    // About 1.5x faster than the two-arg version of Array#splice().
    function spliceOne(list, index) {
      for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
        list[i] = list[k];
      list.pop();
    }

    function arrayClone(arr, i) {
      var copy = new Array(i);
      while (i--)
        copy[i] = arr[i];
      return copy;
    }

    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }

    var BASE_URL = isDev() ? 'https://waimao-test1.cowork.netease.com' : 'https://waimao.office.163.com';

    var NosUploadHost = 'wanproxy-web.127.net';
    var UploadFileStatus;
    (function (UploadFileStatus) {
        UploadFileStatus[UploadFileStatus["INIT"] = 0] = "INIT";
        UploadFileStatus[UploadFileStatus["UPLOADING"] = 1] = "UPLOADING";
        UploadFileStatus[UploadFileStatus["DONE"] = 2] = "DONE";
        UploadFileStatus[UploadFileStatus["FAIL"] = 3] = "FAIL";
        UploadFileStatus[UploadFileStatus["PAUSE"] = 4] = "PAUSE";
        UploadFileStatus[UploadFileStatus["CANCEL"] = 5] = "CANCEL";
    })(UploadFileStatus || (UploadFileStatus = {}));
    function getUploadToken(options) {
        return fetch("".concat(BASE_URL, "/sns-server/api/biz/upload/get_upload_token?fileName=").concat(encodeURIComponent(options.fileName || '')))
            .then(function (res) { return res.json(); })
            .then(function (res) {
            if (res.success) {
                return res.data;
            }
            throw new Error(res.message);
        });
    }
    // class EventEmitter {
    //   events: Record<string, Array<Function>> = {};
    //   on(event: string, listener: Function) {
    //     if (!this.events[event]) {
    //       this.events[event] = [];
    //     }
    //     this.events[event].push(listener);
    //     return this;
    //   }
    //   off(event: string, listener?: Function) {
    //     if (!this.events[event]) {
    //       return this;
    //     }
    //     if (listener === undefined) {
    //       delete this.events[event];
    //     } else {
    //       const idx = this.events[event].indexOf(listener);
    //       idx > -1 && this.events[event].splice(idx, 1);
    //     }
    //     return this;
    //   }
    //   emit(event: string, ...data: any[]) {
    //     const copy = [...this.events[event]];
    //     copy.forEach(fn => fn(...data));
    //     return this;
    //   }
    // }
    var NosUploader = /** @class */ (function (_super) {
        __extends(NosUploader, _super);
        function NosUploader(file, hash, sliceSize) {
            var _this = _super.call(this) || this;
            _this.status = UploadFileStatus.INIT;
            _this.sliceSize = 2 * 1024 * 1024;
            _this.file = file;
            // this._setStatus(UploadFileStatus.UPLOADING);;
            _this.hash = hash;
            _this.id = hash + Date.now();
            _this.fileSize = file.size;
            _this.offset = 0;
            _this.progress = 0;
            _this.sliceUploadStartTime = Date.now();
            if (sliceSize) {
                _this.sliceSize = sliceSize;
            }
            return _this;
        }
        NosUploader.prototype.startUpload = function () {
            var _this = this;
            var option = {
                fileName: this.file.name,
                fileSize: this.file.size,
            };
            getUploadToken(option)
                .then(function (data) {
                _this.uploadInfo = data;
                console.log('uploadToken', data);
                _this.fileReader = new FileReader();
                _this.fileReader.onload = function (e) {
                    var _a;
                    _this.uploadSlice((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                };
                _this.fileReader.onerror = function (e) {
                    _this._setStatus(UploadFileStatus.FAIL);
                    _this.emit('error', e);
                };
                _this._setStatus(UploadFileStatus.UPLOADING);
                _this.uploadNext();
            })
                .catch(function (e) {
                _this._setStatus(UploadFileStatus.FAIL);
                _this.emit('error', e);
            });
        };
        NosUploader.prototype.cancelUpload = function () {
            this._setStatus(UploadFileStatus.CANCEL);
            this.abortController && this.abortController.abort();
        };
        NosUploader.prototype.continueUpload = function () {
            if (this.status === UploadFileStatus.UPLOADING)
                return;
            if (!this.uploadInfo) {
                this.startUpload();
            }
            else {
                this._setStatus(UploadFileStatus.UPLOADING);
                this.uploadNext();
            }
        };
        NosUploader.prototype.completeUpload = function () {
            this._setStatus(UploadFileStatus.DONE);
            this.emit('complete', this.uploadInfo);
            return this.uploadInfo;
        };
        NosUploader.prototype.uploadSlice = function (slice) {
            var _this = this;
            var _a = this, offset = _a.offset, status = _a.status, uploadInfo = _a.uploadInfo;
            if (!slice || !uploadInfo)
                return;
            if (status !== UploadFileStatus.UPLOADING)
                return;
            var bucketName = uploadInfo.bucketName, nosKey = uploadInfo.nosKey, _b = uploadInfo.context, context = _b === void 0 ? '' : _b, token = uploadInfo.token;
            var isComplete = slice.byteLength + offset === this.file.size;
            var uploadUrl = "https://".concat(NosUploadHost, "/").concat(bucketName, "/").concat(nosKey);
            this.abortController = new AbortController();
            // const config: AxiosRequestConfig = {
            //     headers: {
            //         'x-nos-token': token,
            //         ContentType: this.file.type,
            //     },
            //     timeout: 2 * 60 * 1000,
            //     params: {
            //         offset,
            //         complete: isComplete,
            //         context,
            //         version: '1.0',
            //     },
            //     onUploadProgress: (ev: ProgressEvent) => {
            //         const pos = this.offset + ev.loaded;
            //         this.progress = +((pos * 100) / this.file.size).toFixed(1);
            //         // const now = Date.now();
            //         // this.uploadSpeed =
            //         //     formatFileSize(
            //         //         (slice.byteLength * 1000) / (now - (this.sliceUploadStartTime || 0))
            //         //     ) + '/s';
            //         // this.sliceUploadStartTime = now;
            //         // this.emit('progress', { loaded: pos, progress: this.progress, speed: this.uploadSpeed });
            //     },
            //     cancelToken: this.cancelToken.token
            // };
            var params = new URLSearchParams({
                offset: offset.toString(),
                complete: String(isComplete),
                context: context,
                version: '1.0'
            }).toString();
            fetch(uploadUrl + '?' + params, {
                method: 'POST',
                body: slice,
                headers: {
                    'x-nos-token': token,
                    ContentType: this.file.type,
                },
                signal: this.abortController.signal,
            })
                .then(function (res) { return res.json(); })
                .then(function (ret) {
                console.log('upload to', uploadUrl, offset, offset + slice.byteLength, ret);
                if (isComplete) {
                    _this.completeUpload();
                }
                else {
                    _this.uploadInfo.context = ret.context;
                    _this.offset = ret.offset;
                    _this.uploadNext();
                }
            })
                .catch(function (_) {
                _this._setStatus(UploadFileStatus.FAIL);
                _this.emit('error', _);
            });
        };
        NosUploader.prototype.uploadNext = function () {
            var blobSlice = File.prototype.slice;
            console.log('uploadSlice', this.offset, this.offset + this.sliceSize);
            this.fileReader.readAsArrayBuffer(blobSlice.call(this.file, this.offset, this.offset + this.sliceSize));
        };
        NosUploader.prototype._setStatus = function (status) {
            if (this.status !== status) {
                var oldStatus = status;
                this.status = status;
                this.emit('statusChange', status, oldStatus);
            }
        };
        return NosUploader;
    }(EventEmitter));

    var DEFAULT_MEDIA_HOST = 'https://media-hkg4-2.cdn.whatsapp.net';
    function download(url) {
        return fetch(url).then(function (res) { return res.arrayBuffer(); });
    }
    function decrypt(buffer, mediaInfo) {
        return decryptMedia(buffer, mediaInfo.mediaKey, mediaInfo.mediaType);
    }
    function upload(file, mediaInfo) {
        var uploader = new NosUploader(file, mediaInfo.hash);
        return new Promise(function (resolve, reject) {
            uploader.on('complete', resolve);
            uploader.on('error', reject);
            uploader.startUpload();
        });
    }
    var mediaHandler = function (mediaInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                url = "".concat(DEFAULT_MEDIA_HOST).concat(mediaInfo.directPath, "&hash=").concat(mediaInfo.encFileHash);
                return [2 /*return*/, download(url).then(function (buff) { return decrypt(buff, mediaInfo); }).then(function (buffer) {
                        var blob = new Blob([buffer], { type: mediaInfo.mimeType });
                        var file = new File([blob], mediaInfo.filename ? mediaInfo.filename : mediaInfo.hash, {
                            type: mediaInfo.mimeType
                        });
                        // todo 上传到nos
                        return upload(file, mediaInfo).then(function (res) {
                            console.log('uploaded', res);
                            return { bucketName: res.bucketName, nosKey: res.nosKey };
                        }, function (e) {
                            console.error(e);
                            throw e;
                        });
                    })];
            });
        });
    };

    var checkSyncedMessages = function (companyId, messageIds) {
        return fetch("".concat(BASE_URL, "/sns-sender-adapter/api/biz/whatsapp/personal/im/isSync"), {
            method: 'POST',
            body: JSON.stringify({
                resourceId: companyId,
                resourceType: 1,
                messageIds: messageIds,
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(function (res) { return res.json(); })
            .then(function (res) {
            if (res.success === true) {
                return res.data;
            }
            throw new Error(res.message);
        });
    };
    var syncMessages = function (req) {
        var body = __assign(__assign({}, req), { resourceType: 1, messages: req.messages });
        return fetch("".concat(BASE_URL, "/sns-sender-adapter/api/biz/whatsapp/personal/im/syncMessage"), {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(function (res) { return res.json(); })
            .then(function (res) {
            if (res.success === true) {
                return res.data;
            }
            throw new Error(res.message);
        });
    };

    function startWhatsApp() {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request.type === 'syncMessage') {
                handleSyncMessage(request.data, sendResponse);
                return true;
            }
            else if (request.type === 'clearServiceWorker') {
                chrome.browsingData.removeServiceWorkers({
                    "origins": ["https://web.whatsapp.com"]
                }, function () {
                    console.log('service worker for whatsapp cleared');
                    sendResponse({
                        success: true
                    });
                });
                return true;
            }
            if (request.type === 'syncData') {
                fetch(BASE_URL + '/it-plugins/api/biz/plugin/uni_create_product', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request.data)
                }).then(function (res) { return res.json(); })
                    .then(function (res) { return sendResponse(res); });
                return true;
            }
            if (request.type === 'whatsAppCreateJob') {
                fetch(BASE_URL + '/sns-server/api/biz/personal/job/create', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request.data)
                }).then(function (res) { return res.json(); })
                    .then(function (res) { return sendResponse(res); });
                return true;
            }
            if (request.type === 'whatsAppUpdateJob') {
                fetch(BASE_URL + '/sns-server/api/biz/personal/task/update', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request.data)
                }).then(function (res) { return res.json(); })
                    .then(function (res) { return sendResponse(res); });
                return true;
            }
        });
    }
    function handleSyncMessage(data, sendResponse) {
        return __awaiter(this, void 0, void 0, function () {
            var companyId, messageList, messageIds, unSyncedMessageIds, mapUnSyncedMessages_1, unSyncedMessageList_1, promises_1, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('handleSyncMessage', data);
                        companyId = data.companyId, messageList = data.messageList;
                        if (!messageList || messageList.length === 0) {
                            return [2 /*return*/, sendResponse([])];
                        }
                        if (!companyId) {
                            return [2 /*return*/, sendResponse([])];
                        }
                        messageIds = messageList.map(function (i) { return i.msgId; });
                        return [4 /*yield*/, checkSyncedMessages(companyId, messageIds)];
                    case 1:
                        unSyncedMessageIds = _a.sent();
                        if (unSyncedMessageIds.length === 0) {
                            return [2 /*return*/, sendResponse(messageIds)];
                        }
                        mapUnSyncedMessages_1 = arrayToMap(unSyncedMessageIds);
                        unSyncedMessageList_1 = messageList.filter(function (i) { return !!mapUnSyncedMessages_1[i.msgId]; });
                        promises_1 = [];
                        unSyncedMessageList_1.forEach(function (msg) {
                            switch (msg.type) {
                                case 'image':
                                case 'video':
                                case 'ptt':
                                case 'document':
                                    promises_1.push(mediaHandler({
                                        mediaKey: msg.body.mediaKey,
                                        mediaType: msg.type,
                                        mimeType: msg.body.mimeType,
                                        hash: msg.body.hash,
                                        filename: msg.body.filename,
                                        directPath: msg.body.directPath,
                                        encFileHash: msg.body.encFileHash,
                                    }).then(function (nosUploadInfo) {
                                        msg.body.nosUploadInfo = nosUploadInfo;
                                        return nosUploadInfo;
                                    }), function (err) {
                                        console.warn(err);
                                        // todo 日志上报
                                    });
                                    break;
                            }
                        });
                        Promise.allSettled(promises_1).then(function (links) {
                            console.log('download all media', unSyncedMessageList_1, links);
                            var messages = unSyncedMessageList_1.map(function (item) { return ({
                                messageId: item.msgId,
                                exchangeType: item.sendType === 'in' ? 1 : 0,
                                sendTime: item.sendTime * 1000,
                                messageType: item.type,
                                content: JSON.stringify(item.body)
                            }); });
                            // 同步消息
                            syncMessages({
                                from: data.fromSnsId,
                                fromName: data.fromSnsName,
                                to: data.toSnsId,
                                toName: data.toSnsName,
                                toAvatar: data.toSnsAvatar,
                                resourceId: data.companyId,
                                messages: messages,
                            })
                                .then(function () {
                                sendResponse(messages.map(function (i) { return i.messageId; }));
                            });
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        console.error(e_1);
                        return [2 /*return*/, sendResponse([])];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }

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

    startWhatsApp();
    registerNetwork();

})();
