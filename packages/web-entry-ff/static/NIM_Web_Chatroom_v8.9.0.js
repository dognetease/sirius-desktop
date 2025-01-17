!(function (e, t) {
  'object' == typeof exports && 'object' == typeof module
    ? (module.exports = t(
        (function () {
          try {
            return require('crypto');
          } catch (e) {}
        })()
      ))
    : 'function' == typeof define && define.amd
    ? define(['crypto'], t)
    : 'object' == typeof exports
    ? (exports.Chatroom = t(
        (function () {
          try {
            return require('crypto');
          } catch (e) {}
        })()
      ))
    : (e.Chatroom = t(e.crypto));
})(window, function (__WEBPACK_EXTERNAL_MODULE__307__) {
  return (function (e) {
    var t = {};
    function n(r) {
      if (t[r]) return t[r].exports;
      var o = (t[r] = { i: r, l: !1, exports: {} });
      return e[r].call(o.exports, o, o.exports, n), (o.l = !0), o.exports;
    }
    return (
      (n.m = e),
      (n.c = t),
      (n.d = function (e, t, r) {
        n.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: r });
      }),
      (n.r = function (e) {
        'undefined' != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
          Object.defineProperty(e, '__esModule', { value: !0 });
      }),
      (n.t = function (e, t) {
        if ((1 & t && (e = n(e)), 8 & t)) return e;
        if (4 & t && 'object' == typeof e && e && e.__esModule) return e;
        var r = Object.create(null);
        if ((n.r(r), Object.defineProperty(r, 'default', { enumerable: !0, value: e }), 2 & t && 'string' != typeof e))
          for (var o in e)
            n.d(
              r,
              o,
              function (t) {
                return e[t];
              }.bind(null, o)
            );
        return r;
      }),
      (n.n = function (e) {
        var t =
          e && e.__esModule
            ? function () {
                return e.default;
              }
            : function () {
                return e;
              };
        return n.d(t, 'a', t), t;
      }),
      (n.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      }),
      (n.p = ''),
      n((n.s = 302))
    );
  })([
    function (e, t, n) {
      'use strict';
      var r = i(n(21)),
        o = i(n(2));
      function i(e) {
        return e && e.__esModule ? e : { default: e };
      }
      var s = n(86),
        a = n(69);
      function c(e) {
        'object' === (void 0 === e ? 'undefined' : (0, o.default)(e))
          ? ((this.callFunc = e.callFunc || null), (this.message = e.message || 'UNKNOW ERROR'))
          : (this.message = e),
          (this.time = new Date()),
          (this.timetag = +this.time);
      }
      n(142);
      var u,
        l,
        p = n(10),
        m = p.getGlobal(),
        d = /\s+/;
      (p.deduplicate = function (e) {
        var t = [];
        return (
          e.forEach(function (e) {
            -1 === t.indexOf(e) && t.push(e);
          }),
          t
        );
      }),
        (p.capFirstLetter = function (e) {
          return e ? (e = '' + e).slice(0, 1).toUpperCase() + e.slice(1) : '';
        }),
        (p.guid =
          ((u = function () {
            return ((65536 * (1 + Math.random())) | 0).toString(16).substring(1);
          }),
          function () {
            return u() + u() + u() + u() + u() + u() + u() + u();
          })),
        (p.extend = function (e, t, n) {
          for (var r in t) (void 0 !== e[r] && !0 !== n) || (e[r] = t[r]);
        }),
        (p.filterObj = function (e, t) {
          var n = {};
          return (
            p.isString(t) && (t = t.split(d)),
            t.forEach(function (t) {
              e.hasOwnProperty(t) && (n[t] = e[t]);
            }),
            n
          );
        }),
        (p.copy = function (e, t) {
          return (
            (t = t || {}),
            e
              ? (Object.keys(e).forEach(function (n) {
                  p.exist(e[n]) && (t[n] = e[n]);
                }),
                t)
              : t
          );
        }),
        (p.copyWithNull = function (e, t) {
          return (
            (t = t || {}),
            e
              ? (Object.keys(e).forEach(function (n) {
                  (p.exist(e[n]) || p.isnull(e[n])) && (t[n] = e[n]);
                }),
                t)
              : t
          );
        }),
        (p.findObjIndexInArray = function (e, t) {
          e = e || [];
          var n = t.keyPath || 'id',
            r = -1;
          return (
            e.some(function (e, o) {
              if (a(e, n) === t.value) return (r = o), !0;
            }),
            r
          );
        }),
        (p.findObjInArray = function (e, t) {
          var n = p.findObjIndexInArray(e, t);
          return -1 === n ? null : e[n];
        }),
        (p.mergeObjArray = function () {
          var e = [],
            t = [].slice.call(arguments, 0, -1),
            n = arguments[arguments.length - 1];
          p.isArray(n) && (t.push(n), (n = {}));
          var r,
            o = (n.keyPath = n.keyPath || 'id');
          for (n.sortPath = n.sortPath || o; !e.length && t.length; ) e = (e = t.shift() || []).slice(0);
          return (
            t.forEach(function (t) {
              t &&
                t.forEach(function (t) {
                  -1 !== (r = p.findObjIndexInArray(e, { keyPath: o, value: a(t, o) })) ? (e[r] = p.merge({}, e[r], t)) : e.push(t);
                });
            }),
            n.notSort || (e = p.sortObjArray(e, n)),
            e
          );
        }),
        (p.cutObjArray = function (e) {
          var t = e.slice(0),
            n = arguments.length,
            r = [].slice.call(arguments, 1, n - 1),
            o = arguments[n - 1];
          p.isObject(o) || (r.push(o), (o = {}));
          var i,
            s = (o.keyPath = o.keyPath || 'id');
          return (
            r.forEach(function (e) {
              p.isArray(e) || (e = [e]),
                e.forEach(function (e) {
                  e && ((o.value = a(e, s)), -1 !== (i = p.findObjIndexInArray(t, o)) && t.splice(i, 1));
                });
            }),
            t
          );
        }),
        (p.sortObjArray = function (e, t) {
          var n = (t = t || {}).sortPath || 'id';
          s.insensitive = !!t.insensitive;
          var r,
            o,
            i,
            c = !!t.desc;
          return (
            (i = p.isFunction(t.compare)
              ? t.compare
              : function (e, t) {
                  return (r = a(e, n)), (o = a(t, n)), c ? s(o, r) : s(r, o);
                }),
            e.sort(i)
          );
        }),
        (p.emptyFunc = function () {}),
        (p.isEmptyFunc = function (e) {
          return e === p.emptyFunc;
        }),
        (p.notEmptyFunc = function (e) {
          return e !== p.emptyFunc;
        }),
        (p.splice = function (e, t, n) {
          return [].splice.call(e, t, n);
        }),
        (p.reshape2d = function (e, t) {
          if (Array.isArray(e)) {
            p.verifyParamType('type', t, 'number', 'util::reshape2d');
            var n = e.length;
            if (n <= t) return [e];
            for (var r = Math.ceil(n / t), o = [], i = 0; i < r; i++) o.push(e.slice(i * t, (i + 1) * t));
            return o;
          }
          return e;
        }),
        (p.flatten2d = function (e) {
          if (Array.isArray(e)) {
            var t = [];
            return (
              e.forEach(function (e) {
                t = t.concat(e);
              }),
              t
            );
          }
          return e;
        }),
        (p.dropArrayDuplicates = function (e) {
          if (Array.isArray(e)) {
            for (var t = {}, n = []; e.length > 0; ) {
              t[e.shift()] = !0;
            }
            for (var r in t) !0 === t[r] && n.push(r);
            return n;
          }
          return e;
        }),
        (p.onError = function (e) {
          throw new c(e);
        }),
        (p.verifyParamPresent = function (e, t, n, r) {
          n = n || '';
          var o = !1;
          switch (p.typeOf(t)) {
            case 'undefined':
            case 'null':
              o = !0;
              break;
            case 'string':
              '' === t && (o = !0);
              break;
            case 'StrStrMap':
            case 'object':
              Object.keys(t).length || (o = !0);
              break;
            case 'array':
              t.length
                ? t.some(function (e) {
                    if (p.notexist(e)) return (o = !0), !0;
                  })
                : (o = !0);
          }
          o && p.onParamAbsent(n + e, r);
        }),
        (p.onParamAbsent = function (e, t) {
          p.onParamError('缺少参数 ' + e + ', 请确保参数不是 空字符串、空对象、空数组、null或undefined, 或数组的内容不是 null/undefined', t);
        }),
        (p.verifyParamAbsent = function (e, t, n, r) {
          (n = n || ''), void 0 !== t && p.onParamPresent(n + e, r);
        }),
        (p.onParamPresent = function (e, t) {
          p.onParamError('多余的参数 ' + e, t);
        }),
        (p.verifyParamType = function (e, t, n, r) {
          var o = p.typeOf(t).toLowerCase();
          p.isArray(n) || (n = [n]);
          var i = !0;
          switch (
            (-1 ===
              (n = n.map(function (e) {
                return e.toLowerCase();
              })).indexOf(o) && (i = !1),
            o)
          ) {
            case 'number':
              isNaN(t) && (i = !1);
              break;
            case 'string':
              'numeric or numeric string' === n.join('') && (i = !!/^[0-9]+$/.test(t));
          }
          i || p.onParamInvalidType(e, n, '', r);
        }),
        (p.onParamInvalidType = function (e, t, n, r) {
          (n = n || ''),
            (t = p.isArray(t)
              ? (t = t.map(function (e) {
                  return '"' + e + '"';
                })).join(', ')
              : '"' + t + '"'),
            p.onParamError('参数"' + n + e + '"类型错误, 合法的类型包括: [' + t + ']', r);
        }),
        (p.verifyParamValid = function (e, t, n, r) {
          p.isArray(n) || (n = [n]), -1 === n.indexOf(t) && p.onParamInvalidValue(e, n, r);
        }),
        (p.onParamInvalidValue = function (e, t, n) {
          p.isArray(t) || (t = [t]),
            (t = t.map(function (e) {
              return '"' + e + '"';
            })),
            p.isArray(t) && (t = t.join(', ')),
            p.onParamError('参数 ' + e + '值错误, 合法的值包括: [' + JSON.stringify(t) + ']', n);
        }),
        (p.verifyParamMin = function (e, t, n, r) {
          t < n && p.onParamError('参数' + e + '的值不能小于' + n, r);
        }),
        (p.verifyParamMax = function (e, t, n, r) {
          t > n && p.onParamError('参数' + e + '的值不能大于' + n, r);
        }),
        (p.verifyArrayMax = function (e, t, n, r) {
          t.length > n && p.onParamError('参数' + e + '的长度不能大于' + n, r);
        }),
        (p.verifyEmail =
          ((l = /^\S+@\S+$/),
          function (e, t, n) {
            l.test(t) || p.onParamError('参数' + e + '邮箱格式错误, 合法格式必须包含@符号, @符号前后至少要各有一个字符', n);
          })),
        (p.verifyTel = (function () {
          var e = /^[+\-()\d]+$/;
          return function (t, n, r) {
            e.test(n) || p.onParamError('参数' + t + '电话号码格式错误, 合法字符包括+、-、英文括号和数字', r);
          };
        })()),
        (p.verifyBirth = (function () {
          var e = /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
          return function (t, n, r) {
            e.test(n) || p.onParamError('参数' + t + '生日格式错误, 合法为"yyyy-MM-dd"', r);
          };
        })()),
        (p.onParamError = function (e, t) {
          p.onError({ message: e, callFunc: t });
        }),
        (p.verifyOptions = function (e, t, n, r, o) {
          if (((e = e || {}), t && (p.isString(t) && (t = t.split(d)), p.isArray(t)))) {
            'boolean' != typeof n && ((o = n || null), (n = !0), (r = ''));
            var i = n ? p.verifyParamPresent : p.verifyParamAbsent;
            t.forEach(function (t) {
              i.call(p, t, e[t], r, o);
            });
          }
          return e;
        }),
        (p.verifyParamAtLeastPresentOne = function (e, t, n) {
          t &&
            (p.isString(t) && (t = t.split(d)),
            p.isArray(t) &&
              (t.some(function (t) {
                return p.exist(e[t]);
              }) ||
                p.onParamError('以下参数[' + t.join(', ') + ']至少需要传入一个', n)));
        }),
        (p.verifyParamPresentJustOne = function (e, t, n) {
          t &&
            (p.isString(t) && (t = t.split(d)),
            p.isArray(t) &&
              1 !==
                t.reduce(function (t, n) {
                  return p.exist(e[n]) && t++, t;
                }, 0) &&
              p.onParamError('以下参数[' + t.join(', ') + ']必须且只能传入一个', n));
        }),
        (p.verifyBooleanWithDefault = function (e, t, n, r, o) {
          p.undef(n) && (n = !0),
            d.test(t) && (t = t.split(d)),
            p.isArray(t)
              ? t.forEach(function (t) {
                  p.verifyBooleanWithDefault(e, t, n, r, o);
                })
              : void 0 === e[t]
              ? (e[t] = n)
              : p.isBoolean(e[t]) || p.onParamInvalidType(t, 'boolean', r, o);
        }),
        (p.verifyFileInput = function (e, t) {
          return (
            p.verifyParamPresent('fileInput', e, '', t),
            p.isString(e) &&
              ((e = 'undefined' == typeof document ? void 0 : document.getElementById(e)) || p.onParamError('找不到要上传的文件对应的input, 请检查fileInput id ' + e, t)),
            (e.tagName && 'input' === e.tagName.toLowerCase() && 'file' === e.type.toLowerCase()) ||
              p.onParamError('请提供正确的 fileInput, 必须为 file 类型的 input 节点 tagname:' + e.tagName + ', filetype:' + e.type, t),
            e
          );
        }),
        (p.verifyFileType = function (e, t) {
          p.verifyParamValid('type', e, p.validFileTypes, t);
        }),
        (p.verifyCallback = function (e, t, n) {
          d.test(t) && (t = t.split(d)),
            p.isArray(t)
              ? t.forEach(function (t) {
                  p.verifyCallback(e, t, n);
                })
              : e[t]
              ? p.isFunction(e[t]) || p.onParamInvalidType(t, 'function', '', n)
              : (e[t] = p.emptyFunc);
        }),
        (p.verifyFileUploadCallback = function (e, t) {
          p.verifyCallback(e, 'uploadprogress uploaddone uploaderror uploadcancel', t);
        }),
        (p.validFileTypes = ['image', 'audio', 'video', 'file']),
        (p.validFileExts = {
          image: ['bmp', 'gif', 'jpg', 'jpeg', 'jng', 'png', 'webp'],
          audio: ['mp3', 'wav', 'aac', 'wma', 'wmv', 'amr', 'mp2', 'flac', 'vorbis', 'ac3'],
          video: ['mp4', 'rm', 'rmvb', 'wmv', 'avi', 'mpg', 'mpeg', 'mov'],
        }),
        (p.filterFiles = function (e, t) {
          var n,
            r,
            o = 'file' === (t = t.toLowerCase()),
            i = [];
          return (
            [].forEach.call(e, function (e) {
              if (o) i.push(e);
              else if (((n = e.name.slice(e.name.lastIndexOf('.') + 1)), (r = e.type.split('/'))[0] && r[1])) {
                (r[0].toLowerCase() === t || -1 !== p.validFileExts[t].indexOf(n)) && i.push(e);
              }
            }),
            i
          );
        });
      var f,
        y,
        g = (p.supportFormData = p.notundef(m.FormData));
      (p.getFileName = function (e) {
        return (e = p.verifyFileInput(e)), g ? e.files[0].name : e.value.slice(e.value.lastIndexOf('\\') + 1);
      }),
        (p.getFileInfo =
          ((f = { ppt: 1, pptx: 2, pdf: 3, doc: 6, docx: 7 }),
          function (e) {
            var t = {};
            if (!(e = p.verifyFileInput(e)).files) return t;
            var n = e.files[0];
            return (
              g &&
                ((t.name = n.name),
                (t.size = n.size),
                (t.type = n.name.match(/\.(\w+)$/)),
                (t.type = t.type && t.type[1].toLowerCase()),
                (t.transcodeType = f[t.type] || 0)),
              t
            );
          })),
        (p.sizeText =
          ((y = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'BB']),
          function (e) {
            var t,
              n = 0;
            do {
              (t = (e = Math.floor(100 * e) / 100) + y[n]), (e /= 1024), n++;
            } while (e > 1);
            return t;
          })),
        (p.promises2cmds = function (e) {
          return e.map(function (e) {
            return e.cmd;
          });
        }),
        (p.objs2accounts = function (e) {
          return e.map(function (e) {
            return e.account;
          });
        }),
        (p.teams2ids = function (e) {
          return e.map(function (e) {
            return e.teamId;
          });
        }),
        (p.objs2ids = function (e) {
          return e.map(function (e) {
            return e.id;
          });
        }),
        (p.getMaxUpdateTime = function (e) {
          var t = e.map(function (e) {
            return +e.updateTime;
          });
          return Math.max.apply(Math, t);
        }),
        (p.genCheckUniqueFunc = function (e, t) {
          return (
            (e = e || 'id'),
            (t = t || 1e3),
            function (t) {
              (this.uniqueSet = this.uniqueSet || {}), (this.uniqueSet[e] = this.uniqueSet[e] || {});
              var n = this.uniqueSet[e],
                r = t[e];
              return !n[r] && ((n[r] = !0), !0);
            }
          );
        }),
        (p.fillPropertyWithDefault = function (e, t, n) {
          return !!p.undef(e[t]) && ((e[t] = n), !0);
        }),
        (p.throttle = function (e, t, n, r) {
          var o,
            i,
            s,
            a = null,
            c = 0;
          n || (n = {});
          var u = function () {
            (c = !1 === n.leading ? 0 : new Date().getTime()), (a = null), (s = e.apply(o, i)), a || (o = i = null);
          };
          return function () {
            var l = new Date().getTime();
            c || !1 !== n.leading || (c = l);
            var p = t - (l - c);
            return (
              (o = this),
              (i = arguments),
              p <= 0 || p > t
                ? (clearTimeout(a), (a = null), (c = l), (s = e.apply(o, i)), a || (o = i = null))
                : a || !1 === n.trailing
                ? a && r && r.apply(o, i)
                : ((a = setTimeout(u, p)), r && r.apply(o, i)),
              s
            );
          };
        }),
        (p.get = function (e, t) {
          var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0,
            r = t.replace(/\[(\d+)\]/g, '.$1').split('.'),
            o = e,
            i = !0,
            s = !1,
            a = void 0;
          try {
            for (var c, u = r[Symbol.iterator](); !(i = (c = u.next()).done); i = !0) {
              var l = c.value;
              if (void 0 === (o = Object(o)[l])) return n;
            }
          } catch (e) {
            (s = !0), (a = e);
          } finally {
            try {
              !i && u.return && u.return();
            } finally {
              if (s) throw a;
            }
          }
          return o;
        }),
        (p.pickAsString = function (e, t) {
          return e
            ? t
                .filter(function (t) {
                  return void 0 !== e[t];
                })
                .map(function (t) {
                  return t + '=' + e[t];
                })
                .join(',')
            : '';
        }),
        (p.omitAsString = function (e, t) {
          if (!e) return '';
          var n = {};
          return (
            t.forEach(function (e) {
              n[e] = !0;
            }),
            Object.keys(e)
              .filter(function (e) {
                return !n[e];
              })
              .map(function (t) {
                return t + '=' + e[t];
              })
              .join(',')
          );
        });
      var h = {
        session: function (e) {
          var t = (0, r.default)({}, e);
          return (
            ['topCustom', 'localCustom', 'extra'].forEach(function (e) {
              t[e] && (t[e] = '***');
            }),
            t.lastMsg && (t.lastMsg = { idServer: t.lastMsg.idServer, idClient: t.lastMsg.idClient }),
            t
          );
        },
      };
      p.secureOutput = function (e, t) {
        Array.isArray(t) || (t = [t]);
        var n = h[e];
        return 1 ===
          (t = t.map(function (e) {
            return n(e);
          })).length
          ? t[0]
          : t;
      };
      var v = {
        string: function (e, t, n) {
          var r = n.required,
            o = n.allowEmpty,
            i = e[t];
          return (!1 === r && void 0 === i) || ('string' == typeof i && !(!o && '' === i));
        },
        number: function (e, t, n) {
          var r = n.required,
            o = n.min,
            i = e[t];
          return (!1 === r && void 0 === i) || ('number' == typeof i && !(i < o));
        },
        enum: function (e, t, n) {
          var r = n.required,
            o = n.values,
            i = e[t];
          return (!1 === r && void 0 === i) || o.indexOf(i) > -1;
        },
        array: function (e, t, n) {
          var r = n.required,
            o = e[t];
          return (!1 === r && void 0 === o) || !!Array.isArray(o);
        },
      };
      (p.validate = function (e, t, n) {
        var r = {};
        return (
          Object.keys(e).forEach(function (o) {
            var i = e[o].type,
              s = v[i];
            s && !s(t, o, e[o])
              ? p.onError({ message: 'Error in parameter verification, ' + o + ' expected value is ' + JSON.stringify(e[o]), callFunc: n })
              : (r[o] = t[o]);
          }),
          r
        );
      }),
        (p.asyncPool = function (e, t, n) {
          if ('number' != typeof e || 'function' != typeof n || !t || !t.length) return Promise.resolve();
          var r = 0,
            o = [],
            i = [];
          return (function s() {
            if (r === t.length) return Promise.resolve();
            var a = t[r++],
              c = Promise.resolve().then(function () {
                return n(a, t);
              });
            o.push(c);
            var u = Promise.resolve();
            if (e <= t.length) {
              var l = c.then(function () {
                return i.splice(i.indexOf(l), 1);
              });
              i.push(l), i.length >= e && (u = Promise.race(i));
            }
            return u.then(function () {
              return s();
            });
          })().then(function () {
            return Promise.all(o);
          });
        }),
        (e.exports = p);
    },
    function (e, t, n) {
      'use strict';
      n(0);
      var r = !1;
      try {
        'function' == typeof localStorage.setItem &&
          'function' == typeof localStorage.getItem &&
          (localStorage.setItem('nim_localstorage_exist_test', '1'),
          (r = '1' === localStorage.getItem('nim_localstorage_exist_test')),
          localStorage.removeItem('nim_localstorage_exist_test'));
      } catch (e) {
        r = !1;
      }
      var o = {
        nodeEnv: 'production',
        info: {
          hash: 'b0c19243d738cfc4a1a71576dbc27573d18ca9ff',
          shortHash: 'b0c1924',
          version: '8.9.0',
          sdkVersion: '230',
          sdkHumanVersion: '8.9.0',
          protocolVersion: 1,
        },
        lbsUrl: 'https://lbs.netease.im/lbs/webconf.jsp',
        roomserver: 'roomserver.netease.im',
        connectTimeout: 8e3,
        xhrTimeout: 8e3,
        socketTimeout: 8e3,
        reconnectionDelay: 1600,
        reconnectionDelayMax: 8e3,
        reconnectionJitter: 0.01,
        reconnectiontimer: null,
        heartbeatInterval: 3e4,
        cmdTimeout: 8e3,
        hbCmdTimeout: 5e3,
        defaultReportUrl: 'https://dr.netease.im/1.gif',
        isWeixinApp: !1,
        isNodejs: !1,
        isRN: !1,
        ipVersion: 0,
        PUSHTOKEN: '',
        PUSHCONFIG: {},
        CLIENTTYPE: 16,
        PushPermissionAsked: !1,
        iosPushConfig: null,
        androidPushConfig: null,
        netDetectAddr: 'https://roomserver-dev.netease.im/v1/sdk/detect/local',
        optionDefaultLinkUrl: '',
        defaultLinkUrl: 'weblink.netease.im',
        ipv6DefaultLinkUrl: 'weblink.netease.im',
        optionIpv6DefaultLinkUrl: '',
        wxDefaultLinkUrl: 'wlnimsc0.netease.im',
        serverNosConfig: r ? { cdnDomain: localStorage.getItem('nim_cdn_domain') || '', objectPrefix: localStorage.getItem('nim_object_prefix') || '' } : {},
        hasLocalStorage: r,
        getDefaultLinkUrl: function (e) {
          var t, n;
          1 === o.ipVersion ? ((t = o.optionIpv6DefaultLinkUrl), (n = o.ipv6DefaultLinkUrl)) : ((t = o.optionDefaultLinkUrl), (n = o.defaultLinkUrl));
          var r = t || (o.isWeixinApp ? o.wxDefaultLinkUrl : n);
          if (!r) return !1;
          var i = e ? 'https' : 'http',
            s = e ? '443' : '80',
            a = r;
          return -1 === r.indexOf('http') && (a = i + '://' + a), -1 === r.indexOf(':') && (a = a + ':' + s), a;
        },
        ipProbeAddr: { ipv4: 'https://detect4.netease.im/test/', ipv6: 'https://detect6.netease.im/test/' },
        formatSocketUrl: function (e) {
          var t = e.url,
            n = e.secure ? 'https' : 'http';
          return -1 === t.indexOf('http') ? n + '://' + t : t;
        },
        uploadUrl: 'https://nos.netease.com',
        chunkUploadUrl: 'https://wanproxy-web.127.net',
        commonMaxSize: 104857600,
        chunkSize: 4194304,
        chunkMaxSize: 4194304e4,
        replaceUrl: 'https://{bucket}-nosdn.netease.im/{object}',
        downloadHost: 'nos.netease.com',
        downloadHostList: ['nos.netease.com'],
        downloadUrl: 'https://{bucket}-nosdn.netease.im/{object}',
        nosCdnEnable: !0,
        httpsEnabled: !1,
        threshold: 0,
        nosLbsUrls: ['http://wanproxy.127.net/lbs', 'http://wanproxy-bj.127.net/lbs', 'http://wanproxy-hz.127.net/lbs', 'http://wanproxy-oversea.127.net/lbs'],
        genUploadUrl: function (e) {
          return o.uploadUrl + '/' + e;
        },
        genChunkUploadUrl: function (e) {
          return o.chunkUploadUrl ? o.chunkUploadUrl + '/' + e.bucket + '/' + e.objectName : '';
        },
        genDownloadUrl: function (e, t, n) {
          var r = e.bucket,
            i = (e.tag, e.expireSec),
            s = +new Date(),
            a = i ? '&survivalTime=' + i : '';
          if (n) return 'https://' + n + '/' + t + '?createTime=' + s + a;
          var c = o.replaceUrl + '?createTime=' + s + a;
          return (c = o.genNosProtocolUrl(c)).replace('{bucket}', r).replace('{object}', t);
        },
        genFileUrl: function (e) {
          var t = e.bucket,
            n = e.objectName;
          return o.genNosProtocolUrl(o.replaceUrl).replace('{bucket}', t).replace('{object}', n);
        },
        genNosProtocolUrl: function (e) {
          return (
            /^http/.test(e) ? o.httpsEnabled && 0 !== e.indexOf('https://') && (e = e.replace('http', 'https')) : (e = o.httpsEnabled ? 'https://' + e : 'http://' + e), e
          );
        },
      };
      e.exports = o;
    },
    function (e, t, n) {
      'use strict';
      t.__esModule = !0;
      var r = s(n(123)),
        o = s(n(132)),
        i =
          'function' == typeof o.default && 'symbol' == typeof r.default
            ? function (e) {
                return typeof e;
              }
            : function (e) {
                return e && 'function' == typeof o.default && e.constructor === o.default && e !== o.default.prototype ? 'symbol' : typeof e;
              };
      function s(e) {
        return e && e.__esModule ? e : { default: e };
      }
      t.default =
        'function' == typeof o.default && 'symbol' === i(r.default)
          ? function (e) {
              return void 0 === e ? 'undefined' : i(e);
            }
          : function (e) {
              return e && 'function' == typeof o.default && e.constructor === o.default && e !== o.default.prototype ? 'symbol' : void 0 === e ? 'undefined' : i(e);
            };
    },
    ,
    function (e, t, n) {
      var r = n(54)('wks'),
        o = n(39),
        i = n(7).Symbol,
        s = 'function' == typeof i;
      (e.exports = function (e) {
        return r[e] || (r[e] = (s && i[e]) || (s ? i : o)('Symbol.' + e));
      }).store = r;
    },
    ,
    function (e, t, n) {
      'use strict';
      var r,
        o = n(2),
        i = (r = o) && r.__esModule ? r : { default: r };
      function s(e, t) {
        var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
        (this.message = e || n.message || ''),
          'object' === (void 0 === t ? 'undefined' : (0, i.default)(t)) ? ((this.event = t), (this.code = 'Other_Error')) : void 0 !== t && (this.code = t),
          (this.timetag = +new Date()),
          void 0 !== n && (this.event = n),
          this.event && ((this.callFunc = this.event.callFunc || null), delete this.event.callFunc);
      }
      (s.prototype = Object.create(Error.prototype)), (s.prototype.name = 'NIMError');
      var a = {
        201: '客户端版本不对, 需升级sdk',
        302: '用户名或密码错误, 请检查appKey和token是否有效, account和token是否匹配',
        403: '非法操作或没有权限',
        404: '对象(用户/群/聊天室)不存在',
        405: '参数长度过长',
        408: '客户端请求超时',
        414: '参数错误',
        415: '服务不可用/没有聊天室服务器可分配',
        416: '频率控制',
        417: '重复操作',
        422: '账号被禁用',
        500: '服务器内部错误',
        501: '数据库操作失败',
        503: '服务器繁忙',
        508: '删除有效期过了',
        509: '已失效',
        7101: '被拉黑',
        700: '批量操作部分失败',
        801: '群人数达到上限',
        802: '没有权限',
        803: '群不存在或未发生变化',
        804: '用户不在群里面',
        805: '群类型不匹配',
        806: '创建群数量达到限制',
        807: '群成员状态不对',
        809: '已经在群里',
        811: '强推列表中账号数量超限',
        812: '群被禁言',
        813: '因群数量限制，部分拉人成功',
        814: '禁止使用群组消息已读服务',
        815: '群管理员人数上限',
        816: '批量操作部分失败',
        997: '协议已失效',
        998: '解包错误',
        999: '打包错误',
        9102: '通道失效',
        9103: '已经在其他端接听/拒绝过这通电话',
        11001: '对方离线, 通话不可送达',
        13002: '聊天室状态异常',
        13003: '在黑名单中',
        13004: '在禁言名单中',
        13006: '聊天室处于整体禁言状态,只有管理员能发言',
        Connect_Failed: '无法建立连接, 请确保能 ping/telnet 到云信服务器; 如果是IE8/9, 请确保项目部署在 HTTPS 环境下',
        Error_Internet_Disconnected: '网断了',
        Error_Connection_is_not_Established: '连接未建立',
        Error_Connection_Socket_State_not_Match: 'socket状态不对',
        Error_Timeout: '超时',
        Param_Error: '参数错误',
        No_File_Selected: '请选择文件',
        Wrong_File_Type: '文件类型错误',
        File_Too_Large: '文件过大',
        Cross_Origin_Iframe: '不能获取跨域Iframe的内容',
        Not_Support: '不支持',
        NO_DB: '无数据库',
        DB: '数据库错误',
        Still_In_Team: '还在群里',
        Session_Exist: '会话已存在',
        Session_Not_Exist: '会话不存在',
        Error_Unknown: '未知错误',
        Operation_Canceled: '操作取消',
      };
      [200, 406, 808, 810].forEach(function (e) {
        a[e] = null;
      }),
        (s.genError = function (e) {
          var t = a[e];
          return void 0 === t && (t = '操作失败'), null === t ? null : new s(t, e);
        }),
        (s.multiInstance = function (e) {
          return new s('不允许初始化多个实例', 'Not_Allow_Multi_Instance', e);
        }),
        (s.newNetworkError = function (e) {
          var t = 'Error_Internet_Disconnected';
          return new s(a[t], t, e);
        }),
        (s.newConnectError = function (e) {
          var t = 'Connect_Failed';
          return new s(a[t] || null, t, e);
        }),
        (s.newConnectionError = function (e) {
          var t = 'Error_Connection_is_not_Established';
          return new s(a[t], t, e);
        }),
        (s.newSocketStateError = function (e) {
          var t = 'Error_Connection_Socket_State_not_Match';
          return new s(a[t], t, e);
        }),
        (s.newTimeoutError = function (e) {
          var t = 'Error_Timeout';
          return new s(a[t], t, e);
        }),
        (s.newFrequencyControlError = function (e) {
          var t = new s(a[416], 416, e);
          return (t.from = 'local'), t;
        }),
        (s.newParamError = function (e, t) {
          return new s(e || a.Param_Error, 'Param_Error', t);
        }),
        (s.newNoFileError = function (e, t) {
          var n = 'No_File_Selected';
          return new s(e || a[n], n, t);
        }),
        (s.newWrongFileTypeError = function (e, t) {
          var n = 'Wrong_File_Type';
          return new s(e || a[n], n, t);
        }),
        (s.newFileTooLargeError = function (e, t) {
          var n = 'File_Too_Large';
          return new s(e || a[n], n, t);
        }),
        (s.newCORSIframeError = function (e) {
          var t = 'Cross_Origin_Iframe';
          return new s(a[t], t, e);
        }),
        (s.newSupportError = function (e, t, n) {
          return new s('不支持' + e, 'Not_Support_' + t, n);
        }),
        (s.newSupportDBError = function (e) {
          return s.newSupportError('数据库', 'DB', e);
        }),
        (s.noDBError = function (e) {
          return new s(a.NO_DB, 'NO_DB', e);
        }),
        (s.newDBError = function (e) {
          return new s(a.DB, 'DB', e);
        }),
        (s.newUnknownError = function (e) {
          var t = 'Error_Unknown';
          return new s(a[t], t, e);
        }),
        (s.stillInTeamError = function (e) {
          var t = 'Still_In_Team';
          return new s(a[t], t, e);
        }),
        (s.sessionExist = function (e) {
          var t = 'Session_Exist';
          return new s(a[t], t, e);
        }),
        (s.sessionNotExist = function (e) {
          var t = 'Session_Not_Exist';
          return new s(a[t], t, e);
        }),
        (s.cancel = function (e) {
          var t = 'Operation_Canceled';
          return new s(a[t], t, e);
        }),
        (s.customError = function (e, t) {
          e = e || 'Other_Error';
          var n = '';
          return (
            (t = t || {}).message || (n = a[e] || e),
            'object' !== (void 0 === e ? 'undefined' : (0, i.default)(e)) ? new s(n, e, t) : new s(n, 'Other_Error', void 0 === t ? e : t)
          );
        }),
        (e.exports = s);
    },
    function (e, t) {
      var n = (e.exports =
        'undefined' != typeof window && window.Math == Math ? window : 'undefined' != typeof self && self.Math == Math ? self : Function('return this')());
      'number' == typeof __g && (__g = n);
    },
    function (e, t) {
      var n = (e.exports = { version: '2.6.9' });
      'number' == typeof __e && (__e = n);
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = {
          init: function () {
            o.deviceId = r.guid();
          },
        };
      o.init(),
        (o.clientTypeMap = { 1: 'Android', 2: 'iOS', 4: 'PC', 8: 'WindowsPhone', 16: 'Web', 32: 'Server', 64: 'Mac' }),
        (o.db = { open: function () {} }),
        (o.rnfs = null),
        (e.exports = o);
    },
    function (e, t, n) {
      'use strict';
      (function (e) {
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.url2origin =
            t.uniqueID =
            t.off =
            t.removeEventListener =
            t.on =
            t.addEventListener =
            t.format =
            t.regWhiteSpace =
            t.regBlank =
            t.emptyFunc =
            t.f =
            t.emptyObj =
            t.o =
              void 0);
        var r = s(n(70)),
          o = s(n(21)),
          i = s(n(2));
        function s(e) {
          return e && e.__esModule ? e : { default: e };
        }
        (t.getGlobal = a),
          (t.detectCSSFeature = function (e) {
            var t = !1,
              n = 'Webkit Moz ms O'.split(' ');
            if ('undefined' == typeof document) return void console.log('error:fn:detectCSSFeature document is undefined');
            var r = document.createElement('div'),
              o = null;
            (e = e.toLowerCase()), void 0 !== r.style[e] && (t = !0);
            if (!1 === t) {
              o = e.charAt(0).toUpperCase() + e.substr(1);
              for (var i = 0; i < n.length; i++)
                if (void 0 !== r.style[n[i] + o]) {
                  t = !0;
                  break;
                }
            }
            return t;
          }),
          (t.fix = c),
          (t.getYearStr = u),
          (t.getMonthStr = l),
          (t.getDayStr = p),
          (t.getHourStr = m),
          (t.getMinuteStr = d),
          (t.getSecondStr = f),
          (t.getMillisecondStr = y),
          (t.dateFromDateTimeLocal = function (e) {
            return (e = '' + e), new Date(e.replace(/-/g, '/').replace('T', ' '));
          }),
          (t.getClass = v),
          (t.typeOf = b),
          (t.isString = T),
          (t.isNumber = S),
          (t.isInt = function (e) {
            return S(e) && e % 1 == 0;
          }),
          (t.isBoolean = function (e) {
            return 'boolean' === b(e);
          }),
          (t.isArray = k),
          (t.isFunction = M),
          (t.isDate = x),
          (t.isRegExp = function (e) {
            return 'regexp' === b(e);
          }),
          (t.isError = function (e) {
            return 'error' === b(e);
          }),
          (t.isnull = _),
          (t.notnull = w),
          (t.undef = C),
          (t.notundef = P),
          (t.exist = O),
          (t.notexist = A),
          (t.isObject = I),
          (t.isEmpty = function (e) {
            return A(e) || ((T(e) || k(e)) && 0 === e.length);
          }),
          (t.containsNode = function (e, t) {
            if (e === t) return !0;
            for (; t.parentNode; ) {
              if (t.parentNode === e) return !0;
              t = t.parentNode;
            }
            return !1;
          }),
          (t.calcHeight = function (e) {
            var t = e.parentNode || ('undefined' == typeof document ? null : document.body);
            if (!t) return 0;
            ((e = e.cloneNode(!0)).style.display = 'block'), (e.style.opacity = 0), (e.style.height = 'auto'), t.appendChild(e);
            var n = e.offsetHeight;
            return t.removeChild(e), n;
          }),
          (t.remove = function (e) {
            e.parentNode && e.parentNode.removeChild(e);
          }),
          (t.dataset = function (e, t, n) {
            if (!O(n)) return e.getAttribute('data-' + t);
            e.setAttribute('data-' + t, n);
          }),
          (t.target = function (e) {
            return e.target || e.srcElement;
          }),
          (t.createIframe = function (e) {
            if ('undefined' == typeof document) return;
            var t;
            if ((e = e || {}).name)
              try {
                (t = document.createElement('<iframe name="' + e.name + '"></iframe>')).frameBorder = 0;
              } catch (n) {
                (t = document.createElement('iframe')).name = e.name;
              }
            else t = document.createElement('iframe');
            e.visible || (t.style.display = 'none');
            M(e.onload) &&
              N(t, 'load', function n(r) {
                if (!t.src) return;
                e.multi || L(t, 'load', n);
                e.onload(r);
              });
            (e.parent || document.body).appendChild(t);
            var n = e.src || 'about:blank';
            return (
              setTimeout(function () {
                t.src = n;
              }, 0),
              t
            );
          }),
          (t.html2node = function (e) {
            if ('undefined' == typeof document) return;
            var t = document.createElement('div');
            t.innerHTML = e;
            var n = [],
              r = void 0,
              o = void 0;
            if (t.children) for (r = 0, o = t.children.length; r < o; r++) n.push(t.children[r]);
            else
              for (r = 0, o = t.childNodes.length; r < o; r++) {
                var i = t.childNodes[r];
                1 === i.nodeType && n.push(i);
              }
            return n.length > 1 ? t : n[0];
          }),
          (t.scrollTop = function (e) {
            'undefined' != typeof document && O(e) && (document.documentElement.scrollTop = document.body.scrollTop = e);
            return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
          }),
          (t.forOwn = D),
          (t.mixin = F),
          (t.isJSON = U),
          (t.parseJSON = function e(t) {
            try {
              U(t) && (t = JSON.parse(t)),
                I(t) &&
                  D(t, function (n, r) {
                    switch (b(r)) {
                      case 'string':
                      case 'object':
                        t[n] = e(r);
                    }
                  });
            } catch (e) {
              console.log('error:', e);
            }
            return t;
          }),
          (t.simpleClone = function (e) {
            var t = [],
              n = JSON.stringify(e, function (e, n) {
                if ('object' === (void 0 === n ? 'undefined' : (0, i.default)(n)) && null !== n) {
                  if (-1 !== t.indexOf(n)) return;
                  t.push(n);
                }
                return n;
              });
            return JSON.parse(n);
          }),
          (t.merge = function () {
            for (var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
              n[r - 1] = arguments[r];
            return (
              n.forEach(function (t) {
                F(e, t);
              }),
              e
            );
          }),
          (t.fillUndef = function (e, t) {
            return (
              D(t, function (t, n) {
                C(e[t]) && (e[t] = n);
              }),
              e
            );
          }),
          (t.checkWithDefault = function (e, t, n) {
            var r = e[t] || e[t.toLowerCase()];
            A(r) && ((r = n), (e[t] = r));
            return r;
          }),
          (t.fetch = function (e, t) {
            return (
              D(e, function (n, r) {
                O(t[n]) && (e[n] = t[n]);
              }),
              e
            );
          }),
          (t.string2object = function () {
            var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : '',
              t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : ',',
              n = {};
            return (
              e.split(t).forEach(function (e) {
                var t = e.split('='),
                  r = t.shift();
                r && (n[decodeURIComponent(r)] = decodeURIComponent(t.join('=')));
              }),
              n
            );
          }),
          (t.object2string = B),
          (t.genUrlSep = function (e) {
            return e.indexOf('?') < 0 ? '?' : '&';
          }),
          (t.object2query = function (e) {
            return B(e, '&', !0);
          }),
          (t.isFileInput = q),
          (t.getKeys = function (e, t) {
            var n = Object.keys(e);
            t &&
              n.sort(function (t, n) {
                var r = q(e[t]),
                  o = q(e[n]);
                return r === o ? 0 : r ? 1 : -1;
              });
            return n;
          }),
          (t._get = function (e, t) {
            var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0,
              r = t.replace(/\[(\d+)\]/g, '.$1').split('.'),
              o = e,
              i = !0,
              s = !1,
              a = void 0;
            try {
              for (var c, u = r[Symbol.iterator](); !(i = (c = u.next()).done); i = !0) {
                var l = c.value;
                if (void 0 === (o = Object(o)[l])) return n;
              }
            } catch (e) {
              (s = !0), (a = e);
            } finally {
              try {
                !i && u.return && u.return();
              } finally {
                if (s) throw a;
              }
            }
            return o;
          }),
          (t.getLastSeveralItems = function (e, t) {
            for (
              var n = e.length,
                i = [],
                s = function (t) {
                  var n = e[t],
                    s = n.map(function (e) {
                      return (0, o.default)({}, e, { flag: 'sort_flag_' + t });
                    });
                  i.push.apply(i, (0, r.default)(s));
                },
                a = 0;
              a < n;
              a++
            )
              s(a);
            i.sort(function (e, t) {
              return e.startTime - t.startTime;
            });
            for (
              var c = [],
                u = function (e) {
                  c[e] = i
                    .filter(function (t) {
                      return t.flag === 'sort_flag_' + e;
                    })
                    .map(function (e) {
                      return (0, o.default)({}, e, { flag: void 0 });
                    });
                },
                a = 0;
              a < n;
              a++
            )
              u(a);
            return c;
          });
        (t.o = {}), (t.emptyObj = {}), (t.f = function () {}), (t.emptyFunc = function () {}), (t.regBlank = /\s+/gi), (t.regWhiteSpace = /\s+/gi);
        function a() {
          return 'undefined' != typeof window ? window : void 0 !== e ? e : 'undefined' != typeof self ? self : {};
        }
        function c(e, t) {
          t = t || 2;
          for (var n = '' + e; n.length < t; ) n = '0' + n;
          return n;
        }
        function u(e) {
          return '' + e.getFullYear();
        }
        function l(e) {
          return c(e.getMonth() + 1);
        }
        function p(e) {
          return c(e.getDate());
        }
        function m(e) {
          return c(e.getHours());
        }
        function d(e) {
          return c(e.getMinutes());
        }
        function f(e) {
          return c(e.getSeconds());
        }
        function y(e) {
          return c(e.getMilliseconds(), 3);
        }
        var g, h;
        t.format =
          ((g = /yyyy|MM|dd|hh|mm|ss|SSS/g),
          (h = { yyyy: u, MM: l, dd: p, hh: m, mm: d, ss: f, SSS: y }),
          function (e, t) {
            return (
              (e = new Date(e)),
              isNaN(+e)
                ? 'invalid date'
                : (t = t || 'yyyy-MM-dd').replace(g, function (t) {
                    return h[t](e);
                  })
            );
          });
        function v(e) {
          return Object.prototype.toString.call(e).slice(8, -1);
        }
        function b(e) {
          return v(e).toLowerCase();
        }
        function T(e) {
          return 'string' === b(e);
        }
        function S(e) {
          return 'number' === b(e);
        }
        function k(e) {
          return 'array' === b(e);
        }
        function M(e) {
          return 'function' === b(e);
        }
        function x(e) {
          return 'date' === b(e);
        }
        function _(e) {
          return null === e;
        }
        function w(e) {
          return null !== e;
        }
        function C(e) {
          return void 0 === e;
        }
        function P(e) {
          return void 0 !== e;
        }
        function O(e) {
          return P(e) && w(e);
        }
        function A(e) {
          return C(e) || _(e);
        }
        function I(e) {
          return O(e) && 'object' === b(e);
        }
        var E = (t.addEventListener = function (e, t, n) {
            e.addEventListener ? e.addEventListener(t, n, !1) : e.attachEvent && e.attachEvent('on' + t, n);
          }),
          N = (t.on = E),
          j = (t.removeEventListener = function (e, t, n) {
            e.removeEventListener ? e.removeEventListener(t, n, !1) : e.detachEvent && e.detachEvent('on' + t, n);
          }),
          L = (t.off = j);
        function D() {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : function () {},
            n = arguments[2];
          for (var r in e) e.hasOwnProperty(r) && t.call(n, r, e[r]);
        }
        function F(e, t) {
          D(t, function (t, n) {
            e[t] = n;
          });
        }
        var R;
        t.uniqueID =
          ((R = 0),
          function () {
            return '' + R++;
          });
        function U(e) {
          return T(e) && 0 === e.indexOf('{') && e.lastIndexOf('}') === e.length - 1;
        }
        function B(e, t, n) {
          if (!e) return '';
          var r = [];
          return (
            D(e, function (e, t) {
              M(t) ||
                (x(t) ? (t = t.getTime()) : k(t) ? (t = t.join(',')) : I(t) && (t = JSON.stringify(t)),
                n && (t = encodeURIComponent(t)),
                r.push(encodeURIComponent(e) + '=' + t));
            }),
            r.join(t || ',')
          );
        }
        t.url2origin = (function () {
          var e = /^([\w]+?:\/\/.*?(?=\/|$))/i;
          return function (t) {
            return e.test(t || '') ? RegExp.$1.toLowerCase() : '';
          };
        })();
        function q(e) {
          var t = a();
          return (e.tagName && 'INPUT' === e.tagName.toUpperCase()) || (t.Blob && e instanceof t.Blob);
        }
      }).call(this, n(20));
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(2),
        i = (r = o) && r.__esModule ? r : { default: r };
      var s = n(147),
        a = n(0),
        c = a.notundef,
        u = n(148),
        l = n(1),
        p = n(17);
      function m() {}
      var d = {};
      (m.getInstance = function (e) {
        (e = y(e)), a.verifyOptions(e, 'account', 'api::Base.getInstance');
        var t = this.genInstanceName(e),
          n = d[t];
        return n ? m.updateInstance(n, e) : (n = d[t] = new this(e)), n;
      }),
        (m.updateInstance = function (e, t) {
          e.setOptions(t), e.connect();
        });
      var f = (m.fn = m.prototype = Object.create(new s())),
        y = function (e) {
          return (
            e.nosSurvivalTime
              ? (a.verifyParamType('nosSurvivalTime', e.nosSurvivalTime, 'number', 'api::Base.getInstance'),
                a.verifyParamMin('nosSurvivalTime', e.nosSurvivalTime, 86400, 'api::Base.getInstance'))
              : (e.nosSurvivalTime = 1 / 0),
            e
          );
        };
      (f.updatePrivateConf = function (e) {
        if (e && 'object' === (0, i.default)(e.privateConf)) {
          var t = e.privateConf;
          'string' == typeof t.lbs_web && (e.lbsUrl = t.lbs_web),
            'boolean' == typeof t.link_ssl_web && (e.secure = t.link_ssl_web),
            'boolean' == typeof t.https_enabled && (e.httpsEnabled = t.https_enabled),
            (e.uploadUrl = t.nos_uploader_web ? t.nos_uploader_web : null),
            (e.chunkUploadUrl = t.nos_uploader_web ? t.nos_uploader_web : null),
            (e.replaceUrl = t.nos_downloader ? t.nos_downloader : null),
            (e.downloadUrl = t.nos_accelerate ? t.nos_accelerate : null),
            (e.downloadHost = t.nos_accelerate_host ? t.nos_accelerate_host : null),
            (e.downloadHostList = t.nos_accelerate_host_list || []),
            e.downloadHost && e.downloadHostList.push(e.downloadHost),
            (e.nosCdnEnable = !1 !== t.nos_cdn_enable),
            (e.ntServerAddress = t.nt_server || null),
            (e.kibanaServer = t.kibana_server),
            (e.statisticServer = t.statistic_server),
            (e.reportGlobalServer = t.report_global_server),
            (e.ipVersion = t.ip_protocol_version),
            (e.defaultLink = t.link_web || e.defaultLink),
            (e.ipv6DefaultLink = t.link_ipv6_web || e.ipv6DefaultLink),
            'string' == typeof t.nos_lbs ? (e.nosLbsUrls = [t.nos_lbs]) : (e.nosLbsUrls = []);
        }
        return (
          null === e.ntServerAddress || '' === e.ntServerAddress ? (l.ntServerAddress = null) : (l.ntServerAddress = e.ntServerAddress || l.defaultReportUrl),
          (l.uploadUrl = e.uploadUrl || l.uploadUrl),
          (l.chunkUploadUrl = e.chunkUploadUrl || l.chunkUploadUrl),
          (l.downloadUrl = e.downloadUrl || l.downloadUrl),
          (l.downloadHost = e.downloadHost || l.downloadHost),
          (l.downloadHostList = e.downloadHostList && e.downloadHostList.length > 0 ? e.downloadHostList : l.downloadHostList),
          (l.nosCdnEnable = !1 !== e.nosCdnEnable),
          (l.replaceUrl = e.replaceUrl || l.replaceUrl),
          (l.httpsEnabled = e.httpsEnabled || l.httpsEnabled),
          e.probe_ipv4_url && (l.ipProbeAddr.ipv4 = e.probe_ipv4_url),
          e.probe_ipv6_url && (l.ipProbeAddr.ipv6 = e.probe_ipv6_url),
          e
        );
      }),
        (f.init = function (e) {
          a.verifyOptions(e, 'account', 'api::Base.init'),
            (e = this.updatePrivateConf(e)),
            a.verifyBooleanWithDefault(e, 'exifOrientation', !0, '', 'api::Base.init'),
            (e.lbsBackup = void 0 === e.lbsBackup || e.lbsBackup);
          var t = (this.account = e.account = e.account + ''),
            n = e.constructor.genInstanceName(e),
            r = d[n];
          if ((e._disableSingleton && (r = null), r)) return m.updateInstance(r, e), r;
          (this.name = n),
            (d[n] = this),
            (this.logger = e.logger = new u({ debug: e.debug, logFunc: e.logFunc, prefix: this.subType, dbLog: !1 !== e.dbLog, account: e.account, expire: e.expire })),
            (e.api = this);
          var o = (this.protocol = new e.Protocol(e));
          return (
            (o.name = 'Protocol-' + n), (o.account = t), (o.api = this), (o.message = this.message = new e.Message({ account: t })), (this.options = a.copy(e)), this
          );
        }),
        (f.destroy = function (e) {
          var t,
            n = this;
          e = e || {};
          var r = this.name;
          this.logger.warn('destroy::start'),
            r
              ? (this.protocol && (t = this.protocol.connectTimer),
                this.protocol && this.protocol.resetPush && this.protocol.resetPush(),
                this.disconnect({
                  done: function (o) {
                    n.logger.warn('ApiBase::destroy: instance destroyed ...'),
                      p.destroy(),
                      Object.getOwnPropertyNames(n.options).forEach(function (e) {
                        0 === e.indexOf('on') &&
                          ((n.options[e] = function () {}), (n.protocol.options[e] = function () {}), (n.protocol.api.options[e] = function () {}));
                      }),
                      n.logger.setLogDisabled(),
                      Object.getOwnPropertyNames(n).forEach(function (e) {
                        n[e] = void 0;
                      }),
                      d && ((d[r] = null), clearTimeout(t)),
                      e.done instanceof Function && e.done(o);
                  },
                }))
              : this.logger && this.logger.warn && this.logger.warn('destroy::no instanceName');
        }),
        (f.setOptions = function (e) {
          this.protocol.setOptions(e);
        }),
        (f.processCallback = function (e, t) {
          g(e, t);
        }),
        (f.processCallbackPromise = function (e, t) {
          return new Promise(function (n, r) {
            g(e, t, !0, n, r);
          });
        });
      var g = function (e, t, n, r, o) {
        var i = 'api::processCallback';
        n && (i = 'api::processCallbackPromise'),
          a.verifyCallback(e, 'done', i),
          (e.callback = function (s, u, l) {
            var p = e.callback.options;
            if (((u = u || p), t && (u = p), a.isFunction(e.cbaop))) {
              var m = e.cbaop(s, u);
              c(m) && (u = m);
            }
            var d = e.done;
            a.isObject(u) && (delete u.done, delete u.cb, delete u.callback), n ? (s ? o({ message: '生成接口回调错误', callFunc: i, event: s }) : r(u)) : d(s, u, l);
          }),
          (e.callback.options = a.copy(e));
      };
      (f.processPs = function (e) {
        a.notexist(e.ps) && (e.ps = ''), a.verifyArrayMax('ps', e.ps, 5e3);
      }),
        (f.processCustom = function (e) {
          a.notexist(e.custom) && (e.custom = '');
        }),
        (f.sendCmd = function () {
          this.protocol.sendCmd.apply(this.protocol, arguments);
        }),
        (f.sendCmdWithResp = function (e, t, n) {
          this.sendCmd(e, t, function (e, t, r) {
            a.isFunction(n) && (e ? n(e, t) : n(null, r));
          });
        }),
        (f.cbAndSendCmd = function (e, t) {
          var n = this.processCallbackPromise(t);
          return this.sendCmd(e, t), n;
        }),
        (f.sendCmdUsePromise = function (e, t) {
          var n = this;
          return new Promise(function (r, o) {
            n.sendCmd(e, t, function (e, t, n) {
              if (e) o(e);
              else {
                var i = a.merge({}, t, n);
                r(i);
              }
            });
          });
        }),
        (m.use = function (e, t) {
          e && e.install && a.isFunction(e.install) && e.install(this, t);
        }),
        (m.rmAllInstances = function () {
          for (var e in d) d[e].destroy();
          d = {};
        }),
        (f.logout = function (e) {
          (e = e || {}), (this.protocol.shouldReconnect = !1), (this.protocol.doLogout = !0), this.processCallback(e), this.sendCmd('logout', e, e.callback);
        }),
        (e.exports = m),
        n(166),
        n(167),
        n(170),
        n(171),
        n(172),
        n(173),
        n(174);
    },
    function (e, t, n) {
      var r = n(23);
      e.exports = function (e) {
        if (!r(e)) throw TypeError(e + ' is not an object!');
        return e;
      };
    },
    function (e, t, n) {
      var r = n(12),
        o = n(79),
        i = n(50),
        s = Object.defineProperty;
      t.f = n(14)
        ? Object.defineProperty
        : function (e, t, n) {
            if ((r(e), (t = i(t, !0)), r(n), o))
              try {
                return s(e, t, n);
              } catch (e) {}
            if ('get' in n || 'set' in n) throw TypeError('Accessors not supported!');
            return 'value' in n && (e[t] = n.value), e;
          };
    },
    function (e, t, n) {
      e.exports = !n(31)(function () {
        return (
          7 !=
          Object.defineProperty({}, 'a', {
            get: function () {
              return 7;
            },
          }).a
        );
      });
    },
    ,
    function (e, t, n) {
      'use strict';
      (function (t) {
        var r,
          o = n(2),
          i = (r = o) && r.__esModule ? r : { default: r };
        var s = (function () {
          var e = 'object' === (void 0 === t ? 'undefined' : (0, i.default)(t)) ? t : window,
            n = Math.pow(2, 53) - 1,
            r = /\bOpera/,
            o = Object.prototype,
            s = o.hasOwnProperty,
            a = o.toString;
          function c(e) {
            return (e = String(e)).charAt(0).toUpperCase() + e.slice(1);
          }
          function u(e) {
            return (e = f(e)), /^(?:webOS|i(?:OS|P))/.test(e) ? e : c(e);
          }
          function l(e, t) {
            for (var n in e) s.call(e, n) && t(e[n], n, e);
          }
          function p(e) {
            return null == e ? c(e) : a.call(e).slice(8, -1);
          }
          function m(e) {
            return String(e).replace(/([ -])(?!$)/g, '$1?');
          }
          function d(e, t) {
            var r = null;
            return (
              (function (e, t) {
                var r = -1,
                  o = e ? e.length : 0;
                if ('number' == typeof o && o > -1 && o <= n) for (; ++r < o; ) t(e[r], r, e);
                else l(e, t);
              })(e, function (n, o) {
                r = t(r, n, o, e);
              }),
              r
            );
          }
          function f(e) {
            return String(e).replace(/^ +| +$/g, '');
          }
          return (function t(n) {
            var o = e,
              s = n && 'object' === (void 0 === n ? 'undefined' : (0, i.default)(n)) && 'String' != p(n);
            s && ((o = n), (n = null));
            var c = o.navigator || {},
              y = c.userAgent || '';
            n || (n = y);
            var g,
              h,
              v,
              b,
              T,
              S = s ? !!c.likeChrome : /\bChrome\b/.test(n) && !/internal|\n/i.test(a.toString()),
              k = s ? 'Object' : 'ScriptBridgingProxyObject',
              M = s ? 'Object' : 'Environment',
              x = s && o.java ? 'JavaPackage' : p(o.java),
              _ = s ? 'Object' : 'RuntimeObject',
              w = /\bJava/.test(x) && o.java,
              C = w && p(o.environment) == M,
              P = w ? 'a' : 'α',
              O = w ? 'b' : 'β',
              A = o.document || {},
              I = o.operamini || o.opera,
              E = r.test((E = s && I ? I['[[Class]]'] : p(I))) ? E : (I = null),
              N = n,
              j = [],
              L = null,
              D = n == y,
              F = D && I && 'function' == typeof I.version && I.version(),
              R = d(
                [
                  { label: 'EdgeHTML', pattern: 'Edge' },
                  'Trident',
                  { label: 'WebKit', pattern: 'AppleWebKit' },
                  'iCab',
                  'Presto',
                  'NetFront',
                  'Tasman',
                  'KHTML',
                  'Gecko',
                ],
                function (e, t) {
                  return e || (RegExp('\\b' + (t.pattern || m(t)) + '\\b', 'i').exec(n) && (t.label || t));
                }
              ),
              U = (function (e) {
                return d(e, function (e, t) {
                  return e || (RegExp('\\b' + (t.pattern || m(t)) + '\\b', 'i').exec(n) && (t.label || t));
                });
              })([
                'Adobe AIR',
                'Arora',
                'Avant Browser',
                'Breach',
                'Camino',
                'Electron',
                'Epiphany',
                'Fennec',
                'Flock',
                'Galeon',
                'GreenBrowser',
                'iCab',
                'Iceweasel',
                'K-Meleon',
                'Konqueror',
                'Lunascape',
                'Maxthon',
                { label: 'Microsoft Edge', pattern: 'Edge' },
                'Midori',
                'Nook Browser',
                'PaleMoon',
                'PhantomJS',
                'Raven',
                'Rekonq',
                'RockMelt',
                { label: 'Samsung Internet', pattern: 'SamsungBrowser' },
                'SeaMonkey',
                { label: 'Silk', pattern: '(?:Cloud9|Silk-Accelerated)' },
                'Sleipnir',
                'SlimBrowser',
                { label: 'SRWare Iron', pattern: 'Iron' },
                'Sunrise',
                'Swiftfox',
                'Waterfox',
                'WebPositive',
                'Opera Mini',
                { label: 'Opera Mini', pattern: 'OPiOS' },
                'Opera',
                { label: 'Opera', pattern: 'OPR' },
                'Chrome',
                { label: 'Chrome', pattern: '(?:HeadlessChrome)' },
                { label: 'Chrome Mobile', pattern: '(?:CriOS|CrMo)' },
                { label: 'Firefox', pattern: '(?:Firefox|Minefield)' },
                { label: 'Firefox for iOS', pattern: 'FxiOS' },
                { label: 'IE', pattern: 'IEMobile' },
                { label: 'IE', pattern: 'MSIE' },
                'Safari',
              ]),
              B = $([
                { label: 'BlackBerry', pattern: 'BB10' },
                'BlackBerry',
                { label: 'Galaxy S', pattern: 'GT-I9000' },
                { label: 'Galaxy S2', pattern: 'GT-I9100' },
                { label: 'Galaxy S3', pattern: 'GT-I9300' },
                { label: 'Galaxy S4', pattern: 'GT-I9500' },
                { label: 'Galaxy S5', pattern: 'SM-G900' },
                { label: 'Galaxy S6', pattern: 'SM-G920' },
                { label: 'Galaxy S6 Edge', pattern: 'SM-G925' },
                { label: 'Galaxy S7', pattern: 'SM-G930' },
                { label: 'Galaxy S7 Edge', pattern: 'SM-G935' },
                'Google TV',
                'Lumia',
                'iPad',
                'iPod',
                'iPhone',
                'Kindle',
                { label: 'Kindle Fire', pattern: '(?:Cloud9|Silk-Accelerated)' },
                'Nexus',
                'Nook',
                'PlayBook',
                'PlayStation Vita',
                'PlayStation',
                'TouchPad',
                'Transformer',
                { label: 'Wii U', pattern: 'WiiU' },
                'Wii',
                'Xbox One',
                { label: 'Xbox 360', pattern: 'Xbox' },
                'Xoom',
              ]),
              q = (function (e) {
                return d(e, function (e, t, r) {
                  return e || ((t[B] || t[/^[a-z]+(?: +[a-z]+\b)*/i.exec(B)] || RegExp('\\b' + m(r) + '(?:\\b|\\w*\\d)', 'i').exec(n)) && r);
                });
              })({
                Apple: { iPad: 1, iPhone: 1, iPod: 1 },
                Archos: {},
                Amazon: { Kindle: 1, 'Kindle Fire': 1 },
                Asus: { Transformer: 1 },
                'Barnes & Noble': { Nook: 1 },
                BlackBerry: { PlayBook: 1 },
                Google: { 'Google TV': 1, Nexus: 1 },
                HP: { TouchPad: 1 },
                HTC: {},
                LG: {},
                Microsoft: { Xbox: 1, 'Xbox One': 1 },
                Motorola: { Xoom: 1 },
                Nintendo: { 'Wii U': 1, Wii: 1 },
                Nokia: { Lumia: 1 },
                Samsung: { 'Galaxy S': 1, 'Galaxy S2': 1, 'Galaxy S3': 1, 'Galaxy S4': 1 },
                Sony: { PlayStation: 1, 'PlayStation Vita': 1 },
              }),
              H = (function (e) {
                return d(e, function (e, t) {
                  var r = t.pattern || m(t);
                  return (
                    !e &&
                      (e = RegExp('\\b' + r + '(?:/[\\d.]+|[ \\w.]*)', 'i').exec(n)) &&
                      (e = (function (e, t, n) {
                        var r = {
                          '10.0': '10',
                          6.4: '10 Technical Preview',
                          6.3: '8.1',
                          6.2: '8',
                          6.1: 'Server 2008 R2 / 7',
                          '6.0': 'Server 2008 / Vista',
                          5.2: 'Server 2003 / XP 64-bit',
                          5.1: 'XP',
                          5.01: '2000 SP1',
                          '5.0': '2000',
                          '4.0': 'NT',
                          '4.90': 'ME',
                        };
                        return (
                          t && n && /^Win/i.test(e) && !/^Windows Phone /i.test(e) && (r = r[/[\d.]+$/.exec(e)]) && (e = 'Windows ' + r),
                          (e = String(e)),
                          t && n && (e = e.replace(RegExp(t, 'i'), n)),
                          (e = u(
                            e
                              .replace(/ ce$/i, ' CE')
                              .replace(/\bhpw/i, 'web')
                              .replace(/\bMacintosh\b/, 'Mac OS')
                              .replace(/_PowerPC\b/i, ' OS')
                              .replace(/\b(OS X) [^ \d]+/i, '$1')
                              .replace(/\bMac (OS X)\b/, '$1')
                              .replace(/\/(\d)/, ' $1')
                              .replace(/_/g, '.')
                              .replace(/(?: BePC|[ .]*fc[ \d.]+)$/i, '')
                              .replace(/\bx86\.64\b/gi, 'x86_64')
                              .replace(/\b(Windows Phone) OS\b/, '$1')
                              .replace(/\b(Chrome OS \w+) [\d.]+\b/, '$1')
                              .split(' on ')[0]
                          ))
                        );
                      })(e, r, t.label || t)),
                    e
                  );
                });
              })([
                'Windows Phone',
                'Android',
                'CentOS',
                { label: 'Chrome OS', pattern: 'CrOS' },
                'Debian',
                'Fedora',
                'FreeBSD',
                'Gentoo',
                'Haiku',
                'Kubuntu',
                'Linux Mint',
                'OpenBSD',
                'Red Hat',
                'SuSE',
                'Ubuntu',
                'Xubuntu',
                'Cygwin',
                'Symbian OS',
                'hpwOS',
                'webOS ',
                'webOS',
                'Tablet OS',
                'Tizen',
                'Linux',
                'Mac OS X',
                'Macintosh',
                'Mac',
                'Windows 98;',
                'Windows ',
              ]);
            function $(e) {
              return d(e, function (e, t) {
                var r = t.pattern || m(t);
                return (
                  !e &&
                    (e =
                      RegExp('\\b' + r + ' *\\d+[.\\w_]*', 'i').exec(n) ||
                      RegExp('\\b' + r + ' *\\w+-[\\w]*', 'i').exec(n) ||
                      RegExp('\\b' + r + '(?:; *(?:[a-z]+[_-])?[a-z]+\\d+|[^ ();-]*)', 'i').exec(n)) &&
                    ((e = String(t.label && !RegExp(r, 'i').test(t.label) ? t.label : e).split('/'))[1] && !/[\d.]+/.test(e[0]) && (e[0] += ' ' + e[1]),
                    (t = t.label || t),
                    (e = u(
                      e[0]
                        .replace(RegExp(r, 'i'), t)
                        .replace(RegExp('; *(?:' + t + '[_-])?', 'i'), ' ')
                        .replace(RegExp('(' + t + ')[-_.]?(\\w)', 'i'), '$1 $2')
                    ))),
                  e
                );
              });
            }
            if (
              (R && (R = [R]),
              q && !B && (B = $([q])),
              (g = /\bGoogle TV\b/.exec(B)) && (B = g[0]),
              /\bSimulator\b/i.test(n) && (B = (B ? B + ' ' : '') + 'Simulator'),
              'Opera Mini' == U && /\bOPiOS\b/.test(n) && j.push('running in Turbo/Uncompressed mode'),
              'IE' == U && /\blike iPhone OS\b/.test(n)
                ? ((q = (g = t(n.replace(/like iPhone OS/, ''))).manufacturer), (B = g.product))
                : /^iP/.test(B)
                ? (U || (U = 'Safari'), (H = 'iOS' + ((g = / OS ([\d_]+)/i.exec(n)) ? ' ' + g[1].replace(/_/g, '.') : '')))
                : 'Konqueror' != U || /buntu/i.test(H)
                ? (q && 'Google' != q && ((/Chrome/.test(U) && !/\bMobile Safari\b/i.test(n)) || /\bVita\b/.test(B))) ||
                  (/\bAndroid\b/.test(H) && /^Chrome/.test(U) && /\bVersion\//i.test(n))
                  ? ((U = 'Android Browser'), (H = /\bAndroid\b/.test(H) ? H : 'Android'))
                  : 'Silk' == U
                  ? (/\bMobi/i.test(n) || ((H = 'Android'), j.unshift('desktop mode')), /Accelerated *= *true/i.test(n) && j.unshift('accelerated'))
                  : 'PaleMoon' == U && (g = /\bFirefox\/([\d.]+)\b/.exec(n))
                  ? j.push('identifying as Firefox ' + g[1])
                  : 'Firefox' == U && (g = /\b(Mobile|Tablet|TV)\b/i.exec(n))
                  ? (H || (H = 'Firefox OS'), B || (B = g[1]))
                  : !U || (g = !/\bMinefield\b/i.test(n) && /\b(?:Firefox|Safari)\b/.exec(U))
                  ? (U && !B && /[\/,]|^[^(]+?\)/.test(n.slice(n.indexOf(g + '/') + 8)) && (U = null),
                    (g = B || q || H) &&
                      (B || q || /\b(?:Android|Symbian OS|Tablet OS|webOS)\b/.test(H)) &&
                      (U = /[a-z]+(?: Hat)?/i.exec(/\bAndroid\b/.test(H) ? H : g) + ' Browser'))
                  : 'Electron' == U && (g = (/\bChrome\/([\d.]+)\b/.exec(n) || 0)[1]) && j.push('Chromium ' + g)
                : (H = 'Kubuntu'),
              F ||
                (F = d(
                  [
                    '(?:Cloud9|CriOS|CrMo|Edge|FxiOS|IEMobile|Iron|Opera ?Mini|OPiOS|OPR|Raven|SamsungBrowser|Silk(?!/[\\d.]+$))',
                    'Version',
                    'HeadlessChrome',
                    m(U),
                    '(?:Firefox|Minefield|NetFront)',
                  ],
                  function (e, t) {
                    return e || (RegExp(t + '(?:-[\\d.]+/|(?: for [\\w-]+)?[ /-])([\\d.]+[^ ();/_-]*)', 'i').exec(n) || 0)[1] || null;
                  }
                )),
              (g =
                ('iCab' == R && parseFloat(F) > 3 ? 'WebKit' : /\bOpera\b/.test(U) && (/\bOPR\b/.test(n) ? 'Blink' : 'Presto')) ||
                (/\b(?:Midori|Nook|Safari)\b/i.test(n) && !/^(?:Trident|EdgeHTML)$/.test(R) && 'WebKit') ||
                (!R && /\bMSIE\b/i.test(n) && ('Mac OS' == H ? 'Tasman' : 'Trident')) ||
                ('WebKit' == R && /\bPlayStation\b(?! Vita\b)/i.test(U) && 'NetFront')) && (R = [g]),
              'IE' == U && (g = (/; *(?:XBLWP|ZuneWP)(\d+)/i.exec(n) || 0)[1])
                ? ((U += ' Mobile'), (H = 'Windows Phone ' + (/\+$/.test(g) ? g : g + '.x')), j.unshift('desktop mode'))
                : /\bWPDesktop\b/i.test(n)
                ? ((U = 'IE Mobile'), (H = 'Windows Phone 8.x'), j.unshift('desktop mode'), F || (F = (/\brv:([\d.]+)/.exec(n) || 0)[1]))
                : 'IE' != U && 'Trident' == R && (g = /\brv:([\d.]+)/.exec(n)) && (U && j.push('identifying as ' + U + (F ? ' ' + F : '')), (U = 'IE'), (F = g[1])),
              D)
            ) {
              if (((b = 'global'), (T = null != (v = o) ? (0, i.default)(v[b]) : 'number'), /^(?:boolean|number|string|undefined)$/.test(T) || ('object' == T && !v[b])))
                p((g = o.runtime)) == k
                  ? ((U = 'Adobe AIR'), (H = g.flash.system.Capabilities.os))
                  : p((g = o.phantom)) == _
                  ? ((U = 'PhantomJS'), (F = (g = g.version || null) && g.major + '.' + g.minor + '.' + g.patch))
                  : 'number' == typeof A.documentMode && (g = /\bTrident\/(\d+)/i.exec(n))
                  ? ((F = [F, A.documentMode]),
                    (g = +g[1] + 4) != F[1] && (j.push('IE ' + F[1] + ' mode'), R && (R[1] = ''), (F[1] = g)),
                    (F = 'IE' == U ? String(F[1].toFixed(1)) : F[0]))
                  : 'number' == typeof A.documentMode &&
                    /^(?:Chrome|Firefox)\b/.test(U) &&
                    (j.push('masking as ' + U + ' ' + F), (U = 'IE'), (F = '11.0'), (R = ['Trident']), (H = 'Windows'));
              else if ((w && ((N = (g = w.lang.System).getProperty('os.arch')), (H = H || g.getProperty('os.name') + ' ' + g.getProperty('os.version'))), C)) {
                try {
                  (F = o.require('ringo/engine').version.join('.')), (U = 'RingoJS');
                } catch (e) {
                  (g = o.system) && g.global.system == o.system && ((U = 'Narwhal'), H || (H = g[0].os || null));
                }
                U || (U = 'Rhino');
              } else
                'object' === (0, i.default)(o.process) &&
                  !o.process.browser &&
                  (g = o.process) &&
                  ('object' === (0, i.default)(g.versions) &&
                    ('string' == typeof g.versions.electron
                      ? (j.push('Node ' + g.versions.node), (U = 'Electron'), (F = g.versions.electron))
                      : 'string' == typeof g.versions.nw && (j.push('Chromium ' + F, 'Node ' + g.versions.node), (U = 'NW.js'), (F = g.versions.nw))),
                  U || ((U = 'Node.js'), (N = g.arch), (H = g.platform), (F = (F = /[\d.]+/.exec(g.version)) ? F[0] : null)));
              H = H && u(H);
            }
            if (
              (F &&
                (g =
                  /(?:[ab]|dp|pre|[ab]\d+pre)(?:\d+\+?)?$/i.exec(F) ||
                  /(?:alpha|beta)(?: ?\d)?/i.exec(n + ';' + (D && c.appMinorVersion)) ||
                  (/\bMinefield\b/i.test(n) && 'a')) &&
                ((L = /b/i.test(g) ? 'beta' : 'alpha'), (F = F.replace(RegExp(g + '\\+?$'), '') + ('beta' == L ? O : P) + (/\d+\+?/.exec(g) || ''))),
              'Fennec' == U || ('Firefox' == U && /\b(?:Android|Firefox OS)\b/.test(H)))
            )
              U = 'Firefox Mobile';
            else if ('Maxthon' == U && F) F = F.replace(/\.[\d.]+/, '.x');
            else if (/\bXbox\b/i.test(B)) 'Xbox 360' == B && (H = null), 'Xbox 360' == B && /\bIEMobile\b/.test(n) && j.unshift('mobile mode');
            else if ((!/^(?:Chrome|IE|Opera)$/.test(U) && (!U || B || /Browser|Mobi/.test(U))) || ('Windows CE' != H && !/Mobi/i.test(n)))
              if ('IE' == U && D)
                try {
                  null === o.external && j.unshift('platform preview');
                } catch (e) {
                  j.unshift('embedded');
                }
              else
                (/\bBlackBerry\b/.test(B) || /\bBB10\b/.test(n)) && (g = (RegExp(B.replace(/ +/g, ' *') + '/([.\\d]+)', 'i').exec(n) || 0)[1] || F)
                  ? ((H = ((g = [g, /BB10/.test(n)])[1] ? ((B = null), (q = 'BlackBerry')) : 'Device Software') + ' ' + g[0]), (F = null))
                  : this != l &&
                    'Wii' != B &&
                    ((D && I) ||
                      (/Opera/.test(U) && /\b(?:MSIE|Firefox)\b/i.test(n)) ||
                      ('Firefox' == U && /\bOS X (?:\d+\.){2,}/.test(H)) ||
                      ('IE' == U && ((H && !/^Win/.test(H) && F > 5.5) || (/\bWindows XP\b/.test(H) && F > 8) || (8 == F && !/\bTrident\b/.test(n))))) &&
                    !r.test((g = t.call(l, n.replace(r, '') + ';'))) &&
                    g.name &&
                    ((g = 'ing as ' + g.name + ((g = g.version) ? ' ' + g : '')),
                    r.test(U)
                      ? (/\bIE\b/.test(g) && 'Mac OS' == H && (H = null), (g = 'identify' + g))
                      : ((g = 'mask' + g), (U = E ? u(E.replace(/([a-z])([A-Z])/g, '$1 $2')) : 'Opera'), /\bIE\b/.test(g) && (H = null), D || (F = null)),
                    (R = ['Presto']),
                    j.push(g));
            else U += ' Mobile';
            (g = (/\bAppleWebKit\/([\d.]+\+?)/i.exec(n) || 0)[1]) &&
              ((g = [parseFloat(g.replace(/\.(\d)$/, '.0$1')), g]),
              'Safari' == U && '+' == g[1].slice(-1)
                ? ((U = 'WebKit Nightly'), (L = 'alpha'), (F = g[1].slice(0, -1)))
                : (F != g[1] && F != (g[2] = (/\bSafari\/([\d.]+\+?)/i.exec(n) || 0)[1])) || (F = null),
              (g[1] = (/\b(?:Headless)?Chrome\/([\d.]+)/i.exec(n) || 0)[1]),
              537.36 == g[0] && 537.36 == g[2] && parseFloat(g[1]) >= 28 && 'WebKit' == R && (R = ['Blink']),
              D && (S || g[1])
                ? (R && (R[1] = 'like Chrome'),
                  (g =
                    g[1] ||
                    ((g = g[0]) < 530
                      ? 1
                      : g < 532
                      ? 2
                      : g < 532.05
                      ? 3
                      : g < 533
                      ? 4
                      : g < 534.03
                      ? 5
                      : g < 534.07
                      ? 6
                      : g < 534.1
                      ? 7
                      : g < 534.13
                      ? 8
                      : g < 534.16
                      ? 9
                      : g < 534.24
                      ? 10
                      : g < 534.3
                      ? 11
                      : g < 535.01
                      ? 12
                      : g < 535.02
                      ? '13+'
                      : g < 535.07
                      ? 15
                      : g < 535.11
                      ? 16
                      : g < 535.19
                      ? 17
                      : g < 536.05
                      ? 18
                      : g < 536.1
                      ? 19
                      : g < 537.01
                      ? 20
                      : g < 537.11
                      ? '21+'
                      : g < 537.13
                      ? 23
                      : g < 537.18
                      ? 24
                      : g < 537.24
                      ? 25
                      : g < 537.36
                      ? 26
                      : 'Blink' != R
                      ? '27'
                      : '28')))
                : (R && (R[1] = 'like Safari'),
                  (g = (g = g[0]) < 400 ? 1 : g < 500 ? 2 : g < 526 ? 3 : g < 533 ? 4 : g < 534 ? '4+' : g < 535 ? 5 : g < 537 ? 6 : g < 538 ? 7 : g < 601 ? 8 : '8')),
              R && (R[1] += ' ' + (g += 'number' == typeof g ? '.x' : /[.+]/.test(g) ? '' : '+')),
              'Safari' == U && (!F || parseInt(F) > 45) && (F = g)),
              'Opera' == U && (g = /\bzbov|zvav$/.exec(H))
                ? ((U += ' '), j.unshift('desktop mode'), 'zvav' == g ? ((U += 'Mini'), (F = null)) : (U += 'Mobile'), (H = H.replace(RegExp(' *' + g + '$'), '')))
                : 'Safari' == U &&
                  /\bChrome\b/.exec(R && R[1]) &&
                  (j.unshift('desktop mode'), (U = 'Chrome Mobile'), (F = null), /\bOS X\b/.test(H) ? ((q = 'Apple'), (H = 'iOS 4.3+')) : (H = null)),
              F && 0 == F.indexOf((g = /[\d.]+$/.exec(H))) && n.indexOf('/' + g + '-') > -1 && (H = f(H.replace(g, ''))),
              R &&
                !/\b(?:Avant|Nook)\b/.test(U) &&
                (/Browser|Lunascape|Maxthon/.test(U) ||
                  ('Safari' != U && /^iOS/.test(H) && /\bSafari\b/.test(R[1])) ||
                  (/^(?:Adobe|Arora|Breach|Midori|Opera|Phantom|Rekonq|Rock|Samsung Internet|Sleipnir|Web)/.test(U) && R[1])) &&
                (g = R[R.length - 1]) &&
                j.push(g),
              j.length && (j = ['(' + j.join('; ') + ')']),
              q && B && B.indexOf(q) < 0 && j.push('on ' + q),
              B && j.push((/^on /.test(j[j.length - 1]) ? '' : 'on ') + B),
              H &&
                ((g = / ([\d.+]+)$/.exec(H)),
                (h = g && '/' == H.charAt(H.length - g[0].length - 1)),
                (H = {
                  architecture: 32,
                  family: g && !h ? H.replace(g[0], '') : H,
                  version: g ? g[1] : null,
                  toString: function () {
                    var e = this.version;
                    return this.family + (e && !h ? ' ' + e : '') + (64 == this.architecture ? ' 64-bit' : '');
                  },
                })),
              (g = /\b(?:AMD|IA|Win|WOW|x86_|x)64\b/i.exec(N)) && !/\bi686\b/i.test(N)
                ? (H && ((H.architecture = 64), (H.family = H.family.replace(RegExp(' *' + g), ''))),
                  U && (/\bWOW64\b/i.test(n) || (D && /\w(?:86|32)$/.test(c.cpuClass || c.platform) && !/\bWin64; x64\b/i.test(n))) && j.unshift('32-bit'))
                : H && /^OS X/.test(H.family) && 'Chrome' == U && parseFloat(F) >= 39 && (H.architecture = 64),
              n || (n = null);
            var z = {};
            return (
              (z.description = n),
              (z.layout = R && R[0]),
              (z.manufacturer = q),
              (z.name = U),
              (z.prerelease = L),
              (z.product = B),
              (z.ua = n),
              (z.version = U && F),
              (z.os = H || {
                architecture: null,
                family: null,
                version: null,
                toString: function () {
                  return 'null';
                },
              }),
              (z.parse = t),
              (z.toString = function () {
                return this.description || '';
              }),
              z.version && j.unshift(F),
              z.name && j.unshift(U),
              H && U && (H != String(H).split(' ')[0] || (H != U.split(' ')[0] && !B)) && j.push(B ? '(' + H + ')' : 'on ' + H),
              j.length && (z.description = j.join(' ')),
              z
            );
          })();
        })();
        e.exports = s;
      }).call(this, n(20));
    },
    function (e, t, n) {
      'use strict';
      var r = s(n(70)),
        o = s(n(73)),
        i = s(n(48));
      function s(e) {
        return e && e.__esModule ? e : { default: e };
      }
      var a = n(18),
        c = n(16),
        u = n(0),
        l = n(9),
        p = n(1),
        m = n(10),
        d = 'https://statistic.live.126.net/statics/report/common/form',
        f = 'nimErrEvent',
        y = { sdktype: 'IM', platform: 'Web', deviceId: l.deviceId, sdk_ver: p.info.version, manufactor: c.manufacturer, env: 'online' },
        g = { login: 'nimLoginErrEvent', nos: 'nimNosErrEvent' },
        h = { login: null, nos: null },
        v = { maxInterval: 30, maxSize: 100, minInterval: 10, maxDelay: 100, turnOn: !1 },
        b = null,
        T = !1,
        S = {
          reportErrEventUrl: d,
          localKey: f,
          reportErrEvent: function (e) {
            try {
              var t = localStorage.getItem(f);
              if (!t) return;
              t = JSON.parse(t);
              var n = [];
              Object.keys(t).forEach(function (e) {
                n.push(t[e]);
              });
              var r = { app_key: e.appKey, sdk_ver: e.sdk_ver, platform: 'Web', os_ver: c.os.family + ' ' + c.os.version, manufacturer: c.manufacturer, model: c.name };
              a(d, {
                method: 'POST',
                timeout: 2e3,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ common: { device_id: e.deviceId, sdk_type: 'IM' }, event: { logReport: n, deviceinfo: r } }),
                onload: function () {
                  localStorage.removeItem(f);
                },
                onerror: function (e) {},
              });
            } catch (e) {}
          },
          saveErrEvent: function () {
            var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
            if (e.code && e.module)
              try {
                var t = localStorage.getItem(f) || '{}';
                t = JSON.parse(t);
                var n = e.code + e.module + e.accid;
                t[n] ? t[n].count++ : (t[n] = { errorCode: e.code, module: e.module, accid: e.accid, timestamp: new Date().getTime(), count: 1 }),
                  localStorage.setItem(f, JSON.stringify(t));
              } catch (e) {}
          },
          initUniErrReport: function () {
            var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
            (y.appkey = e.appKey),
              a(
                'https://statistic.live.126.net/dispatcher/req?deviceId=' +
                  y.deviceId +
                  '&sdktype=' +
                  y.sdktype +
                  '&sdkVer=' +
                  y.sdk_ver +
                  '&platform=' +
                  y.platform +
                  '&appkey=' +
                  y.appkey,
                {
                  method: 'get',
                  onload: function (e) {
                    var t = null;
                    try {
                      t = JSON.parse(e);
                    } catch (e) {}
                    t &&
                      t.code &&
                      200 === t.code &&
                      (((v = t.data).maxInterval = v.maxInterval > 1e4 ? 1e4 : v.maxInterval),
                      (v.maxInterval = v.maxInterval < 10 ? 10 : v.maxInterval),
                      (v.maxSize = v.maxSize > 1e3 ? 1e3 : v.maxSize),
                      (v.minInterval = v.minInterval < 2 ? 2 : v.minInterval),
                      (v.maxDelay = v.maxDelay > 600 ? 600 : v.maxDelay),
                      200 === t.code &&
                        ((v.turnOn = !0),
                        (b = setInterval(function () {
                          S.checkUniErrCache(!0);
                        }, 1e3 * v.maxInterval))));
                  },
                  onerror: function (e) {},
                }
              );
          },
          startUniErrCache: function (e) {
            var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
            if (h.hasOwnProperty(e) && !h[e] && t.user_id && t.action) {
              var n = new Date().valueOf();
              h[e] = { user_id: t.user_id, action: t.action, start_time: n, extension: [] };
            }
          },
          updateUniErrCache: function (e) {
            var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
            if (h.hasOwnProperty(e) && h[e] && h[e].extension && Array.isArray(h[e].extension)) {
              var n = t.operation_type,
                r = t.code,
                o = t.target,
                s = (0, i.default)(t, ['operation_type', 'code', 'target']),
                a = h[e].extension.reduce(function (e, t) {
                  return e + t.duration;
                }, 0),
                c = new Date().getTime() - a - h[e].start_time;
              t.error && t.error.code && (r = t.error.code),
                h[e].extension.push({ operation_type: n, code: r, succeed: !1, target: o, duration: c, description: JSON.stringify(s) });
            }
          },
          updateUniSuccCache: function (e) {
            var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
            if (h.hasOwnProperty(e) && h[e] && h[e].extension && Array.isArray(h[e].extension)) {
              var n = t.operation_type,
                r = (t.code, t.target),
                o = (0, i.default)(t, ['operation_type', 'code', 'target']),
                s = h[e].extension.reduce(function (e, t) {
                  return e + t.duration;
                }, 0),
                a = new Date().getTime() - s - h[e].start_time;
              h[e].extension.push({ operation_type: n, code: 200, succeed: !0, target: r, duration: a, description: JSON.stringify(o) });
            }
          },
          concludeUniErrCache: function (e) {
            var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
            if (h.hasOwnProperty(e) && h[e])
              if ('nos' !== e || 0 !== t) {
                var n = new Date().valueOf();
                (h[e].succeed = !t), (h[e].duration = n - h[e].start_time);
                var r = u.copy(h[e]);
                h[e] = null;
                try {
                  var o = localStorage.getItem(g[e]) || '[]',
                    i = JSON.parse(o);
                  i.push(r), localStorage.setItem(g[e], JSON.stringify(i)), v.turnOn && S.checkUniErrCache();
                } catch (e) {}
              } else h[e] = null;
          },
          checkUniErrCache: function () {
            var e = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
            if (!T) {
              var t = new Date().valueOf();
              try {
                var n = localStorage.getItem(g.login) || '[]',
                  i = localStorage.getItem(g.nos) || '[]',
                  s = JSON.parse(n),
                  c = JSON.parse(i),
                  u = s.filter(function (e) {
                    return t - e.start_time < 1e3 * v.maxDelay;
                  }),
                  l = c.filter(function (e) {
                    return t - e.start_time < 1e3 * v.maxDelay;
                  }),
                  p = m.getLastSeveralItems([u, l], v.maxSize),
                  f = (0, o.default)(p, 2),
                  h = f[0],
                  k = f[1];
                if (h.length + k.length === v.maxSize || e) {
                  if (h.length + k.length === 0) return;
                  var M = {
                    common: { app_key: y.appkey, platform: y.platform, sdk_ver: y.sdk_ver, manufactor: y.manufactor, env: y.env },
                    event: { login: [].concat((0, r.default)(h)), nos: [].concat((0, r.default)(k)) },
                  };
                  a(d, {
                    method: 'POST',
                    timeout: 2e3,
                    headers: { 'Content-Type': 'application/json', sdktype: y.sdktype },
                    data: JSON.stringify(M),
                    onload: function () {
                      for (var e in g)
                        if (Object.hasOwnProperty.call(g, e)) {
                          var t = g[e];
                          localStorage.setItem(t, '[]');
                        }
                      clearInterval(b),
                        (b = setInterval(function () {
                          S.checkUniErrCache(!0);
                        }, 1e3 * v.maxInterval)),
                        (T = !1);
                    },
                    onerror: function () {
                      T = !1;
                    },
                  }),
                    (T = !0);
                }
              } catch (e) {
                T = !1;
              }
            }
          },
          pause: function () {
            y.turnOn = !1;
          },
          restore: function () {
            y.turnOn = !0;
          },
          destroy: function () {
            b && clearInterval(b), S.concludeUniErrCache('login', 1), S.concludeUniErrCache('nos', 1), (y.turnOn = !1), (T = !1);
          },
        };
      (S.sendBeacon =
        (navigator && navigator.sendBeacon && navigator.sendBeacon.bind(navigator)) ||
        function (e, t) {
          var n = new XMLHttpRequest();
          n.open('POST', e, !0), n.send(t);
        }),
        (e.exports = S);
    },
    function (e, t, n) {
      'use strict';
      var r = n(42),
        o = n(163),
        i = n(164),
        s = n(165);
      (r.json = o), (r.upload = i), (r.chunkUpload = s), (e.exports = r);
    },
    function (e, t) {
      var n = {}.hasOwnProperty;
      e.exports = function (e, t) {
        return n.call(e, t);
      };
    },
    function (e, t) {
      var n;
      n = (function () {
        return this;
      })();
      try {
        n = n || new Function('return this')();
      } catch (e) {
        'object' == typeof window && (n = window);
      }
      e.exports = n;
    },
    function (e, t, n) {
      'use strict';
      t.__esModule = !0;
      var r,
        o = n(117),
        i = (r = o) && r.__esModule ? r : { default: r };
      t.default =
        i.default ||
        function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
          }
          return e;
        };
    },
    function (e, t, n) {
      var r = n(13),
        o = n(32);
      e.exports = n(14)
        ? function (e, t, n) {
            return r.f(e, t, o(1, n));
          }
        : function (e, t, n) {
            return (e[t] = n), e;
          };
    },
    function (e, t) {
      e.exports = function (e) {
        return 'object' == typeof e ? null !== e : 'function' == typeof e;
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = n(1),
        i = n(17),
        s = n(6);
      function a(e) {
        r.undef(e.secure) && (e.secure = !0), (this.options = r.copy(e)), (this.keepNosSafeUrl = this.options.keepNosSafeUrl || !1);
        var t = e.defaultLink || e.defaultLinkUrl;
        r.notundef(t) && r.isString(t) && (o.optionDefaultLinkUrl = t.trim()),
          r.notundef(e.ipv6DefaultLink) && r.isString(e.ipv6DefaultLink) && (o.optionIpv6DefaultLinkUrl = e.ipv6DefaultLink),
          'number' == typeof e.heartbeatInterval && (o.heartbeatInterval = e.heartbeatInterval),
          Array.isArray(e.nosLbsUrls) && (o.nosLbsUrls = e.nosLbsUrls),
          this.init(),
          this.connect();
      }
      var c = (a.fn = a.prototype);
      (c.init = function () {
        (this.logger = this.options.logger),
          (this.getNosOriginUrlReqNum = 0),
          (this.checkNosReqNum = 0),
          (this.cmdTaskArray = []),
          (this.timerMap = {}),
          (this.cmdCallbackMap = {}),
          (this.cmdContentMap = {}),
          this.initConnect(),
          this.reset();
      }),
        (c.reset = function () {
          this.resetConnect();
        }),
        (c.setOptions = function (e) {
          var t = this.options,
            n = Object.keys(t),
            o = n.indexOf('account');
          this.logger.info('setOptions::', r.omitAsString(e, ['appKey', 'token', 'loginExt', 'customTag'])),
            -1 !== o && n.splice(o, 1),
            (e = r.filterObj(e, n)),
            (this.options = r.merge(t, e)),
            this.reset();
        }),
        (c.sendCmd = function (e) {
          var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : '',
            n = arguments[2];
          this.heartbeat();
          var r,
            o = e,
            i = (e = this.parser.createCmd(e, t)).SER;
          (t = t || {}),
            (this.cmdContentMap[i] = t),
            t.single && (delete t.single, 1 === (r = Object.keys(t)).length && (this.cmdContentMap[i] = t[r[0]])),
            t.NOTSTORE &&
              ((r = t.NOTSTORE.split(' ')).forEach(function (e) {
                delete t[e];
              }),
              delete t.NOTSTORE),
            (n = n || t.callback) && (this.cmdCallbackMap[i] = n),
            this.cmdTaskArray.push({ cmdName: o, cmd: JSON.stringify(e) }),
            this.startCmdTaskTimer();
        }),
        (c.startCmdTaskTimer = function () {
          var e = this;
          e.cmdTaskTimer ||
            (e.cmdTaskTimer = setTimeout(function () {
              var t = e.cmdTaskArray.shift();
              (e.cmdTaskTimer = null), t && e.executeCmdTask(t), e.cmdTaskArray.length && e.startCmdTaskTimer();
            }, 0));
        }),
        (c.executeCmdTask = function (e) {
          var t = e.cmdName,
            n = e.cmd,
            r = (n = JSON.parse(n)).SER;
          this.isFrequencyControlled(t)
            ? (this.logger.warn('protocol::executeCmdTask: ' + t + ' hit freq control'),
              this.markCallbackInvalid(r, s.newFrequencyControlError({ callFunc: 'protocol::executeCmdTask', message: t + ' hit freq control' })))
            : this.hasLogin
            ? ('heartbeat' !== t && this.logger.log('protocol::sendCmd: ' + t), this.doSendCmd(n))
            : 'login' === t && this.isConnected()
            ? (this.logger.info('protocol::sendCmd: ' + t), this.doSendCmd(n))
            : (this.logger.warn('protocol::executeCmdTask: ' + t + ' not connected or login'),
              this.markCallbackInvalid(r, s.newSocketStateError({ callFunc: 'protocol::executeCmdTask', message: t + ' not connected or not login' })));
        }),
        (c.isFrequencyControlled = function (e) {
          var t = this.frequencyControlMap && this.frequencyControlMap[e];
          if (t) {
            if (Date.now() < t.from + t.duration) return !0;
            delete this.frequencyControlMap[e];
          }
        }),
        (c.doSendCmd = function (e) {
          var t = this,
            n = e.SER,
            r = 0 === n ? o.hbCmdTimeout : o.cmdTimeout;
          function i() {
            t.markCallbackInvalid(n, s.newSocketStateError({ callFunc: 'protocol::doSendCmd', message: 'ser ' + n + ' socketSendJson Error' })),
              t.onDisconnect('protocol::doSendCmd:socketSendJson');
          }
          t.timerMap[n] = setTimeout(function () {
            t.markCallbackInvalid(n, s.newTimeoutError({ callFunc: 'protocol::doSendCmd', message: 'ser ' + n + ' Timeout Error' }));
          }, r);
          try {
            t.socket && t.socket.send ? t.socket.send(JSON.stringify(e)) : i();
          } catch (e) {
            i();
          }
        }),
        (c.getObjWithSer = function (e) {
          var t = this.cmdContentMap[e];
          return t && !t.isImSyncDataObj && delete this.cmdContentMap[e], t && r.copy(t);
        }),
        (c.getCallbackWithSer = function (e) {
          var t = this.cmdCallbackMap[e];
          return t && !t.isImSyncDataCb && delete this.cmdCallbackMap[e], t;
        }),
        (c.getTimerWithSer = function (e) {
          var t = this.timerMap[e];
          return delete this.timerMap[e], t;
        }),
        (c.clearTimerWithSer = function (e) {
          var t = this.getTimerWithSer(e);
          t && clearTimeout(t);
        }),
        (c.markCallbackInvalid = function (e, t) {
          this.getObjWithSer(e), this.clearTimerWithSer(e);
          var n = this.getCallbackWithSer(e);
          if (n) {
            var r = n.options;
            setTimeout(function () {
              n(t || s.newUnknownError({ ser: e }), r);
            }, 0);
          }
        }),
        (c.markAllCallbackInvalid = function (e) {
          var t = this;
          Object.keys(this.cmdCallbackMap).forEach(function (n) {
            t.markCallbackInvalid(n, e);
          }),
            (t.cmdTaskArray = []);
        }),
        (c.getPacketObj = function (e) {
          var t = null;
          if (e && e.raw) {
            var n = e.raw.ser;
            r.notundef(n) && (t = this.getObjWithSer(n));
          }
          return t;
        }),
        (c.callPacketAckCallback = function (e) {
          var t = this;
          if (e && e.raw) {
            var n = e.raw.ser;
            if (r.notundef(n)) {
              t.clearTimerWithSer(n);
              var o = t.getCallbackWithSer(n);
              o &&
                (o.originUrl &&
                  e.obj &&
                  e.obj.file &&
                  ((e.obj.file._url_safe = e.obj.file.url),
                  (e.obj.file.url = o.originUrl),
                  'audio' === e.obj.type && (e.obj.file.mp3Url = o.originUrl + (~o.originUrl.indexOf('?') ? '&' : '?') + 'audioTrans&type=mp3')),
                e.promise
                  ? e.promise.then(
                      function () {
                        o(e.error, e.obj);
                      },
                      function (r) {
                        (r.callFunc = 'protocol::callPacketAckCallback'), (r.message = 'Resp Promoise Error: cmd: ' + e.cmd + ', ser: ' + n);
                        var i = s.customError('CALLBACK_ACK_ERR', r);
                        t.logger.error('protocol::callPacketAckCallback: promise error ' + JSON.stringify(r)), o(i, e.obj, e.content);
                      }
                    )
                  : o(e.error, e.obj, e.content));
            }
          }
        }),
        (c.onMessage = function (e) {
          var t = this;
          t.heartbeat(),
            t.parser.parseResponse(e).then(function (e) {
              if ((e.notFound && t.logger.warn('protocol::onMessage: packet not found ' + JSON.stringify(e)), e.error)) {
                (e.error.message = e.cmd + ' error: ' + e.error.message),
                  t.logger.error('protocol::onMessage: packet error ' + JSON.stringify(e.error) + '，raw cmd ' + e.rawStr);
                var n = e.raw || {};
                (408 !== n.code && 415 !== n.code && 500 !== n.code) || i.saveErrEvent({ code: n.code, module: e.cmd, accid: t.account });
              }
              e.frequencyControlDuration &&
                (t.logger.error('protocol::onMessage: server freq control ' + JSON.stringify(e.cmd)),
                (t.frequencyControlMap = t.frequencyControlMap || {}),
                (t.frequencyControlMap[e.cmd] = { from: +new Date(), duration: e.frequencyControlDuration })),
                (e.obj = t.getPacketObj(e)),
                'heartbeat' !== e.cmd && t.logger.log('protocol::recvCmd: ' + e.cmd);
              var o = 'process' + r.capFirstLetter(e.service);
              if (t[o])
                if ('syncDone' === e.cmd) {
                  if (t.cmdCallbackMap[e.raw.ser] && t.cmdCallbackMap[e.raw.ser].isImSyncDataCb) {
                    t.cmdCallbackMap[e.raw.ser].isImSyncDataCb = !1;
                    var s = function (e, t) {
                      this.checkNosReqNum++, this.getNosOriginUrlReqNum <= 0 || this.checkNosReqNum >= 20 ? this[e](t) : setTimeout(s, 300);
                    }.bind(t, o, e);
                    setTimeout(function () {
                      s.call(t, o, e);
                    }, 10);
                  }
                } else t[o](e);
              else t.logger.warn('protocol::onMessage: ' + o + ' not found');
              t.callPacketAckCallback(e);
            });
        }),
        (c.onMiscError = function (e, t, n) {
          t && this.notifyError(e, t, n);
        }),
        (c.onCustomError = function (e, t) {
          var n = s.customError(e, t),
            r = t.message || '未知错误';
          this.onMiscError(r, n);
        }),
        (c.notifyError = function (e, t, n) {
          this.isConnected() && (this.logger.error((e || '') + ' ' + this.name, t, n), this.options.onerror(t, n));
        }),
        (c.emitAPI = function (e) {
          var t = e.type,
            n = e.obj;
          this.api.emit(t, n);
        }),
        (e.exports = a),
        n(175),
        n(178),
        n(179),
        n(180),
        n(181);
    },
    function (e, t, n) {
      (function (t) {
        var r;
        e.exports =
          ((r =
            r ||
            (function (e, r) {
              var o;
              if (
                ('undefined' != typeof window && window.crypto && (o = window.crypto),
                'undefined' != typeof self && self.crypto && (o = self.crypto),
                'undefined' != typeof globalThis && globalThis.crypto && (o = globalThis.crypto),
                !o && 'undefined' != typeof window && window.msCrypto && (o = window.msCrypto),
                !o && void 0 !== t && t.crypto && (o = t.crypto),
                !o)
              )
                try {
                  o = n(307);
                } catch (e) {}
              var i = function () {
                  if (o) {
                    if ('function' == typeof o.getRandomValues)
                      try {
                        return o.getRandomValues(new Uint32Array(1))[0];
                      } catch (e) {}
                    if ('function' == typeof o.randomBytes)
                      try {
                        return o.randomBytes(4).readInt32LE();
                      } catch (e) {}
                  }
                  throw new Error('Native crypto module could not be used to get secure random number.');
                },
                s =
                  Object.create ||
                  (function () {
                    function e() {}
                    return function (t) {
                      var n;
                      return (e.prototype = t), (n = new e()), (e.prototype = null), n;
                    };
                  })(),
                a = {},
                c = (a.lib = {}),
                u = (c.Base = {
                  extend: function (e) {
                    var t = s(this);
                    return (
                      e && t.mixIn(e),
                      (t.hasOwnProperty('init') && this.init !== t.init) ||
                        (t.init = function () {
                          t.$super.init.apply(this, arguments);
                        }),
                      (t.init.prototype = t),
                      (t.$super = this),
                      t
                    );
                  },
                  create: function () {
                    var e = this.extend();
                    return e.init.apply(e, arguments), e;
                  },
                  init: function () {},
                  mixIn: function (e) {
                    for (var t in e) e.hasOwnProperty(t) && (this[t] = e[t]);
                    e.hasOwnProperty('toString') && (this.toString = e.toString);
                  },
                  clone: function () {
                    return this.init.prototype.extend(this);
                  },
                }),
                l = (c.WordArray = u.extend({
                  init: function (e, t) {
                    (e = this.words = e || []), (this.sigBytes = null != t ? t : 4 * e.length);
                  },
                  toString: function (e) {
                    return (e || m).stringify(this);
                  },
                  concat: function (e) {
                    var t = this.words,
                      n = e.words,
                      r = this.sigBytes,
                      o = e.sigBytes;
                    if ((this.clamp(), r % 4))
                      for (var i = 0; i < o; i++) {
                        var s = (n[i >>> 2] >>> (24 - (i % 4) * 8)) & 255;
                        t[(r + i) >>> 2] |= s << (24 - ((r + i) % 4) * 8);
                      }
                    else for (var a = 0; a < o; a += 4) t[(r + a) >>> 2] = n[a >>> 2];
                    return (this.sigBytes += o), this;
                  },
                  clamp: function () {
                    var t = this.words,
                      n = this.sigBytes;
                    (t[n >>> 2] &= 4294967295 << (32 - (n % 4) * 8)), (t.length = e.ceil(n / 4));
                  },
                  clone: function () {
                    var e = u.clone.call(this);
                    return (e.words = this.words.slice(0)), e;
                  },
                  random: function (e) {
                    for (var t = [], n = 0; n < e; n += 4) t.push(i());
                    return new l.init(t, e);
                  },
                })),
                p = (a.enc = {}),
                m = (p.Hex = {
                  stringify: function (e) {
                    for (var t = e.words, n = e.sigBytes, r = [], o = 0; o < n; o++) {
                      var i = (t[o >>> 2] >>> (24 - (o % 4) * 8)) & 255;
                      r.push((i >>> 4).toString(16)), r.push((15 & i).toString(16));
                    }
                    return r.join('');
                  },
                  parse: function (e) {
                    for (var t = e.length, n = [], r = 0; r < t; r += 2) n[r >>> 3] |= parseInt(e.substr(r, 2), 16) << (24 - (r % 8) * 4);
                    return new l.init(n, t / 2);
                  },
                }),
                d = (p.Latin1 = {
                  stringify: function (e) {
                    for (var t = e.words, n = e.sigBytes, r = [], o = 0; o < n; o++) {
                      var i = (t[o >>> 2] >>> (24 - (o % 4) * 8)) & 255;
                      r.push(String.fromCharCode(i));
                    }
                    return r.join('');
                  },
                  parse: function (e) {
                    for (var t = e.length, n = [], r = 0; r < t; r++) n[r >>> 2] |= (255 & e.charCodeAt(r)) << (24 - (r % 4) * 8);
                    return new l.init(n, t);
                  },
                }),
                f = (p.Utf8 = {
                  stringify: function (e) {
                    try {
                      return decodeURIComponent(escape(d.stringify(e)));
                    } catch (e) {
                      throw new Error('Malformed UTF-8 data');
                    }
                  },
                  parse: function (e) {
                    return d.parse(unescape(encodeURIComponent(e)));
                  },
                }),
                y = (c.BufferedBlockAlgorithm = u.extend({
                  reset: function () {
                    (this._data = new l.init()), (this._nDataBytes = 0);
                  },
                  _append: function (e) {
                    'string' == typeof e && (e = f.parse(e)), this._data.concat(e), (this._nDataBytes += e.sigBytes);
                  },
                  _process: function (t) {
                    var n,
                      r = this._data,
                      o = r.words,
                      i = r.sigBytes,
                      s = this.blockSize,
                      a = 4 * s,
                      c = i / a,
                      u = (c = t ? e.ceil(c) : e.max((0 | c) - this._minBufferSize, 0)) * s,
                      p = e.min(4 * u, i);
                    if (u) {
                      for (var m = 0; m < u; m += s) this._doProcessBlock(o, m);
                      (n = o.splice(0, u)), (r.sigBytes -= p);
                    }
                    return new l.init(n, p);
                  },
                  clone: function () {
                    var e = u.clone.call(this);
                    return (e._data = this._data.clone()), e;
                  },
                  _minBufferSize: 0,
                })),
                g =
                  ((c.Hasher = y.extend({
                    cfg: u.extend(),
                    init: function (e) {
                      (this.cfg = this.cfg.extend(e)), this.reset();
                    },
                    reset: function () {
                      y.reset.call(this), this._doReset();
                    },
                    update: function (e) {
                      return this._append(e), this._process(), this;
                    },
                    finalize: function (e) {
                      e && this._append(e);
                      var t = this._doFinalize();
                      return t;
                    },
                    blockSize: 16,
                    _createHelper: function (e) {
                      return function (t, n) {
                        return new e.init(n).finalize(t);
                      };
                    },
                    _createHmacHelper: function (e) {
                      return function (t, n) {
                        return new g.HMAC.init(e, n).finalize(t);
                      };
                    },
                  })),
                  (a.algo = {}));
              return a;
            })(Math)),
          r);
      }).call(this, n(20));
    },
    function (e, t, n) {
      var r = n(7),
        o = n(8),
        i = n(37),
        s = n(22),
        a = n(19),
        c = function (e, t, n) {
          var u,
            l,
            p,
            m = e & c.F,
            d = e & c.G,
            f = e & c.S,
            y = e & c.P,
            g = e & c.B,
            h = e & c.W,
            v = d ? o : o[t] || (o[t] = {}),
            b = v.prototype,
            T = d ? r : f ? r[t] : (r[t] || {}).prototype;
          for (u in (d && (n = t), n))
            ((l = !m && T && void 0 !== T[u]) && a(v, u)) ||
              ((p = l ? T[u] : n[u]),
              (v[u] =
                d && 'function' != typeof T[u]
                  ? n[u]
                  : g && l
                  ? i(p, r)
                  : h && T[u] == p
                  ? (function (e) {
                      var t = function (t, n, r) {
                        if (this instanceof e) {
                          switch (arguments.length) {
                            case 0:
                              return new e();
                            case 1:
                              return new e(t);
                            case 2:
                              return new e(t, n);
                          }
                          return new e(t, n, r);
                        }
                        return e.apply(this, arguments);
                      };
                      return (t.prototype = e.prototype), t;
                    })(p)
                  : y && 'function' == typeof p
                  ? i(Function.call, p)
                  : p),
              y && (((v.virtual || (v.virtual = {}))[u] = p), e & c.R && b && !b[u] && s(b, u, p)));
        };
      (c.F = 1), (c.G = 2), (c.S = 4), (c.P = 8), (c.B = 16), (c.W = 32), (c.U = 64), (c.R = 128), (e.exports = c);
    },
    function (e, t, n) {
      var r = n(81),
        o = n(51);
      e.exports = function (e) {
        return r(o(e));
      };
    },
    function (e, t) {
      e.exports = {};
    },
    ,
    function (e, t, n) {
      'use strict';
      var r = n(1),
        o = {
          genUrlSep: function (e) {
            return -1 === (e = '' + e).indexOf('?') ? '?imageView&' : '&';
          },
          urlQuery2Object: function (e) {
            if ('[object String]' !== Object.prototype.toString.call(e) || '' === e) return {};
            var t = e.indexOf('?');
            if (-1 !== t) {
              var n = e.slice(t + 1).split('&'),
                r = {};
              return (
                n.forEach(function (e) {
                  if (~e.indexOf('=')) {
                    var t = e.split('=');
                    r[t[0]] = decodeURIComponent(t[1]);
                  } else r[e] = '';
                }),
                r
              );
            }
          },
          url2object: function (e) {
            '[object String]' !== Object.prototype.toString.call(e) && (e = '');
            var t = (e = e || '').indexOf('https') >= 0 ? 'https://' : 'http://',
              n = e.replace(t, '');
            n.indexOf('?') >= 0 && (n = n.substring(0, n.indexOf('?')));
            var r = n.split('/');
            n = r[0];
            var o = '';
            if ((r.length > 0 && (o = r.slice(1).join('/')), -1 === e.indexOf('?'))) return { protocol: t, hostname: n, path: o, query: {} };
            var i = e.substr(e.indexOf('?') + 1).split('&'),
              s = {};
            return (
              i.forEach(function (e) {
                if (e.indexOf('=') > 0) {
                  var t = e.split('=');
                  s[t[0]] = decodeURIComponent(t[1]);
                } else s[e] = '';
              }),
              { protocol: t, hostname: n, path: o, query: s }
            );
          },
          object2url: function (e) {
            var t = e.protocol,
              n = e.hostname,
              r = e.path,
              o = e.query;
            (t = t || 'http://'), (n = n || ''), r && (n = n + '/' + r), (o = o || {});
            var i = [];
            for (var s in o) 'imageView' !== s && i.push(s + '=' + encodeURIComponent(o[s]));
            return i.length > 0 ? '' + t + n + '?imageView&' + i.join('&') : '' + t + n;
          },
          genPrivateUrl: function (e) {
            var t = o.url2object(e),
              n = t.hostname,
              i = t.path,
              s = r.downloadUrl,
              a = r.downloadHostList,
              c = r.nosCdnEnable,
              u = r.serverNosConfig.cdnDomain,
              l = decodeURIComponent(r.serverNosConfig.objectPrefix),
              p = decodeURIComponent(i),
              m = p.indexOf(l);
            if (u && m > -1 && c) return '' + t.protocol + u + '/' + p.slice(m);
            if (a.includes(n) && i.includes('/')) {
              var d = i.indexOf('/'),
                f = i.substring(0, d),
                y = i.substring(d + 1);
              return s.replace('{bucket}', f).replace('{object}', y);
            }
            var g = a.filter(function (e) {
                return 'string' == typeof n && n.includes(e);
              })[0],
              h = g ? n.replace(g, '').replace(/\W/g, '') : null;
            return h ? s.replace('{bucket}', h).replace('{object}', i) : e;
          },
        };
      e.exports = o;
    },
    function (e, t) {
      e.exports = function (e) {
        try {
          return !!e();
        } catch (e) {
          return !0;
        }
      };
    },
    function (e, t) {
      e.exports = function (e, t) {
        return { enumerable: !(1 & e), configurable: !(2 & e), writable: !(4 & e), value: t };
      };
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(2),
        i = (r = o) && r.__esModule ? r : { default: r },
        s = n(30);
      var a = n(0),
        c = a.notundef,
        u = a.exist,
        l = n(62),
        p = n(93),
        m = p.typeMap;
      function d(e) {
        e.resend ? (a.verifyOptions(e, 'idClient', 'msg::Message'), (this.idClient = e.idClient)) : (this.idClient = a.guid()),
          (this.type = m[e.type]),
          (this.resend = e.resend ? 1 : 0),
          c(e.subType) && (a.isInt(+e.subType) && +e.subType > 0 ? (this.subType = +e.subType) : a.onParamError('subType只能是大于0的整数', 'msg::Message')),
          c(e.custom) && ('object' === (0, i.default)(e.custom) ? (this.custom = JSON.stringify(e.custom)) : (this.custom = '' + e.custom)),
          c(e.text) && (this.body = '' + e.text),
          c(e.body) && (this.body = '' + e.body),
          c(e.yidunEnable) && (this.yidunEnable = e.yidunEnable ? 1 : 0),
          c(e.antiSpamUsingYidun) && (this.antiSpamUsingYidun = e.antiSpamUsingYidun ? 1 : 0),
          c(e.antiSpamContent) &&
            ('object' === (0, i.default)(e.antiSpamContent)
              ? (this.antiSpamContent = JSON.stringify(e.antiSpamContent))
              : (this.antiSpamContent = '' + e.antiSpamContent)),
          c(e.antiSpamBusinessId) &&
            ('object' === (0, i.default)(e.antiSpamBusinessId)
              ? (this.antiSpamBusinessId = JSON.stringify(e.antiSpamBusinessId))
              : (this.antiSpamBusinessId = '' + e.antiSpamBusinessId)),
          c(e.yidunAntiCheating) && (this.yidunAntiCheating = e.yidunAntiCheating + ''),
          c(e.skipHistory) && (this.skipHistory = e.skipHistory ? 1 : 0),
          c(e.highPriority) && (this.highPriority = e.highPriority ? 1 : 0),
          c(e.clientAntiSpam) && (this.clientAntiSpam = e.clientAntiSpam ? 1 : 0),
          c(e.env) && (this.env = e.env),
          c(e.notifyTargetTags) && (this.notifyTargetTags = e.notifyTargetTags),
          c(e.yidunAntiSpamExt) && (this.yidunAntiSpamExt = e.yidunAntiSpamExt),
          (c(e.loc_x) || c(e.loc_y) || c(e.loc_z)) && ((this.loc_x = e.loc_x), (this.loc_y = e.loc_y), (this.loc_z = e.loc_z));
      }
      (d.validTypes = p.validTypes),
        a.merge(d.prototype, p.prototype),
        (d.getType = p.getType),
        (d.reverse = function (e) {
          var t = a.filterObj(e, 'chatroomId idClient from fromNick fromAvatar _fromAvatar_safe fromCustom userUpdateTime custom status notifyTargetTags');
          return (
            c(t.fromAvatar) && (t.fromAvatar = (0, s.genPrivateUrl)(t.fromAvatar)),
            (t = a.merge(t, {
              fromClientType: l.reverseType(e.fromClientType),
              time: +e.time,
              type: d.getType(e),
              text: u(e.body) ? e.body : e.text || '',
              resend: 1 == +e.resend,
            })),
            c(t.userUpdateTime) && (t.userUpdateTime = +t.userUpdateTime),
            c(e.callbackExt) && (t.callbackExt = e.callbackExt),
            c(e.subType) && (t.subType = +e.subType),
            c(e.yidunAntiSpamRes) && (t.yidunAntiSpamRes = e.yidunAntiSpamRes),
            (t.status = t.status || 'success'),
            t
          );
        }),
        (d.setExtra = function (e, t) {
          p.setFlow(e, t);
        }),
        (e.exports = d);
    },
    function (e, t) {
      e.exports = !0;
    },
    function (e, t, n) {
      'use strict';
      var r = n(125)(!0);
      n(82)(
        String,
        'String',
        function (e) {
          (this._t = String(e)), (this._i = 0);
        },
        function () {
          var e,
            t = this._t,
            n = this._i;
          return n >= t.length ? { value: void 0, done: !0 } : ((e = r(t, n)), (this._i += e.length), { value: e, done: !1 });
        }
      );
    },
    function (e, t) {
      var n = {}.toString;
      e.exports = function (e) {
        return n.call(e).slice(8, -1);
      };
    },
    function (e, t, n) {
      var r = n(49);
      e.exports = function (e, t, n) {
        if ((r(e), void 0 === t)) return e;
        switch (n) {
          case 1:
            return function (n) {
              return e.call(t, n);
            };
          case 2:
            return function (n, r) {
              return e.call(t, n, r);
            };
          case 3:
            return function (n, r, o) {
              return e.call(t, n, r, o);
            };
        }
        return function () {
          return e.apply(t, arguments);
        };
      };
    },
    function (e, t, n) {
      var r = n(80),
        o = n(55);
      e.exports =
        Object.keys ||
        function (e) {
          return r(e, o);
        };
    },
    function (e, t) {
      var n = 0,
        r = Math.random();
      e.exports = function (e) {
        return 'Symbol('.concat(void 0 === e ? '' : e, ')_', (++n + r).toString(36));
      };
    },
    function (e, t) {
      t.f = {}.propertyIsEnumerable;
    },
    function (e, t, n) {
      var r = n(51);
      e.exports = function (e) {
        return Object(r(e));
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(10),
        o = n(159),
        i = n(161),
        s = n(162),
        a = {},
        c = r.f;
      function u(e) {
        var t = (e.upload = 'multipart/form-data' === (e.headers || r.o)['Content-Type']),
          n = !1;
        try {
          n = (location.protocol + '//' + location.host).toLowerCase() !== r.url2origin(e.url);
        } catch (e) {}
        return (
          (e.cors = n),
          t || n || e.mode
            ? (function (e) {
                var t = e.mode,
                  n = o,
                  a = r.getGlobal();
                return !a.FormData && a.document && (t = 'iframe'), 'iframe' === t && (n = e.upload ? i : s), new n(e);
              })(e)
            : new o(e)
        );
      }
      function l(e, t, n) {
        var r = a[e];
        if (r) {
          'onload' === t &&
            r.result &&
            (n = (function (e, t) {
              t = { data: t };
              var n = e.result.headers;
              return n && (t.headers = e.req.header(n)), t;
            })(r, n)),
            (function (e) {
              var t = a[e];
              t && (t.req.destroy(), delete a[e]);
            })(e);
          var o = { type: t, result: n };
          c(o), o.stopped || r[t](o.result);
        }
      }
      function p(e, t) {
        var n = r.genUrlSep(e);
        return (t = t || ''), r.isObject(t) && (t = r.object2query(t)), t && (e += n + t), e;
      }
      function m(e, t) {
        t = t || {};
        var n = r.uniqueID(),
          o = { result: t.result, onload: t.onload || r.f, onerror: t.onerror || r.f };
        (a[n] = o),
          (t.onload = function (e, t) {
            l(e, 'onload', t);
          }.bind(null, n)),
          (t.onerror = function (e, t) {
            l(e, 'onerror', t);
          }.bind(null, n)),
          t.query && (e = p(e, t.query));
        var i = t.method || '';
        return (i && !/get/i.test(i)) || !t.data || ((e = p(e, t.data)), (t.data = null)), (t.url = e), (o.req = u(t)), n;
      }
      (m.filter = function (e) {
        r.isFunction(e) && (c = e);
      }),
        (m.abort = function (e) {
          var t = a[e];
          t && t.req && t.req.abort();
        }),
        (e.exports = m);
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(30),
        i = n(0),
        s = n(6),
        a = n(110),
        c = n(182),
        u = n(183),
        l = n(184),
        p = n(185),
        m = n(186);
      function d(e) {
        this.mixin(e);
      }
      (d.prototype = Object.create(function () {}.prototype, { protocol: { value: null, writable: !0, enumerable: !0, configurable: !0 } })),
        (d.prototype.setProtocol = function (e) {
          this.protocol = e;
        }),
        (d.prototype.mixin = function (e) {
          var t = this;
          (this.configMap = this.configMap || {}),
            ['idMap', 'cmdConfig', 'packetConfig'].forEach(function (n) {
              t.configMap[n] = i.merge({}, t.configMap[n], e.configMap && e.configMap[n]);
            }),
            ['serializeMap', 'unserializeMap'].forEach(function (n) {
              t[n] = i.merge({}, t[n], e[n]);
            });
        }),
        (d.prototype.createCmd =
          ((r = 1),
          function (e, t) {
            var n = this,
              o = this.configMap.cmdConfig[e],
              s = 'heartbeat' === e ? 0 : r++;
            return (
              s > 32767 && ((s = 1), (r = 2)),
              (e = { SID: o.sid, CID: o.cid, SER: s }),
              o.params &&
                ((e.Q = []),
                o.params.forEach(function (r) {
                  var o = r.type,
                    s = r.name,
                    a = r.entity,
                    c = t[s];
                  if (!i.undef(c)) {
                    switch (o) {
                      case 'PropertyArray':
                        (o = 'ArrayMable'),
                          (c = c.map(function (e) {
                            return { t: 'Property', v: n.serialize(e, a) };
                          }));
                        break;
                      case 'Property':
                        c = n.serialize(c, s);
                        break;
                      case 'bool':
                        c = c ? 'true' : 'false';
                    }
                    e.Q.push({ t: o, v: c });
                  }
                })),
              e
            );
          })),
        (d.prototype.parseResponse = function (e) {
          var t = this;
          return new Promise(function (n, r) {
            var o = JSON.parse(e),
              a = { raw: o, rawStr: e, error: s.genError(o.code) },
              c = t.configMap.packetConfig[o.sid + '_' + o.cid];
            if (!c) return (a.notFound = { sid: o.sid, cid: o.cid }), void n(a);
            var u = o.r,
              l = 'notify' === c.service && !c.cmd;
            if (((a.isNotify = l), l)) {
              var p = o.r[1].headerPacket;
              if (((c = t.configMap.packetConfig[p.sid + '_' + p.cid]), (u = o.r[1].body), !c)) return (a.notFound = { sid: p.sid, cid: p.cid }), void n(a);
            }
            if (((a.service = c.service), (a.cmd = c.cmd), a.error)) {
              var m = o.sid + '_' + o.cid;
              if ((l && (m = p.sid + '_' + p.cid), (a.error.cmd = a.cmd), (a.error.callFunc = 'protocol::parseResponse: ' + m), 416 === a.error.code)) {
                var d = u[0];
                d && (a.frequencyControlDuration = 1e3 * d);
              }
            }
            var f = !1;
            a.error && c.trivialErrorCodes && (f = -1 !== c.trivialErrorCodes.indexOf(a.error.code));
            var y = [];
            if ((!a.error || f) && c.response) {
              a.content = {};
              var g = function (e, t, n, r) {
                if ((e && 'msg' === r) || 'sysMsg' === r) {
                  var o = n.content[r];
                  i.isObject(o) && !o.idServer && (o.idServer = '' + t.r[0]);
                }
              };
              c.response.forEach(function (e, n) {
                var r = u[n];
                if (!i.undef(r)) {
                  var s = e.type,
                    c = e.name,
                    p = e.entity || c;
                  switch (s) {
                    case 'Property':
                      y.push(
                        t.unserialize(r, p).then(
                          function (e, t, n, r, o) {
                            (n.content[r] = o), g(e, t, n, r);
                          }.bind(this, l, o, a, c)
                        )
                      );
                      break;
                    case 'PropertyArray':
                      (a.content[c] = []),
                        r.forEach(function (e, n) {
                          y.push(
                            t.unserialize(e, p).then(
                              function (e, t, r) {
                                e.content[t][n] = r;
                              }.bind(this, a, c)
                            )
                          );
                        });
                      break;
                    case 'KVArray':
                      (a.content[c] = r), g(l, o, a, c);
                      break;
                    case 'long':
                    case 'Long':
                    case 'byte':
                    case 'Byte':
                    case 'Number':
                      a.content[c] = +r;
                      break;
                    default:
                      (a.content[c] = r), g(l, o, a, c);
                  }
                }
              });
            }
            Promise.all(y).then(function () {
              n(a);
            });
          });
        }),
        (d.prototype.serialize = function (e, t) {
          var n = this.serializeMap[t],
            r = {};
          for (var o in n) e.hasOwnProperty(o) && (r[n[o]] = e[o]);
          return r;
        }),
        (d.prototype.matchNosSafeUrl = function (e) {
          if (!i.isString(e) || !~e.indexOf('_im_url=1')) return !1;
          var t = (0, o.urlQuery2Object)(e);
          return !(!t || !t._im_url || 1 != t._im_url);
        }),
        (d.prototype.getOneNosOriginUrl = function (e, t, n) {
          var r = this;
          return new Promise(function (o, i) {
            r.protocol.getNosOriginUrlReqNum++,
              r.protocol.sendCmd('getNosOriginUrl', { nosFileUrlTag: { safeUrl: e } }, function (e, i, s) {
                r.protocol.getNosOriginUrlReqNum--,
                  e ? console.warn('error: get nos originUrl failed', e) : ((t['_' + n + '_safe'] = t[n]), (t[n] = s.nosFileUrlTag && s.nosFileUrlTag.originUrl)),
                  o();
              });
          });
        }),
        (d.prototype.checkObjSafeUrl = function (e, t, n) {
          var r = this;
          for (var o in e)
            if (e.hasOwnProperty(o)) {
              var s = e[o];
              if (i.isString(s)) {
                if (this.matchNosSafeUrl(s)) {
                  var a = this.getOneNosOriginUrl(s, e, o);
                  t.push(a), n.push(a);
                }
              } else
                i.isObject(s)
                  ? this.checkObjSafeUrl(s, t, n)
                  : i.isArray(s) &&
                    s.forEach(function (e) {
                      i.isObject(e) && r.checkObjSafeUrl(e, t, n);
                    });
            }
        });
      var f = ['url', 'avatar', 'fromAvatar', 'chatroomAvatar'];
      (d.prototype.unserialize = function (e, t) {
        var n = this;
        return new Promise(function (r, o) {
          var i = n.unserializeMap[t],
            s = {},
            a = [];
          if (e)
            for (var c in i) {
              var u = [];
              if (e.hasOwnProperty(c) && ((s[i[c]] = e[c]), !n.protocol.keepNosSafeUrl))
                if ('attach' === i[c] && e[c] && e[c].indexOf && ~e[c].indexOf('_im_url=1'))
                  try {
                    var l = JSON.parse(e[c]);
                    n.checkObjSafeUrl(l, u, a),
                      Promise.all(u).then(
                        function (e, t) {
                          e.attach = JSON.stringify(t);
                        }.bind(n, s, l)
                      );
                  } catch (e) {
                    console.warn(e);
                  }
                else ~f.indexOf(i[c]) && e[c] && n.matchNosSafeUrl(e[c]) && a.push(n.getOneNosOriginUrl(e[c], s, i[c]));
            }
          Promise.all(a).then(function (e) {
            r(s);
          });
        });
      }),
        (d.prototype.syncUnserialize = function (e, t) {
          var n = this.unserializeMap[t],
            r = {};
          if (e) for (var o in n) e.hasOwnProperty(o) && (r[n[o]] = e[o]);
          return r;
        });
      var y = new d({ configMap: a, serializeMap: c, unserializeMap: u }),
        g = new d({ configMap: l, serializeMap: p, unserializeMap: m });
      e.exports = { IM: y, Chatroom: g };
    },
    function (e, t, n) {
      var r = n(13).f,
        o = n(19),
        i = n(4)('toStringTag');
      e.exports = function (e, t, n) {
        e && !o((e = n ? e : e.prototype), i) && r(e, i, { configurable: !0, value: t });
      };
    },
    function (e, t, n) {
      n(129);
      for (
        var r = n(7),
          o = n(22),
          i = n(28),
          s = n(4)('toStringTag'),
          a =
            'CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,TextTrackList,TouchList'.split(
              ','
            ),
          c = 0;
        c < a.length;
        c++
      ) {
        var u = a[c],
          l = r[u],
          p = l && l.prototype;
        p && !p[s] && o(p, s, u), (i[u] = i.Array);
      }
    },
    ,
    ,
    function (e, t, n) {
      'use strict';
      (t.__esModule = !0),
        (t.default = function (e, t) {
          var n = {};
          for (var r in e) t.indexOf(r) >= 0 || (Object.prototype.hasOwnProperty.call(e, r) && (n[r] = e[r]));
          return n;
        });
    },
    function (e, t) {
      e.exports = function (e) {
        if ('function' != typeof e) throw TypeError(e + ' is not a function!');
        return e;
      };
    },
    function (e, t, n) {
      var r = n(23);
      e.exports = function (e, t) {
        if (!r(e)) return e;
        var n, o;
        if (t && 'function' == typeof (n = e.toString) && !r((o = n.call(e)))) return o;
        if ('function' == typeof (n = e.valueOf) && !r((o = n.call(e)))) return o;
        if (!t && 'function' == typeof (n = e.toString) && !r((o = n.call(e)))) return o;
        throw TypeError("Can't convert object to primitive value");
      };
    },
    function (e, t) {
      e.exports = function (e) {
        if (null == e) throw TypeError("Can't call method on  " + e);
        return e;
      };
    },
    function (e, t) {
      var n = Math.ceil,
        r = Math.floor;
      e.exports = function (e) {
        return isNaN((e = +e)) ? 0 : (e > 0 ? r : n)(e);
      };
    },
    function (e, t, n) {
      var r = n(54)('keys'),
        o = n(39);
      e.exports = function (e) {
        return r[e] || (r[e] = o(e));
      };
    },
    function (e, t, n) {
      var r = n(8),
        o = n(7),
        i = o['__core-js_shared__'] || (o['__core-js_shared__'] = {});
      (e.exports = function (e, t) {
        return i[e] || (i[e] = void 0 !== t ? t : {});
      })('versions', []).push({ version: r.version, mode: n(34) ? 'pure' : 'global', copyright: '© 2019 Denis Pushkarev (zloirock.ru)' });
    },
    function (e, t) {
      e.exports = 'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'.split(',');
    },
    function (e, t) {
      t.f = Object.getOwnPropertySymbols;
    },
    function (e, t, n) {
      t.f = n(4);
    },
    function (e, t, n) {
      var r = n(7),
        o = n(8),
        i = n(34),
        s = n(57),
        a = n(13).f;
      e.exports = function (e) {
        var t = o.Symbol || (o.Symbol = i ? {} : r.Symbol || {});
        '_' == e.charAt(0) || e in t || a(t, e, { value: s.f(e) });
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(10),
        o = r.f,
        i = n(160);
      function s(e) {
        e.onload && this.once('load', e.onload),
          e.onerror && this.once('error', e.onerror),
          e.onbeforesend && this.once('beforesend', e.onbeforesend),
          e.onaftersend && this.once('aftersend', e.onaftersend);
        var t = (e = this.options =
          r.fetch(
            {
              method: 'GET',
              url: '',
              sync: !1,
              data: null,
              headers: {},
              cookie: !1,
              timeout: 6e4,
              type: 'text',
              form: null,
              input: null,
              putFileAtEnd: !1,
              proxyUrl: '',
            },
            e
          )).headers;
        r.notexist(t['Content-Type']) && (t['Content-Type'] = 'application/x-www-form-urlencoded'), this.send();
      }
      var a = (s.prototype = Object.create(i.prototype));
      (a.send = function () {
        var e = this,
          t = e.options;
        setTimeout(function () {
          try {
            try {
              e.emit('beforesend', t);
            } catch (e) {
              console.log('error:', 'ignore error ajax beforesend,', e);
            }
            e.doSend();
          } catch (t) {
            console.log('error:', 'ignore error server error,', t), e.onError('serverError', '请求失败:' + t.message);
          }
        }, 0);
      }),
        (a.doSend = o),
        (a.afterSend = function () {
          var e = this;
          setTimeout(function () {
            e.emit('aftersend', e.options);
          }, 0);
        }),
        (a.onLoad = function (e) {
          var t = this.options,
            n = e.status,
            r = e.result;
          if ('number' != typeof n || 0 !== n)
            if (0 === ('' + n).indexOf('2')) {
              if ('json' === t.type)
                try {
                  r = JSON.parse(r);
                } catch (e) {
                  return console.log('error:', 'ignore error parse json,', e), void this.onError('parseError', r);
                }
              this.emit('load', r);
            } else this.onError('serverError', '服务器返回异常状态', { status: n, result: r, date: e.date });
          else this.onError('netError', '网络错误');
        }),
        (a.onError = function (e, t, n) {
          var o = r.isObject(n) ? n : {};
          (o.code = e || 'error'), (o.message = t || '发生错误'), this.emit('error', o);
        }),
        (a.onTimeout = function () {
          this.onError('timeout', '请求超时');
        }),
        (a.abort = function () {
          this.onError('abort', '客户端中止');
        }),
        (a.header = function (e) {
          var t = this;
          if (!r.isArray(e)) return t.getResponseHeader(e || '');
          var n = {};
          return (
            e.forEach(function (e) {
              n[e] = t.header(e);
            }),
            n
          );
        }),
        (a.getResponseHeader = o),
        (a.destroy = o),
        (e.exports = s);
    },
    function (e, t, n) {
      'use strict';
      var r = {
          link: { id: 1, heartbeat: 2, negotiateTransport: 5, initTransport: 6 },
          sync: { id: 5, sync: 1, syncTeamMembers: 2 },
          misc: {
            id: 6,
            getSimpleNosToken: 1,
            getNosToken: 2,
            notifyUploadLog: 3,
            uploadSdkLogUrl: 4,
            audioToText: 5,
            processImage: 6,
            getNosTokenTrans: 7,
            notifyTransLog: 8,
            fetchFile: 9,
            fetchFileList: 10,
            removeFile: 11,
            getClientAntispam: 17,
            fileQuickTransfer: 18,
            getNosOriginUrl: 22,
            getServerTime: 23,
            getNosAccessToken: 24,
            deleteNosAccessToken: 25,
            getNosCdnHost: 26,
          },
          avSignal: {
            id: 15,
            signalingCreate: 1,
            signalingDelay: 2,
            signalingClose: 3,
            signalingJoin: 4,
            signalingLeave: 5,
            signalingInvite: 6,
            signalingCancel: 7,
            signalingReject: 8,
            signalingAccept: 9,
            signalingControl: 10,
            signalingNotify: 11,
            signalingMutilClientSyncNotify: 12,
            signalingUnreadMessageSyncNotify: 13,
            signalingChannelsSyncNotify: 14,
            signalingGetChannelInfo: 15,
          },
        },
        o = {
          heartbeat: { sid: r.link.id, cid: r.link.heartbeat },
          negotiateTransport: {
            sid: r.link.id,
            cid: r.link.negotiateTransport,
            params: [
              { type: 'int', name: 'sdkVersion' },
              { type: 'Property', name: 'negotiateTransportTag' },
            ],
          },
          initTransport: { sid: r.link.id, cid: r.link.initTransport, params: [{ type: 'Property', name: 'initTransportTag' }] },
          getSimpleNosToken: { sid: r.misc.id, cid: r.misc.getSimpleNosToken, params: [{ type: 'int', name: 'num' }] },
          getNosToken: {
            sid: r.misc.id,
            cid: r.misc.getNosToken,
            params: [
              { type: 'String', name: 'responseBody' },
              { type: 'Property', name: 'nosToken', entity: 'nosToken' },
            ],
          },
          uploadSdkLogUrl: { sid: r.misc.id, cid: r.misc.uploadSdkLogUrl, params: [{ type: 'string', name: 'url' }] },
          audioToText: { sid: r.misc.id, cid: r.misc.audioToText, params: [{ type: 'Property', name: 'audioToText' }] },
          processImage: {
            sid: r.misc.id,
            cid: r.misc.processImage,
            params: [
              { type: 'String', name: 'url' },
              { type: 'PropertyArray', name: 'imageOps', entity: 'imageOp' },
            ],
          },
          getClientAntispam: { sid: r.misc.id, cid: r.misc.getClientAntispam, params: [{ type: 'Property', name: 'clientAntispam' }] },
          fileQuickTransfer: { sid: r.misc.id, cid: r.misc.fileQuickTransfer, params: [{ type: 'Property', name: 'fileQuickTransfer' }] },
          getNosOriginUrl: { sid: r.misc.id, cid: r.misc.getNosOriginUrl, params: [{ type: 'Property', name: 'nosFileUrlTag' }] },
          getServerTime: { sid: r.misc.id, cid: r.misc.getServerTime, params: [] },
          getNosAccessToken: { sid: r.misc.id, cid: r.misc.getNosAccessToken, params: [{ type: 'Property', name: 'nosAccessTokenTag' }] },
          deleteNosAccessToken: { sid: r.misc.id, cid: r.misc.deleteNosAccessToken, params: [{ type: 'Property', name: 'nosAccessTokenTag' }] },
          getNosTokenTrans: { sid: r.misc.id, cid: r.misc.getNosTokenTrans, params: [{ type: 'Property', name: 'transToken' }] },
          fetchFile: { sid: r.misc.id, cid: r.misc.fetchFile, params: [{ type: 'String', name: 'docId' }] },
          fetchFileList: { sid: r.misc.id, cid: r.misc.fetchFileList, params: [{ type: 'Property', name: 'fileListParam' }] },
          removeFile: { sid: r.misc.id, cid: r.misc.removeFile, params: [{ type: 'String', name: 'docId' }] },
          getNosCdnHost: { sid: r.misc.id, cid: r.misc.getNosCdnHost, params: [] },
          signalingCreate: { sid: r.avSignal.id, cid: r.avSignal.signalingCreate, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingDelay: { sid: r.avSignal.id, cid: r.avSignal.signalingDelay, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingClose: { sid: r.avSignal.id, cid: r.avSignal.signalingClose, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingJoin: { sid: r.avSignal.id, cid: r.avSignal.signalingJoin, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingLeave: { sid: r.avSignal.id, cid: r.avSignal.signalingLeave, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingInvite: { sid: r.avSignal.id, cid: r.avSignal.signalingInvite, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingCancel: { sid: r.avSignal.id, cid: r.avSignal.signalingCancel, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingReject: { sid: r.avSignal.id, cid: r.avSignal.signalingReject, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingAccept: { sid: r.avSignal.id, cid: r.avSignal.signalingAccept, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingControl: { sid: r.avSignal.id, cid: r.avSignal.signalingControl, params: [{ type: 'Property', name: 'avSignalTag' }] },
          signalingGetChannelInfo: { sid: r.avSignal.id, cid: r.avSignal.signalingGetChannelInfo, params: [{ type: 'Property', name: 'avSignalTag' }] },
        };
      e.exports = {
        idMap: r,
        cmdConfig: o,
        packetConfig: {
          '1_2': { service: 'link', cmd: 'heartbeat' },
          '1_5': { service: 'link', cmd: 'negotiateTransport', response: [{ type: 'Property', name: 'negotiateTransportTag' }] },
          '1_6': { service: 'link', cmd: 'initTransport', response: [{ type: 'Property', name: 'initTransportTag' }] },
          '6_1': { service: 'misc', cmd: 'getSimpleNosToken', response: [{ type: 'PropertyArray', name: 'nosTokens', entity: 'nosToken' }] },
          '6_2': { service: 'misc', cmd: 'getNosToken', response: [{ type: 'Property', name: 'nosToken' }] },
          '6_3': { service: 'misc', cmd: 'notifyUploadLog' },
          '6_4': { service: 'misc', cmd: 'uploadSdkLogUrl' },
          '6_5': { service: 'misc', cmd: 'audioToText', response: [{ type: 'String', name: 'text' }] },
          '6_6': { service: 'misc', cmd: 'processImage', response: [{ type: 'String', name: 'url' }] },
          '6_7': {
            service: 'misc',
            cmd: 'getNosTokenTrans',
            response: [
              { type: 'Property', name: 'nosToken' },
              { type: 'String', name: 'docId' },
            ],
          },
          '6_8': { service: 'misc', cmd: 'notifyTransLog', response: [{ type: 'Property', name: 'transInfo' }] },
          '6_9': { service: 'misc', cmd: 'fetchFile', response: [{ type: 'Property', name: 'info', entity: 'transInfo' }] },
          '6_10': {
            service: 'misc',
            cmd: 'fetchFileList',
            response: [
              { type: 'PropertyArray', name: 'list', entity: 'transInfo' },
              { type: 'Number', name: 'totalCount' },
            ],
          },
          '6_11': { service: 'misc', cmd: 'removeFile', response: [{ type: 'String', name: 'res' }] },
          '6_17': { service: 'misc', cmd: 'getClientAntispam', response: [{ type: 'Property', name: 'clientAntispam' }] },
          '6_18': { service: 'misc', cmd: 'fileQuickTransfer', response: [{ type: 'Property', name: 'fileQuickTransfer' }] },
          '6_22': { service: 'misc', cmd: 'getNosOriginUrl', response: [{ type: 'Property', name: 'nosFileUrlTag' }] },
          '6_23': { service: 'misc', cmd: 'getServerTime', response: [{ type: 'Number', name: 'time' }] },
          '6_24': { service: 'misc', cmd: 'getNosAccessToken', response: [{ type: 'Property', name: 'nosAccessTokenTag' }] },
          '6_25': { service: 'misc', cmd: 'deleteNosAccessToken' },
          '6_26': { service: 'misc', cmd: 'getNosCdnHost', response: [{ type: 'Property', name: 'nosConfigTag' }] },
          '15_1': { service: 'avSignal', cmd: 'signalingCreate', response: [{ type: 'Property', name: 'avSignalTag' }] },
          '15_2': { service: 'avSignal', cmd: 'signalingDelay', response: [{ type: 'Property', name: 'avSignalTag' }] },
          '15_3': { service: 'avSignal', cmd: 'signalingClose', response: [{ type: 'Property', name: 'avSignalTag' }] },
          '15_4': { service: 'avSignal', cmd: 'signalingJoin', response: [{ type: 'Property', name: 'avSignalTag' }] },
          '15_5': { service: 'avSignal', cmd: 'signalingLeave', response: [] },
          '15_6': { service: 'avSignal', cmd: 'signalingInvite', response: [] },
          '15_7': { service: 'avSignal', cmd: 'signalingCancel', response: [] },
          '15_8': { service: 'avSignal', cmd: 'signalingReject', response: [] },
          '15_9': { service: 'avSignal', cmd: 'signalingAccept', response: [] },
          '15_10': { service: 'avSignal', cmd: 'signalingControl', response: [] },
          '15_11': { service: 'avSignal', cmd: 'signalingNotify', response: [{ type: 'Property', name: 'avSignalTag' }] },
          '15_12': { service: 'avSignal', cmd: 'signalingMutilClientSyncNotify', response: [{ type: 'Property', name: 'avSignalTag' }] },
          '15_13': { service: 'avSignal', cmd: 'signalingUnreadMessageSyncNotify', response: [{ type: 'PropertyArray', name: 'avSignalTag' }] },
          '15_14': { service: 'avSignal', cmd: 'signalingChannelsSyncNotify', response: [{ type: 'PropertyArray', name: 'avSignalTag' }] },
          '15_15': { service: 'avSignal', cmd: 'signalingGetChannelInfo', response: [{ type: 'Property', name: 'avSignalTag' }] },
        },
      };
    },
    ,
    function (e, t, n) {
      'use strict';
      var r,
        o = n(9);
      var i = ((r = o) && r.__esModule ? r : { default: r }).default.clientTypeMap;
      function s() {}
      (s.reverse = function (e) {
        var t = e;
        return (t.type = i[t.type]), t;
      }),
        (s.reverseType = function (e) {
          return i[e] || e;
        }),
        (e.exports = s);
    },
    ,
    function (e, t, n) {
      'use strict';
      var r = n(201);
      e.exports = Function.prototype.bind || r;
    },
    function (e, t, n) {
      'use strict';
      var r = Function.prototype.toString,
        o = /^\s*class\b/,
        i = function (e) {
          try {
            var t = r.call(e);
            return o.test(t);
          } catch (e) {
            return !1;
          }
        },
        s = Object.prototype.toString,
        a = 'function' == typeof Symbol && 'symbol' == typeof Symbol.toStringTag;
      e.exports = function (e) {
        if (!e) return !1;
        if ('function' != typeof e && 'object' != typeof e) return !1;
        if ('function' == typeof e && !e.prototype) return !0;
        if (a)
          return (function (e) {
            try {
              return !i(e) && (r.call(e), !0);
            } catch (e) {
              return !1;
            }
          })(e);
        if (i(e)) return !1;
        var t = s.call(e);
        return '[object Function]' === t || '[object GeneratorFunction]' === t;
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(24),
        o = n(0),
        i = o.undef,
        s = o.notundef,
        a = n(1),
        c = n(43),
        u = n(217),
        l = n(113);
      function p(e) {
        o.verifyOptions(e, 'appKey account chatroomId chatroomAddresses', 'protocol::ChatroomProtocol'),
          e.isAnonymous || o.verifyOptions(e, 'token', 'protocol::ChatroomProtocol'),
          o.verifyParamType('chatroomAddresses', e.chatroomAddresses, 'array', 'protocol::ChatroomProtocol'),
          o.verifyCallback(e, 'onconnect onerror onwillreconnect ondisconnect onmsg onmsgs onrobots', 'protocol::ChatroomProtocol'),
          r.call(this, e);
      }
      var m = r.fn,
        d = (p.fn = p.prototype = Object.create(m));
      (d.init = function () {
        m.init.call(this),
          c.Chatroom.setProtocol(this),
          (this.parser = c.Chatroom),
          this.sendCmd.bind(this),
          (this.syncResult = {}),
          (this.timetags = {}),
          (this.msgBuffer = []);
      }),
        (d.reset = function () {
          var e = this;
          m.reset.call(e);
          var t = e.options;
          i(t.msgBufferInterval) && (t.msgBufferInterval = 300),
            o.verifyParamType('msgBufferInterval', t.msgBufferInterval, 'number', 'protocol::ChatroomProtocol.reset'),
            i(t.msgBufferSize) && (t.msgBufferSize = 500),
            o.verifyParamType('msgBufferSize', t.msgBufferSize, 'number', 'protocol::ChatroomProtocol.reset'),
            s(t.chatroomAddresses) &&
              ((e.socketUrls = t.chatroomAddresses.map(function (t) {
                return a.formatSocketUrl({ url: t, secure: e.options.secure });
              })),
              (e.socketUrlsBackup = e.socketUrls.slice(0)));
        }),
        (d.processChatroom = function (e) {
          switch (e.cmd) {
            case 'login':
              e.error ||
                ((e.obj = { chatroom: u.reverse(e.content.chatroom), member: l.reverse(e.content.chatroomMember) }),
                (this.cdnInfo = {}),
                this.initCdnData(),
                clearTimeout(this.queryCdnTimer),
                this.onCdnMsgInfo(e.content.chatroomCdnInfo));
              break;
            case 'kicked':
              this.onKicked(e);
              break;
            case 'logout':
              break;
            case 'sendMsg':
              this.onSendMsg(e);
              break;
            case 'msg':
              this.onMsg(e), this.cdnInfo && this.cdnInfo.enable && this.correctCdnTime(+e.content.msg.time);
              break;
            case 'getChatroomMembers':
            case 'getChatroomMembersByTag':
              this.onChatroomMembers(e);
              break;
            case 'getChatroomMemberCountByTag':
              this.onGetChatroomMemberCountByTag(e);
              break;
            case 'getHistoryMsgs':
              this.onHistoryMsgs(e);
              break;
            case 'markChatroomMember':
              this.onMarkChatroomMember(e);
              break;
            case 'closeChatroom':
              break;
            case 'getChatroom':
              this.onChatroom(e);
              break;
            case 'updateChatroom':
              break;
            case 'updateMyChatroomMemberInfo':
              delete e.obj.chatroomMember;
              break;
            case 'getChatroomMembersInfo':
              this.onChatroomMembersInfo(e);
              break;
            case 'kickChatroomMember':
            case 'updateChatroomMemberTempMute':
              break;
            case 'queueList':
              e.error || (e.obj = e.content);
              break;
            case 'syncRobot':
              this.onSyncRobot(e);
              break;
            case 'notifyCdnInfo':
              this.onCdnMsgInfo(e.content && e.content.chatroomCdnInfo);
          }
        }),
        (d.onChatroom = function (e) {
          e.error || (e.obj.chatroom = u.reverse(e.content.chatroom));
        }),
        (e.exports = p),
        n(303),
        n(304),
        n(305),
        n(314);
    },
    function (e, t, n) {
      var r = n(23),
        o = n(7).document,
        i = r(o) && r(o.createElement);
      e.exports = function (e) {
        return i ? o.createElement(e) : {};
      };
    },
    function (e, t, n) {
      var r = n(52),
        o = Math.min;
      e.exports = function (e) {
        return e > 0 ? o(r(e), 9007199254740991) : 0;
      };
    },
    function (e, t) {
      e.exports = function (e, t) {
        var n = t.split('.');
        for (; n.length; ) {
          var r = n.shift(),
            o = !1;
          if (('?' == r[r.length - 1] && ((r = r.slice(0, -1)), (o = !0)), !(e = e[r]) && o)) return e;
        }
        return e;
      };
    },
    function (e, t, n) {
      'use strict';
      t.__esModule = !0;
      var r,
        o = n(143),
        i = (r = o) && r.__esModule ? r : { default: r };
      t.default = function (e) {
        if (Array.isArray(e)) {
          for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
          return n;
        }
        return (0, i.default)(e);
      };
    },
    function (e, t, n) {
      var r = n(72),
        o = n(4)('iterator'),
        i = n(28);
      e.exports = n(8).getIteratorMethod = function (e) {
        if (null != e) return e[o] || e['@@iterator'] || i[r(e)];
      };
    },
    function (e, t, n) {
      var r = n(36),
        o = n(4)('toStringTag'),
        i =
          'Arguments' ==
          r(
            (function () {
              return arguments;
            })()
          );
      e.exports = function (e) {
        var t, n, s;
        return void 0 === e
          ? 'Undefined'
          : null === e
          ? 'Null'
          : 'string' ==
            typeof (n = (function (e, t) {
              try {
                return e[t];
              } catch (e) {}
            })((t = Object(e)), o))
          ? n
          : i
          ? r(t)
          : 'Object' == (s = r(t)) && 'function' == typeof t.callee
          ? 'Arguments'
          : s;
      };
    },
    function (e, t, n) {
      'use strict';
      t.__esModule = !0;
      var r = i(n(153)),
        o = i(n(156));
      function i(e) {
        return e && e.__esModule ? e : { default: e };
      }
      t.default = (function () {
        return function (e, t) {
          if (Array.isArray(e)) return e;
          if ((0, r.default)(Object(e)))
            return (function (e, t) {
              var n = [],
                r = !0,
                i = !1,
                s = void 0;
              try {
                for (var a, c = (0, o.default)(e); !(r = (a = c.next()).done) && (n.push(a.value), !t || n.length !== t); r = !0);
              } catch (e) {
                (i = !0), (s = e);
              } finally {
                try {
                  !r && c.return && c.return();
                } finally {
                  if (i) throw s;
                }
              }
              return n;
            })(e, t);
          throw new TypeError('Invalid attempt to destructure non-iterable instance');
        };
      })();
    },
    ,
    ,
    ,
    function (e, t, n) {
      'use strict';
      var r = n(11),
        o = n(66),
        i = n(1),
        s = n(217),
        a = n(315),
        c = n(0),
        u = c.verifyOptions,
        l = c.verifyParamType,
        p = n(43).Chatroom;
      function m(e) {
        return (
          (this.subType = 'chatroom'),
          (this.nosScene = e.nosScene || 'chatroom'),
          (this.nosSurvivalTime = e.nosSurvivalTime),
          (e.Protocol = o),
          (e.Message = a),
          (e.constructor = m),
          e.isAnonymous &&
            ((e.account = e.account || 'nimanon_' + c.guid()),
            (e.isAnonymous = 1),
            c.verifyOptions(e, 'chatroomNick', 'api::Chatroom'),
            (e.chatroomAvatar = e.chatroomAvatar || ' ')),
          this.init(e)
        );
      }
      (m.Protocol = o),
        (m.parser = p),
        (m.use = r.use),
        (m.getInstance = function (e) {
          return (
            e.isAnonymous &&
              ((e.account = e.account || 'nimanon_' + c.guid()),
              (e.isAnonymous = 1),
              c.verifyOptions(e, 'chatroomNick', 'api::Chatroom.getInstance'),
              (e.chatroomAvatar = e.chatroomAvatar || ' ')),
            r.getInstance.call(this, e)
          );
        }),
        (m.genInstanceName = function (e) {
          return c.verifyOptions(e, 'chatroomId', 'api::Chatroom.genInstanceName'), 'Chatroom-account-' + e.account + '-chatroomId-' + e.chatroomId;
        });
      var d = (m.fn = m.prototype = Object.create(r.prototype));
      (m.info = d.info = i.info),
        (d.getChatroom = function (e) {
          this.processCallback(e), this.sendCmd('getChatroom', e);
        }),
        (d.updateChatroom = function (e) {
          u(e, 'chatroom needNotify', 'api::updateChatroom'),
            l('needNotify', e.needNotify, 'boolean'),
            this.processCustom(e),
            this.processCallback(e),
            (e.chatroom = new s(e.chatroom)),
            this.sendCmd('updateChatroom', e);
        }),
        (d.closeChatroom = function (e) {
          this.processCustom(e), this.processCallback(e), this.sendCmd('closeChatroom', e);
        }),
        (e.exports = m),
        n(325),
        n(326),
        n(327);
    },
    function (e, t, n) {
      'use strict';
      var r = n(30),
        o = n(33),
        i = n(0),
        s = n(1);
      function a(e) {
        switch (
          (i.notundef(e.type) ? i.verifyFileType(e.type, 'msg::FileMessage') : (e.type = 'file'),
          i.verifyOptions(e, 'file', 'msg::FileMessage'),
          i.verifyOptions(e.file, 'url ext size', !0, 'file.', 'msg::FileMessage'),
          e.type)
        ) {
          case 'image':
            c.verifyFile(e.file, 'msg::FileMessage');
            break;
          case 'audio':
            u.verifyFile(e.file, 'msg::FileMessage');
            break;
          case 'video':
            l.verifyFile(e.file, 'msg::FileMessage');
        }
        o.call(this, e), (this.attach = JSON.stringify(e.file));
      }
      (a.prototype = Object.create(o.prototype)),
        (a.reverse = function (e) {
          var t = o.reverse(e);
          return (
            (e.attach = e.attach ? '' + e.attach : ''),
            (t.file = e.attach ? JSON.parse(e.attach) : {}),
            (t.file.url = (0, r.genPrivateUrl)(t.file.url)),
            'audio' !== t.type || t.file.mp3Url || (t.file.mp3Url = t.file.url + (~t.file.url.indexOf('?') ? '&' : '?') + 'audioTrans&type=mp3'),
            s.httpsEnabled && 0 !== t.file.url.indexOf('https://') && (t.file.url = t.file.url.replace('http', 'https')),
            t
          );
        }),
        (e.exports = a);
      var c = n(317),
        u = n(318),
        l = n(319);
    },
    function (e, t, n) {
      e.exports =
        !n(14) &&
        !n(31)(function () {
          return (
            7 !=
            Object.defineProperty(n(67)('div'), 'a', {
              get: function () {
                return 7;
              },
            }).a
          );
        });
    },
    function (e, t, n) {
      var r = n(19),
        o = n(27),
        i = n(121)(!1),
        s = n(53)('IE_PROTO');
      e.exports = function (e, t) {
        var n,
          a = o(e),
          c = 0,
          u = [];
        for (n in a) n != s && r(a, n) && u.push(n);
        for (; t.length > c; ) r(a, (n = t[c++])) && (~i(u, n) || u.push(n));
        return u;
      };
    },
    function (e, t, n) {
      var r = n(36);
      e.exports = Object('z').propertyIsEnumerable(0)
        ? Object
        : function (e) {
            return 'String' == r(e) ? e.split('') : Object(e);
          };
    },
    function (e, t, n) {
      'use strict';
      var r = n(34),
        o = n(26),
        i = n(83),
        s = n(22),
        a = n(28),
        c = n(126),
        u = n(44),
        l = n(128),
        p = n(4)('iterator'),
        m = !([].keys && 'next' in [].keys()),
        d = function () {
          return this;
        };
      e.exports = function (e, t, n, f, y, g, h) {
        c(n, t, f);
        var v,
          b,
          T,
          S = function (e) {
            if (!m && e in _) return _[e];
            switch (e) {
              case 'keys':
              case 'values':
                return function () {
                  return new n(this, e);
                };
            }
            return function () {
              return new n(this, e);
            };
          },
          k = t + ' Iterator',
          M = 'values' == y,
          x = !1,
          _ = e.prototype,
          w = _[p] || _['@@iterator'] || (y && _[y]),
          C = w || S(y),
          P = y ? (M ? S('entries') : C) : void 0,
          O = ('Array' == t && _.entries) || w;
        if (
          (O && (T = l(O.call(new e()))) !== Object.prototype && T.next && (u(T, k, !0), r || 'function' == typeof T[p] || s(T, p, d)),
          M &&
            w &&
            'values' !== w.name &&
            ((x = !0),
            (C = function () {
              return w.call(this);
            })),
          (r && !h) || (!m && !x && _[p]) || s(_, p, C),
          (a[t] = C),
          (a[k] = d),
          y)
        )
          if (((v = { values: M ? C : S('values'), keys: g ? C : S('keys'), entries: P }), h)) for (b in v) b in _ || i(_, b, v[b]);
          else o(o.P + o.F * (m || x), t, v);
        return v;
      };
    },
    function (e, t, n) {
      e.exports = n(22);
    },
    function (e, t, n) {
      var r = n(12),
        o = n(127),
        i = n(55),
        s = n(53)('IE_PROTO'),
        a = function () {},
        c = function () {
          var e,
            t = n(67)('iframe'),
            r = i.length;
          for (
            t.style.display = 'none',
              n(101).appendChild(t),
              t.src = 'javascript:',
              (e = t.contentWindow.document).open(),
              e.write('<script>document.F=Object</script>'),
              e.close(),
              c = e.F;
            r--;

          )
            delete c.prototype[i[r]];
          return c();
        };
      e.exports =
        Object.create ||
        function (e, t) {
          var n;
          return null !== e ? ((a.prototype = r(e)), (n = new a()), (a.prototype = null), (n[s] = e)) : (n = c()), void 0 === t ? n : o(n, t);
        };
    },
    function (e, t, n) {
      var r = n(80),
        o = n(55).concat('length', 'prototype');
      t.f =
        Object.getOwnPropertyNames ||
        function (e) {
          return r(e, o);
        };
    },
    function (e, t) {
      e.exports = function e(t, n) {
        'use strict';
        var r,
          o,
          i = /(^([+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[0-9a-f]+$|\d+)/gi,
          s = /(^[ ]*|[ ]*$)/g,
          a = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
          c = /^0x[0-9a-f]+$/i,
          u = /^0/,
          l = function (t) {
            return (e.insensitive && ('' + t).toLowerCase()) || '' + t;
          },
          p = l(t).replace(s, '') || '',
          m = l(n).replace(s, '') || '',
          d = p.replace(i, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
          f = m.replace(i, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
          y = parseInt(p.match(c), 16) || (1 !== d.length && p.match(a) && Date.parse(p)),
          g = parseInt(m.match(c), 16) || (y && m.match(a) && Date.parse(m)) || null;
        if (g) {
          if (y < g) return -1;
          if (y > g) return 1;
        }
        for (var h = 0, v = Math.max(d.length, f.length); h < v; h++) {
          if (((r = (!(d[h] || '').match(u) && parseFloat(d[h])) || d[h] || 0), (o = (!(f[h] || '').match(u) && parseFloat(f[h])) || f[h] || 0), isNaN(r) !== isNaN(o)))
            return isNaN(r) ? 1 : -1;
          if ((typeof r != typeof o && ((r += ''), (o += '')), r < o)) return -1;
          if (r > o) return 1;
        }
        return 0;
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(10),
        o = r.getGlobal(),
        i = {},
        s = o.name || '_parent',
        a = [],
        c = [];
      i.addMsgListener = function (e) {
        a.push(e);
      };
      var u,
        l,
        p,
        m,
        d =
          ((u = /^([\w]+?:\/\/.*?(?=\/|$))/i),
          function (e) {
            return (e = e || ''), u.test(e) ? RegExp.$1 : '*';
          }),
        f = function () {
          var e = unescape(o.name || '').trim();
          if (e && 0 === e.indexOf('MSG|')) {
            o.name = '';
            var t = r.string2object(e.replace('MSG|', ''), '|'),
              n = (t.origin || '').toLowerCase();
            (n && '*' !== n && 0 !== location.href.toLowerCase().indexOf(n)) ||
              (function (e) {
                for (var t = 0, n = a.length; t < n; t++)
                  try {
                    a[t].call(null, e);
                  } catch (e) {}
              })({
                data: JSON.parse(t.data || 'null'),
                source: o.frames[t.self] || t.self,
                origin: d(t.ref || ('undefined' == typeof document ? '' : document.referrer)),
              });
          }
        },
        y =
          ((p = function (e, t) {
            for (var n = 0, r = e.length; n < r; n++) if (e[n] === t) return !0;
            return !1;
          }),
          function () {
            if (c.length) {
              l = [];
              for (var e, t = c.length - 1; t >= 0; t--) (e = c[t]), p(l, e.w) || (l.push(e.w), c.splice(t, 1), (e.w.name = e.d));
              l = null;
            }
          }),
        g = (i.startTimer =
          ((m = !1),
          function () {
            m || ((m = !0), o.postMessage || (setInterval(y, 100), setInterval(f, 20)));
          }));
      (i.postMessage = function (e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
        if ((r.fillUndef(t, { origin: '*', source: s }), o.postMessage)) {
          var n = t.data;
          o.FormData || (n = JSON.stringify(n)), e.postMessage(n, t.origin);
        } else {
          if ((g(), r.isObject(t))) {
            var i = {};
            (i.origin = t.origin || ''), (i.ref = location.href), (i.self = t.source), (i.data = JSON.stringify(t.data)), (t = 'MSG|' + r.object2string(i, '|', !0));
          }
          c.unshift({ w: e, d: escape(t) });
        }
      }),
        (e.exports = i);
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = {
          file: { md5: '$(Etag)', size: '$(ObjectSize)' },
          image: { md5: '$(Etag)', size: '$(ObjectSize)', w: '$(ImageInfo.Width)', h: '$(ImageInfo.Height)', orientation: '$(ImageInfo.Orientation)' },
          audio: { md5: '$(Etag)', size: '$(ObjectSize)', dur: '$(AVinfo.Audio.Duration)' },
          video: { md5: '$(Etag)', size: '$(ObjectSize)', dur: '$(AVinfo.Video.Duration)', w: '$(AVinfo.Video.Width)', h: '$(AVinfo.Video.Height)' },
        },
        i = {
          genResponseBody: function (e) {
            return o[(e = e || 'file')];
          },
          parseResponse: function (e, t) {
            r.notundef(e.size) && (e.size = +e.size), r.notundef(e.w) && (e.w = +e.w), r.notundef(e.h) && (e.h = +e.h), r.notundef(e.dur) && (e.dur = +e.dur);
            var n = e.orientation;
            if (r.notundef(n) && (delete e.orientation, t && ('right, top' === n || 'left, bottom' === n))) {
              var o = e.w;
              (e.w = e.h), (e.h = o);
            }
            return e;
          },
        };
      e.exports = i;
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = {
          fromDataURL: function (e) {
            var t = r.getGlobal(),
              n = void 0;
            n = e.split(',')[0].indexOf('base64') >= 0 ? t.atob(e.split(',')[1]) : t.decodeURIComponent(e.split(',')[1]);
            for (var o = e.split(',')[0].split(':')[1].split(';')[0], i = new Uint8Array(n.length), s = 0; s < n.length; s++) i[s] = n.charCodeAt(s);
            return new t.Blob([i], { type: o });
          },
        };
      e.exports = o;
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = { stripmeta: 0, blur: 2, quality: 3, crop: 4, rotate: 5, thumbnail: 7, interlace: 9 },
        i = { 0: 'stripmeta', 1: 'type', 2: 'blur', 3: 'quality', 4: 'crop', 5: 'rotate', 6: 'pixel', 7: 'thumbnail', 8: 'watermark', 9: 'interlace', 10: 'tmp' };
      function s(e) {
        r.verifyOptions(e, 'type', 'image::ImageOp'), r.verifyParamValid('type', e.type, s.validTypes, 'image::ImageOp'), r.merge(this, e), (this.type = o[e.type]);
      }
      (s.validTypes = Object.keys(o)),
        (s.reverse = function (e) {
          var t = r.copy(e);
          return (t.type = i[t.type]), t;
        }),
        (s.reverseImageOps = function (e) {
          return e.map(function (e) {
            return s.reverse(e);
          });
        }),
        (e.exports = s);
    },
    function (e, t, n) {
      'use strict';
      var r = { 1: 'ROOM_CLOSE', 2: 'ROOM_JOIN', 3: 'INVITE', 4: 'CANCEL_INVITE', 5: 'REJECT', 6: 'ACCEPT', 7: 'LEAVE', 8: 'CONTROL' },
        o = { 1: 'accid', 2: 'uid', 3: 'createTime', 4: 'expireTime', 5: 'web_uid' },
        i = {
          10404: 'ROOM_NOT_EXISTS',
          10405: 'ROOM_HAS_EXISTS',
          10406: 'ROOM_MEMBER_NOT_EXISTS',
          10407: 'ROOM_MEMBER_HAS_EXISTS',
          10408: 'INVITE_NOT_EXISTS',
          10409: 'INVITE_HAS_REJECT',
          10410: 'INVITE_HAS_ACCEPT',
          10201: 'PEER_NIM_OFFLINE',
          10202: 'PEER_PUSH_OFFLINE',
          10419: 'ROOM_MEMBER_EXCEED',
          10420: 'ROOM_MEMBER_HAS_EXISTS_OTHER_CLIENT',
          10417: 'UID_CONFLICT',
        };
      e.exports = {
        parseAvSignalType: function (e) {
          return r[e] || e;
        },
        parseAvSignalMember: function (e) {
          var t = {};
          return (
            Object.keys(e).forEach(function (n) {
              t[o[n]] = e[n];
            }),
            t
          );
        },
        parseAvSignalError: function (e) {
          return (e.message = i[e.code] || e.message || e), e;
        },
      };
    },
    function (module, exports, __webpack_require__) {
      (function (global, module) {
        var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;
        /*! Socket.IO.js build:0.9.11, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */ function getGlobal() {
          return 'undefined' != typeof window ? window : 'undefined' != typeof self ? self : void 0 !== global ? global : {};
        }
        var root = getGlobal(),
          io = module.exports;
        void 0 === root.location && (root.location = null),
          root.io ? module && (module.exports = io = root.io) : (root.io = io),
          (function () {
            !(function (e, t) {
              var n = e;
              (n.version = '0.9.11'),
                (n.protocol = 1),
                (n.transports = []),
                (n.j = []),
                (n.sockets = {}),
                (n.connect = function (e, r) {
                  var o,
                    i,
                    s = n.util.parseUri(e);
                  t &&
                    t.location &&
                    ((s.protocol = s.protocol || t.location.protocol.slice(0, -1)),
                    (s.host = s.host || (t.document ? t.document.domain : t.location.hostname)),
                    (s.port = s.port || t.location.port)),
                    (o = n.util.uniqueUri(s));
                  var a = {
                    host: s.ipv6uri ? '[' + s.host + ']' : s.host,
                    secure: 'https' === s.protocol,
                    port: s.port || ('https' === s.protocol ? 443 : 80),
                    query: s.query || '',
                  };
                  return (
                    n.util.merge(a, r),
                    (!a['force new connection'] && n.sockets[o]) || (i = new n.Socket(a)),
                    !a['force new connection'] && i && (n.sockets[o] = i),
                    (i = i || n.sockets[o]).of(s.path.length > 1 ? s.path : '')
                  );
                });
            })(module.exports, root),
              (function (e, t) {
                var n = (e.util = {}),
                  r =
                    /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
                  o = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];
                (n.parseUri = function (e) {
                  var t = e,
                    n = e.indexOf('['),
                    i = e.indexOf(']');
                  -1 != n && -1 != i && (e = e.substring(0, n) + e.substring(n, i).replace(/:/g, ';') + e.substring(i, e.length));
                  for (var s = r.exec(e || ''), a = {}, c = 14; c--; ) a[o[c]] = s[c] || '';
                  return (
                    -1 != n &&
                      -1 != i &&
                      ((a.source = t),
                      (a.host = a.host.substring(1, a.host.length - 1).replace(/;/g, ':')),
                      (a.authority = a.authority.replace('[', '').replace(']', '').replace(/;/g, ':')),
                      (a.ipv6uri = !0)),
                    a
                  );
                }),
                  (n.uniqueUri = function (e) {
                    var n = e.protocol,
                      r = e.host,
                      o = e.port;
                    return (
                      'document' in t && t.document
                        ? ((r = r || document.domain), (o = o || ('https' == n && 'https:' !== document.location.protocol ? 443 : document.location.port)))
                        : ((r = r || 'localhost'), o || 'https' != n || (o = 443)),
                      (n || 'http') + '://' + r + ':' + (o || 80)
                    );
                  }),
                  (n.query = function (e, t) {
                    var r = n.chunkQuery(e || ''),
                      o = [];
                    for (var i in (n.merge(r, n.chunkQuery(t || '')), r)) r.hasOwnProperty(i) && o.push(i + '=' + r[i]);
                    return o.length ? '?' + o.join('&') : '';
                  }),
                  (n.chunkQuery = function (e) {
                    for (var t, n = {}, r = e.split('&'), o = 0, i = r.length; o < i; ++o) (t = r[o].split('='))[0] && (n[t[0]] = t[1]);
                    return n;
                  });
                var i = !1;
                (n.load = function (e) {
                  if (('undefined' != typeof document && document && 'complete' === document.readyState) || i) return e();
                  n.on(t, 'load', e, !1);
                }),
                  (n.on = function (e, t, n, r) {
                    e.attachEvent ? e.attachEvent('on' + t, n) : e.addEventListener && e.addEventListener(t, n, r);
                  }),
                  (n.request = function (e) {
                    if (e && 'undefined' != typeof XDomainRequest && !n.ua.hasCORS) return new XDomainRequest();
                    if ('undefined' != typeof XMLHttpRequest && (!e || n.ua.hasCORS)) return new XMLHttpRequest();
                    if (!e)
                      try {
                        return new root[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
                      } catch (e) {}
                    return null;
                  }),
                  void 0 !== root &&
                    n.load(function () {
                      i = !0;
                    }),
                  (n.defer = function (e) {
                    if (!n.ua.webkit || 'undefined' != typeof importScripts) return e();
                    n.load(function () {
                      setTimeout(e, 100);
                    });
                  }),
                  (n.merge = function (e, t, r, o) {
                    var i,
                      s = o || [],
                      a = void 0 === r ? 2 : r;
                    for (i in t)
                      t.hasOwnProperty(i) && n.indexOf(s, i) < 0 && ('object' == typeof e[i] && a ? n.merge(e[i], t[i], a - 1, s) : ((e[i] = t[i]), s.push(t[i])));
                    return e;
                  }),
                  (n.mixin = function (e, t) {
                    n.merge(e.prototype, t.prototype);
                  }),
                  (n.inherit = function (e, t) {
                    function n() {}
                    (n.prototype = t.prototype), (e.prototype = new n());
                  }),
                  (n.isArray =
                    Array.isArray ||
                    function (e) {
                      return '[object Array]' === Object.prototype.toString.call(e);
                    }),
                  (n.intersect = function (e, t) {
                    for (var r = [], o = e.length > t.length ? e : t, i = e.length > t.length ? t : e, s = 0, a = i.length; s < a; s++)
                      ~n.indexOf(o, i[s]) && r.push(i[s]);
                    return r;
                  }),
                  (n.indexOf = function (e, t, n) {
                    var r = e.length;
                    for (n = n < 0 ? (n + r < 0 ? 0 : n + r) : n || 0; n < r && e[n] !== t; n++);
                    return r <= n ? -1 : n;
                  }),
                  (n.toArray = function (e) {
                    for (var t = [], n = 0, r = e.length; n < r; n++) t.push(e[n]);
                    return t;
                  }),
                  (n.ua = {}),
                  (n.ua.hasCORS =
                    'undefined' != typeof XMLHttpRequest &&
                    (function () {
                      try {
                        var e = new XMLHttpRequest();
                      } catch (e) {
                        return !1;
                      }
                      return null != e.withCredentials;
                    })()),
                  (n.ua.webkit = 'undefined' != typeof navigator && /webkit/i.test(navigator.userAgent)),
                  (n.ua.iDevice = 'undefined' != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent));
              })(void 0 !== io ? io : module.exports, root),
              (function (e, t) {
                function n() {}
                (e.EventEmitter = n),
                  (n.prototype.on = function (e, n) {
                    return (
                      this.$events || (this.$events = {}),
                      this.$events[e] ? (t.util.isArray(this.$events[e]) ? this.$events[e].push(n) : (this.$events[e] = [this.$events[e], n])) : (this.$events[e] = n),
                      this
                    );
                  }),
                  (n.prototype.addListener = n.prototype.on),
                  (n.prototype.once = function (e, t) {
                    var n = this;
                    function r() {
                      n.removeListener(e, r), t.apply(this, arguments);
                    }
                    return (r.listener = t), this.on(e, r), this;
                  }),
                  (n.prototype.removeListener = function (e, n) {
                    if (this.$events && this.$events[e]) {
                      var r = this.$events[e];
                      if (t.util.isArray(r)) {
                        for (var o = -1, i = 0, s = r.length; i < s; i++)
                          if (r[i] === n || (r[i].listener && r[i].listener === n)) {
                            o = i;
                            break;
                          }
                        if (o < 0) return this;
                        r.splice(o, 1), r.length || delete this.$events[e];
                      } else (r === n || (r.listener && r.listener === n)) && delete this.$events[e];
                    }
                    return this;
                  }),
                  (n.prototype.removeAllListeners = function (e) {
                    return void 0 === e ? ((this.$events = {}), this) : (this.$events && this.$events[e] && (this.$events[e] = null), this);
                  }),
                  (n.prototype.listeners = function (e) {
                    return (
                      this.$events || (this.$events = {}),
                      this.$events[e] || (this.$events[e] = []),
                      t.util.isArray(this.$events[e]) || (this.$events[e] = [this.$events[e]]),
                      this.$events[e]
                    );
                  }),
                  (n.prototype.emit = function (e) {
                    if (!this.$events) return !1;
                    var n = this.$events[e];
                    if (!n) return !1;
                    var r = Array.prototype.slice.call(arguments, 1);
                    if ('function' == typeof n) n.apply(this, r);
                    else {
                      if (!t.util.isArray(n)) return !1;
                      for (var o = n.slice(), i = 0, s = o.length; i < s; i++) o[i].apply(this, r);
                    }
                    return !0;
                  });
              })(void 0 !== io ? io : module.exports, void 0 !== io ? io : module.parent.exports),
              (function (exports, nativeJSON) {
                'use strict';
                if (nativeJSON && nativeJSON.parse) return (exports.JSON = { parse: nativeJSON.parse, stringify: nativeJSON.stringify });
                var JSON = (exports.JSON = {});
                function f(e) {
                  return e < 10 ? '0' + e : e;
                }
                function date(e, t) {
                  return isFinite(e.valueOf())
                    ? e.getUTCFullYear() +
                        '-' +
                        f(e.getUTCMonth() + 1) +
                        '-' +
                        f(e.getUTCDate()) +
                        'T' +
                        f(e.getUTCHours()) +
                        ':' +
                        f(e.getUTCMinutes()) +
                        ':' +
                        f(e.getUTCSeconds()) +
                        'Z'
                    : null;
                }
                var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                  escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                  gap,
                  indent,
                  meta = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\' },
                  rep;
                function quote(e) {
                  return (
                    (escapable.lastIndex = 0),
                    escapable.test(e)
                      ? '"' +
                        e.replace(escapable, function (e) {
                          var t = meta[e];
                          return 'string' == typeof t ? t : '\\u' + ('0000' + e.charCodeAt(0).toString(16)).slice(-4);
                        }) +
                        '"'
                      : '"' + e + '"'
                  );
                }
                function str(e, t) {
                  var n,
                    r,
                    o,
                    i,
                    s,
                    a = gap,
                    c = t[e];
                  switch ((c instanceof Date && (c = date(e)), 'function' == typeof rep && (c = rep.call(t, e, c)), typeof c)) {
                    case 'string':
                      return quote(c);
                    case 'number':
                      return isFinite(c) ? String(c) : 'null';
                    case 'boolean':
                    case 'null':
                      return String(c);
                    case 'object':
                      if (!c) return 'null';
                      if (((gap += indent), (s = []), '[object Array]' === Object.prototype.toString.apply(c))) {
                        for (i = c.length, n = 0; n < i; n += 1) s[n] = str(n, c) || 'null';
                        return (o = 0 === s.length ? '[]' : gap ? '[\n' + gap + s.join(',\n' + gap) + '\n' + a + ']' : '[' + s.join(',') + ']'), (gap = a), o;
                      }
                      if (rep && 'object' == typeof rep)
                        for (i = rep.length, n = 0; n < i; n += 1) 'string' == typeof rep[n] && (o = str((r = rep[n]), c)) && s.push(quote(r) + (gap ? ': ' : ':') + o);
                      else for (r in c) Object.prototype.hasOwnProperty.call(c, r) && (o = str(r, c)) && s.push(quote(r) + (gap ? ': ' : ':') + o);
                      return (o = 0 === s.length ? '{}' : gap ? '{\n' + gap + s.join(',\n' + gap) + '\n' + a + '}' : '{' + s.join(',') + '}'), (gap = a), o;
                  }
                }
                (JSON.stringify = function (e, t, n) {
                  var r;
                  if (((gap = ''), (indent = ''), 'number' == typeof n)) for (r = 0; r < n; r += 1) indent += ' ';
                  else 'string' == typeof n && (indent = n);
                  if (((rep = t), t && 'function' != typeof t && ('object' != typeof t || 'number' != typeof t.length)))
                    throw new Error('socket.io:: replacer cannot JSON.stringify');
                  return str('', { '': e });
                }),
                  (JSON.parse = function (text, reviver) {
                    var j;
                    function walk(e, t) {
                      var n,
                        r,
                        o = e[t];
                      if (o && 'object' == typeof o) for (n in o) Object.prototype.hasOwnProperty.call(o, n) && (void 0 !== (r = walk(o, n)) ? (o[n] = r) : delete o[n]);
                      return reviver.call(e, t, o);
                    }
                    if (
                      ((text = String(text)),
                      (cx.lastIndex = 0),
                      cx.test(text) &&
                        (text = text.replace(cx, function (e) {
                          return '\\u' + ('0000' + e.charCodeAt(0).toString(16)).slice(-4);
                        })),
                      /^[\],:{}\s]*$/.test(
                        text
                          .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                          .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                          .replace(/(?:^|:|,)(?:\s*\[)+/g, '')
                      ))
                    )
                      return (j = eval('(' + text + ')')), 'function' == typeof reviver ? walk({ '': j }, '') : j;
                    throw new SyntaxError('socket.io:: reviver cannot JSON.parse');
                  });
              })(void 0 !== io ? io : module.exports, 'undefined' != typeof JSON ? JSON : void 0),
              (function (e, t) {
                var n = (e.parser = {}),
                  r = (n.packets = ['disconnect', 'connect', 'heartbeat', 'message', 'json', 'event', 'ack', 'error', 'noop']),
                  o = (n.reasons = ['transport not supported', 'client not handshaken', 'unauthorized']),
                  i = (n.advice = ['reconnect']),
                  s = t.JSON,
                  a = t.util.indexOf;
                (n.encodePacket = function (e) {
                  var t = a(r, e.type),
                    n = e.id || '',
                    c = e.endpoint || '',
                    u = e.ack,
                    l = null;
                  switch (e.type) {
                    case 'error':
                      var p = e.reason ? a(o, e.reason) : '',
                        m = e.advice ? a(i, e.advice) : '';
                      ('' === p && '' === m) || (l = p + ('' !== m ? '+' + m : ''));
                      break;
                    case 'message':
                      '' !== e.data && (l = e.data);
                      break;
                    case 'event':
                      var d = { name: e.name };
                      e.args && e.args.length && (d.args = e.args), (l = s.stringify(d));
                      break;
                    case 'json':
                      l = s.stringify(e.data);
                      break;
                    case 'connect':
                      e.qs && (l = e.qs);
                      break;
                    case 'ack':
                      l = e.ackId + (e.args && e.args.length ? '+' + s.stringify(e.args) : '');
                  }
                  var f = [t, n + ('data' == u ? '+' : ''), c];
                  return null != l && f.push(l), f.join(':');
                }),
                  (n.encodePayload = function (e) {
                    var t = '';
                    if (1 == e.length) return e[0];
                    for (var n = 0, r = e.length; n < r; n++) {
                      t += '�' + e[n].length + '�' + e[n];
                    }
                    return t;
                  });
                var c = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;
                (n.decodePacket = function (e) {
                  if (!(a = e.match(c))) return {};
                  var t = a[2] || '',
                    n = ((e = a[5] || ''), { type: r[a[1]], endpoint: a[4] || '' });
                  switch ((t && ((n.id = t), a[3] ? (n.ack = 'data') : (n.ack = !0)), n.type)) {
                    case 'error':
                      var a = e.split('+');
                      (n.reason = o[a[0]] || ''), (n.advice = i[a[1]] || '');
                      break;
                    case 'message':
                      n.data = e || '';
                      break;
                    case 'event':
                      try {
                        var u = s.parse(e);
                        (n.name = u.name), (n.args = u.args);
                      } catch (e) {}
                      n.args = n.args || [];
                      break;
                    case 'json':
                      try {
                        n.data = s.parse(e);
                      } catch (e) {}
                      break;
                    case 'connect':
                      n.qs = e || '';
                      break;
                    case 'ack':
                      if ((a = e.match(/^([0-9]+)(\+)?(.*)/)) && ((n.ackId = a[1]), (n.args = []), a[3]))
                        try {
                          n.args = a[3] ? s.parse(a[3]) : [];
                        } catch (e) {}
                  }
                  return n;
                }),
                  (n.decodePayload = function (e) {
                    var t = function (e, t) {
                      for (var n = 0, r = e; r < t.length; r++) {
                        if ('�' == t.charAt(r)) return n;
                        n++;
                      }
                      return n;
                    };
                    if ('�' == e.charAt(0)) {
                      for (var r = [], o = 1, i = ''; o < e.length; o++)
                        if ('�' == e.charAt(o)) {
                          var s = e.substr(o + 1).substr(0, i);
                          if ('�' != e.charAt(o + 1 + Number(i)) && o + 1 + Number(i) != e.length) {
                            var a = Number(i);
                            (l = t(o + a + 1, e)), (s = e.substr(o + 1).substr(0, a + l)), (o += l);
                          }
                          r.push(n.decodePacket(s)), (o += Number(i) + 1), (i = '');
                        } else i += e.charAt(o);
                      return r;
                    }
                    return [n.decodePacket(e)];
                  });
              })(void 0 !== io ? io : module.exports, void 0 !== io ? io : module.parent.exports),
              (function (e, t) {
                function n(e, t) {
                  (this.socket = e), (this.sessid = t);
                }
                (e.Transport = n),
                  t.util.mixin(n, t.EventEmitter),
                  (n.prototype.heartbeats = function () {
                    return !0;
                  }),
                  (n.prototype.onData = function (e) {
                    if (this !== this.socket.transport) return this;
                    if ((this.clearCloseTimeout(), (this.socket.connected || this.socket.connecting || this.socket.reconnecting) && this.setCloseTimeout(), '' !== e)) {
                      var n = t.parser.decodePayload(e);
                      if (n && n.length) for (var r = 0, o = n.length; r < o; r++) this.onPacket(n[r]);
                    }
                    return this;
                  }),
                  (n.prototype.onPacket = function (e) {
                    return (
                      this.socket.setHeartbeatTimeout(),
                      'heartbeat' == e.type
                        ? this.onHeartbeat()
                        : ('connect' == e.type && '' == e.endpoint && this.onConnect(),
                          'error' == e.type && 'reconnect' == e.advice && (this.isOpen = !1),
                          this.socket.onPacket(e),
                          this)
                    );
                  }),
                  (n.prototype.setCloseTimeout = function () {
                    if (!this.closeTimeout) {
                      var e = this;
                      this.closeTimeout = setTimeout(function () {
                        e.onDisconnect();
                      }, this.socket.closeTimeout);
                    }
                  }),
                  (n.prototype.onDisconnect = function () {
                    return (
                      this.isOpen && this.close(),
                      this.clearTimeouts(),
                      this.socket ? (this.socket.transport === this ? this.socket.onDisconnect() : this.socket.setBuffer(!1), this) : this
                    );
                  }),
                  (n.prototype.onConnect = function () {
                    return this.socket.onConnect(), this;
                  }),
                  (n.prototype.clearCloseTimeout = function () {
                    this.closeTimeout && (clearTimeout(this.closeTimeout), (this.closeTimeout = null));
                  }),
                  (n.prototype.clearTimeouts = function () {
                    this.clearCloseTimeout(), this.reopenTimeout && clearTimeout(this.reopenTimeout);
                  }),
                  (n.prototype.packet = function (e) {
                    this.send(t.parser.encodePacket(e));
                  }),
                  (n.prototype.onHeartbeat = function (e) {
                    this.packet({ type: 'heartbeat' });
                  }),
                  (n.prototype.onOpen = function () {
                    (this.isOpen = !0), this.clearCloseTimeout(), this.socket.onOpen();
                  }),
                  (n.prototype.onClose = function () {
                    (this.isOpen = !1),
                      this.socket.transport === this ? this.socket.onClose() : this.socket.setBuffer(!1),
                      this.onDisconnect(),
                      this.onDisconnectDone instanceof Function && this.onDisconnectDone(null),
                      this.onConnectionOver instanceof Function && this.onConnectionOver(null);
                  }),
                  (n.prototype.onDisconnectDone = function () {}),
                  (n.prototype.onConnectionOver = function () {}),
                  (n.prototype.prepareUrl = function () {
                    var e = this.socket.options;
                    return this.scheme() + '://' + e.host + ':' + e.port + '/' + e.resource + '/' + t.protocol + '/' + this.name + '/' + this.sessid;
                  }),
                  (n.prototype.ready = function (e, t) {
                    t.call(this);
                  });
              })(void 0 !== io ? io : module.exports, void 0 !== io ? io : module.parent.exports),
              (function (e, t, n) {
                function r(e) {
                  if (
                    ((this.options = {
                      port: 80,
                      secure: !1,
                      document: 'document' in n && document,
                      resource: 'socket.io',
                      transports: e.transports || t.transports,
                      'connect timeout': 1e4,
                      'try multiple transports': !0,
                      reconnect: !0,
                      'reconnection delay': 500,
                      'reconnection limit': 1 / 0,
                      'reopen delay': 3e3,
                      'max reconnection attempts': 10,
                      'sync disconnect on unload': !1,
                      'auto connect': !0,
                      'flash policy port': 10843,
                      manualFlush: !1,
                    }),
                    t.util.merge(this.options, e),
                    (this.connected = !1),
                    (this.open = !1),
                    (this.connecting = !1),
                    (this.reconnecting = !1),
                    (this.namespaces = {}),
                    (this.buffer = []),
                    (this.doBuffer = !1),
                    this.options['sync disconnect on unload'] && (!this.isXDomain() || t.util.ua.hasCORS))
                  ) {
                    var r = this;
                    t.util.on(
                      n,
                      'beforeunload',
                      function () {
                        r.disconnectSync();
                      },
                      !1
                    );
                  }
                  this.options['auto connect'] && this.connect();
                }
                function o() {}
                (e.Socket = r),
                  t.util.mixin(r, t.EventEmitter),
                  (r.prototype.of = function (e) {
                    return (
                      this.namespaces[e] || ((this.namespaces[e] = new t.SocketNamespace(this, e)), '' !== e && this.namespaces[e].packet({ type: 'connect' })),
                      this.namespaces[e]
                    );
                  }),
                  (r.prototype.publish = function () {
                    var e;
                    for (var t in (this.emit.apply(this, arguments), this.namespaces)) this.namespaces.hasOwnProperty(t) && (e = this.of(t)).$emit.apply(e, arguments);
                  }),
                  (r.prototype.handshake = function (e) {
                    var n = this,
                      r = this.options;
                    function i(t) {
                      t instanceof Error ? ((n.connecting = !1), n.onError(t.message)) : e.apply(null, t.split(':'));
                    }
                    var s = [
                      'http' + (r.secure ? 's' : '') + ':/',
                      r.host + ':' + r.port,
                      r.resource,
                      t.protocol,
                      t.util.query(this.options.query, 't=' + +new Date()),
                    ].join('/');
                    if (this.isXDomain() && !t.util.ua.hasCORS && 'undefined' != typeof document && document) {
                      var a = document.getElementsByTagName('script')[0],
                        c = document.createElement('script');
                      (c.src = s + '&jsonp=' + t.j.length),
                        (c.onreadystatechange = function () {
                          'loaded' == this.readyState &&
                            c.parentNode &&
                            (c.parentNode.removeChild(c),
                            (n.connecting = !1),
                            !n.reconnecting && n.onError('Server down or port not open'),
                            n.publish('handshake_failed'));
                        }),
                        a.parentNode.insertBefore(c, a),
                        t.j.push(function (e) {
                          i(e), c.parentNode.removeChild(c);
                        });
                    } else {
                      var u = t.util.request();
                      u.open('GET', s, !0),
                        (u.timeout = 1e4),
                        this.isXDomain() && (u.withCredentials = !0),
                        (u.onreadystatechange = function () {
                          4 == u.readyState &&
                            ((u.onreadystatechange = o),
                            200 == u.status
                              ? i(u.responseText)
                              : 403 == u.status
                              ? ((n.connecting = !1), n.onError(u.responseText), n.publish('handshake_failed'))
                              : ((n.connecting = !1), !n.reconnecting && n.onError(u.responseText), n.publish('handshake_failed')));
                        }),
                        (u.ontimeout = function (e) {
                          (n.connecting = !1), !n.reconnecting && n.onError(u.responseText), n.publish('handshake_failed');
                        }),
                        u.send(null);
                    }
                  }),
                  (r.prototype.connect = function (e) {
                    if (this.connecting) return this;
                    var n = this;
                    return (
                      (n.connecting = !0),
                      this.handshake(function (r, o, i, s) {
                        (n.sessionid = r),
                          (n.closeTimeout = 1e3 * i),
                          (n.heartbeatTimeout = 1e3 * o),
                          n.transports || (n.transports = n.origTransports = s ? t.util.intersect(s.split(','), n.options.transports) : n.options.transports),
                          n.setHeartbeatTimeout(),
                          n.once('connect', function () {
                            clearTimeout(n.connectTimeoutTimer), (n.connectTimeoutTimer = null), e && 'function' == typeof e && e();
                          }),
                          n.doConnect();
                      }),
                      this
                    );
                  }),
                  (r.prototype.doConnect = function () {
                    var e = this;
                    if ((e.transport && e.transport.clearTimeouts(), (e.transport = e.getTransport(e.transports)), !e.transport)) return e.publish('connect_failed');
                    e.transport.ready(e, function () {
                      (e.connecting = !0),
                        e.publish('connecting', e.transport.name),
                        e.transport.open(),
                        e.options['connect timeout'] &&
                          (e.connectTimeoutTimer && clearTimeout(e.connectTimeoutTimer),
                          (e.connectTimeoutTimer = setTimeout(e.tryNextTransport.bind(e), e.options['connect timeout'])));
                    });
                  }),
                  (r.prototype.getTransport = function (e) {
                    for (var n, r = e || this.transports, o = 0; (n = r[o]); o++) {
                      if (t.Transport[n] && t.Transport[n].check(this) && (!this.isXDomain() || t.Transport[n].xdomainCheck(this)))
                        return new t.Transport[n](this, this.sessionid);
                    }
                    return null;
                  }),
                  (r.prototype.tryNextTransport = function () {
                    if (!this.connected && ((this.connecting = !1), this.options['try multiple transports'])) {
                      for (var e = this.transports; e.length > 0 && e.splice(0, 1)[0] != this.transport.name; );
                      e.length ? this.doConnect() : this.publish('connect_failed');
                    }
                  }),
                  (r.prototype.setHeartbeatTimeout = function () {
                    if ((clearTimeout(this.heartbeatTimeoutTimer), !this.transport || this.transport.heartbeats())) {
                      var e = this;
                      this.heartbeatTimeoutTimer = setTimeout(function () {
                        e.transport && e.transport.onClose();
                      }, this.heartbeatTimeout);
                    }
                  }),
                  (r.prototype.packet = function (e) {
                    return this.connected && !this.doBuffer ? this.transport.packet(e) : this.buffer.push(e), this;
                  }),
                  (r.prototype.setBuffer = function (e) {
                    (this.doBuffer = e), !e && this.connected && this.buffer.length && (this.options.manualFlush || this.flushBuffer());
                  }),
                  (r.prototype.flushBuffer = function () {
                    this.transport.payload(this.buffer), (this.buffer = []);
                  }),
                  (r.prototype.disconnect = function () {
                    return (this.connected || this.connecting) && (this.open && this.of('').packet({ type: 'disconnect' }), this.onDisconnect('booted')), this;
                  }),
                  (r.prototype.disconnectSync = function () {
                    var e = t.util.request(),
                      n =
                        [
                          'http' + (this.options.secure ? 's' : '') + ':/',
                          this.options.host + ':' + this.options.port,
                          this.options.resource,
                          t.protocol,
                          '',
                          this.sessionid,
                        ].join('/') + '/?disconnect=1';
                    e.open('GET', n, !1), e.send(null), this.onDisconnect('booted');
                  }),
                  (r.prototype.isXDomain = function () {
                    var e = (n && n.location) || {},
                      t = e.port || ('https:' == e.protocol ? 443 : 80);
                    return this.options.host !== e.hostname || this.options.port != t;
                  }),
                  (r.prototype.onConnect = function () {
                    this.connected || ((this.connected = !0), (this.connecting = !1), this.doBuffer || this.setBuffer(!1), this.emit('connect'));
                  }),
                  (r.prototype.onOpen = function () {
                    this.open = !0;
                  }),
                  (r.prototype.onClose = function () {
                    (this.open = !1), clearTimeout(this.heartbeatTimeoutTimer);
                  }),
                  (r.prototype.onPacket = function (e) {
                    this.of(e.endpoint).onPacket(e);
                  }),
                  (r.prototype.onError = function (e) {
                    e && e.advice && 'reconnect' === e.advice && (this.connected || this.connecting) && (this.disconnect(), this.options.reconnect && this.reconnect()),
                      this.publish('error', e && e.reason ? e.reason : e);
                  }),
                  (r.prototype.onDisconnect = function (e) {
                    var t = this.connected,
                      n = this.connecting;
                    (this.connected = !1),
                      (this.connecting = !1),
                      (this.open = !1),
                      (t || n) &&
                        (this.transport.close(),
                        this.transport.clearTimeouts(),
                        t && (this.publish('disconnect', e), 'booted' != e && this.options.reconnect && !this.reconnecting && this.reconnect()),
                        n && (this.connectTimeoutTimer && clearTimeout(this.connectTimeoutTimer), this.tryNextTransport()));
                  }),
                  (r.prototype.reconnect = function () {
                    (this.reconnecting = !0), (this.reconnectionAttempts = 0), (this.reconnectionDelay = this.options['reconnection delay']);
                    var e = this,
                      t = this.options['max reconnection attempts'],
                      n = this.options['try multiple transports'],
                      r = this.options['reconnection limit'];
                    function o() {
                      if (e.connected) {
                        for (var t in e.namespaces) e.namespaces.hasOwnProperty(t) && '' !== t && e.namespaces[t].packet({ type: 'connect' });
                        e.publish('reconnect', e.transport.name, e.reconnectionAttempts);
                      }
                      clearTimeout(e.reconnectionTimer),
                        e.removeListener('connect_failed', i),
                        e.removeListener('connect', i),
                        (e.reconnecting = !1),
                        delete e.reconnectionAttempts,
                        delete e.reconnectionDelay,
                        delete e.reconnectionTimer,
                        delete e.redoTransports,
                        (e.options['try multiple transports'] = n);
                    }
                    function i() {
                      if (e.reconnecting)
                        return e.connected
                          ? o()
                          : e.connecting && e.reconnecting
                          ? (e.reconnectionTimer = setTimeout(i, 1e3))
                          : void (e.reconnectionAttempts++ >= t
                              ? e.redoTransports
                                ? (e.publish('reconnect_failed'), o())
                                : (e.on('connect_failed', i),
                                  (e.options['try multiple transports'] = !0),
                                  (e.transports = e.origTransports),
                                  (e.transport = e.getTransport()),
                                  (e.redoTransports = !0),
                                  e.connect())
                              : (e.reconnectionDelay < r && (e.reconnectionDelay *= 2),
                                e.connect(),
                                e.publish('reconnecting', e.reconnectionDelay, e.reconnectionAttempts),
                                (e.reconnectionTimer = setTimeout(i, e.reconnectionDelay))));
                    }
                    (this.options['try multiple transports'] = !1), (this.reconnectionTimer = setTimeout(i, this.reconnectionDelay)), this.on('connect', i);
                  });
              })(void 0 !== io ? io : module.exports, void 0 !== io ? io : module.parent.exports, root),
              (function (e, t) {
                function n(e, t) {
                  (this.socket = e), (this.name = t || ''), (this.flags = {}), (this.json = new r(this, 'json')), (this.ackPackets = 0), (this.acks = {});
                }
                function r(e, t) {
                  (this.namespace = e), (this.name = t);
                }
                (e.SocketNamespace = n),
                  t.util.mixin(n, t.EventEmitter),
                  (n.prototype.$emit = t.EventEmitter.prototype.emit),
                  (n.prototype.of = function () {
                    return this.socket.of.apply(this.socket, arguments);
                  }),
                  (n.prototype.packet = function (e) {
                    return (e.endpoint = this.name), this.socket.packet(e), (this.flags = {}), this;
                  }),
                  (n.prototype.send = function (e, t) {
                    var n = { type: this.flags.json ? 'json' : 'message', data: e };
                    return 'function' == typeof t && ((n.id = ++this.ackPackets), (n.ack = !0), (this.acks[n.id] = t)), this.packet(n);
                  }),
                  (n.prototype.emit = function (e) {
                    var t = Array.prototype.slice.call(arguments, 1),
                      n = t[t.length - 1],
                      r = { type: 'event', name: e };
                    return (
                      'function' == typeof n && ((r.id = ++this.ackPackets), (r.ack = 'data'), (this.acks[r.id] = n), (t = t.slice(0, t.length - 1))),
                      (r.args = t),
                      this.packet(r)
                    );
                  }),
                  (n.prototype.disconnect = function () {
                    return '' === this.name ? this.socket.disconnect() : (this.packet({ type: 'disconnect' }), this.$emit('disconnect')), this;
                  }),
                  (n.prototype.onPacket = function (e) {
                    var n = this;
                    function r() {
                      n.packet({ type: 'ack', args: t.util.toArray(arguments), ackId: e.id });
                    }
                    switch (e.type) {
                      case 'connect':
                        this.$emit('connect');
                        break;
                      case 'disconnect':
                        '' === this.name ? this.socket.onDisconnect(e.reason || 'booted') : this.$emit('disconnect', e.reason);
                        break;
                      case 'message':
                      case 'json':
                        var o = ['message', e.data];
                        'data' == e.ack ? o.push(r) : e.ack && this.packet({ type: 'ack', ackId: e.id }), this.$emit.apply(this, o);
                        break;
                      case 'event':
                        o = [e.name].concat(e.args);
                        'data' == e.ack && o.push(r), this.$emit.apply(this, o);
                        break;
                      case 'ack':
                        this.acks[e.ackId] && (this.acks[e.ackId].apply(this, e.args), delete this.acks[e.ackId]);
                        break;
                      case 'error':
                        console.error('SocketIO on packet error: ', e),
                          e.advice ? this.socket.onError(e) : 'unauthorized' === e.reason ? this.$emit('connect_failed', e.reason) : this.$emit('error', e.reason);
                    }
                  }),
                  (r.prototype.send = function () {
                    (this.namespace.flags[this.name] = !0), this.namespace.send.apply(this.namespace, arguments);
                  }),
                  (r.prototype.emit = function () {
                    (this.namespace.flags[this.name] = !0), this.namespace.emit.apply(this.namespace, arguments);
                  });
              })(void 0 !== io ? io : module.exports, void 0 !== io ? io : module.parent.exports),
              (function (e, t, n) {
                function r(e) {
                  t.Transport.apply(this, arguments);
                }
                (e.websocket = r),
                  t.util.inherit(r, t.Transport),
                  (r.prototype.name = 'websocket'),
                  (r.prototype.open = function () {
                    var e,
                      r = t.util.query(this.socket.options.query),
                      o = this;
                    return (
                      e || (e = n.MozWebSocket || n.WebSocket),
                      (this.websocket = new e(this.prepareUrl() + r)),
                      (this.websocket.onopen = function () {
                        o.onOpen(), o.socket.setBuffer(!1);
                      }),
                      (this.websocket.onmessage = function (e) {
                        o.onData(e.data);
                      }),
                      (this.websocket.onclose = function () {
                        o.socket.setBuffer(!0), o.onClose();
                      }),
                      (this.websocket.onerror = function (e) {
                        o.onError(e);
                      }),
                      this
                    );
                  }),
                  t.util.ua.iDevice
                    ? (r.prototype.send = function (e) {
                        var t = this;
                        return (
                          setTimeout(function () {
                            t.websocket.send(e);
                          }, 0),
                          this
                        );
                      })
                    : (r.prototype.send = function (e) {
                        return this.websocket.send(e), this;
                      }),
                  (r.prototype.payload = function (e) {
                    for (var t = 0, n = e.length; t < n; t++) this.packet(e[t]);
                    return this;
                  }),
                  (r.prototype.close = function () {
                    return this.websocket.close(), this;
                  }),
                  (r.prototype.onError = function (e) {
                    this.socket.onError(e);
                  }),
                  (r.prototype.scheme = function () {
                    return this.socket.options.secure ? 'wss' : 'ws';
                  }),
                  (r.check = function () {
                    return ('WebSocket' in n && !('__addTask' in WebSocket)) || 'MozWebSocket' in n;
                  }),
                  (r.xdomainCheck = function () {
                    return !0;
                  }),
                  t.transports.push('websocket');
              })(void 0 !== io ? io.Transport : module.exports, void 0 !== io ? io : module.parent.exports, root),
              (function (e, t, n) {
                function r(e) {
                  e && (t.Transport.apply(this, arguments), (this.sendBuffer = []));
                }
                function o() {}
                (e.XHR = r),
                  t.util.inherit(r, t.Transport),
                  (r.prototype.open = function () {
                    return this.socket.setBuffer(!1), this.onOpen(), this.get(), this.setCloseTimeout(), this;
                  }),
                  (r.prototype.payload = function (e) {
                    for (var n = [], r = 0, o = e.length; r < o; r++) n.push(t.parser.encodePacket(e[r]));
                    this.send(t.parser.encodePayload(n));
                  }),
                  (r.prototype.send = function (e) {
                    return this.post(e), this;
                  }),
                  (r.prototype.post = function (e) {
                    var t = this;
                    this.socket.setBuffer(!0),
                      (this.sendXHR = this.request('POST')),
                      n.XDomainRequest && this.sendXHR instanceof XDomainRequest
                        ? (this.sendXHR.onload = this.sendXHR.onerror =
                            function () {
                              (this.onload = o), t.socket.setBuffer(!1);
                            })
                        : (this.sendXHR.onreadystatechange = function () {
                            4 == this.readyState && ((this.onreadystatechange = o), (t.posting = !1), 200 == this.status ? t.socket.setBuffer(!1) : t.onClose());
                          }),
                      this.sendXHR.send(e);
                  }),
                  (r.prototype.close = function () {
                    return this.onClose(), this;
                  }),
                  (r.prototype.request = function (e) {
                    var n = t.util.request(this.socket.isXDomain()),
                      r = t.util.query(this.socket.options.query, 't=' + +new Date());
                    if ((n.open(e || 'GET', this.prepareUrl() + r, !0), 'POST' == e))
                      try {
                        n.setRequestHeader ? n.setRequestHeader('Content-type', 'text/plain;charset=UTF-8') : (n.contentType = 'text/plain');
                      } catch (e) {}
                    return n;
                  }),
                  (r.prototype.scheme = function () {
                    return this.socket.options.secure ? 'https' : 'http';
                  }),
                  (r.check = function (e, r) {
                    try {
                      var o = t.util.request(r),
                        i = n.XDomainRequest && o instanceof XDomainRequest,
                        s = e && e.options && e.options.secure ? 'https:' : 'http:',
                        a = n.location && s != n.location.protocol;
                      if (o && (!i || !a)) return !0;
                    } catch (e) {}
                    return !1;
                  }),
                  (r.xdomainCheck = function (e) {
                    return r.check(e, !0);
                  });
              })(void 0 !== io ? io.Transport : module.exports, void 0 !== io ? io : module.parent.exports, root),
              (function (e, t, n) {
                function r() {
                  t.Transport.XHR.apply(this, arguments);
                }
                function o() {}
                (e['xhr-polling'] = r),
                  t.util.inherit(r, t.Transport.XHR),
                  t.util.merge(r, t.Transport.XHR),
                  (r.prototype.name = 'xhr-polling'),
                  (r.prototype.heartbeats = function () {
                    return !1;
                  }),
                  (r.prototype.open = function () {
                    return t.Transport.XHR.prototype.open.call(this), !1;
                  }),
                  (r.prototype.get = function () {
                    if (this.isOpen) {
                      var e = this;
                      (this.xhr = this.request()),
                        n.XDomainRequest && this.xhr instanceof XDomainRequest
                          ? ((this.xhr.onload = function () {
                              (this.onload = o), (this.onerror = o), (e.retryCounter = 1), e.onData(this.responseText), e.get();
                            }),
                            (this.xhr.onerror = function () {
                              e.retryCounter++, !e.retryCounter || e.retryCounter > 3 ? e.onClose() : e.get();
                            }))
                          : (this.xhr.onreadystatechange = function () {
                              4 == this.readyState && ((this.onreadystatechange = o), 200 == this.status ? (e.onData(this.responseText), e.get()) : e.onClose());
                            }),
                        this.xhr.send(null);
                    }
                  }),
                  (r.prototype.onClose = function () {
                    if ((t.Transport.XHR.prototype.onClose.call(this), this.xhr)) {
                      this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = o;
                      try {
                        this.xhr.abort();
                      } catch (e) {}
                      this.xhr = null;
                    }
                  }),
                  (r.prototype.ready = function (e, n) {
                    var r = this;
                    t.util.defer(function () {
                      n.call(r);
                    });
                  }),
                  t.transports.push('xhr-polling');
              })(void 0 !== io ? io.Transport : module.exports, void 0 !== io ? io : module.parent.exports, root),
              (__WEBPACK_AMD_DEFINE_ARRAY__ = []),
              (__WEBPACK_AMD_DEFINE_RESULT__ = function () {
                return io;
              }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)),
              void 0 === __WEBPACK_AMD_DEFINE_RESULT__ || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
          })();
      }).call(this, __webpack_require__(20), __webpack_require__(177)(module));
    },
    function (e, t, n) {
      'use strict';
      var r = n(9);
      function o() {}
      o.typeMap = { text: 0, image: 1, audio: 2, video: 3, geo: 4, notification: 5, file: 6, tip: 10, robot: 11, g2: 12, custom: 100 };
      var i = (o.typeReverseMap = {
        0: 'text',
        1: 'image',
        2: 'audio',
        3: 'video',
        4: 'geo',
        5: 'notification',
        6: 'file',
        10: 'tip',
        11: 'robot',
        12: 'g2',
        100: 'custom',
      });
      (o.validTypes = Object.keys(o.typeMap)),
        (o.setFlow = function (e, t) {
          var n = t === e.from;
          n && t === e.to && (n = r.deviceId === e.fromDeviceId), (e.flow = n ? 'out' : 'in'), 'robot' === e.type && e.content && e.content.msgOut && (e.flow = 'in');
        }),
        (o.getType = function (e) {
          var t = e.type;
          return i[t] || t;
        }),
        (e.exports = o);
    },
    function (e, t, n) {
      'use strict';
      var r = n(202),
        o = 'function' == typeof Symbol && 'symbol' == typeof Symbol('foo'),
        i = Object.prototype.toString,
        s = Array.prototype.concat,
        a = Object.defineProperty,
        c =
          a &&
          (function () {
            var e = {};
            try {
              for (var t in (a(e, 'x', { enumerable: !1, value: e }), e)) return !1;
              return e.x === e;
            } catch (e) {
              return !1;
            }
          })(),
        u = function (e, t, n, r) {
          var o;
          (t in e && ('function' != typeof (o = r) || '[object Function]' !== i.call(o) || !r())) ||
            (c ? a(e, t, { configurable: !0, enumerable: !1, value: n, writable: !0 }) : (e[t] = n));
        },
        l = function (e, t) {
          var n = arguments.length > 2 ? arguments[2] : {},
            i = r(t);
          o && (i = s.call(i, Object.getOwnPropertySymbols(t)));
          for (var a = 0; a < i.length; a += 1) u(e, i[a], t[i[a]], n[i[a]]);
        };
      (l.supportsDescriptors = !!c), (e.exports = l);
    },
    function (e, t, n) {
      'use strict';
      var r = Object.prototype.toString;
      e.exports = function (e) {
        var t = r.call(e),
          n = '[object Arguments]' === t;
        return (
          n ||
            (n =
              '[object Array]' !== t && null !== e && 'object' == typeof e && 'number' == typeof e.length && e.length >= 0 && '[object Function]' === r.call(e.callee)),
          n
        );
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(64),
        o = n(204),
        i = r.call(Function.call, String.prototype.replace),
        s = /^[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+/,
        a = /[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+$/;
      e.exports = function () {
        var e = o.ToString(o.CheckObjectCoercible(this));
        return i(i(e, s, ''), a, '');
      };
    },
    function (e, t, n) {
      'use strict';
      var r = Object.getOwnPropertyDescriptor
          ? (function () {
              return Object.getOwnPropertyDescriptor(arguments, 'callee').get;
            })()
          : function () {
              throw new TypeError();
            },
        o = 'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator,
        i =
          Object.getPrototypeOf ||
          function (e) {
            return e.__proto__;
          },
        s = void 0,
        a = 'undefined' == typeof Uint8Array ? void 0 : i(Uint8Array),
        c = {
          '$ %Array%': Array,
          '$ %ArrayBuffer%': 'undefined' == typeof ArrayBuffer ? void 0 : ArrayBuffer,
          '$ %ArrayBufferPrototype%': 'undefined' == typeof ArrayBuffer ? void 0 : ArrayBuffer.prototype,
          '$ %ArrayIteratorPrototype%': o ? i([][Symbol.iterator]()) : void 0,
          '$ %ArrayPrototype%': Array.prototype,
          '$ %ArrayProto_entries%': Array.prototype.entries,
          '$ %ArrayProto_forEach%': Array.prototype.forEach,
          '$ %ArrayProto_keys%': Array.prototype.keys,
          '$ %ArrayProto_values%': Array.prototype.values,
          '$ %AsyncFromSyncIteratorPrototype%': void 0,
          '$ %AsyncFunction%': void 0,
          '$ %AsyncFunctionPrototype%': void 0,
          '$ %AsyncGenerator%': void 0,
          '$ %AsyncGeneratorFunction%': void 0,
          '$ %AsyncGeneratorPrototype%': void 0,
          '$ %AsyncIteratorPrototype%': s && o && Symbol.asyncIterator ? s[Symbol.asyncIterator]() : void 0,
          '$ %Atomics%': 'undefined' == typeof Atomics ? void 0 : Atomics,
          '$ %Boolean%': Boolean,
          '$ %BooleanPrototype%': Boolean.prototype,
          '$ %DataView%': 'undefined' == typeof DataView ? void 0 : DataView,
          '$ %DataViewPrototype%': 'undefined' == typeof DataView ? void 0 : DataView.prototype,
          '$ %Date%': Date,
          '$ %DatePrototype%': Date.prototype,
          '$ %decodeURI%': decodeURI,
          '$ %decodeURIComponent%': decodeURIComponent,
          '$ %encodeURI%': encodeURI,
          '$ %encodeURIComponent%': encodeURIComponent,
          '$ %Error%': Error,
          '$ %ErrorPrototype%': Error.prototype,
          '$ %eval%': eval,
          '$ %EvalError%': EvalError,
          '$ %EvalErrorPrototype%': EvalError.prototype,
          '$ %Float32Array%': 'undefined' == typeof Float32Array ? void 0 : Float32Array,
          '$ %Float32ArrayPrototype%': 'undefined' == typeof Float32Array ? void 0 : Float32Array.prototype,
          '$ %Float64Array%': 'undefined' == typeof Float64Array ? void 0 : Float64Array,
          '$ %Float64ArrayPrototype%': 'undefined' == typeof Float64Array ? void 0 : Float64Array.prototype,
          '$ %Function%': Function,
          '$ %FunctionPrototype%': Function.prototype,
          '$ %Generator%': void 0,
          '$ %GeneratorFunction%': void 0,
          '$ %GeneratorPrototype%': void 0,
          '$ %Int8Array%': 'undefined' == typeof Int8Array ? void 0 : Int8Array,
          '$ %Int8ArrayPrototype%': 'undefined' == typeof Int8Array ? void 0 : Int8Array.prototype,
          '$ %Int16Array%': 'undefined' == typeof Int16Array ? void 0 : Int16Array,
          '$ %Int16ArrayPrototype%': 'undefined' == typeof Int16Array ? void 0 : Int8Array.prototype,
          '$ %Int32Array%': 'undefined' == typeof Int32Array ? void 0 : Int32Array,
          '$ %Int32ArrayPrototype%': 'undefined' == typeof Int32Array ? void 0 : Int32Array.prototype,
          '$ %isFinite%': isFinite,
          '$ %isNaN%': isNaN,
          '$ %IteratorPrototype%': o ? i(i([][Symbol.iterator]())) : void 0,
          '$ %JSON%': JSON,
          '$ %JSONParse%': JSON.parse,
          '$ %Map%': 'undefined' == typeof Map ? void 0 : Map,
          '$ %MapIteratorPrototype%': 'undefined' != typeof Map && o ? i(new Map()[Symbol.iterator]()) : void 0,
          '$ %MapPrototype%': 'undefined' == typeof Map ? void 0 : Map.prototype,
          '$ %Math%': Math,
          '$ %Number%': Number,
          '$ %NumberPrototype%': Number.prototype,
          '$ %Object%': Object,
          '$ %ObjectPrototype%': Object.prototype,
          '$ %ObjProto_toString%': Object.prototype.toString,
          '$ %ObjProto_valueOf%': Object.prototype.valueOf,
          '$ %parseFloat%': parseFloat,
          '$ %parseInt%': parseInt,
          '$ %Promise%': 'undefined' == typeof Promise ? void 0 : Promise,
          '$ %PromisePrototype%': 'undefined' == typeof Promise ? void 0 : Promise.prototype,
          '$ %PromiseProto_then%': 'undefined' == typeof Promise ? void 0 : Promise.prototype.then,
          '$ %Promise_all%': 'undefined' == typeof Promise ? void 0 : Promise.all,
          '$ %Promise_reject%': 'undefined' == typeof Promise ? void 0 : Promise.reject,
          '$ %Promise_resolve%': 'undefined' == typeof Promise ? void 0 : Promise.resolve,
          '$ %Proxy%': 'undefined' == typeof Proxy ? void 0 : Proxy,
          '$ %RangeError%': RangeError,
          '$ %RangeErrorPrototype%': RangeError.prototype,
          '$ %ReferenceError%': ReferenceError,
          '$ %ReferenceErrorPrototype%': ReferenceError.prototype,
          '$ %Reflect%': 'undefined' == typeof Reflect ? void 0 : Reflect,
          '$ %RegExp%': RegExp,
          '$ %RegExpPrototype%': RegExp.prototype,
          '$ %Set%': 'undefined' == typeof Set ? void 0 : Set,
          '$ %SetIteratorPrototype%': 'undefined' != typeof Set && o ? i(new Set()[Symbol.iterator]()) : void 0,
          '$ %SetPrototype%': 'undefined' == typeof Set ? void 0 : Set.prototype,
          '$ %SharedArrayBuffer%': 'undefined' == typeof SharedArrayBuffer ? void 0 : SharedArrayBuffer,
          '$ %SharedArrayBufferPrototype%': 'undefined' == typeof SharedArrayBuffer ? void 0 : SharedArrayBuffer.prototype,
          '$ %String%': String,
          '$ %StringIteratorPrototype%': o ? i(''[Symbol.iterator]()) : void 0,
          '$ %StringPrototype%': String.prototype,
          '$ %Symbol%': o ? Symbol : void 0,
          '$ %SymbolPrototype%': o ? Symbol.prototype : void 0,
          '$ %SyntaxError%': SyntaxError,
          '$ %SyntaxErrorPrototype%': SyntaxError.prototype,
          '$ %ThrowTypeError%': r,
          '$ %TypedArray%': a,
          '$ %TypedArrayPrototype%': a ? a.prototype : void 0,
          '$ %TypeError%': TypeError,
          '$ %TypeErrorPrototype%': TypeError.prototype,
          '$ %Uint8Array%': 'undefined' == typeof Uint8Array ? void 0 : Uint8Array,
          '$ %Uint8ArrayPrototype%': 'undefined' == typeof Uint8Array ? void 0 : Uint8Array.prototype,
          '$ %Uint8ClampedArray%': 'undefined' == typeof Uint8ClampedArray ? void 0 : Uint8ClampedArray,
          '$ %Uint8ClampedArrayPrototype%': 'undefined' == typeof Uint8ClampedArray ? void 0 : Uint8ClampedArray.prototype,
          '$ %Uint16Array%': 'undefined' == typeof Uint16Array ? void 0 : Uint16Array,
          '$ %Uint16ArrayPrototype%': 'undefined' == typeof Uint16Array ? void 0 : Uint16Array.prototype,
          '$ %Uint32Array%': 'undefined' == typeof Uint32Array ? void 0 : Uint32Array,
          '$ %Uint32ArrayPrototype%': 'undefined' == typeof Uint32Array ? void 0 : Uint32Array.prototype,
          '$ %URIError%': URIError,
          '$ %URIErrorPrototype%': URIError.prototype,
          '$ %WeakMap%': 'undefined' == typeof WeakMap ? void 0 : WeakMap,
          '$ %WeakMapPrototype%': 'undefined' == typeof WeakMap ? void 0 : WeakMap.prototype,
          '$ %WeakSet%': 'undefined' == typeof WeakSet ? void 0 : WeakSet,
          '$ %WeakSetPrototype%': 'undefined' == typeof WeakSet ? void 0 : WeakSet.prototype,
        };
      e.exports = function (e, t) {
        if (arguments.length > 1 && 'boolean' != typeof t) throw new TypeError('"allowMissing" argument must be a boolean');
        var n = '$ ' + e;
        if (!(n in c)) throw new SyntaxError('intrinsic ' + e + ' does not exist!');
        if (void 0 === c[n] && !t) throw new TypeError('intrinsic ' + e + ' exists, but is not available. Please file an issue!');
        return c[n];
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(64);
      e.exports = r.call(Function.call, Object.prototype.hasOwnProperty);
    },
    function (e, t, n) {
      'use strict';
      var r = n(96);
      e.exports = function () {
        return String.prototype.trim && '​' === '​'.trim() ? String.prototype.trim : r;
      };
    },
    function (e, t, n) {
      'use strict';
      n(115).polyfill(), (n(1).isBrowser = !0);
    },
    function (e, t, n) {
      var r = n(7).document;
      e.exports = r && r.documentElement;
    },
    function (e, t) {},
    function (e, t, n) {
      var r = n(12);
      e.exports = function (e, t, n, o) {
        try {
          return o ? t(r(n)[0], n[1]) : t(n);
        } catch (t) {
          var i = e.return;
          throw (void 0 !== i && r(i.call(e)), t);
        }
      };
    },
    function (e, t, n) {
      var r = n(28),
        o = n(4)('iterator'),
        i = Array.prototype;
      e.exports = function (e) {
        return void 0 !== e && (r.Array === e || i[o] === e);
      };
    },
    function (e, t, n) {
      var r = n(4)('iterator'),
        o = !1;
      try {
        var i = [7][r]();
        (i.return = function () {
          o = !0;
        }),
          Array.from(i, function () {
            throw 2;
          });
      } catch (e) {}
      e.exports = function (e, t) {
        if (!t && !o) return !1;
        var n = !1;
        try {
          var i = [7],
            s = i[r]();
          (s.next = function () {
            return { done: (n = !0) };
          }),
            (i[r] = function () {
              return s;
            }),
            e(i);
        } catch (e) {}
        return n;
      };
    },
    function (e, t, n) {
      'use strict';
      (function (r) {
        var o,
          i,
          s = n(2),
          a = (i = s) && i.__esModule ? i : { default: i };
        !(function (i, s) {
          var c,
            u = (i = void 0 !== i ? i : 'undefined' != typeof self ? self : void 0 !== r ? r : {}).IDBKeyRange || i.webkitIDBKeyRange,
            l = 'readonly',
            p = 'readwrite',
            m = Object.prototype.hasOwnProperty,
            d = function () {
              if (
                !c &&
                !(c =
                  i.indexedDB || i.webkitIndexedDB || i.mozIndexedDB || i.oIndexedDB || i.msIndexedDB || (null === i.indexedDB && i.shimIndexedDB ? i.shimIndexedDB : s))
              )
                throw 'IndexedDB required';
              return c;
            },
            f = function (e) {
              return e;
            },
            y = function (e) {
              return Object.prototype.toString.call(e).slice(8, -1).toLowerCase();
            },
            g = function (e) {
              return 'function' == typeof e;
            },
            h = function (e) {
              return e === s;
            },
            v = function (e, t) {
              var n = this,
                r = !1;
              (this.name = t),
                (this.getIndexedDB = function () {
                  return e;
                }),
                (this.add = function (t) {
                  if (r) throw 'Database has been closed';
                  for (var o = [], i = 0, s = 0; s < arguments.length - 1; s++)
                    if (Array.isArray(arguments[s + 1])) for (var a = 0; a < arguments[s + 1].length; a++) (o[i] = arguments[s + 1][a]), i++;
                    else (o[i] = arguments[s + 1]), i++;
                  var c = e.transaction(t, p),
                    u = c.objectStore(t);
                  return new Promise(function (e, t) {
                    o.forEach(function (e) {
                      var t;
                      if (e.item && e.key) {
                        var n = e.key;
                        (e = e.item), (t = u.add(e, n));
                      } else t = u.add(e);
                      t.onsuccess = function (t) {
                        var n = t.target,
                          r = n.source.keyPath;
                        null === r && (r = '__id__'), Object.defineProperty(e, r, { value: n.result, enumerable: !0 });
                      };
                    }),
                      (c.oncomplete = function () {
                        e(o, n);
                      }),
                      (c.onerror = function (e) {
                        e.preventDefault(), t(e);
                      }),
                      (c.onabort = function (e) {
                        t(e);
                      });
                  });
                }),
                (this.updateAndDelete = function (t, n, o) {
                  if (r) throw 'Database has been closed';
                  var i = e.transaction(t, p),
                    s = i.objectStore(t),
                    a = s.keyPath;
                  return new Promise(function (e, t) {
                    n.forEach(function (e) {
                      if (e.item && e.key) {
                        var t = e.key;
                        (e = e.item), s.put(e, t);
                      } else s.put(e);
                    }),
                      o.forEach(function (e) {
                        s.delete(e[a]);
                      }),
                      (i.oncomplete = function () {
                        e([n, o]);
                      }),
                      (i.onerror = function (e) {
                        t(e);
                      });
                  });
                }),
                (this.update = function (t) {
                  if (r) throw 'Database has been closed';
                  for (var o, i = [], s = 1; s < arguments.length; s++) (o = arguments[s]), Array.isArray(o) ? (i = i.concat(o)) : i.push(o);
                  var a = e.transaction(t, p),
                    c = a.objectStore(t);
                  c.keyPath;
                  return new Promise(function (e, t) {
                    i.forEach(function (e) {
                      var t;
                      if (e.item && e.key) {
                        var n = e.key;
                        (e = e.item), (t = c.put(e, n));
                      } else t = c.put(e);
                      (t.onsuccess = function (e) {}), (t.onerror = function (e) {});
                    }),
                      (a.oncomplete = function () {
                        e(i, n);
                      }),
                      (a.onerror = function (e) {
                        t(e);
                      }),
                      (a.onabort = function (e) {
                        t(e);
                      });
                  });
                }),
                (this.remove = function (t, n, o, i, a, c, l) {
                  if (r) throw 'Database has been closed';
                  var m = e.transaction(t, p),
                    d = m.objectStore(t);
                  return new Promise(function (e, t) {
                    function r(e) {
                      return e === s || null === e;
                    }
                    if ((r(i) && (i = -1 / 0), r(a) && (a = 1 / 0), null === n || Array.isArray(n) || (n = [n]), r(o)))
                      null !== n
                        ? n.forEach(function (e) {
                            d.delete(e);
                          })
                        : d.delete((range = u.bound(i, a, c, l)));
                    else {
                      var p = void 0;
                      (p = null !== n ? u.only(n[0]) : u.bound(i, a, c, l)),
                        (d.index(o).openCursor(p).onsuccess = function (e) {
                          var t = e.target.result;
                          t && (t.delete(), t.continue());
                        });
                    }
                    (m.oncomplete = function () {
                      e();
                    }),
                      (m.onerror = function (e) {
                        t(e);
                      }),
                      (m.onabort = function (e) {
                        t(e);
                      });
                  });
                }),
                (this.clear = function (t) {
                  if (r) throw 'Database has been closed';
                  var n = e.transaction(t, p);
                  n.objectStore(t).clear();
                  return new Promise(function (e, t) {
                    (n.oncomplete = function () {
                      e();
                    }),
                      (n.onerror = function (e) {
                        t(e);
                      });
                  });
                }),
                (this.close = function () {
                  r || (e.close(), (r = !0), delete S[t]);
                }),
                (this.get = function (t, n) {
                  if (r) throw 'Database has been closed';
                  var o = e.transaction(t),
                    i = o.objectStore(t).get(n);
                  return new Promise(function (e, t) {
                    (i.onsuccess = function (t) {
                      e(t.target.result);
                    }),
                      (o.onerror = function (e) {
                        t(e);
                      });
                  });
                }),
                (this.query = function (t, n) {
                  if (r) throw 'Database has been closed';
                  return new b(t, e, n);
                }),
                (this.count = function (t, n) {
                  if (r) throw 'Database has been closed';
                  e.transaction(t).objectStore(t);
                });
              for (var o = 0, i = e.objectStoreNames.length; o < i; o++)
                !(function (e) {
                  for (var t in ((n[e] = {}), n))
                    m.call(n, t) &&
                      'close' !== t &&
                      (n[e][t] = (function (t) {
                        return function () {
                          var r = [e].concat([].slice.call(arguments, 0));
                          return n[t].apply(n, r);
                        };
                      })(t));
                })(e.objectStoreNames[o]);
            },
            b = function (e, t, n) {
              var r = this,
                o = !1,
                i = !1,
                c = function (r, c, m, d, f, y, h) {
                  return new Promise(function (v, b) {
                    var T = o || i ? p : l,
                      S = t.transaction(e, T),
                      k = S.objectStore(e),
                      M = n ? k.index(n) : k,
                      x = r ? u[r].apply(null, c) : null,
                      _ = [],
                      w = [x],
                      C = 0;
                    (f = f || null), (y = y || []), 'count' !== m && w.push(d || 'next');
                    var P = !!o && Object.keys(o);
                    (M[m].apply(M, w).onsuccess = function (e) {
                      var t = e.target.result;
                      if ((void 0 === t ? 'undefined' : (0, a.default)(t)) === (0, a.default)(0)) _ = t;
                      else if (t)
                        if (null !== f && f[0] > C) (C = f[0]), t.advance(f[0]);
                        else if (null !== f && C >= f[0] + f[1]);
                        else {
                          var n = !0,
                            r = 'value' in t ? t.value : t.key;
                          y.forEach(function (e) {
                            e && e.length && (2 === e.length ? (n = n && r[e[0]] === e[1]) : g(e[0]) && (n = n && e[0].apply(s, [r])));
                          }),
                            n &&
                              (C++,
                              _.push(h(r)),
                              i
                                ? t.delete()
                                : o &&
                                  ((r = (function (e) {
                                    for (var t = 0; t < P.length; t++) {
                                      var n = P[t],
                                        r = o[n];
                                      r instanceof Function && (r = r(e)), (e[n] = r);
                                    }
                                    return e;
                                  })(r)),
                                  t.update(r))),
                            t.continue();
                        }
                    }),
                      (S.oncomplete = function () {
                        v(_);
                      }),
                      (S.onerror = function (e) {
                        b(e);
                      }),
                      (S.onabort = function (e) {
                        b(e);
                      });
                  });
                },
                m = function (e, t) {
                  var n = 'next',
                    r = 'openCursor',
                    s = [],
                    a = null,
                    u = f,
                    l = !1,
                    p = function () {
                      return c(e, t, r, l ? n + 'unique' : n, a, s, u);
                    },
                    m = function () {
                      return (n = null), (r = 'count'), { execute: p };
                    },
                    d = function e() {
                      var t;
                      return (
                        (t = arguments[0]),
                        1 == (a = 'array' === y(t) ? arguments[0] : Array.prototype.slice.call(arguments, 0, 2)).length && a.unshift(0),
                        (function (e) {
                          return 'number' === y(e);
                        })(a[1]) || (a = null),
                        { execute: p, count: m, keys: v, filter: b, asc: T, desc: S, distinct: k, modify: M, limit: e, map: x, remove: _ }
                      );
                    },
                    v = function e(t) {
                      return (
                        (t = !!h(t) || !!t) && (r = 'openKeyCursor'),
                        { execute: p, keys: e, filter: b, asc: T, desc: S, distinct: k, modify: M, limit: d, map: x, remove: _ }
                      );
                    },
                    b = function e() {
                      return (
                        s.push(Array.prototype.slice.call(arguments, 0, 2)),
                        { execute: p, count: m, keys: v, filter: e, asc: T, desc: S, distinct: k, modify: M, limit: d, map: x, remove: _ }
                      );
                    },
                    T = function e(t) {
                      return (
                        (t = !!h(t) || !!t),
                        (n = t ? 'next' : 'prev'),
                        { execute: p, count: m, keys: v, filter: b, asc: e, desc: S, distinct: k, modify: M, limit: d, map: x, remove: _ }
                      );
                    },
                    S = function e(t) {
                      return (
                        (t = !!h(t) || !!t),
                        (n = t ? 'prev' : 'next'),
                        { execute: p, count: m, keys: v, filter: b, asc: T, desc: e, distinct: k, modify: M, limit: d, map: x, remove: _ }
                      );
                    },
                    k = function e(t) {
                      return (
                        (t = !!h(t) || !!t), (l = t), { execute: p, count: m, keys: v, filter: b, asc: T, desc: S, distinct: e, modify: M, limit: d, map: x, remove: _ }
                      );
                    },
                    M = function e(t) {
                      return (o = t), { execute: p, count: m, keys: v, filter: b, asc: T, desc: S, distinct: k, modify: e, limit: d, map: x, remove: _ };
                    },
                    x = function e(t) {
                      return g(t) && (u = t), { execute: p, count: m, keys: v, filter: b, asc: T, desc: S, distinct: k, modify: M, limit: d, map: e, remove: _ };
                    },
                    _ = function e(t) {
                      return (
                        (t = !!h(t) || !!t), (i = t), { execute: p, count: m, keys: v, filter: b, asc: T, desc: S, distinct: k, modify: M, limit: d, map: x, remove: e }
                      );
                    };
                  return { execute: p, count: m, keys: v, filter: b, asc: T, desc: S, distinct: k, modify: M, limit: d, map: x, remove: _ };
                };
              'only bound upperBound lowerBound'.split(' ').forEach(function (e) {
                r[e] = function () {
                  return new m(e, arguments);
                };
              }),
                (this.filter = function () {
                  var e = new m(null, null);
                  return e.filter.apply(e, arguments);
                }),
                (this.all = function () {
                  return this.filter();
                });
            },
            T = function (e, t, n, r) {
              var o = e.target.result,
                i = new v(o, t);
              return (S[t] = o), Promise.resolve(i);
            },
            S = {},
            k = {
              version: '0.10.2',
              open: function (e) {
                var t;
                return new Promise(function (n, r) {
                  if (S[e.server]) T({ target: { result: S[e.server] } }, e.server, e.version, e.schema).then(n, r);
                  else {
                    try {
                      t = d().open(e.server, e.version);
                    } catch (e) {
                      r(e);
                    }
                    (t.onsuccess = function (t) {
                      T(t, e.server, e.version, e.schema).then(n, r);
                    }),
                      (t.onupgradeneeded = function (t) {
                        !(function (e, t, n) {
                          for (var r in ('function' == typeof t && (t = t()), t)) {
                            var o,
                              i = t[r];
                            for (var s in ((o =
                              !m.call(t, r) || n.objectStoreNames.contains(r) ? e.currentTarget.transaction.objectStore(r) : n.createObjectStore(r, i.key)),
                            i.indexes)) {
                              var a = i.indexes[s];
                              try {
                                o.index(s);
                              } catch (e) {
                                o.createIndex(s, a.key || s, Object.keys(a).length ? a : { unique: !1 });
                              }
                            }
                          }
                        })(t, e.schema, t.target.result);
                      }),
                      (t.onerror = function (e) {
                        r(e);
                      });
                  }
                });
              },
              remove: function (e) {
                return new Promise(function (t, n) {
                  if (!e) return t();
                  var r, o;
                  (void 0 === e ? 'undefined' : (0, a.default)(e)) === v && (e = e.name),
                    'string' == typeof e && (r = S[e]),
                    r && 'function' == typeof r.close && r.close();
                  try {
                    o = d().deleteDatabase(e);
                  } catch (e) {
                    n(e);
                  }
                  (o.onsuccess = function (n) {
                    delete S[e], t(e);
                  }),
                    (o.onerror = function (e) {
                      n(e);
                    }),
                    (o.onblocked = function (e) {
                      n(e);
                    });
                });
              },
            };
          void 0 !== e.exports
            ? (e.exports = k)
            : (o = function () {
                return k;
              }.call(t, n, t, e)) === s || (e.exports = o);
        })(void 0);
      }).call(this, n(20));
    },
    function (e, t, n) {
      'use strict';
      var r = {
        set: function (e, t, n) {
          (r[e] = t), n && (n.support = t);
        },
      };
      e.exports = r;
    },
    ,
    ,
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = n(60),
        i = r.merge({}, o.idMap, {
          auth: { id: 2, login: 3, kicked: 5, logout: 6, multiPortLogin: 7, kick: 8 },
          user: {
            id: 3,
            updatePushToken: 1,
            appBackground: 2,
            markInBlacklist: 3,
            getBlacklist: 4,
            markInMutelist: 5,
            getMutelist: 6,
            getRelations: 8,
            getUsers: 7,
            updateMyInfo: 10,
            updateDonnop: 15,
            syncMyInfo: 109,
            syncUpdateMyInfo: 110,
          },
          notify: {
            id: 4,
            markRead: 3,
            syncOfflineMsgs: 4,
            batchMarkRead: 5,
            syncOfflineSysMsgs: 6,
            syncOfflineNetcallMsgs: 8,
            syncRoamingMsgs: 9,
            syncMsgReceipts: 12,
            syncRobots: 15,
            syncBroadcastMsgs: 16,
            syncSuperTeamRoamingMsgs: 17,
            syncOfflineSuperTeamSysMsgs: 18,
            syncDeleteSuperTeamMsgOfflineRoaming: 19,
            syncDeleteMsgSelf: 21,
            syncSessionsWithMoreRoaming: 22,
            syncStickTopSessions: 23,
            syncSessionHistoryMsgsDelete: 24,
          },
          sync: { id: 5, sync: 1, syncTeamMembers: 2, syncSuperTeamMembers: 3 },
          msg: {
            id: 7,
            sendMsg: 1,
            msg: 2,
            sysMsg: 3,
            getHistoryMsgs: 6,
            sendCustomSysMsg: 7,
            searchHistoryMsgs: 8,
            deleteSessions: 9,
            getSessions: 10,
            syncSendMsg: 101,
            sendMsgReceipt: 11,
            msgReceipt: 12,
            deleteMsg: 13,
            msgDeleted: 14,
            markSessionAck: 16,
            markSessionAckBatch: 25,
            broadcastMsg: 17,
            clearServerHistoryMsgs: 18,
            getServerSessions: 19,
            getServerSession: 20,
            updateServerSession: 21,
            deleteServerSessions: 22,
            deleteMsgSelf: 23,
            deleteMsgSelfBatch: 24,
            msgFtsInServer: 26,
            msgFtsInServerByTiming: 27,
            onClearServerHistoryMsgs: 118,
            syncUpdateServerSession: 121,
            onDeleteMsgSelf: 123,
            onDeleteMsgSelfBatch: 124,
          },
          msgExtend: {
            id: 23,
            getThreadMsgs: 1,
            getMsgsByIdServer: 2,
            addQuickComment: 3,
            deleteQuickComment: 4,
            onQuickComment: 5,
            onDeleteQuickComment: 6,
            getQuickComments: 7,
            addCollect: 8,
            deleteCollects: 9,
            updateCollect: 10,
            getCollects: 11,
            addStickTopSession: 12,
            deleteStickTopSession: 13,
            updateStickTopSession: 14,
            addMsgPin: 15,
            updateMsgPin: 16,
            deleteMsgPin: 17,
            onAddMsgPin: 18,
            onUpdateMsgPin: 19,
            onDeleteMsgPin: 20,
            getMsgPins: 21,
            syncAddQuickComment: 103,
            syncDeleteQuickComment: 104,
            syncAddStickTopSession: 112,
            syncDeleteStickTopSession: 113,
            syncUpdateStickTopSession: 114,
            syncAddMsgPin: 115,
            syncUpdateMsgPin: 116,
            syncDeleteMsgPin: 117,
          },
          team: {
            id: 8,
            createTeam: 1,
            sendTeamMsg: 2,
            teamMsg: 3,
            teamMsgs: 4,
            addTeamMembers: 5,
            removeTeamMembers: 6,
            updateTeam: 7,
            leaveTeam: 8,
            getTeam: 9,
            getTeams: 10,
            getTeamMembers: 11,
            dismissTeam: 12,
            applyTeam: 13,
            passTeamApply: 14,
            rejectTeamApply: 15,
            addTeamManagers: 16,
            removeTeamManagers: 17,
            transferTeam: 18,
            updateInfoInTeam: 19,
            updateNickInTeam: 20,
            acceptTeamInvite: 21,
            rejectTeamInvite: 22,
            getTeamHistoryMsgs: 23,
            searchTeamHistoryMsgs: 24,
            updateMuteStateInTeam: 25,
            getMyTeamMembers: 26,
            getMutedTeamMembers: 27,
            sendTeamMsgReceipt: 28,
            getTeamMsgReads: 29,
            getTeamMsgReadAccounts: 30,
            notifyTeamMsgReads: 31,
            muteTeamAll: 32,
            getTeamMemberInvitorAccid: 33,
            getTeamsById: 34,
            syncMyTeamMembers: 126,
            syncTeams: 109,
            syncTeamMembers: 111,
            syncCreateTeam: 101,
            syncSendTeamMsg: 102,
            syncUpdateTeamMember: 119,
          },
          superTeam: {
            id: 21,
            sendSuperTeamMsg: 2,
            superTeamMsg: 3,
            addSuperTeamMembers: 5,
            removeSuperTeamMembers: 6,
            leaveSuperTeam: 7,
            updateSuperTeam: 8,
            getSuperTeam: 9,
            getSuperTeams: 12,
            updateInfoInSuperTeam: 10,
            getMySuperTeamMembers: 11,
            getSuperTeamMembers: 13,
            getSuperTeamHistoryMsgs: 14,
            getSuperTeamMembersByJoinTime: 15,
            sendSuperTeamCustomSysMsg: 16,
            deleteSuperTeamMsg: 17,
            superTeamMsgDelete: 18,
            superTeamCustomSysMsg: 19,
            applySuperTeam: 20,
            passSuperTeamApply: 21,
            rejectSuperTeamApply: 22,
            acceptSuperTeamInvite: 23,
            rejectSuperTeamInvite: 24,
            markSuperTeamSessionAck: 25,
            addSuperTeamManagers: 26,
            removeSuperTeamManagers: 27,
            updateSuperTeamMute: 28,
            updateSuperTeamMembersMute: 29,
            updateNickInSuperTeam: 30,
            transferSuperTeam: 31,
            markSuperTeamSessionsAck: 32,
            getSuperTeamMembersByAccounts: 33,
            getMutedSuperTeamMembers: 34,
            syncMySuperTeamMembers: 111,
            syncSuperTeams: 109,
            syncSuperTeamMembers: 113,
            syncCreateSuperTeam: 101,
            syncSendSuperTeamMsg: 102,
            syncUpdateSuperTeamMember: 110,
            syncDeleteSuperTeamMsg: 117,
          },
          friend: { id: 12, friendRequest: 1, syncFriendRequest: 101, deleteFriend: 2, syncDeleteFriend: 102, updateFriend: 3, syncUpdateFriend: 103, getFriends: 4 },
          chatroom: { id: 13, getChatroomAddress: 1 },
          filter: { id: 101, sendFilterMsg: 1, filterMsg: 2, filterSysMsg: 3, sendFilterCustomSysMsg: 7 },
          eventService: {
            id: 14,
            publishEvent: 1,
            pushEvent: 2,
            subscribeEvent: 3,
            unSubscribeEventsByAccounts: 4,
            unSubscribeEventsByType: 5,
            querySubscribeEventsByAccounts: 6,
            querySubscribeEventsByType: 7,
            pushEvents: 9,
          },
          proxyService: { id: 22, httpProxy: 1, onProxyMsg: 2 },
        }),
        s = r.merge({}, o.cmdConfig, {
          login: { sid: i.auth.id, cid: i.auth.login, params: [{ type: 'Property', name: 'login' }] },
          logout: { sid: i.auth.id, cid: i.auth.logout },
          kick: { sid: i.auth.id, cid: i.auth.kick, params: [{ type: 'StrArray', name: 'deviceIds' }] },
          updatePushToken: {
            sid: i.user.id,
            cid: i.user.updatePushToken,
            params: [
              { type: 'String', name: 'tokenName' },
              { type: 'String', name: 'token' },
              { type: 'int', name: 'pushkit' },
            ],
          },
          appBackground: {
            sid: i.user.id,
            cid: i.user.appBackground,
            params: [
              { type: 'bool', name: 'isBackground' },
              { type: 'Int', name: 'badge' },
            ],
          },
          markInBlacklist: {
            sid: i.user.id,
            cid: i.user.markInBlacklist,
            params: [
              { type: 'String', name: 'account' },
              { type: 'bool', name: 'isAdd' },
            ],
          },
          getBlacklist: { sid: i.user.id, cid: i.user.getBlacklist, params: [{ type: 'long', name: 'time' }] },
          markInMutelist: {
            sid: i.user.id,
            cid: i.user.markInMutelist,
            params: [
              { type: 'String', name: 'account' },
              { type: 'bool', name: 'isAdd' },
            ],
          },
          getMutelist: { sid: i.user.id, cid: i.user.getMutelist, params: [{ type: 'long', name: 'time' }] },
          getRelations: { sid: i.user.id, cid: i.user.getRelations, params: [{ type: 'long', name: 'timetag' }] },
          getUsers: { sid: i.user.id, cid: i.user.getUsers, params: [{ type: 'StrArray', name: 'accounts' }] },
          updateMyInfo: { sid: i.user.id, cid: i.user.updateMyInfo, params: [{ type: 'Property', name: 'user' }] },
          updateDonnop: { sid: i.user.id, cid: i.user.updateDonnop, params: [{ type: 'Property', name: 'donnop' }] },
          markRead: {
            sid: i.notify.id,
            cid: i.notify.markRead,
            params: [
              { type: 'long', name: 'id' },
              { type: 'ph', name: 'ph' },
            ],
          },
          batchMarkRead: {
            sid: i.notify.id,
            cid: i.notify.batchMarkRead,
            params: [
              { type: 'byte', name: 'sid' },
              { type: 'byte', name: 'cid' },
              { type: 'LongArray', name: 'ids' },
            ],
          },
          sync: { sid: i.sync.id, cid: i.sync.sync, params: [{ type: 'Property', name: 'sync' }] },
          syncTeamMembers: { sid: i.sync.id, cid: i.sync.syncTeamMembers, params: [{ type: 'LongLongMap', name: 'sync' }] },
          syncSuperTeamMembers: { sid: i.sync.id, cid: i.sync.syncSuperTeamMembers, params: [{ type: 'LongLongMap', name: 'sync' }] },
          sendMsg: { sid: i.msg.id, cid: i.msg.sendMsg, params: [{ type: 'Property', name: 'msg' }] },
          getHistoryMsgs: {
            sid: i.msg.id,
            cid: i.msg.getHistoryMsgs,
            params: [
              { type: 'String', name: 'to' },
              { type: 'long', name: 'beginTime' },
              { type: 'long', name: 'endTime' },
              { type: 'long', name: 'lastMsgId' },
              { type: 'int', name: 'limit' },
              { type: 'bool', name: 'reverse' },
              { type: 'LongArray', name: 'msgTypes' },
            ],
          },
          sendCustomSysMsg: { sid: i.msg.id, cid: i.msg.sendCustomSysMsg, params: [{ type: 'Property', name: 'sysMsg' }] },
          searchHistoryMsgs: {
            sid: i.msg.id,
            cid: i.msg.searchHistoryMsgs,
            params: [
              { type: 'String', name: 'to' },
              { type: 'long', name: 'beginTime' },
              { type: 'long', name: 'endTime' },
              { type: 'String', name: 'keyword' },
              { type: 'int', name: 'limit' },
              { type: 'bool', name: 'reverse' },
            ],
          },
          getSessions: { sid: i.msg.id, cid: i.msg.getSessions, params: [{ type: 'long', name: 'time' }] },
          deleteSessions: { sid: i.msg.id, cid: i.msg.deleteSessions, params: [{ type: 'StrArray', name: 'sessions' }] },
          sendMsgReceipt: { sid: i.msg.id, cid: i.msg.sendMsgReceipt, params: [{ type: 'Property', name: 'msgReceipt' }] },
          deleteMsg: { sid: i.msg.id, cid: i.msg.deleteMsg, params: [{ type: 'Property', name: 'sysMsg' }] },
          markSessionAck: {
            sid: i.msg.id,
            cid: i.msg.markSessionAck,
            params: [
              { type: 'byte', name: 'scene' },
              { type: 'String', name: 'to' },
              { type: 'long', name: 'timetag' },
            ],
          },
          markSessionAckBatch: { sid: i.msg.id, cid: i.msg.markSessionAckBatch, params: [{ type: 'PropertyArray', name: 'sessionAckTags', entity: 'sessionAckTag' }] },
          clearServerHistoryMsgs: { sid: i.msg.id, cid: i.msg.clearServerHistoryMsgs, params: [{ type: 'Property', name: 'clearMsgsParams' }] },
          clearServerHistoryMsgsWithSync: { sid: i.msg.id, cid: i.msg.clearServerHistoryMsgs, params: [{ type: 'Property', name: 'clearMsgsParamsWithSync' }] },
          msgFtsInServer: { sid: i.msg.id, cid: i.msg.msgFtsInServer, params: [{ type: 'Property', name: 'msgFullSearchRequestTag' }] },
          msgFtsInServerByTiming: { sid: i.msg.id, cid: i.msg.msgFtsInServerByTiming, params: [{ type: 'Property', name: 'msgTimingFullSearchRequestTag' }] },
          onClearServerHistoryMsgs: { sid: i.msg.id, cid: i.msg.clearServerHistoryMsgs },
          getServerSessions: { sid: i.msg.id, cid: i.msg.getServerSessions, params: [{ type: 'Property', name: 'sessionReqTag' }] },
          getServerSession: { sid: i.msg.id, cid: i.msg.getServerSession, params: [{ type: 'Property', name: 'session' }] },
          updateServerSession: { sid: i.msg.id, cid: i.msg.updateServerSession, params: [{ type: 'Property', name: 'session' }] },
          deleteServerSessions: { sid: i.msg.id, cid: i.msg.deleteServerSessions, params: [{ type: 'PropertyArray', name: 'sessions', entity: 'session' }] },
          deleteMsgSelf: { sid: i.msg.id, cid: i.msg.deleteMsgSelf, params: [{ type: 'Property', name: 'deleteMsgSelfTag' }] },
          deleteMsgSelfBatch: {
            sid: i.msg.id,
            cid: i.msg.deleteMsgSelfBatch,
            params: [{ type: 'PropertyArray', name: 'deleteMsgSelfTags', entity: 'deleteMsgSelfTag' }],
          },
          onDeleteMsgSelf: { sid: i.msg.id, cid: i.msg.onDeleteMsgSelf },
          onDeleteMsgSelfBatch: { sid: i.msg.id, cid: i.msg.onDeleteMsgSelfBatch },
          sendSuperTeamMsg: { sid: i.superTeam.id, cid: i.superTeam.sendSuperTeamMsg, params: [{ type: 'Property', name: 'msg' }] },
          addSuperTeamMembers: {
            sid: i.superTeam.id,
            cid: i.superTeam.addSuperTeamMembers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
              { type: 'String', name: 'ps' },
            ],
          },
          removeSuperTeamMembers: {
            sid: i.superTeam.id,
            cid: i.superTeam.removeSuperTeamMembers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          leaveSuperTeam: { sid: i.superTeam.id, cid: i.superTeam.leaveSuperTeam, params: [{ type: 'long', name: 'teamId' }] },
          updateSuperTeam: { sid: i.superTeam.id, cid: i.superTeam.updateSuperTeam, params: [{ type: 'Property', name: 'team' }] },
          getSuperTeam: { sid: i.superTeam.id, cid: i.superTeam.getSuperTeam, params: [{ type: 'long', name: 'teamId' }] },
          getSuperTeams: { sid: i.superTeam.id, cid: i.superTeam.getSuperTeams, params: [{ type: 'long', name: 'timetag' }] },
          getSuperTeamMembers: {
            sid: i.superTeam.id,
            cid: i.superTeam.getSuperTeamMembers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'long', name: 'timetag' },
            ],
          },
          updateInfoInSuperTeam: { sid: i.superTeam.id, cid: i.superTeam.updateInfoInSuperTeam, params: [{ type: 'Property', name: 'superTeamMember' }] },
          getSuperTeamHistoryMsgs: {
            sid: i.superTeam.id,
            cid: i.superTeam.getSuperTeamHistoryMsgs,
            params: [
              { type: 'long', name: 'to' },
              { type: 'long', name: 'beginTime' },
              { type: 'long', name: 'endTime' },
              { type: 'long', name: 'lastMsgId' },
              { type: 'int', name: 'limit' },
              { type: 'bool', name: 'reverse' },
              { type: 'LongArray', name: 'msgTypes' },
            ],
          },
          applySuperTeam: {
            sid: i.superTeam.id,
            cid: i.superTeam.applySuperTeam,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'ps' },
            ],
          },
          passSuperTeamApply: {
            sid: i.superTeam.id,
            cid: i.superTeam.passSuperTeamApply,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'from' },
            ],
          },
          rejectSuperTeamApply: {
            sid: i.superTeam.id,
            cid: i.superTeam.rejectSuperTeamApply,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'from' },
              { type: 'String', name: 'ps' },
            ],
          },
          acceptSuperTeamInvite: {
            sid: i.superTeam.id,
            cid: i.superTeam.acceptSuperTeamInvite,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'from' },
            ],
          },
          rejectSuperTeamInvite: {
            sid: i.superTeam.id,
            cid: i.superTeam.rejectSuperTeamInvite,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'from' },
              { type: 'String', name: 'ps' },
            ],
          },
          markSuperTeamSessionAck: {
            sid: i.superTeam.id,
            cid: i.superTeam.markSuperTeamSessionAck,
            params: [
              { type: 'long', name: 'to' },
              { type: 'long', name: 'timetag' },
            ],
          },
          addSuperTeamManagers: {
            sid: i.superTeam.id,
            cid: i.superTeam.addSuperTeamManagers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          removeSuperTeamManagers: {
            sid: i.superTeam.id,
            cid: i.superTeam.removeSuperTeamManagers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          updateSuperTeamMute: {
            sid: i.superTeam.id,
            cid: i.superTeam.updateSuperTeamMute,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'int', name: 'mute' },
            ],
          },
          updateSuperTeamMembersMute: {
            sid: i.superTeam.id,
            cid: i.superTeam.updateSuperTeamMembersMute,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
              { type: 'int', name: 'mute' },
            ],
          },
          updateNickInSuperTeam: { sid: i.superTeam.id, cid: i.superTeam.updateNickInSuperTeam, params: [{ type: 'Property', name: 'superTeamMember' }] },
          transferSuperTeam: {
            sid: i.superTeam.id,
            cid: i.superTeam.transferSuperTeam,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'account' },
              { type: 'bool', name: 'leave' },
            ],
          },
          markSuperTeamSessionsAck: {
            sid: i.superTeam.id,
            cid: i.superTeam.markSuperTeamSessionsAck,
            params: [{ type: 'PropertyArray', name: 'sessionAckTags', entity: 'sessionAckTag' }],
          },
          getSuperTeamMembersByJoinTime: {
            sid: i.superTeam.id,
            cid: i.superTeam.getSuperTeamMembersByJoinTime,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'long', name: 'joinTime' },
              { type: 'int', name: 'limit' },
              { type: 'bool', name: 'reverse' },
            ],
          },
          getSuperTeamMembersByAccounts: { sid: i.superTeam.id, cid: i.superTeam.getSuperTeamMembersByAccounts, params: [{ type: 'StrArray', name: 'memberIds' }] },
          getMutedSuperTeamMembers: {
            sid: i.superTeam.id,
            cid: i.superTeam.getMutedSuperTeamMembers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'long', name: 'joinTime' },
              { type: 'int', name: 'limit' },
              { type: 'bool', name: 'reverse' },
            ],
          },
          sendSuperTeamCustomSysMsg: { sid: i.superTeam.id, cid: i.superTeam.sendSuperTeamCustomSysMsg, params: [{ type: 'Property', name: 'sysMsg' }] },
          deleteSuperTeamMsg: { sid: i.superTeam.id, cid: i.superTeam.deleteSuperTeamMsg, params: [{ type: 'Property', name: 'sysMsg' }] },
          getMySuperTeamMembers: { sid: i.superTeam.id, cid: i.superTeam.getMySuperTeamMembers, params: [{ type: 'LongArray', name: 'teamIds' }] },
          createTeam: {
            sid: i.team.id,
            cid: i.team.createTeam,
            params: [
              { type: 'Property', name: 'team' },
              { type: 'StrArray', name: 'accounts' },
              { type: 'String', name: 'ps' },
            ],
          },
          sendTeamMsg: { sid: i.team.id, cid: i.team.sendTeamMsg, params: [{ type: 'Property', name: 'msg' }] },
          addTeamMembers: {
            sid: i.team.id,
            cid: i.team.addTeamMembers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
              { type: 'String', name: 'ps' },
              { type: 'String', name: 'attach' },
            ],
          },
          removeTeamMembers: {
            sid: i.team.id,
            cid: i.team.removeTeamMembers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          updateTeam: { sid: i.team.id, cid: i.team.updateTeam, params: [{ type: 'Property', name: 'team' }] },
          leaveTeam: { sid: i.team.id, cid: i.team.leaveTeam, params: [{ type: 'long', name: 'teamId' }] },
          getTeam: { sid: i.team.id, cid: i.team.getTeam, params: [{ type: 'long', name: 'teamId' }] },
          getTeams: { sid: i.team.id, cid: i.team.getTeams, params: [{ type: 'long', name: 'timetag' }] },
          getTeamsById: { sid: i.team.id, cid: i.team.getTeamsById, params: [{ type: 'longArray', name: 'teamIds' }] },
          getTeamMembers: {
            sid: i.team.id,
            cid: i.team.getTeamMembers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'long', name: 'timetag' },
            ],
          },
          dismissTeam: { sid: i.team.id, cid: i.team.dismissTeam, params: [{ type: 'long', name: 'teamId' }] },
          applyTeam: {
            sid: i.team.id,
            cid: i.team.applyTeam,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'ps' },
            ],
          },
          passTeamApply: {
            sid: i.team.id,
            cid: i.team.passTeamApply,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'from' },
            ],
          },
          rejectTeamApply: {
            sid: i.team.id,
            cid: i.team.rejectTeamApply,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'from' },
              { type: 'String', name: 'ps' },
            ],
          },
          addTeamManagers: {
            sid: i.team.id,
            cid: i.team.addTeamManagers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          removeTeamManagers: {
            sid: i.team.id,
            cid: i.team.removeTeamManagers,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          transferTeam: {
            sid: i.team.id,
            cid: i.team.transferTeam,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'account' },
              { type: 'bool', name: 'leave' },
            ],
          },
          updateInfoInTeam: { sid: i.team.id, cid: i.team.updateInfoInTeam, params: [{ type: 'Property', name: 'teamMember' }] },
          updateNickInTeam: { sid: i.team.id, cid: i.team.updateNickInTeam, params: [{ type: 'Property', name: 'teamMember' }] },
          acceptTeamInvite: {
            sid: i.team.id,
            cid: i.team.acceptTeamInvite,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'from' },
            ],
          },
          rejectTeamInvite: {
            sid: i.team.id,
            cid: i.team.rejectTeamInvite,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'from' },
              { type: 'String', name: 'ps' },
            ],
          },
          getTeamHistoryMsgs: {
            sid: i.team.id,
            cid: i.team.getTeamHistoryMsgs,
            params: [
              { type: 'long', name: 'to' },
              { type: 'long', name: 'beginTime' },
              { type: 'long', name: 'endTime' },
              { type: 'long', name: 'lastMsgId' },
              { type: 'int', name: 'limit' },
              { type: 'bool', name: 'reverse' },
              { type: 'LongArray', name: 'msgTypes' },
            ],
          },
          searchTeamHistoryMsgs: {
            sid: i.team.id,
            cid: i.team.searchTeamHistoryMsgs,
            params: [
              { type: 'long', name: 'to' },
              { type: 'long', name: 'beginTime' },
              { type: 'long', name: 'endTime' },
              { type: 'String', name: 'keyword' },
              { type: 'int', name: 'limit' },
              { type: 'bool', name: 'reverse' },
            ],
          },
          updateMuteStateInTeam: {
            sid: i.team.id,
            cid: i.team.updateMuteStateInTeam,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'String', name: 'account' },
              { type: 'int', name: 'mute' },
            ],
          },
          getMyTeamMembers: { sid: i.team.id, cid: i.team.getMyTeamMembers, params: [{ type: 'LongArray', name: 'teamIds' }] },
          getMutedTeamMembers: { sid: i.team.id, cid: i.team.getMutedTeamMembers, params: [{ type: 'long', name: 'teamId' }] },
          sendTeamMsgReceipt: { sid: i.team.id, cid: i.team.sendTeamMsgReceipt, params: [{ type: 'PropertyArray', name: 'teamMsgReceipts', entity: 'teamMsgReceipt' }] },
          getTeamMsgReads: { sid: i.team.id, cid: i.team.getTeamMsgReads, params: [{ type: 'PropertyArray', name: 'teamMsgReceipts', entity: 'teamMsgReceipt' }] },
          getTeamMsgReadAccounts: { sid: i.team.id, cid: i.team.getTeamMsgReadAccounts, params: [{ type: 'Property', name: 'teamMsgReceipt' }] },
          muteTeamAll: {
            sid: i.team.id,
            cid: i.team.muteTeamAll,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'int', name: 'mute' },
            ],
          },
          getTeamMemberInvitorAccid: {
            sid: i.team.id,
            cid: i.team.getTeamMemberInvitorAccid,
            params: [
              { type: 'long', name: 'teamId' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          friendRequest: {
            sid: i.friend.id,
            cid: i.friend.friendRequest,
            params: [
              { type: 'String', name: 'account' },
              { type: 'byte', name: 'type' },
              { type: 'String', name: 'ps' },
            ],
          },
          deleteFriend: {
            sid: i.friend.id,
            cid: i.friend.deleteFriend,
            params: [
              { type: 'String', name: 'account' },
              { type: 'Property', name: 'delFriendParams' },
            ],
          },
          updateFriend: { sid: i.friend.id, cid: i.friend.updateFriend, params: [{ type: 'Property', name: 'friend' }] },
          getFriends: { sid: i.friend.id, cid: i.friend.getFriends, params: [{ type: 'long', name: 'timetag' }] },
          getChatroomAddress: {
            sid: i.chatroom.id,
            cid: i.chatroom.getChatroomAddress,
            params: [
              { type: 'long', name: 'chatroomId' },
              { type: 'bool', name: 'isWeixinApp' },
              { type: 'number', name: 'type' },
            ],
          },
          sendFilterMsg: { sid: i.filter.id, cid: i.filter.sendFilterMsg, params: [{ type: 'Property', name: 'msg' }] },
          sendFilterCustomSysMsg: { sid: i.filter.id, cid: i.filter.sendFilterCustomSysMsg, params: [{ type: 'Property', name: 'sysMsg' }] },
          publishEvent: { sid: i.eventService.id, cid: i.eventService.publishEvent, params: [{ type: 'Property', name: 'msgEvent' }] },
          pushEvent: { sid: i.eventService.id, cid: i.eventService.pushEvent },
          subscribeEvent: {
            sid: i.eventService.id,
            cid: i.eventService.subscribeEvent,
            params: [
              { type: 'Property', name: 'msgEventSubscribe' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          unSubscribeEventsByAccounts: {
            sid: i.eventService.id,
            cid: i.eventService.unSubscribeEventsByAccounts,
            params: [
              { type: 'Property', name: 'msgEventSubscribe' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          unSubscribeEventsByType: { sid: i.eventService.id, cid: i.eventService.unSubscribeEventsByType, params: [{ type: 'Property', name: 'msgEventSubscribe' }] },
          querySubscribeEventsByAccounts: {
            sid: i.eventService.id,
            cid: i.eventService.querySubscribeEventsByAccounts,
            params: [
              { type: 'Property', name: 'msgEventSubscribe' },
              { type: 'StrArray', name: 'accounts' },
            ],
          },
          querySubscribeEventsByType: {
            sid: i.eventService.id,
            cid: i.eventService.querySubscribeEventsByType,
            params: [{ type: 'Property', name: 'msgEventSubscribe' }],
          },
          pushEvents: { sid: i.eventService.id, cid: i.eventService.pushEvents },
          getThreadMsgs: {
            sid: i.msgExtend.id,
            cid: i.msgExtend.getThreadMsgs,
            params: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'threadMsgReq' },
            ],
          },
          getMsgsByIdServer: { sid: i.msgExtend.id, cid: i.msgExtend.getMsgsByIdServer, params: [{ type: 'PropertyArray', name: 'reqMsgs', entity: 'msg' }] },
          addQuickComment: {
            sid: i.msgExtend.id,
            cid: i.msgExtend.addQuickComment,
            params: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'comment' },
            ],
          },
          deleteQuickComment: {
            sid: i.msgExtend.id,
            cid: i.msgExtend.deleteQuickComment,
            params: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'comment' },
            ],
          },
          getQuickComments: { sid: i.msgExtend.id, cid: i.msgExtend.getQuickComments, params: [{ type: 'PropertyArray', name: 'commentReq', entity: 'commentReq' }] },
          addCollect: { sid: i.msgExtend.id, cid: i.msgExtend.addCollect, params: [{ type: 'Property', name: 'collect' }] },
          deleteCollects: { sid: i.msgExtend.id, cid: i.msgExtend.deleteCollects, params: [{ type: 'PropertyArray', name: 'collectList', entity: 'collect' }] },
          updateCollect: { sid: i.msgExtend.id, cid: i.msgExtend.updateCollect, params: [{ type: 'Property', name: 'collect' }] },
          getCollects: { sid: i.msgExtend.id, cid: i.msgExtend.getCollects, params: [{ type: 'Property', name: 'collectQuery' }] },
          addStickTopSession: { sid: i.msgExtend.id, cid: i.msgExtend.addStickTopSession, params: [{ type: 'Property', name: 'stickTopSession' }] },
          updateStickTopSession: { sid: i.msgExtend.id, cid: i.msgExtend.updateStickTopSession, params: [{ type: 'Property', name: 'stickTopSession' }] },
          deleteStickTopSession: { sid: i.msgExtend.id, cid: i.msgExtend.deleteStickTopSession, params: [{ type: 'Property', name: 'stickTopSession' }] },
          addMsgPin: {
            sid: i.msgExtend.id,
            cid: i.msgExtend.addMsgPin,
            params: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
            ],
          },
          updateMsgPin: {
            sid: i.msgExtend.id,
            cid: i.msgExtend.updateMsgPin,
            params: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
            ],
          },
          deleteMsgPin: {
            sid: i.msgExtend.id,
            cid: i.msgExtend.deleteMsgPin,
            params: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
            ],
          },
          getMsgPins: { sid: i.msgExtend.id, cid: i.msgExtend.getMsgPins, params: [{ type: 'Property', name: 'msgPinReq' }] },
          httpProxy: { sid: i.proxyService.id, cid: i.proxyService.httpProxy, params: [{ type: 'Property', name: 'proxyTag' }] },
        }),
        a = r.merge({}, o.packetConfig, {
          '2_3': {
            service: 'auth',
            cmd: 'login',
            response: [
              { type: 'Property', name: 'loginRes' },
              { type: 'PropertyArray', name: 'loginPorts', entity: 'loginPort' },
              { type: 'Property', name: 'aosPushInfo' },
            ],
          },
          '2_5': {
            service: 'auth',
            cmd: 'kicked',
            response: [
              { type: 'Number', name: 'from' },
              { type: 'Number', name: 'reason' },
              { type: 'String', name: 'custom' },
              { type: 'Number', name: 'customClientType' },
            ],
          },
          '2_6': { service: 'auth', cmd: 'logout' },
          '2_7': {
            service: 'auth',
            cmd: 'multiPortLogin',
            response: [
              { type: 'Number', name: 'state' },
              { type: 'PropertyArray', name: 'loginPorts', entity: 'loginPort' },
            ],
          },
          '2_8': { service: 'auth', cmd: 'kick', response: [{ type: 'StrArray', name: 'deviceIds' }] },
          '3_1': { service: 'user', cmd: 'updatePushToken' },
          '3_2': { service: 'user', cmd: 'appBackground' },
          '3_3': { service: 'user', cmd: 'markInBlacklist' },
          '3_103': {
            service: 'user',
            cmd: 'syncMarkInBlacklist',
            response: [
              { type: 'String', name: 'account' },
              { type: 'Boolean', name: 'isAdd' },
            ],
          },
          '3_4': { service: 'user', cmd: 'getBlacklist', response: [{ type: 'StrArray', name: 'blacklist' }] },
          '3_5': { service: 'user', cmd: 'markInMutelist' },
          '3_105': {
            service: 'user',
            cmd: 'syncMarkInMutelist',
            response: [
              { type: 'String', name: 'account' },
              { type: 'Boolean', name: 'isAdd' },
            ],
          },
          '3_6': { service: 'user', cmd: 'getMutelist', response: [{ type: 'StrArray', name: 'mutelist' }] },
          '3_8': {
            service: 'user',
            cmd: 'getRelations',
            response: [
              { type: 'PropertyArray', name: 'specialRelations', entity: 'specialRelation' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '3_7': { service: 'user', cmd: 'getUsers', response: [{ type: 'PropertyArray', name: 'users', entity: 'user' }] },
          '3_10': { service: 'user', cmd: 'updateMyInfo', response: [{ type: 'Number', name: 'timetag' }] },
          '3_15': { service: 'user', cmd: 'updateDonnop', response: [{ type: 'Number', name: 'timetag' }] },
          '3_115': {
            service: 'user',
            cmd: 'syncUpdateDonnop',
            response: [
              { type: 'Property', name: 'donnop' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '3_109': {
            service: 'user',
            cmd: 'syncMyInfo',
            response: [
              { type: 'Property', name: 'user' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '3_110': { service: 'user', cmd: 'syncUpdateMyInfo', response: [{ type: 'Property', name: 'user' }] },
          '4_1': { service: 'notify' },
          '4_2': { service: 'notify' },
          '4_3': { service: 'notify', cmd: 'markRead' },
          '4_4': { service: 'notify', cmd: 'syncOfflineMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '4_5': { service: 'notify', cmd: 'batchMarkRead' },
          '4_6': { service: 'notify', cmd: 'syncOfflineSysMsgs', response: [{ type: 'PropertyArray', name: 'sysMsgs', entity: 'sysMsg' }] },
          '4_8': { service: 'notify', cmd: 'syncOfflineNetcallMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '4_9': { service: 'notify', cmd: 'syncRoamingMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '4_12': {
            service: 'notify',
            cmd: 'syncMsgReceipts',
            response: [
              { type: 'PropertyArray', name: 'msgReceipts', entity: 'msgReceipt' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '4_13': {
            service: 'notify',
            cmd: 'syncDonnop',
            response: [
              { type: 'Property', name: 'donnop' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '4_14': {
            service: 'notify',
            cmd: 'syncSessionAck',
            response: [
              { type: 'StrLongMap', name: 'p2p' },
              { type: 'LongLongMap', name: 'team' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '4_15': { service: 'notify', cmd: 'syncRobots', response: [{ type: 'PropertyArray', name: 'robots', entity: 'robot' }] },
          '4_16': { service: 'notify', cmd: 'syncBroadcastMsgs', response: [{ type: 'PropertyArray', name: 'broadcastMsgs', entity: 'broadcastMsg' }] },
          '4_17': { service: 'notify', cmd: 'syncSuperTeamRoamingMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '4_18': { service: 'notify', cmd: 'syncOfflineSuperTeamSysMsgs', response: [{ type: 'PropertyArray', name: 'sysMsgs', entity: 'sysMsg' }] },
          '4_19': {
            service: 'notify',
            cmd: 'syncDeleteSuperTeamMsgOfflineRoaming',
            response: [
              { type: 'PropertyArray', name: 'sysMsgs', entity: 'sysMsg' },
              { type: 'Number', name: 'timetag' },
              { type: 'Number', name: 'type' },
            ],
          },
          '4_20': {
            service: 'notify',
            cmd: 'syncSuperTeamSessionAck',
            response: [
              { type: 'LongLongMap', name: 'superTeam' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '4_21': { service: 'notify', cmd: 'syncDeleteMsgSelf', response: [{ type: 'PropertyArray', name: 'deletedMsgs', entity: 'deleteMsgSelfTag' }] },
          '4_22': { service: 'notify', cmd: 'syncSessionsWithMoreRoaming', response: [{ type: 'PropertyArray', name: 'sessions', entity: 'msg' }] },
          '4_23': {
            service: 'notify',
            cmd: 'syncStickTopSessions',
            response: [
              { type: 'Number', name: 'timetag' },
              { type: 'boolean', name: 'modify' },
              { type: 'PropertyArray', name: 'sessions', entity: 'stickTopSession' },
            ],
          },
          '4_24': {
            service: 'notify',
            cmd: 'syncSessionHistoryMsgsDelete',
            response: [{ type: 'PropertyArray', name: 'sessionHistoryMsgsDeleteTags', entity: 'clearMsgsParamsWithSync' }],
          },
          '4_100': { service: 'notify', cmd: 'syncOfflineFilterMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '4_101': { service: 'notify', cmd: 'syncOfflineFilterSysMsgs', response: [{ type: 'PropertyArray', name: 'sysMsgs', entity: 'sysMsg' }] },
          '5_1': { service: 'sync', cmd: 'syncDone', response: [{ type: 'Number', name: 'timetag' }] },
          '5_2': { service: 'sync', cmd: 'syncTeamMembersDone', response: [{ type: 'Number', name: 'timetag' }] },
          '5_3': { service: 'sync', cmd: 'syncSuperTeamMembersDone', response: [{ type: 'Number', name: 'timetag' }] },
          '7_1': { service: 'msg', cmd: 'sendMsg', response: [{ type: 'Property', name: 'msg' }], trivialErrorCodes: [7101] },
          '7_2': { service: 'msg', cmd: 'msg', response: [{ type: 'Property', name: 'msg' }] },
          '7_3': { service: 'msg', cmd: 'sysMsg', response: [{ type: 'Property', name: 'sysMsg' }] },
          '7_6': { service: 'msg', cmd: 'getHistoryMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '7_7': { service: 'msg', cmd: 'sendCustomSysMsg', trivialErrorCodes: [7101] },
          '7_8': { service: 'msg', cmd: 'searchHistoryMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '7_9': { service: 'msg', cmd: 'deleteSessions' },
          '7_10': { service: 'msg', cmd: 'getSessions', response: [{ type: 'StrArray', name: 'sessions' }] },
          '7_101': { service: 'msg', cmd: 'syncSendMsg', response: [{ type: 'Property', name: 'msg' }] },
          '7_11': { service: 'msg', cmd: 'sendMsgReceipt', response: [{ type: 'Property', name: 'msgReceipt' }] },
          '7_12': { service: 'msg', cmd: 'msgReceipt', response: [{ type: 'Property', name: 'msgReceipt' }] },
          '7_13': { service: 'msg', cmd: 'onDeleteMsg' },
          '7_14': { service: 'msg', cmd: 'onMsgDeleted', response: [{ type: 'Property', name: 'sysMsg' }] },
          '7_15': {
            service: 'msg',
            cmd: 'onDeleteMsgOfflineRoaming',
            response: [
              { type: 'PropertyArray', name: 'sysMsgs', entity: 'sysMsg' },
              { type: 'Number', name: 'timetag' },
              { type: 'Number', name: 'type' },
            ],
          },
          '7_16': { service: 'msg', cmd: 'onMarkSessionAck' },
          '7_17': { service: 'msg', cmd: 'broadcastMsg', response: [{ type: 'Property', name: 'broadcastMsg' }] },
          '7_18': { service: 'msg', cmd: 'clearServerHistoryMsgs', response: [{ type: 'Long', name: 'timetag' }] },
          '7_19': {
            service: 'session',
            cmd: 'getServerSessions',
            response: [
              { type: 'Property', name: 'sessionReqTag' },
              { type: 'PropertyArray', name: 'sessionList', entity: 'session' },
            ],
          },
          '7_20': { service: 'session', cmd: 'getServerSession', response: [{ type: 'Property', name: 'session' }] },
          '7_21': { service: 'session', cmd: 'updateServerSession' },
          '7_22': { service: 'session', cmd: 'deleteServerSessions' },
          '7_23': { service: 'msg', cmd: 'deleteMsgSelf', response: [{ type: 'Long', name: 'timetag' }] },
          '7_24': { service: 'msg', cmd: 'deleteMsgSelfBatch', response: [{ type: 'Long', name: 'timetag' }] },
          '7_25': { service: 'msg', cmd: 'onMarkSessionAckBatch' },
          '7_26': { service: 'msg', cmd: 'msgFtsInServer', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '7_27': { service: 'msg', cmd: 'msgFtsInServerByTiming', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '7_118': {
            service: 'msg',
            cmd: 'onClearServerHistoryMsgs',
            response: [{ type: 'Property', name: 'sessionHistoryMsgsDeleteTag', entity: 'clearMsgsParamsWithSync' }],
          },
          '7_123': { service: 'msg', cmd: 'onDeleteMsgSelf', response: [{ type: 'Property', name: 'deleteMsgSelfTag' }] },
          '7_124': { service: 'msg', cmd: 'onDeleteMsgSelfBatch', response: [{ type: 'PropertyArray', name: 'deleteMsgSelfTags', entity: 'deleteMsgSelfTag' }] },
          '7_116': {
            service: 'msg',
            cmd: 'syncMarkSessionAck',
            response: [
              { type: 'Number', name: 'scene' },
              { type: 'String', name: 'to' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '7_121': { service: 'msg', cmd: 'syncUpdateServerSession', response: [{ type: 'Property', name: 'session' }] },
          '23_1': {
            service: 'msgExtend',
            cmd: 'getThreadMsgs',
            response: [
              { type: 'Property', name: 'threadMsg', entity: 'msg' },
              { type: 'Property', name: 'threadMsgsMeta' },
              { type: 'PropertyArray', name: 'msgs', entity: 'msg' },
            ],
          },
          '23_2': { service: 'msgExtend', cmd: 'getMsgsByIdServer', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '23_3': { service: 'msgExtend', cmd: 'addQuickComment', response: [{ type: 'Number', name: 'timetag' }] },
          '23_4': { service: 'msgExtend', cmd: 'deleteQuickComment', response: [{ type: 'Number', name: 'timetag' }] },
          '23_5': {
            service: 'msgExtend',
            cmd: 'onQuickComment',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'comment' },
            ],
          },
          '23_6': {
            service: 'msgExtend',
            cmd: 'onDeleteQuickComment',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'comment' },
            ],
          },
          '23_7': { service: 'msgExtend', cmd: 'getQuickComments', response: [{ type: 'PropertyArray', name: 'commentRes', entity: 'commentRes' }] },
          '23_8': { service: 'msgExtend', cmd: 'addCollect', response: [{ type: 'Property', name: 'collect' }] },
          '23_9': { service: 'msgExtend', cmd: 'deleteCollects', response: [{ type: 'Number', name: 'deleteNum' }] },
          '23_10': { service: 'msgExtend', cmd: 'updateCollect', response: [{ type: 'Property', name: 'collect' }] },
          '23_11': {
            service: 'msgExtend',
            cmd: 'getCollects',
            response: [
              { type: 'Number', name: 'total' },
              { type: 'PropertyArray', name: 'collectList', entity: 'collect' },
            ],
          },
          '23_12': { service: 'msgExtend', cmd: 'addStickTopSession', response: [{ type: 'Property', name: 'stickTopSession' }] },
          '23_13': { service: 'msgExtend', cmd: 'deleteStickTopSession', response: [{ type: 'Number', name: 'timetag' }] },
          '23_14': { service: 'msgExtend', cmd: 'updateStickTopSession', response: [{ type: 'Property', name: 'stickTopSession' }] },
          '23_15': { service: 'msgExtend', cmd: 'addMsgPin', response: [{ type: 'Number', name: 'timetag' }] },
          '23_16': { service: 'msgExtend', cmd: 'updateMsgPin', response: [{ type: 'Number', name: 'timetag' }] },
          '23_17': { service: 'msgExtend', cmd: 'deleteMsgPin', response: [{ type: 'Number', name: 'timetag' }] },
          '23_18': {
            service: 'msgExtend',
            cmd: 'onAddMsgPin',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '23_19': {
            service: 'msgExtend',
            cmd: 'onUpdateMsgPin',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '23_20': {
            service: 'msgExtend',
            cmd: 'onDeleteMsgPin',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '23_21': {
            service: 'msgExtend',
            cmd: 'getMsgPins',
            response: [
              { type: 'Number', name: 'timetag' },
              { type: 'Boolean', name: 'modify' },
              { type: 'PropertyArray', name: 'pins', entity: 'msgPinRes' },
            ],
          },
          '23_103': {
            service: 'msgExtend',
            cmd: 'syncAddQuickComment',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'comment' },
            ],
          },
          '23_104': {
            service: 'msgExtend',
            cmd: 'syncDeleteQuickComment',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'comment' },
            ],
          },
          '23_112': { service: 'msgExtend', cmd: 'syncAddStickTopSession', response: [{ type: 'Property', name: 'stickTopSession' }] },
          '23_113': {
            service: 'msgExtend',
            cmd: 'syncDeleteStickTopSession',
            response: [
              { type: 'Number', name: 'timetag' },
              { type: 'Property', name: 'stickTopSession' },
            ],
          },
          '23_114': { service: 'msgExtend', cmd: 'syncUpdateStickTopSession', response: [{ type: 'Property', name: 'stickTopSession' }] },
          '23_115': {
            service: 'msgExtend',
            cmd: 'syncAddMsgPin',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '23_116': {
            service: 'msgExtend',
            cmd: 'syncUpdateMsgPin',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '23_117': {
            service: 'msgExtend',
            cmd: 'syncDeleteMsgPin',
            response: [
              { type: 'Property', name: 'msg' },
              { type: 'Property', name: 'pinTag' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '21_2': { service: 'superTeam', cmd: 'sendSuperTeamMsg', response: [{ type: 'Property', name: 'msg' }] },
          '21_3': { service: 'superTeam', cmd: 'superTeamMsg', response: [{ type: 'Property', name: 'msg' }] },
          '21_5': {
            service: 'superTeam',
            cmd: 'addSuperTeamMembers',
            response: [
              { type: 'StrArray', name: 'abortedAccidList' },
              { type: 'long', name: 'timetag' },
            ],
          },
          '21_6': { service: 'superTeam', cmd: 'removeSuperTeamMembers' },
          '21_7': { service: 'superTeam', cmd: 'leaveSuperTeam' },
          '21_8': {
            service: 'superTeam',
            cmd: 'updateSuperTeam',
            response: [
              { type: 'long', name: 'teamId' },
              { type: 'long', name: 'timetag' },
            ],
          },
          '21_9': { service: 'superTeam', cmd: 'getSuperTeam', response: [{ type: 'Property', name: 'team' }] },
          '21_12': {
            service: 'superTeam',
            cmd: 'getSuperTeams',
            response: [
              { type: 'PropertyArray', name: 'teams', entity: 'superTeam' },
              { type: 'bool', name: 'isAll' },
              { type: 'long', name: 'timetag' },
            ],
          },
          '21_10': { service: 'superTeam', cmd: 'updateInfoInSuperTeam' },
          '21_13': { service: 'superTeam', cmd: 'getSuperTeamMembers', response: [{ type: 'long', name: 'timetag' }] },
          '21_11': { service: 'superTeam', cmd: 'getMySuperTeamMembers', response: [{ type: 'PropertyArray', name: 'members', entity: 'superTeamMember' }] },
          '21_14': { service: 'superTeam', cmd: 'getSuperTeamHistoryMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '21_15': { service: 'superTeam', cmd: 'getSuperTeamMembersByJoinTime', response: [{ type: 'PropertyArray', name: 'members', entity: 'superTeamMember' }] },
          '21_16': { service: 'superTeam', cmd: 'sendSuperTeamCustomSysMsg', trivialErrorCodes: [7101] },
          '21_17': { service: 'superTeam', cmd: 'onDeleteSuperTeamMsg' },
          '21_18': { service: 'superTeam', cmd: 'onSuperTeamMsgDelete', response: [{ type: 'Property', name: 'sysMsg' }] },
          '21_19': { service: 'superTeam', cmd: 'superTeamCustomSysMsg', response: [{ type: 'Property', name: 'sysMsg' }] },
          '21_20': { service: 'superTeam', cmd: 'applySuperTeam', response: [{ type: 'Property', name: 'team' }] },
          '21_21': { service: 'superTeam', cmd: 'passSuperTeamApply' },
          '21_22': { service: 'superTeam', cmd: 'rejectSuperTeamApply' },
          '21_23': { service: 'superTeam', cmd: 'acceptSuperTeamInvite', response: [{ type: 'Property', name: 'team' }] },
          '21_24': { service: 'superTeam', cmd: 'rejectSuperTeamInvite' },
          '21_25': { service: 'superTeam', cmd: 'onMarkSuperTeamSessionAck' },
          '21_26': { service: 'superTeam', cmd: 'addSuperTeamManagers' },
          '21_27': { service: 'superTeam', cmd: 'removeSuperTeamManagers' },
          '21_28': { service: 'superTeam', cmd: 'updateSuperTeamMute' },
          '21_29': { service: 'superTeam', cmd: 'updateSuperTeamMembersMute', response: [{ type: 'long', name: 'timetag' }] },
          '21_30': { service: 'superTeam', cmd: 'updateNickInSuperTeam' },
          '21_31': { service: 'superTeam', cmd: 'transferSuperTeam' },
          '21_32': { service: 'superTeam', cmd: 'onMarkSuperTeamSessionsAck' },
          '21_33': { service: 'superTeam', cmd: 'getSuperTeamMembersByAccounts', response: [{ type: 'PropertyArray', name: 'members', entity: 'superTeamMember' }] },
          '21_34': { service: 'superTeam', cmd: 'getMutedSuperTeamMembers', response: [{ type: 'PropertyArray', name: 'members', entity: 'superTeamMember' }] },
          '21_113': {
            service: 'superTeam',
            cmd: 'syncSuperTeamMembers',
            response: [
              { type: 'Number', name: 'teamId' },
              { type: 'PropertyArray', name: 'members', entity: 'superTeamMember' },
              { type: 'bool', name: 'isAll' },
              { type: 'long', name: 'timetag' },
            ],
          },
          '21_111': {
            service: 'superTeam',
            cmd: 'syncMySuperTeamMembers',
            response: [
              { type: 'PropertyArray', name: 'teamMembers', entity: 'superTeamMember' },
              { type: 'long', name: 'timetag' },
            ],
          },
          '21_109': {
            service: 'superTeam',
            cmd: 'syncSuperTeams',
            response: [
              { type: 'PropertyArray', name: 'teams', entity: 'superTeam' },
              { type: 'bool', name: 'isAll' },
              { type: 'long', name: 'timetag' },
            ],
          },
          '21_101': { service: 'superTeam', cmd: 'syncCreateSuperTeam', response: [{ type: 'Property', name: 'team' }] },
          '21_102': { service: 'superTeam', cmd: 'syncSendSuperTeamMsg', response: [{ type: 'Property', name: 'msg' }] },
          '21_110': { service: 'superTeam', cmd: 'syncUpdateSuperTeamMember', response: [{ type: 'Property', name: 'teamMember', entity: 'superTeamMember' }] },
          '21_117': { service: 'superTeam', cmd: 'syncDeleteSuperTeamMsg', response: [{ type: 'Property', name: 'sysMsg' }] },
          '21_125': {
            service: 'superTeam',
            cmd: 'syncMarkSuperTeamSessionAck',
            response: [
              { type: 'Long', name: 'to' },
              { type: 'Long', name: 'timetag' },
            ],
          },
          '8_1': {
            service: 'team',
            cmd: 'createTeam',
            response: [
              { type: 'Property', name: 'team' },
              { type: 'StrArray', name: 'abortedAccidList' },
            ],
          },
          '8_2': { service: 'team', cmd: 'sendTeamMsg', response: [{ type: 'Property', name: 'msg' }] },
          '8_3': { service: 'team', cmd: 'teamMsg', response: [{ type: 'Property', name: 'msg' }] },
          '8_4': { service: 'team', cmd: 'teamMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '8_5': {
            service: 'team',
            cmd: 'addTeamMembers',
            response: [
              { type: 'long', name: 'time' },
              { type: 'StrArray', name: 'abortedAccidList' },
            ],
          },
          '8_6': { service: 'team', cmd: 'removeTeamMembers' },
          '8_7': {
            service: 'team',
            cmd: 'updateTeam',
            response: [
              { type: 'Number', name: 'id' },
              { type: 'Number', name: 'time' },
            ],
          },
          '8_8': { service: 'team', cmd: 'leaveTeam' },
          '8_9': { service: 'team', cmd: 'getTeam', response: [{ type: 'Property', name: 'team' }] },
          '8_10': {
            service: 'team',
            cmd: 'getTeams',
            response: [
              { type: 'PropertyArray', name: 'teams', entity: 'team' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '8_11': {
            service: 'team',
            cmd: 'getTeamMembers',
            response: [
              { type: 'Number', name: 'teamId' },
              { type: 'PropertyArray', name: 'members', entity: 'teamMember' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '8_12': { service: 'team', cmd: 'dismissTeam' },
          '8_13': { service: 'team', cmd: 'applyTeam', response: [{ type: 'Property', name: 'team' }] },
          '8_14': { service: 'team', cmd: 'passTeamApply' },
          '8_15': { service: 'team', cmd: 'rejectTeamApply' },
          '8_16': { service: 'team', cmd: 'addTeamManagers' },
          '8_17': { service: 'team', cmd: 'removeTeamManagers' },
          '8_18': { service: 'team', cmd: 'transferTeam' },
          '8_19': { service: 'team', cmd: 'updateInfoInTeam' },
          '8_20': { service: 'team', cmd: 'updateNickInTeam' },
          '8_21': { service: 'team', cmd: 'acceptTeamInvite', response: [{ type: 'Property', name: 'team' }] },
          '8_22': { service: 'team', cmd: 'rejectTeamInvite' },
          '8_23': { service: 'team', cmd: 'getTeamHistoryMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '8_24': { service: 'team', cmd: 'searchTeamHistoryMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '8_25': { service: 'team', cmd: 'updateMuteStateInTeam' },
          '8_26': { service: 'team', cmd: 'getMyTeamMembers', response: [{ type: 'PropertyArray', name: 'teamMembers', entity: 'teamMember' }] },
          '8_27': {
            service: 'team',
            cmd: 'getMutedTeamMembers',
            response: [
              { type: 'Number', name: 'teamId' },
              { type: 'PropertyArray', name: 'teamMembers', entity: 'teamMember' },
            ],
          },
          '8_28': { service: 'team', cmd: 'sendTeamMsgReceipt', response: [{ type: 'PropertyArray', name: 'teamMsgReceipts', entity: 'teamMsgReceipt' }] },
          '8_29': { service: 'team', cmd: 'getTeamMsgReads', response: [{ type: 'PropertyArray', name: 'teamMsgReceipts', entity: 'teamMsgReceipt' }] },
          '8_30': {
            service: 'team',
            cmd: 'getTeamMsgReadAccounts',
            response: [
              { type: 'Property', name: 'teamMsgReceipt' },
              { type: 'StrArray', name: 'readAccounts' },
              { type: 'StrArray', name: 'unreadAccounts' },
            ],
          },
          '8_31': { service: 'team', cmd: 'notifyTeamMsgReads', response: [{ type: 'PropertyArray', name: 'teamMsgReceipts', entity: 'teamMsgReceipt' }] },
          '8_32': { service: 'team', cmd: 'muteTeamAll', response: [] },
          '8_33': { service: 'team', cmd: 'getTeamMemberInvitorAccid', response: [{ type: 'object', name: 'accountsMap' }] },
          '8_34': {
            service: 'team',
            cmd: 'getTeamsById',
            response: [
              { type: 'PropertyArray', name: 'teams', entity: 'team' },
              { type: 'StrArray', name: 'tids' },
            ],
            trivialErrorCodes: [816],
          },
          '8_126': {
            service: 'team',
            cmd: 'syncMyTeamMembers',
            response: [
              { type: 'PropertyArray', name: 'teamMembers', entity: 'teamMember' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '8_109': {
            service: 'team',
            cmd: 'syncTeams',
            response: [
              { type: 'Number', name: 'timetag' },
              { type: 'PropertyArray', name: 'teams', entity: 'team' },
            ],
          },
          '8_111': {
            service: 'team',
            cmd: 'syncTeamMembers',
            response: [
              { type: 'Number', name: 'teamId' },
              { type: 'PropertyArray', name: 'members', entity: 'teamMember' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '8_101': { service: 'team', cmd: 'syncCreateTeam', response: [{ type: 'Property', name: 'team' }] },
          '8_102': { service: 'team', cmd: 'syncSendTeamMsg', response: [{ type: 'Property', name: 'msg' }] },
          '8_119': { service: 'team', cmd: 'syncUpdateTeamMember', response: [{ type: 'Property', name: 'teamMember' }] },
          '12_1': { service: 'friend', cmd: 'friendRequest' },
          '12_101': {
            service: 'friend',
            cmd: 'syncFriendRequest',
            response: [
              { type: 'String', name: 'account' },
              { type: 'Number', name: 'type' },
              { type: 'String', name: 'ps' },
            ],
          },
          '12_2': { service: 'friend', cmd: 'deleteFriend' },
          '12_102': { service: 'friend', cmd: 'syncDeleteFriend', response: [{ type: 'String', name: 'account' }] },
          '12_3': { service: 'friend', cmd: 'updateFriend' },
          '12_103': { service: 'friend', cmd: 'syncUpdateFriend', response: [{ type: 'Property', name: 'friend' }] },
          '12_4': {
            service: 'friend',
            cmd: 'getFriends',
            response: [
              { type: 'PropertyArray', name: 'friends', entity: 'friend' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '12_5': {
            service: 'friend',
            cmd: 'syncFriends',
            response: [
              { type: 'PropertyArray', name: 'friends', entity: 'friend' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '12_6': {
            service: 'friend',
            cmd: 'syncFriendUsers',
            response: [
              { type: 'PropertyArray', name: 'users', entity: 'user' },
              { type: 'Number', name: 'timetag' },
            ],
          },
          '13_1': { service: 'chatroom', cmd: 'getChatroomAddress', response: [{ type: 'StrArray', name: 'address' }] },
          '14_1': { service: 'eventService', cmd: 'publishEvent', response: [{ type: 'Property', name: 'msgEvent' }] },
          '14_2': { service: 'eventService', cmd: 'pushEvent', response: [{ type: 'Property', name: 'msgEvent' }] },
          '14_3': { service: 'eventService', cmd: 'subscribeEvent', response: [{ type: 'StrArray', name: 'accounts' }] },
          '14_4': { service: 'eventService', cmd: 'unSubscribeEventsByAccounts', response: [{ type: 'StrArray', name: 'accounts' }] },
          '14_5': { service: 'eventService', cmd: 'unSubscribeEventsByType' },
          '14_6': {
            service: 'eventService',
            cmd: 'querySubscribeEventsByAccounts',
            response: [{ type: 'PropertyArray', name: 'msgEventSubscribes', entity: 'msgEventSubscribe' }],
          },
          '14_7': {
            service: 'eventService',
            cmd: 'querySubscribeEventsByType',
            response: [{ type: 'PropertyArray', name: 'msgEventSubscribes', entity: 'msgEventSubscribe' }],
          },
          '14_9': { service: 'eventService', cmd: 'pushEvents', response: [{ type: 'PropertyArray', name: 'msgEvents', entity: 'msgEvent' }] },
          '22_1': { service: 'proxyService', cmd: 'httpProxy', response: [{ type: 'Property', name: 'proxyTag' }] },
          '22_2': { service: 'proxyService', cmd: 'onProxyMsg', response: [{ type: 'Property', name: 'proxyMsg', entity: 'proxyMsgTag' }] },
          '101_1': { service: 'filter', cmd: 'sendFilterMsg', response: [{ type: 'Property', name: 'msg' }] },
          '101_2': { service: 'filter', cmd: 'filterMsg', response: [{ type: 'Property', name: 'msg' }] },
          '101_3': { service: 'filter', cmd: 'filterSysMsg', response: [{ type: 'Property', name: 'sysMsg' }] },
          '101_7': { service: 'filter', cmd: 'sendFilterCustomSysMsg' },
        });
      e.exports = { idMap: i, cmdConfig: s, packetConfig: a };
    },
    ,
    function (e, t, n) {
      'use strict';
      var r = n(16),
        o = n(196),
        i = n(92),
        s = n(86),
        a = n(69),
        c = n(0),
        u = n(107),
        l = n(89),
        p = n(18),
        m = n(215),
        d = n(216);
      e.exports = function (e) {
        c.merge(e, { platform: r, xhr: o, io: i, naturalSort: s, deepAccess: a, util: c, support: u, blob: l, ajax: p, LoggerPlugin: m, usePlugin: d });
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(30),
        o = n(0),
        i = o.notundef,
        s = { '-2': 'unset', '-1': 'restricted', 0: 'common', 1: 'owner', 2: 'manager', 3: 'guest', 4: 'anonymous' };
      function a(e) {
        i(e.nick) && (this.nick = '' + e.nick), i(e.avatar) && (this.avatar = '' + e.avatar), i(e.custom) && (this.custom = '' + e.custom);
      }
      (a.reverse = function (e) {
        var t = o.copy(e);
        return (
          i(t.chatroomId) && (t.chatroomId = '' + t.chatroomId),
          i(t.avatar) && (t.avatar = (0, r.genPrivateUrl)(t.avatar)),
          i(t.type) && (t.type = s[t.type]),
          i(t.level) && (t.level = +t.level),
          i(t.online) && (t.online = 1 == +t.online),
          i(t.enterTime) && (t.enterTime = +t.enterTime),
          i(t.guest) && (t.guest = 1 == +t.guest),
          i(t.blacked) && (t.blacked = 1 == +t.blacked),
          i(t.gaged) && (t.gaged = 1 == +t.gaged),
          i(t.valid) && (t.valid = 1 == +t.valid),
          i(t.updateTime) && (t.updateTime = +t.updateTime),
          i(t.tempMuted) ? (t.tempMuted = 1 == +t.tempMuted) : (t.tempMuted = !1),
          i(t.tempMuteDuration) ? (t.tempMuteDuration = +t.tempMuteDuration) : (t.tempMuteDuration = 0),
          t.online || delete t.enterTime,
          t.guest && ((t.type = 'guest'), delete t.valid),
          'common' !== t.type && delete t.level,
          delete t.guest,
          t
        );
      }),
        (a.reverseMembers = function (e) {
          return e.map(function (e) {
            return a.reverse(e);
          });
        }),
        (a.validTypes = Object.keys(s)),
        (a.typeReverseMap = s),
        (e.exports = a);
    },
    function (e, t, n) {
      var r;
      e.exports =
        ((r = n(25)),
        n(219),
        void (
          r.lib.Cipher ||
          (function (e) {
            var t = r,
              n = t.lib,
              o = n.Base,
              i = n.WordArray,
              s = n.BufferedBlockAlgorithm,
              a = t.enc,
              c = (a.Utf8, a.Base64),
              u = t.algo,
              l = u.EvpKDF,
              p = (n.Cipher = s.extend({
                cfg: o.extend(),
                createEncryptor: function (e, t) {
                  return this.create(this._ENC_XFORM_MODE, e, t);
                },
                createDecryptor: function (e, t) {
                  return this.create(this._DEC_XFORM_MODE, e, t);
                },
                init: function (e, t, n) {
                  (this.cfg = this.cfg.extend(n)), (this._xformMode = e), (this._key = t), this.reset();
                },
                reset: function () {
                  s.reset.call(this), this._doReset();
                },
                process: function (e) {
                  return this._append(e), this._process();
                },
                finalize: function (e) {
                  e && this._append(e);
                  var t = this._doFinalize();
                  return t;
                },
                keySize: 4,
                ivSize: 4,
                _ENC_XFORM_MODE: 1,
                _DEC_XFORM_MODE: 2,
                _createHelper: (function () {
                  function e(e) {
                    return 'string' == typeof e ? M : T;
                  }
                  return function (t) {
                    return {
                      encrypt: function (n, r, o) {
                        return e(r).encrypt(t, n, r, o);
                      },
                      decrypt: function (n, r, o) {
                        return e(r).decrypt(t, n, r, o);
                      },
                    };
                  };
                })(),
              })),
              m =
                ((n.StreamCipher = p.extend({
                  _doFinalize: function () {
                    var e = this._process(!0);
                    return e;
                  },
                  blockSize: 1,
                })),
                (t.mode = {})),
              d = (n.BlockCipherMode = o.extend({
                createEncryptor: function (e, t) {
                  return this.Encryptor.create(e, t);
                },
                createDecryptor: function (e, t) {
                  return this.Decryptor.create(e, t);
                },
                init: function (e, t) {
                  (this._cipher = e), (this._iv = t);
                },
              })),
              f = (m.CBC = (function () {
                var t = d.extend();
                function n(t, n, r) {
                  var o,
                    i = this._iv;
                  i ? ((o = i), (this._iv = e)) : (o = this._prevBlock);
                  for (var s = 0; s < r; s++) t[n + s] ^= o[s];
                }
                return (
                  (t.Encryptor = t.extend({
                    processBlock: function (e, t) {
                      var r = this._cipher,
                        o = r.blockSize;
                      n.call(this, e, t, o), r.encryptBlock(e, t), (this._prevBlock = e.slice(t, t + o));
                    },
                  })),
                  (t.Decryptor = t.extend({
                    processBlock: function (e, t) {
                      var r = this._cipher,
                        o = r.blockSize,
                        i = e.slice(t, t + o);
                      r.decryptBlock(e, t), n.call(this, e, t, o), (this._prevBlock = i);
                    },
                  })),
                  t
                );
              })()),
              y = (t.pad = {}),
              g = (y.Pkcs7 = {
                pad: function (e, t) {
                  for (var n = 4 * t, r = n - (e.sigBytes % n), o = (r << 24) | (r << 16) | (r << 8) | r, s = [], a = 0; a < r; a += 4) s.push(o);
                  var c = i.create(s, r);
                  e.concat(c);
                },
                unpad: function (e) {
                  var t = 255 & e.words[(e.sigBytes - 1) >>> 2];
                  e.sigBytes -= t;
                },
              }),
              h =
                ((n.BlockCipher = p.extend({
                  cfg: p.cfg.extend({ mode: f, padding: g }),
                  reset: function () {
                    var e;
                    p.reset.call(this);
                    var t = this.cfg,
                      n = t.iv,
                      r = t.mode;
                    this._xformMode == this._ENC_XFORM_MODE ? (e = r.createEncryptor) : ((e = r.createDecryptor), (this._minBufferSize = 1)),
                      this._mode && this._mode.__creator == e
                        ? this._mode.init(this, n && n.words)
                        : ((this._mode = e.call(r, this, n && n.words)), (this._mode.__creator = e));
                  },
                  _doProcessBlock: function (e, t) {
                    this._mode.processBlock(e, t);
                  },
                  _doFinalize: function () {
                    var e,
                      t = this.cfg.padding;
                    return (
                      this._xformMode == this._ENC_XFORM_MODE ? (t.pad(this._data, this.blockSize), (e = this._process(!0))) : ((e = this._process(!0)), t.unpad(e)), e
                    );
                  },
                  blockSize: 4,
                })),
                (n.CipherParams = o.extend({
                  init: function (e) {
                    this.mixIn(e);
                  },
                  toString: function (e) {
                    return (e || this.formatter).stringify(this);
                  },
                }))),
              v = (t.format = {}),
              b = (v.OpenSSL = {
                stringify: function (e) {
                  var t = e.ciphertext,
                    n = e.salt;
                  return (n ? i.create([1398893684, 1701076831]).concat(n).concat(t) : t).toString(c);
                },
                parse: function (e) {
                  var t,
                    n = c.parse(e),
                    r = n.words;
                  return (
                    1398893684 == r[0] && 1701076831 == r[1] && ((t = i.create(r.slice(2, 4))), r.splice(0, 4), (n.sigBytes -= 16)), h.create({ ciphertext: n, salt: t })
                  );
                },
              }),
              T = (n.SerializableCipher = o.extend({
                cfg: o.extend({ format: b }),
                encrypt: function (e, t, n, r) {
                  r = this.cfg.extend(r);
                  var o = e.createEncryptor(n, r),
                    i = o.finalize(t),
                    s = o.cfg;
                  return h.create({ ciphertext: i, key: n, iv: s.iv, algorithm: e, mode: s.mode, padding: s.padding, blockSize: e.blockSize, formatter: r.format });
                },
                decrypt: function (e, t, n, r) {
                  (r = this.cfg.extend(r)), (t = this._parse(t, r.format));
                  var o = e.createDecryptor(n, r).finalize(t.ciphertext);
                  return o;
                },
                _parse: function (e, t) {
                  return 'string' == typeof e ? t.parse(e, this) : e;
                },
              })),
              S = (t.kdf = {}),
              k = (S.OpenSSL = {
                execute: function (e, t, n, r) {
                  r || (r = i.random(8));
                  var o = l.create({ keySize: t + n }).compute(e, r),
                    s = i.create(o.words.slice(t), 4 * n);
                  return (o.sigBytes = 4 * t), h.create({ key: o, iv: s, salt: r });
                },
              }),
              M = (n.PasswordBasedCipher = T.extend({
                cfg: T.cfg.extend({ kdf: k }),
                encrypt: function (e, t, n, r) {
                  var o = (r = this.cfg.extend(r)).kdf.execute(n, e.keySize, e.ivSize);
                  r.iv = o.iv;
                  var i = T.encrypt.call(this, e, t, o.key, r);
                  return i.mixIn(o), i;
                },
                decrypt: function (e, t, n, r) {
                  (r = this.cfg.extend(r)), (t = this._parse(t, r.format));
                  var o = r.kdf.execute(n, e.keySize, e.ivSize, t.salt);
                  r.iv = o.iv;
                  var i = T.decrypt.call(this, e, t, o.key, r);
                  return i;
                },
              }));
          })()
        ));
    },
    function (e, t, n) {
      (function (t, n) {
        /*!
         * @overview es6-promise - a tiny implementation of Promises/A+.
         * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
         * @license   Licensed under MIT license
         *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
         * @version   v4.2.8+1e68dce6
         */ var r;
        (r = function () {
          'use strict';
          function e(e) {
            return 'function' == typeof e;
          }
          var r = Array.isArray
              ? Array.isArray
              : function (e) {
                  return '[object Array]' === Object.prototype.toString.call(e);
                },
            o = 0,
            i = void 0,
            s = void 0,
            a = function (e, t) {
              (f[o] = e), (f[o + 1] = t), 2 === (o += 2) && (s ? s(y) : T());
            },
            c = 'undefined' != typeof window ? window : void 0,
            u = c || {},
            l = u.MutationObserver || u.WebKitMutationObserver,
            p = 'undefined' == typeof self && void 0 !== t && '[object process]' === {}.toString.call(t),
            m = 'undefined' != typeof Uint8ClampedArray && 'undefined' != typeof importScripts && 'undefined' != typeof MessageChannel;
          function d() {
            var e = setTimeout;
            return function () {
              return e(y, 1);
            };
          }
          var f = new Array(1e3);
          function y() {
            for (var e = 0; e < o; e += 2) {
              (0, f[e])(f[e + 1]), (f[e] = void 0), (f[e + 1] = void 0);
            }
            o = 0;
          }
          var g,
            h,
            v,
            b,
            T = void 0;
          function S(e, t) {
            var n = this,
              r = new this.constructor(x);
            void 0 === r[M] && F(r);
            var o = n._state;
            if (o) {
              var i = arguments[o - 1];
              a(function () {
                return L(o, r, i, n._result);
              });
            } else N(n, r, e, t);
            return r;
          }
          function k(e) {
            if (e && 'object' == typeof e && e.constructor === this) return e;
            var t = new this(x);
            return O(t, e), t;
          }
          p
            ? (T = function () {
                return t.nextTick(y);
              })
            : l
            ? ((h = 0),
              (v = new l(y)),
              (b = document.createTextNode('')),
              v.observe(b, { characterData: !0 }),
              (T = function () {
                b.data = h = ++h % 2;
              }))
            : m
            ? (((g = new MessageChannel()).port1.onmessage = y),
              (T = function () {
                return g.port2.postMessage(0);
              }))
            : (T =
                void 0 === c
                  ? (function () {
                      try {
                        var e = Function('return this')().require('vertx');
                        return void 0 !== (i = e.runOnLoop || e.runOnContext)
                          ? function () {
                              i(y);
                            }
                          : d();
                      } catch (e) {
                        return d();
                      }
                    })()
                  : d());
          var M = Math.random().toString(36).substring(2);
          function x() {}
          var _ = void 0,
            w = 1,
            C = 2;
          function P(t, n, r) {
            n.constructor === t.constructor && r === S && n.constructor.resolve === k
              ? (function (e, t) {
                  t._state === w
                    ? I(e, t._result)
                    : t._state === C
                    ? E(e, t._result)
                    : N(
                        t,
                        void 0,
                        function (t) {
                          return O(e, t);
                        },
                        function (t) {
                          return E(e, t);
                        }
                      );
                })(t, n)
              : void 0 === r
              ? I(t, n)
              : e(r)
              ? (function (e, t, n) {
                  a(function (e) {
                    var r = !1,
                      o = (function (e, t, n, r) {
                        try {
                          e.call(t, n, r);
                        } catch (e) {
                          return e;
                        }
                      })(
                        n,
                        t,
                        function (n) {
                          r || ((r = !0), t !== n ? O(e, n) : I(e, n));
                        },
                        function (t) {
                          r || ((r = !0), E(e, t));
                        },
                        e._label
                      );
                    !r && o && ((r = !0), E(e, o));
                  }, e);
                })(t, n, r)
              : I(t, n);
          }
          function O(e, t) {
            if (e === t) E(e, new TypeError('You cannot resolve a promise with itself'));
            else if (((o = typeof (r = t)), null === r || ('object' !== o && 'function' !== o))) I(e, t);
            else {
              var n = void 0;
              try {
                n = t.then;
              } catch (t) {
                return void E(e, t);
              }
              P(e, t, n);
            }
            var r, o;
          }
          function A(e) {
            e._onerror && e._onerror(e._result), j(e);
          }
          function I(e, t) {
            e._state === _ && ((e._result = t), (e._state = w), 0 !== e._subscribers.length && a(j, e));
          }
          function E(e, t) {
            e._state === _ && ((e._state = C), (e._result = t), a(A, e));
          }
          function N(e, t, n, r) {
            var o = e._subscribers,
              i = o.length;
            (e._onerror = null), (o[i] = t), (o[i + w] = n), (o[i + C] = r), 0 === i && e._state && a(j, e);
          }
          function j(e) {
            var t = e._subscribers,
              n = e._state;
            if (0 !== t.length) {
              for (var r = void 0, o = void 0, i = e._result, s = 0; s < t.length; s += 3) (r = t[s]), (o = t[s + n]), r ? L(n, r, o, i) : o(i);
              e._subscribers.length = 0;
            }
          }
          function L(t, n, r, o) {
            var i = e(r),
              s = void 0,
              a = void 0,
              c = !0;
            if (i) {
              try {
                s = r(o);
              } catch (e) {
                (c = !1), (a = e);
              }
              if (n === s) return void E(n, new TypeError('A promises callback cannot return that same promise.'));
            } else s = o;
            n._state !== _ || (i && c ? O(n, s) : !1 === c ? E(n, a) : t === w ? I(n, s) : t === C && E(n, s));
          }
          var D = 0;
          function F(e) {
            (e[M] = D++), (e._state = void 0), (e._result = void 0), (e._subscribers = []);
          }
          var R = (function () {
              function e(e, t) {
                (this._instanceConstructor = e),
                  (this.promise = new e(x)),
                  this.promise[M] || F(this.promise),
                  r(t)
                    ? ((this.length = t.length),
                      (this._remaining = t.length),
                      (this._result = new Array(this.length)),
                      0 === this.length
                        ? I(this.promise, this._result)
                        : ((this.length = this.length || 0), this._enumerate(t), 0 === this._remaining && I(this.promise, this._result)))
                    : E(this.promise, new Error('Array Methods must be provided an Array'));
              }
              return (
                (e.prototype._enumerate = function (e) {
                  for (var t = 0; this._state === _ && t < e.length; t++) this._eachEntry(e[t], t);
                }),
                (e.prototype._eachEntry = function (e, t) {
                  var n = this._instanceConstructor,
                    r = n.resolve;
                  if (r === k) {
                    var o = void 0,
                      i = void 0,
                      s = !1;
                    try {
                      o = e.then;
                    } catch (e) {
                      (s = !0), (i = e);
                    }
                    if (o === S && e._state !== _) this._settledAt(e._state, t, e._result);
                    else if ('function' != typeof o) this._remaining--, (this._result[t] = e);
                    else if (n === U) {
                      var a = new n(x);
                      s ? E(a, i) : P(a, e, o), this._willSettleAt(a, t);
                    } else
                      this._willSettleAt(
                        new n(function (t) {
                          return t(e);
                        }),
                        t
                      );
                  } else this._willSettleAt(r(e), t);
                }),
                (e.prototype._settledAt = function (e, t, n) {
                  var r = this.promise;
                  r._state === _ && (this._remaining--, e === C ? E(r, n) : (this._result[t] = n)), 0 === this._remaining && I(r, this._result);
                }),
                (e.prototype._willSettleAt = function (e, t) {
                  var n = this;
                  N(
                    e,
                    void 0,
                    function (e) {
                      return n._settledAt(w, t, e);
                    },
                    function (e) {
                      return n._settledAt(C, t, e);
                    }
                  );
                }),
                e
              );
            })(),
            U = (function () {
              function t(e) {
                (this[M] = D++),
                  (this._result = this._state = void 0),
                  (this._subscribers = []),
                  x !== e &&
                    ('function' != typeof e &&
                      (function () {
                        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
                      })(),
                    this instanceof t
                      ? (function (e, t) {
                          try {
                            t(
                              function (t) {
                                O(e, t);
                              },
                              function (t) {
                                E(e, t);
                              }
                            );
                          } catch (t) {
                            E(e, t);
                          }
                        })(this, e)
                      : (function () {
                          throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
                        })());
              }
              return (
                (t.prototype.catch = function (e) {
                  return this.then(null, e);
                }),
                (t.prototype.finally = function (t) {
                  var n = this.constructor;
                  return e(t)
                    ? this.then(
                        function (e) {
                          return n.resolve(t()).then(function () {
                            return e;
                          });
                        },
                        function (e) {
                          return n.resolve(t()).then(function () {
                            throw e;
                          });
                        }
                      )
                    : this.then(t, t);
                }),
                t
              );
            })();
          return (
            (U.prototype.then = S),
            (U.all = function (e) {
              return new R(this, e).promise;
            }),
            (U.race = function (e) {
              var t = this;
              return r(e)
                ? new t(function (n, r) {
                    for (var o = e.length, i = 0; i < o; i++) t.resolve(e[i]).then(n, r);
                  })
                : new t(function (e, t) {
                    return t(new TypeError('You must pass an array to race.'));
                  });
            }),
            (U.resolve = k),
            (U.reject = function (e) {
              var t = new this(x);
              return E(t, e), t;
            }),
            (U._setScheduler = function (e) {
              s = e;
            }),
            (U._setAsap = function (e) {
              a = e;
            }),
            (U._asap = a),
            (U.polyfill = function () {
              var e = void 0;
              if (void 0 !== n) e = n;
              else if ('undefined' != typeof self) e = self;
              else
                try {
                  e = Function('return this')();
                } catch (e) {
                  throw new Error('polyfill failed because global object is unavailable in this environment');
                }
              var t = e.Promise;
              if (t) {
                var r = null;
                try {
                  r = Object.prototype.toString.call(t.resolve());
                } catch (e) {}
                if ('[object Promise]' === r && !t.cast) return;
              }
              e.Promise = U;
            }),
            (U.Promise = U),
            U
          );
        }),
          (e.exports = r());
      }).call(this, n(116), n(20));
    },
    function (e, t) {
      var n,
        r,
        o = (e.exports = {});
      function i() {
        throw new Error('setTimeout has not been defined');
      }
      function s() {
        throw new Error('clearTimeout has not been defined');
      }
      function a(e) {
        if (n === setTimeout) return setTimeout(e, 0);
        if ((n === i || !n) && setTimeout) return (n = setTimeout), setTimeout(e, 0);
        try {
          return n(e, 0);
        } catch (t) {
          try {
            return n.call(null, e, 0);
          } catch (t) {
            return n.call(this, e, 0);
          }
        }
      }
      !(function () {
        try {
          n = 'function' == typeof setTimeout ? setTimeout : i;
        } catch (e) {
          n = i;
        }
        try {
          r = 'function' == typeof clearTimeout ? clearTimeout : s;
        } catch (e) {
          r = s;
        }
      })();
      var c,
        u = [],
        l = !1,
        p = -1;
      function m() {
        l && c && ((l = !1), c.length ? (u = c.concat(u)) : (p = -1), u.length && d());
      }
      function d() {
        if (!l) {
          var e = a(m);
          l = !0;
          for (var t = u.length; t; ) {
            for (c = u, u = []; ++p < t; ) c && c[p].run();
            (p = -1), (t = u.length);
          }
          (c = null),
            (l = !1),
            (function (e) {
              if (r === clearTimeout) return clearTimeout(e);
              if ((r === s || !r) && clearTimeout) return (r = clearTimeout), clearTimeout(e);
              try {
                r(e);
              } catch (t) {
                try {
                  return r.call(null, e);
                } catch (t) {
                  return r.call(this, e);
                }
              }
            })(e);
        }
      }
      function f(e, t) {
        (this.fun = e), (this.array = t);
      }
      function y() {}
      (o.nextTick = function (e) {
        var t = new Array(arguments.length - 1);
        if (arguments.length > 1) for (var n = 1; n < arguments.length; n++) t[n - 1] = arguments[n];
        u.push(new f(e, t)), 1 !== u.length || l || a(d);
      }),
        (f.prototype.run = function () {
          this.fun.apply(null, this.array);
        }),
        (o.title = 'browser'),
        (o.browser = !0),
        (o.env = {}),
        (o.argv = []),
        (o.version = ''),
        (o.versions = {}),
        (o.on = y),
        (o.addListener = y),
        (o.once = y),
        (o.off = y),
        (o.removeListener = y),
        (o.removeAllListeners = y),
        (o.emit = y),
        (o.prependListener = y),
        (o.prependOnceListener = y),
        (o.listeners = function (e) {
          return [];
        }),
        (o.binding = function (e) {
          throw new Error('process.binding is not supported');
        }),
        (o.cwd = function () {
          return '/';
        }),
        (o.chdir = function (e) {
          throw new Error('process.chdir is not supported');
        }),
        (o.umask = function () {
          return 0;
        });
    },
    function (e, t, n) {
      e.exports = { default: n(118), __esModule: !0 };
    },
    function (e, t, n) {
      n(119), (e.exports = n(8).Object.assign);
    },
    function (e, t, n) {
      var r = n(26);
      r(r.S + r.F, 'Object', { assign: n(120) });
    },
    function (e, t, n) {
      'use strict';
      var r = n(14),
        o = n(38),
        i = n(56),
        s = n(40),
        a = n(41),
        c = n(81),
        u = Object.assign;
      e.exports =
        !u ||
        n(31)(function () {
          var e = {},
            t = {},
            n = Symbol(),
            r = 'abcdefghijklmnopqrst';
          return (
            (e[n] = 7),
            r.split('').forEach(function (e) {
              t[e] = e;
            }),
            7 != u({}, e)[n] || Object.keys(u({}, t)).join('') != r
          );
        })
          ? function (e, t) {
              for (var n = a(e), u = arguments.length, l = 1, p = i.f, m = s.f; u > l; )
                for (var d, f = c(arguments[l++]), y = p ? o(f).concat(p(f)) : o(f), g = y.length, h = 0; g > h; ) (d = y[h++]), (r && !m.call(f, d)) || (n[d] = f[d]);
              return n;
            }
          : u;
    },
    function (e, t, n) {
      var r = n(27),
        o = n(68),
        i = n(122);
      e.exports = function (e) {
        return function (t, n, s) {
          var a,
            c = r(t),
            u = o(c.length),
            l = i(s, u);
          if (e && n != n) {
            for (; u > l; ) if ((a = c[l++]) != a) return !0;
          } else for (; u > l; l++) if ((e || l in c) && c[l] === n) return e || l || 0;
          return !e && -1;
        };
      };
    },
    function (e, t, n) {
      var r = n(52),
        o = Math.max,
        i = Math.min;
      e.exports = function (e, t) {
        return (e = r(e)) < 0 ? o(e + t, 0) : i(e, t);
      };
    },
    function (e, t, n) {
      e.exports = { default: n(124), __esModule: !0 };
    },
    function (e, t, n) {
      n(35), n(45), (e.exports = n(57).f('iterator'));
    },
    function (e, t, n) {
      var r = n(52),
        o = n(51);
      e.exports = function (e) {
        return function (t, n) {
          var i,
            s,
            a = String(o(t)),
            c = r(n),
            u = a.length;
          return c < 0 || c >= u
            ? e
              ? ''
              : void 0
            : (i = a.charCodeAt(c)) < 55296 || i > 56319 || c + 1 === u || (s = a.charCodeAt(c + 1)) < 56320 || s > 57343
            ? e
              ? a.charAt(c)
              : i
            : e
            ? a.slice(c, c + 2)
            : s - 56320 + ((i - 55296) << 10) + 65536;
        };
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(84),
        o = n(32),
        i = n(44),
        s = {};
      n(22)(s, n(4)('iterator'), function () {
        return this;
      }),
        (e.exports = function (e, t, n) {
          (e.prototype = r(s, { next: o(1, n) })), i(e, t + ' Iterator');
        });
    },
    function (e, t, n) {
      var r = n(13),
        o = n(12),
        i = n(38);
      e.exports = n(14)
        ? Object.defineProperties
        : function (e, t) {
            o(e);
            for (var n, s = i(t), a = s.length, c = 0; a > c; ) r.f(e, (n = s[c++]), t[n]);
            return e;
          };
    },
    function (e, t, n) {
      var r = n(19),
        o = n(41),
        i = n(53)('IE_PROTO'),
        s = Object.prototype;
      e.exports =
        Object.getPrototypeOf ||
        function (e) {
          return (e = o(e)), r(e, i) ? e[i] : 'function' == typeof e.constructor && e instanceof e.constructor ? e.constructor.prototype : e instanceof Object ? s : null;
        };
    },
    function (e, t, n) {
      'use strict';
      var r = n(130),
        o = n(131),
        i = n(28),
        s = n(27);
      (e.exports = n(82)(
        Array,
        'Array',
        function (e, t) {
          (this._t = s(e)), (this._i = 0), (this._k = t);
        },
        function () {
          var e = this._t,
            t = this._k,
            n = this._i++;
          return !e || n >= e.length ? ((this._t = void 0), o(1)) : o(0, 'keys' == t ? n : 'values' == t ? e[n] : [n, e[n]]);
        },
        'values'
      )),
        (i.Arguments = i.Array),
        r('keys'),
        r('values'),
        r('entries');
    },
    function (e, t) {
      e.exports = function () {};
    },
    function (e, t) {
      e.exports = function (e, t) {
        return { value: t, done: !!e };
      };
    },
    function (e, t, n) {
      e.exports = { default: n(133), __esModule: !0 };
    },
    function (e, t, n) {
      n(134), n(102), n(140), n(141), (e.exports = n(8).Symbol);
    },
    function (e, t, n) {
      'use strict';
      var r = n(7),
        o = n(19),
        i = n(14),
        s = n(26),
        a = n(83),
        c = n(135).KEY,
        u = n(31),
        l = n(54),
        p = n(44),
        m = n(39),
        d = n(4),
        f = n(57),
        y = n(58),
        g = n(136),
        h = n(137),
        v = n(12),
        b = n(23),
        T = n(41),
        S = n(27),
        k = n(50),
        M = n(32),
        x = n(84),
        _ = n(138),
        w = n(139),
        C = n(56),
        P = n(13),
        O = n(38),
        A = w.f,
        I = P.f,
        E = _.f,
        N = r.Symbol,
        j = r.JSON,
        L = j && j.stringify,
        D = d('_hidden'),
        F = d('toPrimitive'),
        R = {}.propertyIsEnumerable,
        U = l('symbol-registry'),
        B = l('symbols'),
        q = l('op-symbols'),
        H = Object.prototype,
        $ = 'function' == typeof N && !!C.f,
        z = r.QObject,
        W = !z || !z.prototype || !z.prototype.findChild,
        J =
          i &&
          u(function () {
            return (
              7 !=
              x(
                I({}, 'a', {
                  get: function () {
                    return I(this, 'a', { value: 7 }).a;
                  },
                })
              ).a
            );
          })
            ? function (e, t, n) {
                var r = A(H, t);
                r && delete H[t], I(e, t, n), r && e !== H && I(H, t, r);
              }
            : I,
        V = function (e) {
          var t = (B[e] = x(N.prototype));
          return (t._k = e), t;
        },
        G =
          $ && 'symbol' == typeof N.iterator
            ? function (e) {
                return 'symbol' == typeof e;
              }
            : function (e) {
                return e instanceof N;
              },
        K = function (e, t, n) {
          return (
            e === H && K(q, t, n),
            v(e),
            (t = k(t, !0)),
            v(n),
            o(B, t)
              ? (n.enumerable ? (o(e, D) && e[D][t] && (e[D][t] = !1), (n = x(n, { enumerable: M(0, !1) }))) : (o(e, D) || I(e, D, M(1, {})), (e[D][t] = !0)), J(e, t, n))
              : I(e, t, n)
          );
        },
        X = function (e, t) {
          v(e);
          for (var n, r = g((t = S(t))), o = 0, i = r.length; i > o; ) K(e, (n = r[o++]), t[n]);
          return e;
        },
        Q = function (e) {
          var t = R.call(this, (e = k(e, !0)));
          return !(this === H && o(B, e) && !o(q, e)) && (!(t || !o(this, e) || !o(B, e) || (o(this, D) && this[D][e])) || t);
        },
        Y = function (e, t) {
          if (((e = S(e)), (t = k(t, !0)), e !== H || !o(B, t) || o(q, t))) {
            var n = A(e, t);
            return !n || !o(B, t) || (o(e, D) && e[D][t]) || (n.enumerable = !0), n;
          }
        },
        Z = function (e) {
          for (var t, n = E(S(e)), r = [], i = 0; n.length > i; ) o(B, (t = n[i++])) || t == D || t == c || r.push(t);
          return r;
        },
        ee = function (e) {
          for (var t, n = e === H, r = E(n ? q : S(e)), i = [], s = 0; r.length > s; ) !o(B, (t = r[s++])) || (n && !o(H, t)) || i.push(B[t]);
          return i;
        };
      $ ||
        (a(
          (N = function () {
            if (this instanceof N) throw TypeError('Symbol is not a constructor!');
            var e = m(arguments.length > 0 ? arguments[0] : void 0),
              t = function (n) {
                this === H && t.call(q, n), o(this, D) && o(this[D], e) && (this[D][e] = !1), J(this, e, M(1, n));
              };
            return i && W && J(H, e, { configurable: !0, set: t }), V(e);
          }).prototype,
          'toString',
          function () {
            return this._k;
          }
        ),
        (w.f = Y),
        (P.f = K),
        (n(85).f = _.f = Z),
        (n(40).f = Q),
        (C.f = ee),
        i && !n(34) && a(H, 'propertyIsEnumerable', Q, !0),
        (f.f = function (e) {
          return V(d(e));
        })),
        s(s.G + s.W + s.F * !$, { Symbol: N });
      for (var te = 'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'.split(','), ne = 0; te.length > ne; )
        d(te[ne++]);
      for (var re = O(d.store), oe = 0; re.length > oe; ) y(re[oe++]);
      s(s.S + s.F * !$, 'Symbol', {
        for: function (e) {
          return o(U, (e += '')) ? U[e] : (U[e] = N(e));
        },
        keyFor: function (e) {
          if (!G(e)) throw TypeError(e + ' is not a symbol!');
          for (var t in U) if (U[t] === e) return t;
        },
        useSetter: function () {
          W = !0;
        },
        useSimple: function () {
          W = !1;
        },
      }),
        s(s.S + s.F * !$, 'Object', {
          create: function (e, t) {
            return void 0 === t ? x(e) : X(x(e), t);
          },
          defineProperty: K,
          defineProperties: X,
          getOwnPropertyDescriptor: Y,
          getOwnPropertyNames: Z,
          getOwnPropertySymbols: ee,
        });
      var ie = u(function () {
        C.f(1);
      });
      s(s.S + s.F * ie, 'Object', {
        getOwnPropertySymbols: function (e) {
          return C.f(T(e));
        },
      }),
        j &&
          s(
            s.S +
              s.F *
                (!$ ||
                  u(function () {
                    var e = N();
                    return '[null]' != L([e]) || '{}' != L({ a: e }) || '{}' != L(Object(e));
                  })),
            'JSON',
            {
              stringify: function (e) {
                for (var t, n, r = [e], o = 1; arguments.length > o; ) r.push(arguments[o++]);
                if (((n = t = r[1]), (b(t) || void 0 !== e) && !G(e)))
                  return (
                    h(t) ||
                      (t = function (e, t) {
                        if (('function' == typeof n && (t = n.call(this, e, t)), !G(t))) return t;
                      }),
                    (r[1] = t),
                    L.apply(j, r)
                  );
              },
            }
          ),
        N.prototype[F] || n(22)(N.prototype, F, N.prototype.valueOf),
        p(N, 'Symbol'),
        p(Math, 'Math', !0),
        p(r.JSON, 'JSON', !0);
    },
    function (e, t, n) {
      var r = n(39)('meta'),
        o = n(23),
        i = n(19),
        s = n(13).f,
        a = 0,
        c =
          Object.isExtensible ||
          function () {
            return !0;
          },
        u = !n(31)(function () {
          return c(Object.preventExtensions({}));
        }),
        l = function (e) {
          s(e, r, { value: { i: 'O' + ++a, w: {} } });
        },
        p = (e.exports = {
          KEY: r,
          NEED: !1,
          fastKey: function (e, t) {
            if (!o(e)) return 'symbol' == typeof e ? e : ('string' == typeof e ? 'S' : 'P') + e;
            if (!i(e, r)) {
              if (!c(e)) return 'F';
              if (!t) return 'E';
              l(e);
            }
            return e[r].i;
          },
          getWeak: function (e, t) {
            if (!i(e, r)) {
              if (!c(e)) return !0;
              if (!t) return !1;
              l(e);
            }
            return e[r].w;
          },
          onFreeze: function (e) {
            return u && p.NEED && c(e) && !i(e, r) && l(e), e;
          },
        });
    },
    function (e, t, n) {
      var r = n(38),
        o = n(56),
        i = n(40);
      e.exports = function (e) {
        var t = r(e),
          n = o.f;
        if (n) for (var s, a = n(e), c = i.f, u = 0; a.length > u; ) c.call(e, (s = a[u++])) && t.push(s);
        return t;
      };
    },
    function (e, t, n) {
      var r = n(36);
      e.exports =
        Array.isArray ||
        function (e) {
          return 'Array' == r(e);
        };
    },
    function (e, t, n) {
      var r = n(27),
        o = n(85).f,
        i = {}.toString,
        s = 'object' == typeof window && window && Object.getOwnPropertyNames ? Object.getOwnPropertyNames(window) : [];
      e.exports.f = function (e) {
        return s && '[object Window]' == i.call(e)
          ? (function (e) {
              try {
                return o(e);
              } catch (e) {
                return s.slice();
              }
            })(e)
          : o(r(e));
      };
    },
    function (e, t, n) {
      var r = n(40),
        o = n(32),
        i = n(27),
        s = n(50),
        a = n(19),
        c = n(79),
        u = Object.getOwnPropertyDescriptor;
      t.f = n(14)
        ? u
        : function (e, t) {
            if (((e = i(e)), (t = s(t, !0)), c))
              try {
                return u(e, t);
              } catch (e) {}
            if (a(e, t)) return o(!r.f.call(e, t), e[t]);
          };
    },
    function (e, t, n) {
      n(58)('asyncIterator');
    },
    function (e, t, n) {
      n(58)('observable');
    },
    function (e, t, n) {
      'use strict';
      var r = n(1);
      'undefined' != typeof window &&
        (window.console || r.isWeixinApp || (window.console = { log: function () {}, info: function () {}, warn: function () {}, error: function () {} }));
    },
    function (e, t, n) {
      e.exports = { default: n(144), __esModule: !0 };
    },
    function (e, t, n) {
      n(35), n(145), (e.exports = n(8).Array.from);
    },
    function (e, t, n) {
      'use strict';
      var r = n(37),
        o = n(26),
        i = n(41),
        s = n(103),
        a = n(104),
        c = n(68),
        u = n(146),
        l = n(71);
      o(
        o.S +
          o.F *
            !n(105)(function (e) {
              Array.from(e);
            }),
        'Array',
        {
          from: function (e) {
            var t,
              n,
              o,
              p,
              m = i(e),
              d = 'function' == typeof this ? this : Array,
              f = arguments.length,
              y = f > 1 ? arguments[1] : void 0,
              g = void 0 !== y,
              h = 0,
              v = l(m);
            if ((g && (y = r(y, f > 2 ? arguments[2] : void 0, 2)), null == v || (d == Array && a(v))))
              for (n = new d((t = c(m.length))); t > h; h++) u(n, h, g ? y(m[h], h) : m[h]);
            else for (p = v.call(m), n = new d(); !(o = p.next()).done; h++) u(n, h, g ? s(p, y, [o.value, h], !0) : o.value);
            return (n.length = h), n;
          },
        }
      );
    },
    function (e, t, n) {
      'use strict';
      var r = n(13),
        o = n(32);
      e.exports = function (e, t, n) {
        t in e ? r.f(e, t, o(0, n)) : (e[t] = n);
      };
    },
    function (e, t, n) {
      'use strict';
      var r = Object.prototype.hasOwnProperty,
        o = '~';
      function i() {}
      function s(e, t, n) {
        (this.fn = e), (this.context = t), (this.once = n || !1);
      }
      function a() {
        (this._events = new i()), (this._eventsCount = 0);
      }
      Object.create && ((i.prototype = Object.create(null)), new i().__proto__ || (o = !1)),
        (a.prototype.eventNames = function () {
          var e,
            t,
            n = [];
          if (0 === this._eventsCount) return n;
          for (t in (e = this._events)) r.call(e, t) && n.push(o ? t.slice(1) : t);
          return Object.getOwnPropertySymbols ? n.concat(Object.getOwnPropertySymbols(e)) : n;
        }),
        (a.prototype.listeners = function (e, t) {
          var n = o ? o + e : e,
            r = this._events[n];
          if (t) return !!r;
          if (!r) return [];
          if (r.fn) return [r.fn];
          for (var i = 0, s = r.length, a = new Array(s); i < s; i++) a[i] = r[i].fn;
          return a;
        }),
        (a.prototype.emit = function (e, t, n, r, i, s) {
          var a = o ? o + e : e;
          if (!this._events[a]) return !1;
          var c,
            u,
            l = this._events[a],
            p = arguments.length;
          if (l.fn) {
            switch ((l.once && this.removeListener(e, l.fn, void 0, !0), p)) {
              case 1:
                return l.fn.call(l.context), !0;
              case 2:
                return l.fn.call(l.context, t), !0;
              case 3:
                return l.fn.call(l.context, t, n), !0;
              case 4:
                return l.fn.call(l.context, t, n, r), !0;
              case 5:
                return l.fn.call(l.context, t, n, r, i), !0;
              case 6:
                return l.fn.call(l.context, t, n, r, i, s), !0;
            }
            for (u = 1, c = new Array(p - 1); u < p; u++) c[u - 1] = arguments[u];
            l.fn.apply(l.context, c);
          } else {
            var m,
              d = l.length;
            for (u = 0; u < d; u++)
              switch ((l[u].once && this.removeListener(e, l[u].fn, void 0, !0), p)) {
                case 1:
                  l[u].fn.call(l[u].context);
                  break;
                case 2:
                  l[u].fn.call(l[u].context, t);
                  break;
                case 3:
                  l[u].fn.call(l[u].context, t, n);
                  break;
                case 4:
                  l[u].fn.call(l[u].context, t, n, r);
                  break;
                default:
                  if (!c) for (m = 1, c = new Array(p - 1); m < p; m++) c[m - 1] = arguments[m];
                  l[u].fn.apply(l[u].context, c);
              }
          }
          return !0;
        }),
        (a.prototype.on = function (e, t, n) {
          var r = new s(t, n || this),
            i = o ? o + e : e;
          return (
            this._events[i] ? (this._events[i].fn ? (this._events[i] = [this._events[i], r]) : this._events[i].push(r)) : ((this._events[i] = r), this._eventsCount++),
            this
          );
        }),
        (a.prototype.once = function (e, t, n) {
          var r = new s(t, n || this, !0),
            i = o ? o + e : e;
          return (
            this._events[i] ? (this._events[i].fn ? (this._events[i] = [this._events[i], r]) : this._events[i].push(r)) : ((this._events[i] = r), this._eventsCount++),
            this
          );
        }),
        (a.prototype.removeListener = function (e, t, n, r) {
          var s = o ? o + e : e;
          if (!this._events[s]) return this;
          if (!t) return 0 == --this._eventsCount ? (this._events = new i()) : delete this._events[s], this;
          var a = this._events[s];
          if (a.fn) a.fn !== t || (r && !a.once) || (n && a.context !== n) || (0 == --this._eventsCount ? (this._events = new i()) : delete this._events[s]);
          else {
            for (var c = 0, u = [], l = a.length; c < l; c++) (a[c].fn !== t || (r && !a[c].once) || (n && a[c].context !== n)) && u.push(a[c]);
            u.length ? (this._events[s] = 1 === u.length ? u[0] : u) : 0 == --this._eventsCount ? (this._events = new i()) : delete this._events[s];
          }
          return this;
        }),
        (a.prototype.removeAllListeners = function (e) {
          var t;
          return (
            e
              ? ((t = o ? o + e : e), this._events[t] && (0 == --this._eventsCount ? (this._events = new i()) : delete this._events[t]))
              : ((this._events = new i()), (this._eventsCount = 0)),
            this
          );
        }),
        (a.prototype.off = a.prototype.removeListener),
        (a.prototype.addListener = a.prototype.on),
        (a.prototype.setMaxListeners = function () {
          return this;
        }),
        (a.prefixed = o),
        (a.EventEmitter = a),
        (e.exports = a);
    },
    function (e, t, n) {
      'use strict';
      var r = n(16),
        o = n(0),
        i = n(1),
        s = n(9),
        a = n(149);
      function c() {
        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
        o.merge(this, { options: e, debug: !1, api: 'log', style: 'color:blue;', log: o.emptyFunc, info: o.emptyFunc, warn: o.emptyFunc, error: o.emptyFunc }),
          (this.prefix = e.prefix || ''),
          (this.localEnable = a.enable && e.dbLog && e.account),
          this.setDebug(e.debug),
          this.localEnable && ((this._local = new a(e.account, e.expire)), (this._local.logError = this.error));
      }
      var u = c.prototype,
        l = ['Chrome', 'Safari', 'Firefox'];
      (u.setDebug = function () {
        var e = arguments.length > 0 && void 0 !== arguments[0] && arguments[0],
          t = this;
        if (((t.debug = e), e.style && (t.style = e.style), o.exist(console)))
          if (t.debug) {
            var n = console;
            (t.debug = function () {
              var e = t.formatArgsAndSave(arguments, 'debug');
              -1 !== l.indexOf(r.name) && o.isString(e[0]) && ((e[0] = '%c' + e[0]), e.splice(1, 0, t.style)), t._log('debug', e);
            }),
              (t.log = function () {
                var e = t.formatArgsAndSave(arguments, 'log');
                -1 !== l.indexOf(r.name) && o.isString(e[0]) && ((e[0] = '%c' + e[0]), e.splice(1, 0, t.style)), t._log('log', e);
              }),
              (t.info = function () {
                var e = t.formatArgsAndSave(arguments, 'info');
                -1 !== l.indexOf(r.name) && o.isString(e[0]) && ((e[0] = '%c' + e[0]), e.splice(1, 0, t.style)), t._log('info', e);
              }),
              (t.warn = function () {
                var e = t.formatArgsAndSave(arguments, 'warn');
                -1 !== l.indexOf(r.name) && o.isString(e[0]) && ((e[0] = '%c' + e[0]), e.splice(1, 0, t.style)), t._log('warn', e);
              }),
              (t.error = function () {
                var e = t.formatArgsAndSave(arguments, 'error');
                -1 !== l.indexOf(r.name) && o.isString(e[0]) && ((e[0] = '%c' + e[0]), e.splice(1, 0, t.style)), t._log('error', e);
              }),
              t.options.logFunc
                ? (t._log = function () {})
                : (t._log = function (e, r) {
                    if (n[e])
                      try {
                        n[e].apply ? t.chrome(e, r) : t.ie(e, r);
                      } catch (e) {}
                  }),
              (t.chrome = function (e, o) {
                -1 !== l.indexOf(r.name) ? n[e].apply(n, o) : t.ie(e, o);
              }),
              (t.ie = function (e, t) {
                t.forEach(function (t) {
                  n[e](JSON.stringify(t, null, 4));
                });
              });
          } else if (i.isRN || this.localEnable || this.options.logFunc) {
            var s = !i.isRN && !this.localEnable;
            (t.log = function () {
              t.formatArgsAndSave(arguments, 'log', s);
            }),
              (t.info = function () {
                t.formatArgsAndSave(arguments, 'info', s);
              }),
              (t.warn = function () {
                t.formatArgsAndSave(arguments, 'warn', s);
              }),
              (t.error = function () {
                t.formatArgsAndSave(arguments, 'error', s);
              });
          }
      }),
        (u.setLogDisabled = function () {
          (this.localEnable = !1), (this.log = function () {}), (this.info = function () {}), (this.warn = function () {}), (this.error = function () {});
        }),
        (u.formatArgsAndSave = function (e, t, n) {
          e = [].slice.call(e, 0);
          var r = new Date(),
            i =
              '[NIM LOG ' +
              (p(r.getMonth() + 1) + '-' + p(r.getDate()) + ' ' + p(r.getHours()) + ':' + p(r.getMinutes()) + ':' + p(r.getSeconds()) + ':' + p(r.getMilliseconds(), 3)) +
              ' ' +
              this.prefix.toUpperCase() +
              ']  ',
            s = '';
          o.isString(e[0]) ? (e[0] = i + e[0]) : e.splice(0, 0, i),
            e.forEach(function (t, n) {
              o.isArray(t) || o.isObject(t) ? ((e[n] = o.simpleClone(t)), (s += JSON.stringify(e[n]) + ' ')) : (s += t + ' ');
            });
          var a = this.options.logFunc;
          return a && o.isFunction(a[t]) && a[t].apply(a, e), !n && this.writeLocalLog(s, t, +r), e;
        }),
        (u.writeLocalLog = i.isRN
          ? function (e, t) {
              if (!(s.rnfs && s.rnfs.writeFile && s.rnfs.appendFile && s.rnfs.DocumentDirectoryPath)) return;
              if (!/error|warn|info/.test(t)) return;
              var n = s.rnfs,
                r = void 0,
                o = n.size / 2 - 256;
              function i(e) {
                return s.rnfs.DocumentDirectoryPath + '/nimlog_' + e + '.log';
              }
              (e += '\r\n'),
                (n.nimPromise = n.nimPromise
                  .then(function () {
                    return (r = i(n.nimIndex)), n.exists(r);
                  })
                  .then(function (t) {
                    return t ? n.appendFile(r, e) : n.writeFile(r, e);
                  })
                  .then(function () {
                    return n.stat(r);
                  })
                  .then(function (e) {
                    if (e.size > o)
                      return (
                        n.nimIndex++,
                        n.nimIndex > 1 && (n.nimIndex = n.nimIndex % 2),
                        n.unlink(i(n.nimIndex)).catch(function (e) {
                          return Promise.resolve();
                        })
                      );
                  })
                  .catch(function (e) {
                    console.error(e);
                  }));
            }
          : i.isBrowser
          ? function (e, t, n) {
              this._local && this._local.saveLog({ log: e, level: t, time: n });
            }
          : function () {});
      var p = function (e, t) {
        t = t || 2;
        for (var n = '' + e; n.length < t; ) n = '0' + n;
        return n;
      };
      e.exports = c;
    },
    function (e, t, n) {
      'use strict';
      var r = n(150),
        o = n(152),
        i = n(0).getGlobal(),
        s = n(16).name,
        a = 'function' == typeof r,
        c = i.indexedDB && !/^(IE)$/.test(s);
      function u(e, t) {
        (this.logWorker = null),
          (this.db = null),
          (this.logQueue = []),
          (this.callbackList = []),
          (this.preTime = null),
          (this.lastTime = +new Date()),
          this.initLogLocal({ name: e, expire: t });
      }
      var l = u.prototype;
      (u.enable = !0),
        (l.saveLog = function (e) {
          var t = this.logQueue.length,
            n = this.logQueue[t - 1];
          e.time !== this.preTime
            ? ((this.logQueue.length > 50 || (e.time - this.lastTime > 6e4 && this.logQueue.length > 0)) &&
                (this.doSaveLog(this.logQueue.slice(0)), (this.lastTime = n.time), (this.logQueue = [])),
              this.logQueue.push(e),
              (this.preTime = e.time))
            : (n.log += '\r\n' + e.log);
        }),
        (l.doSaveLog = function () {}),
        (l.initLogLocal = function () {}),
        (l.fetchLog = function () {}),
        (l.deleteLogs = function (e) {}),
        (l.logError = function () {}),
        c
          ? a
            ? ((l.doSaveLog = function (e) {
                this.logWorker.postMessage(e);
              }),
              (l.initLogLocal = function (e) {
                var t = this;
                (this.logWorker = new r({})),
                  (this.logWorker.onmessage = function (e) {
                    var n = e.data || {};
                    switch (n.type) {
                      case 'fetchDone':
                        t.fetchLogDone(n.code, n.msg);
                        break;
                      case 'error':
                        t.logError(n.msg);
                    }
                  }),
                  this.logWorker.postMessage({ type: 'init', msg: e });
              }),
              (l.fetchLog = function () {
                var e = this;
                return new Promise(function (t, n) {
                  0 === e.callbackList.length && e.logWorker.postMessage({ type: 'fetch' }), e.callbackList.push(t), e.callbackList.push(n);
                });
              }),
              (l.fetchLogDone = function (e, t) {
                for (var n = 200 === e ? 0 : 1, r = 0; r < this.callbackList.length / 2; r++) this.callbackList[2 * r + n](t);
                this.callbackList = [];
              }),
              (l.deleteLogs = function (e) {
                return this.logWorker.postMessage({ type: 'delete', msg: e }), Promise.resolve();
              }))
            : ((l.doSaveLog = function (e) {
                var t = this;
                this.db.putLog(e).catch(function (e) {
                  t.logError({ msg: 'putLog error', error: e });
                });
              }),
              (l.initLogLocal = function (e) {
                var t = this;
                (this.db = new o(e)),
                  this.db.init().catch(function (e) {
                    t.logError({ msg: 'dbLog init error', error: e });
                  });
              }),
              (l.fetchLog = function () {
                return this.db.getAllLogs();
              }),
              (l.deleteLogs = function (e) {
                return this.db.deleteLogs(e);
              }))
          : (u.enable = !1),
        (e.exports = u);
    },
    function (e, t, n) {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.default = function () {
          return (0, i.default)(
            '!function(t){var e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(r,o,function(e){return t[e]}.bind(null,o));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=37)}([function(t,e){var n=t.exports="undefined"!=typeof window&&window.Math==Math?window:"undefined"!=typeof self&&self.Math==Math?self:Function("return this")();"number"==typeof __g&&(__g=n)},function(t,e){var n={}.hasOwnProperty;t.exports=function(t,e){return n.call(t,e)}},function(t,e,n){var r=n(3),o=n(12);t.exports=n(4)?function(t,e,n){return r.f(t,e,o(1,n))}:function(t,e,n){return t[e]=n,t}},function(t,e,n){var r=n(10),o=n(28),i=n(16),u=Object.defineProperty;e.f=n(4)?Object.defineProperty:function(t,e,n){if(r(t),e=i(e,!0),r(n),o)try{return u(t,e,n)}catch(t){}if("get"in n||"set"in n)throw TypeError("Accessors not supported!");return"value"in n&&(t[e]=n.value),t}},function(t,e,n){t.exports=!n(11)(function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a})},function(t,e,n){var r=n(50),o=n(15);t.exports=function(t){return r(o(t))}},function(t,e,n){var r=n(20)("wks"),o=n(13),i=n(0).Symbol,u="function"==typeof i;(t.exports=function(t){return r[t]||(r[t]=u&&i[t]||(u?i:o)("Symbol."+t))}).store=r},function(t,e){t.exports=function(t){return"object"==typeof t?null!==t:"function"==typeof t}},function(t,e){t.exports=!0},function(t,e){var n=t.exports={version:"2.6.9"};"number"==typeof __e&&(__e=n)},function(t,e,n){var r=n(7);t.exports=function(t){if(!r(t))throw TypeError(t+" is not an object!");return t}},function(t,e){t.exports=function(t){try{return!!t()}catch(t){return!0}}},function(t,e){t.exports=function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}},function(t,e){var n=0,r=Math.random();t.exports=function(t){return"Symbol(".concat(void 0===t?"":t,")_",(++n+r).toString(36))}},function(t,e){var n=Math.ceil,r=Math.floor;t.exports=function(t){return isNaN(t=+t)?0:(t>0?r:n)(t)}},function(t,e){t.exports=function(t){if(null==t)throw TypeError("Can\'t call method on  "+t);return t}},function(t,e,n){var r=n(7);t.exports=function(t,e){if(!r(t))return t;var n,o;if(e&&"function"==typeof(n=t.toString)&&!r(o=n.call(t)))return o;if("function"==typeof(n=t.valueOf)&&!r(o=n.call(t)))return o;if(!e&&"function"==typeof(n=t.toString)&&!r(o=n.call(t)))return o;throw TypeError("Can\'t convert object to primitive value")}},function(t,e){t.exports={}},function(t,e,n){var r=n(32),o=n(21);t.exports=Object.keys||function(t){return r(t,o)}},function(t,e,n){var r=n(20)("keys"),o=n(13);t.exports=function(t){return r[t]||(r[t]=o(t))}},function(t,e,n){var r=n(9),o=n(0),i=o["__core-js_shared__"]||(o["__core-js_shared__"]={});(t.exports=function(t,e){return i[t]||(i[t]=void 0!==e?e:{})})("versions",[]).push({version:r.version,mode:n(8)?"pure":"global",copyright:"© 2019 Denis Pushkarev (zloirock.ru)"})},function(t,e){t.exports="constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",")},function(t,e,n){var r=n(3).f,o=n(1),i=n(6)("toStringTag");t.exports=function(t,e,n){t&&!o(t=n?t:t.prototype,i)&&r(t,i,{configurable:!0,value:e})}},function(t,e,n){e.f=n(6)},function(t,e,n){var r=n(0),o=n(9),i=n(8),u=n(23),c=n(3).f;t.exports=function(t){var e=o.Symbol||(o.Symbol=i?{}:r.Symbol||{});"_"==t.charAt(0)||t in e||c(e,t,{value:u.f(t)})}},function(t,e){e.f={}.propertyIsEnumerable},function(t,e,n){"use strict";var r=n(8),o=n(27),i=n(30),u=n(2),c=n(17),s=n(48),f=n(22),a=n(55),l=n(6)("iterator"),p=!([].keys&&"next"in[].keys()),y=function(){return this};t.exports=function(t,e,n,d,v,h,m){s(n,e,d);var b,g,x,w=function(t){if(!p&&t in P)return P[t];switch(t){case"keys":case"values":return function(){return new n(this,t)}}return function(){return new n(this,t)}},S=e+" Iterator",O="values"==v,j=!1,P=t.prototype,_=P[l]||P["@@iterator"]||v&&P[v],k=_||w(v),L=v?O?w("entries"):k:void 0,M="Array"==e&&P.entries||_;if(M&&(x=a(M.call(new t)))!==Object.prototype&&x.next&&(f(x,S,!0),r||"function"==typeof x[l]||u(x,l,y)),O&&_&&"values"!==_.name&&(j=!0,k=function(){return _.call(this)}),r&&!m||!p&&!j&&P[l]||u(P,l,k),c[e]=k,c[S]=y,v)if(b={values:O?k:w("values"),keys:h?k:w("keys"),entries:L},m)for(g in b)g in P||i(P,g,b[g]);else o(o.P+o.F*(p||j),e,b);return b}},function(t,e,n){var r=n(0),o=n(9),i=n(46),u=n(2),c=n(1),s=function(t,e,n){var f,a,l,p=t&s.F,y=t&s.G,d=t&s.S,v=t&s.P,h=t&s.B,m=t&s.W,b=y?o:o[e]||(o[e]={}),g=b.prototype,x=y?r:d?r[e]:(r[e]||{}).prototype;for(f in y&&(n=e),n)(a=!p&&x&&void 0!==x[f])&&c(b,f)||(l=a?x[f]:n[f],b[f]=y&&"function"!=typeof x[f]?n[f]:h&&a?i(l,r):m&&x[f]==l?function(t){var e=function(e,n,r){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(e);case 2:return new t(e,n)}return new t(e,n,r)}return t.apply(this,arguments)};return e.prototype=t.prototype,e}(l):v&&"function"==typeof l?i(Function.call,l):l,v&&((b.virtual||(b.virtual={}))[f]=l,t&s.R&&g&&!g[f]&&u(g,f,l)))};s.F=1,s.G=2,s.S=4,s.P=8,s.B=16,s.W=32,s.U=64,s.R=128,t.exports=s},function(t,e,n){t.exports=!n(4)&&!n(11)(function(){return 7!=Object.defineProperty(n(29)("div"),"a",{get:function(){return 7}}).a})},function(t,e,n){var r=n(7),o=n(0).document,i=r(o)&&r(o.createElement);t.exports=function(t){return i?o.createElement(t):{}}},function(t,e,n){t.exports=n(2)},function(t,e,n){var r=n(10),o=n(49),i=n(21),u=n(19)("IE_PROTO"),c=function(){},s=function(){var t,e=n(29)("iframe"),r=i.length;for(e.style.display="none",n(54).appendChild(e),e.src="javascript:",(t=e.contentWindow.document).open(),t.write("<script>document.F=Object<\\/script>"),t.close(),s=t.F;r--;)delete s.prototype[i[r]];return s()};t.exports=Object.create||function(t,e){var n;return null!==t?(c.prototype=r(t),n=new c,c.prototype=null,n[u]=t):n=s(),void 0===e?n:o(n,e)}},function(t,e,n){var r=n(1),o=n(5),i=n(51)(!1),u=n(19)("IE_PROTO");t.exports=function(t,e){var n,c=o(t),s=0,f=[];for(n in c)n!=u&&r(c,n)&&f.push(n);for(;e.length>s;)r(c,n=e[s++])&&(~i(f,n)||f.push(n));return f}},function(t,e){var n={}.toString;t.exports=function(t){return n.call(t).slice(8,-1)}},function(t,e,n){var r=n(15);t.exports=function(t){return Object(r(t))}},function(t,e){e.f=Object.getOwnPropertySymbols},function(t,e,n){var r=n(32),o=n(21).concat("length","prototype");e.f=Object.getOwnPropertyNames||function(t){return r(t,o)}},function(t,e,n){const r=n(38);let o=null;function i(t){return t&&"string"!=typeof t?t.message?t.message:t.target&&t.target.error?t.target.error.message:"unknown error":t}self.onmessage=function(t){switch(t.data.type){case"init":n=t.data.msg,(o=new r(n)).init().catch(t=>{postMessage({type:"error",msg:{msg:"dbLog init error",error:i(t)}})});break;case"fetch":o.getAllLogs().then(t=>{postMessage({type:"fetchDone",code:200,msg:t})}).catch(t=>{postMessage({type:"fetchDone",code:500,msg:i(t)})});break;case"delete":o.deleteLogs(e).catch(t=>{postMessage({type:"deleteLogs",code:500,msg:i(t)})});break;default:!function(t){if(!o)return;o.putLog(t).then(t=>{postMessage(200)}).catch(t=>{postMessage({type:"error",msg:{msg:"putLog error",error:i(t)}})})}(t.data)}var e,n}},function(t,e,n){"use strict";var r=n(39),o={log:{key:{keyPath:"time"},indexes:{level:{unique:!1},time:{unique:!0}}}};function i(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.server=null,this.expire=t.expire||72,this.name=t.name}var u=i.prototype;u.init=function(){var t=this;if(!this.server)return r.open({server:"nim-log-"+this.name,version:1,schema:o}).then(function(e){t.server=e})},u.putLog=function(t){var e=this;if(!this.server)return Promise.reject("no db server");var n=t.slice(-1)[0].time-36e5*this.expire;return this.deleteLogs(n).then(function(){return e.server.add("log",t)})},u.getAllLogs=function(){return this.server?this.server.query("log","time").all().execute().then(function(t){var e={},n=t.slice(-1)[0];return e.logs=t.map(function(t){return t.log}).join("\\r\\n"),e.time=n&&n.time,e}):Promise.reject("no db server")},u.deleteLogs=function(t){return this.server?this.server.remove("log",null,"time",0,t):Promise.reject("no db server")},t.exports=i},function(t,e,n){"use strict";(function(r){var o,i,u=n(41),c=(i=u)&&i.__esModule?i:{default:i};!function(i,u){var s,f=(i=void 0!==i?i:"undefined"!=typeof self?self:void 0!==r?r:{}).IDBKeyRange||i.webkitIDBKeyRange,a="readonly",l="readwrite",p=Object.prototype.hasOwnProperty,y=function(){if(!s&&!(s=i.indexedDB||i.webkitIndexedDB||i.mozIndexedDB||i.oIndexedDB||i.msIndexedDB||(null===i.indexedDB&&i.shimIndexedDB?i.shimIndexedDB:u)))throw"IndexedDB required";return s},d=function(t){return t},v=function(t){return Object.prototype.toString.call(t).slice(8,-1).toLowerCase()},h=function(t){return"function"==typeof t},m=function(t){return t===u},b=function(t,e){var n=this,r=!1;this.name=e,this.getIndexedDB=function(){return t},this.add=function(e){if(r)throw"Database has been closed";for(var o=[],i=0,u=0;u<arguments.length-1;u++)if(Array.isArray(arguments[u+1]))for(var c=0;c<arguments[u+1].length;c++)o[i]=arguments[u+1][c],i++;else o[i]=arguments[u+1],i++;var s=t.transaction(e,l),f=s.objectStore(e);return new Promise(function(t,e){o.forEach(function(t){var e;if(t.item&&t.key){var n=t.key;t=t.item,e=f.add(t,n)}else e=f.add(t);e.onsuccess=function(e){var n=e.target,r=n.source.keyPath;null===r&&(r="__id__"),Object.defineProperty(t,r,{value:n.result,enumerable:!0})}}),s.oncomplete=function(){t(o,n)},s.onerror=function(t){t.preventDefault(),e(t)},s.onabort=function(t){e(t)}})},this.updateAndDelete=function(e,n,o){if(r)throw"Database has been closed";var i=t.transaction(e,l),u=i.objectStore(e),c=u.keyPath;return new Promise(function(t,e){n.forEach(function(t){if(t.item&&t.key){var e=t.key;t=t.item,u.put(t,e)}else u.put(t)}),o.forEach(function(t){u.delete(t[c])}),i.oncomplete=function(){t([n,o])},i.onerror=function(t){e(t)}})},this.update=function(e){if(r)throw"Database has been closed";for(var o,i=[],u=1;u<arguments.length;u++)o=arguments[u],Array.isArray(o)?i=i.concat(o):i.push(o);var c=t.transaction(e,l),s=c.objectStore(e);s.keyPath;return new Promise(function(t,e){i.forEach(function(t){var e;if(t.item&&t.key){var n=t.key;t=t.item,e=s.put(t,n)}else e=s.put(t);e.onsuccess=function(t){},e.onerror=function(t){}}),c.oncomplete=function(){t(i,n)},c.onerror=function(t){e(t)},c.onabort=function(t){e(t)}})},this.remove=function(e,n,o,i,c,s,a){if(r)throw"Database has been closed";var p=t.transaction(e,l),y=p.objectStore(e);return new Promise(function(t,e){function r(t){return t===u||null===t}if(r(i)&&(i=-1/0),r(c)&&(c=1/0),null===n||Array.isArray(n)||(n=[n]),r(o))null!==n?n.forEach(function(t){y.delete(t)}):y.delete(range=f.bound(i,c,s,a));else{var l=void 0;l=null!==n?f.only(n[0]):f.bound(i,c,s,a),y.index(o).openCursor(l).onsuccess=function(t){var e=t.target.result;e&&(e.delete(),e.continue())}}p.oncomplete=function(){t()},p.onerror=function(t){e(t)},p.onabort=function(t){e(t)}})},this.clear=function(e){if(r)throw"Database has been closed";var n=t.transaction(e,l);n.objectStore(e).clear();return new Promise(function(t,e){n.oncomplete=function(){t()},n.onerror=function(t){e(t)}})},this.close=function(){r||(t.close(),r=!0,delete w[e])},this.get=function(e,n){if(r)throw"Database has been closed";var o=t.transaction(e),i=o.objectStore(e).get(n);return new Promise(function(t,e){i.onsuccess=function(e){t(e.target.result)},o.onerror=function(t){e(t)}})},this.query=function(e,n){if(r)throw"Database has been closed";return new g(e,t,n)},this.count=function(e,n){if(r)throw"Database has been closed";t.transaction(e).objectStore(e)};for(var o=0,i=t.objectStoreNames.length;o<i;o++)!function(t){for(var e in n[t]={},n)p.call(n,e)&&"close"!==e&&(n[t][e]=function(e){return function(){var r=[t].concat([].slice.call(arguments,0));return n[e].apply(n,r)}}(e))}(t.objectStoreNames[o])},g=function(t,e,n){var r=this,o=!1,i=!1,s=function(r,s,p,y,d,v,m){return new Promise(function(b,g){var x=o||i?l:a,w=e.transaction(t,x),S=w.objectStore(t),O=n?S.index(n):S,j=r?f[r].apply(null,s):null,P=[],_=[j],k=0;d=d||null,v=v||[],"count"!==p&&_.push(y||"next");var L=!!o&&Object.keys(o);O[p].apply(O,_).onsuccess=function(t){var e=t.target.result;if((void 0===e?"undefined":(0,c.default)(e))===(0,c.default)(0))P=e;else if(e)if(null!==d&&d[0]>k)k=d[0],e.advance(d[0]);else if(null!==d&&k>=d[0]+d[1]);else{var n=!0,r="value"in e?e.value:e.key;v.forEach(function(t){t&&t.length&&(2===t.length?n=n&&r[t[0]]===t[1]:h(t[0])&&(n=n&&t[0].apply(u,[r])))}),n&&(k++,P.push(m(r)),i?e.delete():o&&(r=function(t){for(var e=0;e<L.length;e++){var n=L[e],r=o[n];r instanceof Function&&(r=r(t)),t[n]=r}return t}(r),e.update(r))),e.continue()}},w.oncomplete=function(){b(P)},w.onerror=function(t){g(t)},w.onabort=function(t){g(t)}})},p=function(t,e){var n="next",r="openCursor",u=[],c=null,f=d,a=!1,l=function(){return s(t,e,r,a?n+"unique":n,c,u,f)},p=function(){return n=null,r="count",{execute:l}},y=function t(){var e;return e=arguments[0],1==(c="array"===v(e)?arguments[0]:Array.prototype.slice.call(arguments,0,2)).length&&c.unshift(0),function(t){return"number"===v(t)}(c[1])||(c=null),{execute:l,count:p,keys:b,filter:g,asc:x,desc:w,distinct:S,modify:O,limit:t,map:j,remove:P}},b=function t(e){return(e=!!m(e)||!!e)&&(r="openKeyCursor"),{execute:l,keys:t,filter:g,asc:x,desc:w,distinct:S,modify:O,limit:y,map:j,remove:P}},g=function t(){return u.push(Array.prototype.slice.call(arguments,0,2)),{execute:l,count:p,keys:b,filter:t,asc:x,desc:w,distinct:S,modify:O,limit:y,map:j,remove:P}},x=function t(e){return e=!!m(e)||!!e,n=e?"next":"prev",{execute:l,count:p,keys:b,filter:g,asc:t,desc:w,distinct:S,modify:O,limit:y,map:j,remove:P}},w=function t(e){return e=!!m(e)||!!e,n=e?"prev":"next",{execute:l,count:p,keys:b,filter:g,asc:x,desc:t,distinct:S,modify:O,limit:y,map:j,remove:P}},S=function t(e){return e=!!m(e)||!!e,a=e,{execute:l,count:p,keys:b,filter:g,asc:x,desc:w,distinct:t,modify:O,limit:y,map:j,remove:P}},O=function t(e){return o=e,{execute:l,count:p,keys:b,filter:g,asc:x,desc:w,distinct:S,modify:t,limit:y,map:j,remove:P}},j=function t(e){return h(e)&&(f=e),{execute:l,count:p,keys:b,filter:g,asc:x,desc:w,distinct:S,modify:O,limit:y,map:t,remove:P}},P=function t(e){return e=!!m(e)||!!e,i=e,{execute:l,count:p,keys:b,filter:g,asc:x,desc:w,distinct:S,modify:O,limit:y,map:j,remove:t}};return{execute:l,count:p,keys:b,filter:g,asc:x,desc:w,distinct:S,modify:O,limit:y,map:j,remove:P}};"only bound upperBound lowerBound".split(" ").forEach(function(t){r[t]=function(){return new p(t,arguments)}}),this.filter=function(){var t=new p(null,null);return t.filter.apply(t,arguments)},this.all=function(){return this.filter()}},x=function(t,e,n,r){var o=t.target.result,i=new b(o,e);return w[e]=o,Promise.resolve(i)},w={},S={version:"0.10.2",open:function(t){var e;return new Promise(function(n,r){if(w[t.server])x({target:{result:w[t.server]}},t.server,t.version,t.schema).then(n,r);else{try{e=y().open(t.server,t.version)}catch(t){r(t)}e.onsuccess=function(e){x(e,t.server,t.version,t.schema).then(n,r)},e.onupgradeneeded=function(e){!function(t,e,n){for(var r in"function"==typeof e&&(e=e()),e){var o,i=e[r];for(var u in o=!p.call(e,r)||n.objectStoreNames.contains(r)?t.currentTarget.transaction.objectStore(r):n.createObjectStore(r,i.key),i.indexes){var c=i.indexes[u];try{o.index(u)}catch(t){o.createIndex(u,c.key||u,Object.keys(c).length?c:{unique:!1})}}}}(e,t.schema,e.target.result)},e.onerror=function(t){r(t)}}})},remove:function(t){return new Promise(function(e,n){if(!t)return e();var r,o;(void 0===t?"undefined":(0,c.default)(t))===b&&(t=t.name),"string"==typeof t&&(r=w[t]),r&&"function"==typeof r.close&&r.close();try{o=y().deleteDatabase(t)}catch(t){n(t)}o.onsuccess=function(n){delete w[t],e(t)},o.onerror=function(t){n(t)},o.onblocked=function(t){n(t)}})}};void 0!==t.exports?t.exports=S:(o=function(){return S}.call(e,n,e,t))===u||(t.exports=o)}(void 0)}).call(this,n(40))},function(t,e){var n;n=function(){return this}();try{n=n||new Function("return this")()}catch(t){"object"==typeof window&&(n=window)}t.exports=n},function(t,e,n){"use strict";e.__esModule=!0;var r=u(n(42)),o=u(n(60)),i="function"==typeof o.default&&"symbol"==typeof r.default?function(t){return typeof t}:function(t){return t&&"function"==typeof o.default&&t.constructor===o.default&&t!==o.default.prototype?"symbol":typeof t};function u(t){return t&&t.__esModule?t:{default:t}}e.default="function"==typeof o.default&&"symbol"===i(r.default)?function(t){return void 0===t?"undefined":i(t)}:function(t){return t&&"function"==typeof o.default&&t.constructor===o.default&&t!==o.default.prototype?"symbol":void 0===t?"undefined":i(t)}},function(t,e,n){t.exports={default:n(43),__esModule:!0}},function(t,e,n){n(44),n(56),t.exports=n(23).f("iterator")},function(t,e,n){"use strict";var r=n(45)(!0);n(26)(String,"String",function(t){this._t=String(t),this._i=0},function(){var t,e=this._t,n=this._i;return n>=e.length?{value:void 0,done:!0}:(t=r(e,n),this._i+=t.length,{value:t,done:!1})})},function(t,e,n){var r=n(14),o=n(15);t.exports=function(t){return function(e,n){var i,u,c=String(o(e)),s=r(n),f=c.length;return s<0||s>=f?t?"":void 0:(i=c.charCodeAt(s))<55296||i>56319||s+1===f||(u=c.charCodeAt(s+1))<56320||u>57343?t?c.charAt(s):i:t?c.slice(s,s+2):u-56320+(i-55296<<10)+65536}}},function(t,e,n){var r=n(47);t.exports=function(t,e,n){if(r(t),void 0===e)return t;switch(n){case 1:return function(n){return t.call(e,n)};case 2:return function(n,r){return t.call(e,n,r)};case 3:return function(n,r,o){return t.call(e,n,r,o)}}return function(){return t.apply(e,arguments)}}},function(t,e){t.exports=function(t){if("function"!=typeof t)throw TypeError(t+" is not a function!");return t}},function(t,e,n){"use strict";var r=n(31),o=n(12),i=n(22),u={};n(2)(u,n(6)("iterator"),function(){return this}),t.exports=function(t,e,n){t.prototype=r(u,{next:o(1,n)}),i(t,e+" Iterator")}},function(t,e,n){var r=n(3),o=n(10),i=n(18);t.exports=n(4)?Object.defineProperties:function(t,e){o(t);for(var n,u=i(e),c=u.length,s=0;c>s;)r.f(t,n=u[s++],e[n]);return t}},function(t,e,n){var r=n(33);t.exports=Object("z").propertyIsEnumerable(0)?Object:function(t){return"String"==r(t)?t.split(""):Object(t)}},function(t,e,n){var r=n(5),o=n(52),i=n(53);t.exports=function(t){return function(e,n,u){var c,s=r(e),f=o(s.length),a=i(u,f);if(t&&n!=n){for(;f>a;)if((c=s[a++])!=c)return!0}else for(;f>a;a++)if((t||a in s)&&s[a]===n)return t||a||0;return!t&&-1}}},function(t,e,n){var r=n(14),o=Math.min;t.exports=function(t){return t>0?o(r(t),9007199254740991):0}},function(t,e,n){var r=n(14),o=Math.max,i=Math.min;t.exports=function(t,e){return(t=r(t))<0?o(t+e,0):i(t,e)}},function(t,e,n){var r=n(0).document;t.exports=r&&r.documentElement},function(t,e,n){var r=n(1),o=n(34),i=n(19)("IE_PROTO"),u=Object.prototype;t.exports=Object.getPrototypeOf||function(t){return t=o(t),r(t,i)?t[i]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?u:null}},function(t,e,n){n(57);for(var r=n(0),o=n(2),i=n(17),u=n(6)("toStringTag"),c="CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,TextTrackList,TouchList".split(","),s=0;s<c.length;s++){var f=c[s],a=r[f],l=a&&a.prototype;l&&!l[u]&&o(l,u,f),i[f]=i.Array}},function(t,e,n){"use strict";var r=n(58),o=n(59),i=n(17),u=n(5);t.exports=n(26)(Array,"Array",function(t,e){this._t=u(t),this._i=0,this._k=e},function(){var t=this._t,e=this._k,n=this._i++;return!t||n>=t.length?(this._t=void 0,o(1)):o(0,"keys"==e?n:"values"==e?t[n]:[n,t[n]])},"values"),i.Arguments=i.Array,r("keys"),r("values"),r("entries")},function(t,e){t.exports=function(){}},function(t,e){t.exports=function(t,e){return{value:e,done:!!t}}},function(t,e,n){t.exports={default:n(61),__esModule:!0}},function(t,e,n){n(62),n(68),n(69),n(70),t.exports=n(9).Symbol},function(t,e,n){"use strict";var r=n(0),o=n(1),i=n(4),u=n(27),c=n(30),s=n(63).KEY,f=n(11),a=n(20),l=n(22),p=n(13),y=n(6),d=n(23),v=n(24),h=n(64),m=n(65),b=n(10),g=n(7),x=n(34),w=n(5),S=n(16),O=n(12),j=n(31),P=n(66),_=n(67),k=n(35),L=n(3),M=n(18),E=_.f,D=L.f,T=P.f,A=r.Symbol,I=r.JSON,F=I&&I.stringify,N=y("_hidden"),C=y("toPrimitive"),B={}.propertyIsEnumerable,R=a("symbol-registry"),G=a("symbols"),q=a("op-symbols"),V=Object.prototype,K="function"==typeof A&&!!k.f,W=r.QObject,z=!W||!W.prototype||!W.prototype.findChild,H=i&&f(function(){return 7!=j(D({},"a",{get:function(){return D(this,"a",{value:7}).a}})).a})?function(t,e,n){var r=E(V,e);r&&delete V[e],D(t,e,n),r&&t!==V&&D(V,e,r)}:D,J=function(t){var e=G[t]=j(A.prototype);return e._k=t,e},Y=K&&"symbol"==typeof A.iterator?function(t){return"symbol"==typeof t}:function(t){return t instanceof A},Q=function(t,e,n){return t===V&&Q(q,e,n),b(t),e=S(e,!0),b(n),o(G,e)?(n.enumerable?(o(t,N)&&t[N][e]&&(t[N][e]=!1),n=j(n,{enumerable:O(0,!1)})):(o(t,N)||D(t,N,O(1,{})),t[N][e]=!0),H(t,e,n)):D(t,e,n)},U=function(t,e){b(t);for(var n,r=h(e=w(e)),o=0,i=r.length;i>o;)Q(t,n=r[o++],e[n]);return t},X=function(t){var e=B.call(this,t=S(t,!0));return!(this===V&&o(G,t)&&!o(q,t))&&(!(e||!o(this,t)||!o(G,t)||o(this,N)&&this[N][t])||e)},Z=function(t,e){if(t=w(t),e=S(e,!0),t!==V||!o(G,e)||o(q,e)){var n=E(t,e);return!n||!o(G,e)||o(t,N)&&t[N][e]||(n.enumerable=!0),n}},$=function(t){for(var e,n=T(w(t)),r=[],i=0;n.length>i;)o(G,e=n[i++])||e==N||e==s||r.push(e);return r},tt=function(t){for(var e,n=t===V,r=T(n?q:w(t)),i=[],u=0;r.length>u;)!o(G,e=r[u++])||n&&!o(V,e)||i.push(G[e]);return i};K||(c((A=function(){if(this instanceof A)throw TypeError("Symbol is not a constructor!");var t=p(arguments.length>0?arguments[0]:void 0),e=function(n){this===V&&e.call(q,n),o(this,N)&&o(this[N],t)&&(this[N][t]=!1),H(this,t,O(1,n))};return i&&z&&H(V,t,{configurable:!0,set:e}),J(t)}).prototype,"toString",function(){return this._k}),_.f=Z,L.f=Q,n(36).f=P.f=$,n(25).f=X,k.f=tt,i&&!n(8)&&c(V,"propertyIsEnumerable",X,!0),d.f=function(t){return J(y(t))}),u(u.G+u.W+u.F*!K,{Symbol:A});for(var et="hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables".split(","),nt=0;et.length>nt;)y(et[nt++]);for(var rt=M(y.store),ot=0;rt.length>ot;)v(rt[ot++]);u(u.S+u.F*!K,"Symbol",{for:function(t){return o(R,t+="")?R[t]:R[t]=A(t)},keyFor:function(t){if(!Y(t))throw TypeError(t+" is not a symbol!");for(var e in R)if(R[e]===t)return e},useSetter:function(){z=!0},useSimple:function(){z=!1}}),u(u.S+u.F*!K,"Object",{create:function(t,e){return void 0===e?j(t):U(j(t),e)},defineProperty:Q,defineProperties:U,getOwnPropertyDescriptor:Z,getOwnPropertyNames:$,getOwnPropertySymbols:tt});var it=f(function(){k.f(1)});u(u.S+u.F*it,"Object",{getOwnPropertySymbols:function(t){return k.f(x(t))}}),I&&u(u.S+u.F*(!K||f(function(){var t=A();return"[null]"!=F([t])||"{}"!=F({a:t})||"{}"!=F(Object(t))})),"JSON",{stringify:function(t){for(var e,n,r=[t],o=1;arguments.length>o;)r.push(arguments[o++]);if(n=e=r[1],(g(e)||void 0!==t)&&!Y(t))return m(e)||(e=function(t,e){if("function"==typeof n&&(e=n.call(this,t,e)),!Y(e))return e}),r[1]=e,F.apply(I,r)}}),A.prototype[C]||n(2)(A.prototype,C,A.prototype.valueOf),l(A,"Symbol"),l(Math,"Math",!0),l(r.JSON,"JSON",!0)},function(t,e,n){var r=n(13)("meta"),o=n(7),i=n(1),u=n(3).f,c=0,s=Object.isExtensible||function(){return!0},f=!n(11)(function(){return s(Object.preventExtensions({}))}),a=function(t){u(t,r,{value:{i:"O"+ ++c,w:{}}})},l=t.exports={KEY:r,NEED:!1,fastKey:function(t,e){if(!o(t))return"symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!i(t,r)){if(!s(t))return"F";if(!e)return"E";a(t)}return t[r].i},getWeak:function(t,e){if(!i(t,r)){if(!s(t))return!0;if(!e)return!1;a(t)}return t[r].w},onFreeze:function(t){return f&&l.NEED&&s(t)&&!i(t,r)&&a(t),t}}},function(t,e,n){var r=n(18),o=n(35),i=n(25);t.exports=function(t){var e=r(t),n=o.f;if(n)for(var u,c=n(t),s=i.f,f=0;c.length>f;)s.call(t,u=c[f++])&&e.push(u);return e}},function(t,e,n){var r=n(33);t.exports=Array.isArray||function(t){return"Array"==r(t)}},function(t,e,n){var r=n(5),o=n(36).f,i={}.toString,u="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[];t.exports.f=function(t){return u&&"[object Window]"==i.call(t)?function(t){try{return o(t)}catch(t){return u.slice()}}(t):o(r(t))}},function(t,e,n){var r=n(25),o=n(12),i=n(5),u=n(16),c=n(1),s=n(28),f=Object.getOwnPropertyDescriptor;e.f=n(4)?f:function(t,e){if(t=i(t),e=u(e,!0),s)try{return f(t,e)}catch(t){}if(c(t,e))return o(!r.f.call(t,e),t[e])}},function(t,e){},function(t,e,n){n(24)("asyncIterator")},function(t,e,n){n(24)("observable")}]);',
            'Worker',
            void 0,
            void 0
          );
        });
      var r,
        o = n(151),
        i = (r = o) && r.__esModule ? r : { default: r };
      e.exports = t.default;
    },
    function (e, t, n) {
      'use strict';
      e.exports = function (e, t, n, r) {
        var o = self || window;
        try {
          try {
            var i;
            try {
              i = new o.Blob([e]);
            } catch (t) {
              (i = new (o.BlobBuilder || o.WebKitBlobBuilder || o.MozBlobBuilder || o.MSBlobBuilder)()).append(e), (i = i.getBlob());
            }
            var s = o.URL || o.webkitURL,
              a = s.createObjectURL(i),
              c = new o[t](a, n);
            return s.revokeObjectURL(a), c;
          } catch (r) {
            return new o[t]('data:application/javascript,'.concat(encodeURIComponent(e)), n);
          }
        } catch (e) {
          if (!r) throw Error('Inline worker is not supported');
          return new o[t](r, n);
        }
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(106),
        o = { log: { key: { keyPath: 'time' }, indexes: { level: { unique: !1 }, time: { unique: !0 } } } };
      function i() {
        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
        (this.server = null), (this.expire = e.expire || 72), (this.name = e.name);
      }
      var s = i.prototype;
      (s.init = function () {
        var e = this;
        if (!this.server)
          return r.open({ server: 'nim-log-' + this.name, version: 1, schema: o }).then(function (t) {
            e.server = t;
          });
      }),
        (s.putLog = function (e) {
          var t = this;
          if (!this.server) return Promise.reject('no db server');
          var n = e.slice(-1)[0].time - 36e5 * this.expire;
          return this.deleteLogs(n).then(function () {
            return t.server.add('log', e);
          });
        }),
        (s.getAllLogs = function () {
          return this.server
            ? this.server
                .query('log', 'time')
                .all()
                .execute()
                .then(function (e) {
                  var t = {},
                    n = e.slice(-1)[0];
                  return (
                    (t.logs = e
                      .map(function (e) {
                        return e.log;
                      })
                      .join('\r\n')),
                    (t.time = n && n.time),
                    t
                  );
                })
            : Promise.reject('no db server');
        }),
        (s.deleteLogs = function (e) {
          return this.server ? this.server.remove('log', null, 'time', 0, e) : Promise.reject('no db server');
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      e.exports = { default: n(154), __esModule: !0 };
    },
    function (e, t, n) {
      n(45), n(35), (e.exports = n(155));
    },
    function (e, t, n) {
      var r = n(72),
        o = n(4)('iterator'),
        i = n(28);
      e.exports = n(8).isIterable = function (e) {
        var t = Object(e);
        return void 0 !== t[o] || '@@iterator' in t || i.hasOwnProperty(r(t));
      };
    },
    function (e, t, n) {
      e.exports = { default: n(157), __esModule: !0 };
    },
    function (e, t, n) {
      n(45), n(35), (e.exports = n(158));
    },
    function (e, t, n) {
      var r = n(12),
        o = n(71);
      e.exports = n(8).getIterator = function (e) {
        var t = o(e);
        if ('function' != typeof t) throw TypeError(e + ' is not iterable!');
        return r(t.call(e));
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(10),
        o = n(59);
      function i(e) {
        e.onuploading && this.on('uploading', e.onuploading), o.call(this, e);
      }
      var s = o.prototype,
        a = (i.prototype = Object.create(s));
      (a.doSend = function () {
        var e = this.options,
          t = e.headers,
          n = (this.xhr = new XMLHttpRequest());
        if ('multipart/form-data' === t['Content-Type']) {
          delete t['Content-Type'], (n.upload.onprogress = this.onProgress.bind(this)), (n.upload.onload = this.onProgress.bind(this));
          var o = e.data;
          (e.data = new window.FormData()),
            o &&
              r.getKeys(o, e.putFileAtEnd).forEach(function (t) {
                var n = o[t];
                n.tagName && 'INPUT' === n.tagName.toUpperCase()
                  ? 'file' === n.type &&
                    [].forEach.call(n.files, function (t) {
                      e.data.append(r.dataset(n, 'name') || n.name || t.name || 'file-' + r.uniqueID(), t);
                    })
                  : e.data.append(t, n);
              });
        } else t['x-nos-token'] && ((n.upload.onprogress = this.onProgress.bind(this)), (n.upload.onload = this.onProgress.bind(this)));
        (n.onreadystatechange = this.onStateChange.bind(this)),
          0 !== e.timeout && (this.timer = setTimeout(this.onTimeout.bind(this), e.timeout)),
          n.open(e.method, e.url, !e.sync),
          Object.keys(t).forEach(function (e) {
            n.setRequestHeader(e, t[e]);
          }),
          e.cookie && 'withCredentials' in n && (n.withCredentials = !0),
          n.send(e.data),
          this.afterSend();
      }),
        (a.onProgress = function (e) {
          e.lengthComputable && e.loaded <= e.total && this.emit('uploading', e);
        }),
        (a.onStateChange = function () {
          var e,
            t = this.xhr;
          4 === t.readyState && ((e = { status: t.status, result: t.responseText || '' }), this.onLoad(e));
        }),
        (a.getResponseHeader = function (e) {
          var t = this.xhr;
          return t ? t.getResponseHeader(e) : '';
        }),
        (a.destroy = function () {
          clearTimeout(this.timer);
          try {
            (this.xhr.onreadystatechange = r.f), this.xhr.abort();
          } catch (e) {
            console.log('error:', 'ignore error ajax destroy,', e);
          }
          s.destroy.call(this);
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      var r;
      /*!
       * EventEmitter v5.2.6 - git.io/ee
       * Unlicense - http://unlicense.org/
       * Oliver Caldwell - https://oli.me.uk/
       * @preserve
       */ !(function (t) {
        'use strict';
        function o() {}
        var i = o.prototype,
          s = t.EventEmitter;
        function a(e, t) {
          for (var n = e.length; n--; ) if (e[n].listener === t) return n;
          return -1;
        }
        function c(e) {
          return function () {
            return this[e].apply(this, arguments);
          };
        }
        (i.getListeners = function (e) {
          var t,
            n,
            r = this._getEvents();
          if (e instanceof RegExp) for (n in ((t = {}), r)) r.hasOwnProperty(n) && e.test(n) && (t[n] = r[n]);
          else t = r[e] || (r[e] = []);
          return t;
        }),
          (i.flattenListeners = function (e) {
            var t,
              n = [];
            for (t = 0; t < e.length; t += 1) n.push(e[t].listener);
            return n;
          }),
          (i.getListenersAsObject = function (e) {
            var t,
              n = this.getListeners(e);
            return n instanceof Array && ((t = {})[e] = n), t || n;
          }),
          (i.addListener = function (e, t) {
            if (
              !(function e(t) {
                return 'function' == typeof t || t instanceof RegExp || (!(!t || 'object' != typeof t) && e(t.listener));
              })(t)
            )
              throw new TypeError('listener must be a function');
            var n,
              r = this.getListenersAsObject(e),
              o = 'object' == typeof t;
            for (n in r) r.hasOwnProperty(n) && -1 === a(r[n], t) && r[n].push(o ? t : { listener: t, once: !1 });
            return this;
          }),
          (i.on = c('addListener')),
          (i.addOnceListener = function (e, t) {
            return this.addListener(e, { listener: t, once: !0 });
          }),
          (i.once = c('addOnceListener')),
          (i.defineEvent = function (e) {
            return this.getListeners(e), this;
          }),
          (i.defineEvents = function (e) {
            for (var t = 0; t < e.length; t += 1) this.defineEvent(e[t]);
            return this;
          }),
          (i.removeListener = function (e, t) {
            var n,
              r,
              o = this.getListenersAsObject(e);
            for (r in o) o.hasOwnProperty(r) && -1 !== (n = a(o[r], t)) && o[r].splice(n, 1);
            return this;
          }),
          (i.off = c('removeListener')),
          (i.addListeners = function (e, t) {
            return this.manipulateListeners(!1, e, t);
          }),
          (i.removeListeners = function (e, t) {
            return this.manipulateListeners(!0, e, t);
          }),
          (i.manipulateListeners = function (e, t, n) {
            var r,
              o,
              i = e ? this.removeListener : this.addListener,
              s = e ? this.removeListeners : this.addListeners;
            if ('object' != typeof t || t instanceof RegExp) for (r = n.length; r--; ) i.call(this, t, n[r]);
            else for (r in t) t.hasOwnProperty(r) && (o = t[r]) && ('function' == typeof o ? i.call(this, r, o) : s.call(this, r, o));
            return this;
          }),
          (i.removeEvent = function (e) {
            var t,
              n = typeof e,
              r = this._getEvents();
            if ('string' === n) delete r[e];
            else if (e instanceof RegExp) for (t in r) r.hasOwnProperty(t) && e.test(t) && delete r[t];
            else delete this._events;
            return this;
          }),
          (i.removeAllListeners = c('removeEvent')),
          (i.emitEvent = function (e, t) {
            var n,
              r,
              o,
              i,
              s = this.getListenersAsObject(e);
            for (i in s)
              if (s.hasOwnProperty(i))
                for (n = s[i].slice(0), o = 0; o < n.length; o++)
                  !0 === (r = n[o]).once && this.removeListener(e, r.listener),
                    r.listener.apply(this, t || []) === this._getOnceReturnValue() && this.removeListener(e, r.listener);
            return this;
          }),
          (i.trigger = c('emitEvent')),
          (i.emit = function (e) {
            var t = Array.prototype.slice.call(arguments, 1);
            return this.emitEvent(e, t);
          }),
          (i.setOnceReturnValue = function (e) {
            return (this._onceReturnValue = e), this;
          }),
          (i._getOnceReturnValue = function () {
            return !this.hasOwnProperty('_onceReturnValue') || this._onceReturnValue;
          }),
          (i._getEvents = function () {
            return this._events || (this._events = {});
          }),
          (o.noConflict = function () {
            return (t.EventEmitter = s), o;
          }),
          void 0 ===
            (r = function () {
              return o;
            }.call(t, n, t, e)) || (e.exports = r);
      })('undefined' != typeof window ? window : this || {});
    },
    function (e, t, n) {
      'use strict';
      var r = n(10),
        o = n(59),
        i = n(87),
        s = 'NEJ-UPLOAD-RESULT:',
        a = {};
      function c(e) {
        this.init(), o.call(this, e);
      }
      var u = o.prototype,
        l = (c.prototype = Object.create(u));
      (l.init = (function () {
        var e = !1;
        function t(e) {
          var t = e.data;
          if (0 === t.indexOf(s)) {
            var n = (t = JSON.parse(t.replace(s, ''))).key,
              r = a[n];
            r && (delete a[n], (t.result = decodeURIComponent(t.result || '')), r.onLoad(t.result));
          }
        }
        return function () {
          !(function () {
            if (!e) {
              e = !0;
              var n = r.getGlobal();
              n.postMessage ? r.on(n, 'message', t) : (i.addMsgListener(t), i.startTimer());
            }
          })();
        };
      })()),
        (l.doSend = function () {
          var e = this,
            t = e.options,
            n = (e.key = 'zoro-ajax-upload-iframe-' + r.uniqueID());
          a[n] = e;
          var o = (e.form = r.html2node('<form style="display:none;"></form>'));
          'undefined' == typeof document ? console.log('error: document is undefined') : document.body.appendChild(o),
            (o.target = n),
            (o.method = 'POST'),
            (o.enctype = 'multipart/form-data'),
            (o.encoding = 'multipart/form-data');
          var i = t.url,
            s = r.genUrlSep(i);
          o.action = i + s + '_proxy_=form';
          var c = t.data,
            u = [],
            l = [];
          function p() {
            u.forEach(function (e, t) {
              var n = l[t];
              n.parentNode && ((e.name = n.name), r.isFunction(e.setAttribute) && e.setAttribute('form', n.getAttribute('form')), n.parentNode.replaceChild(e, n));
            });
          }
          c &&
            r.getKeys(c, t.putFileAtEnd).forEach(function (e) {
              var t = c[e];
              if (t.tagName && 'INPUT' === t.tagName.toUpperCase()) {
                if ('file' === t.type) {
                  var n = t,
                    i = n.cloneNode(!0);
                  n.parentNode.insertBefore(i, n);
                  var s = r.dataset(n, 'name');
                  s && (n.name = s), o.appendChild(n), r.isFunction(n.setAttribute) && (n.setAttribute('form', ''), n.removeAttribute('form')), u.push(t), l.push(i);
                }
              } else {
                var a = r.html2node('<input type="hidden"/>');
                (a.name = e), (a.value = t), o.appendChild(a);
              }
            });
          var m = (e.iframe = r.createIframe({
            name: n,
            onload: function () {
              e.aborted ? p() : (r.on(m, 'load', e.checkResult.bind(e)), o.submit(), p(), e.afterSend());
            },
          }));
        }),
        (l.checkResult = function () {
          var e, t;
          try {
            if ((t = ((e = this.iframe.contentWindow.document.body).innerText || e.textContent || '').trim()).indexOf(s) >= 0 || e.innerHTML.indexOf(s) >= 0) return;
          } catch (e) {
            return void console.log('error:', 'ignore error if not same domain,', e);
          }
          this.onLoad(t);
        }),
        (l.onLoad = function (e) {
          u.onLoad.call(this, { status: 200, result: e }), r.remove(this.form), r.remove(this.iframe), u.destroy.call(this);
        }),
        (l.destroy = function () {
          r.remove(this.iframe), r.remove(this.form);
        }),
        (l.abort = function () {
          (this.aborted = !0), delete a[this.key], u.abort.call(this);
        }),
        (e.exports = c);
    },
    function (e, t, n) {
      'use strict';
      var r = n(10),
        o = n(87),
        i = n(59),
        s = {};
      function a(e) {
        this.init(), i.call(this, e);
      }
      var c = i.prototype,
        u = (a.prototype = Object.create(c));
      (u.init = (function () {
        var e = 'NEJ-AJAX-DATA:',
          t = !1;
        function n(t) {
          var n = t.data;
          if (0 === n.indexOf(e)) {
            var r = (n = JSON.parse(n.replace(e, ''))).key,
              o = s[r];
            o && (delete s[r], (n.result = decodeURIComponent(n.result || '')), o.onLoad(n));
          }
        }
        return function () {
          !(function () {
            if (!t) {
              t = !0;
              var e = r.getGlobal();
              e.postMessage ? r.on(e, 'message', n) : o.addMsgListener(n);
            }
          })();
        };
      })()),
        (u.doSend = function () {
          var e = this.options,
            t = r.url2origin(e.url),
            n = e.proxyUrl || t + '/res/nej_proxy_frame.html',
            i = s[n];
          if (r.isArray(i)) i.push(this.doSend.bind(this, e));
          else {
            if (!i)
              return (
                (s[n] = [this.doSend.bind(this, e)]),
                void r.createIframe({
                  src: n,
                  onload: function (e) {
                    var t = s[n];
                    (s[n] = r.target(e).contentWindow),
                      t.forEach(function (e) {
                        try {
                          e();
                        } catch (e) {
                          console.log('error:', e);
                        }
                      });
                  },
                })
              );
            if (!this.aborted) {
              var a = (this.key = r.uniqueID());
              s[a] = this;
              var c = r.fetch({ method: 'GET', url: '', data: null, headers: {}, timeout: 0 }, e);
              (c.key = a), o.postMessage(i, { data: c }), this.afterSend();
            }
          }
        }),
        (u.abort = function () {
          (this.aborted = !0), delete s[this.key], c.abort.call(this);
        }),
        (e.exports = a);
    },
    function (e, t, n) {
      'use strict';
      var r,
        o,
        i = n(10),
        s = n(42),
        a =
          ((r = /json/i),
          (o = /post/i),
          function (e, t) {
            var n = ((t = t || {}).data = t.data || {}),
              a = (t.headers = t.headers || {}),
              c = i.checkWithDefault(a, 'Accept', 'application/json'),
              u = i.checkWithDefault(a, 'Content-Type', 'application/json');
            return r.test(c) && (t.type = 'json'), o.test(t.method) && r.test(u) && (t.data = JSON.stringify(n)), s(e, t);
          });
      e.exports = a;
    },
    function (e, t, n) {
      'use strict';
      var r = n(42);
      e.exports = function (e, t) {
        return (
          (t.method = 'POST'), (t.headers = t.headers || {}), (t.headers['Content-Type'] = 'multipart/form-data'), (t.timeout = 0), (t.type = t.type || 'json'), r(e, t)
        );
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(1),
        o = r.chunkSize,
        i = n(42),
        s = {
          mp4: 'video/mp4',
          avi: 'video/x-msvideo',
          wmv: 'video/x-ms-wmv',
          mpeg: 'video/mpeg',
          mov: 'video/quicktime',
          aac: 'audio/x-aac',
          wma: 'audio/x-ms-wma',
          wav: 'audio/x-wav',
          mp3: 'audio/mp3',
        };
      e.exports = function e(t, n, a, c) {
        var u = { file: t.data[n], fileSize: t.data[n].size, fileUploadedSize: 0, percentage: 0 },
          l = t.url;
        function p(e) {
          var n = u.fileUploadedSize + e.loaded,
            r = Math.floor((1e4 * n) / u.fileSize) / 100;
          if ((parseInt(r) >= 100 && ((r = 100), (p = function () {})), u.percentage !== r)) {
            u.percentage = r;
            var o = { docId: t.docId, total: u.fileSize, loaded: n, percentage: r, percentageText: r + '%' };
            t.fileInput && (o.fileInput = t.fileInput), t.blob && (o.blob = t.blob), t.uploadprogress(o);
          }
        }
        function m(e) {
          try {
            e = JSON.parse(e);
          } catch (e) {
            return void a.onError(e);
          }
          if (e.errMsg || e.errCode) a.onError(e);
          else if (e.offset < u.fileSize)
            delete g.onaftersend,
              (u.fileUploadedSize = e.offset),
              (a.sn = (function (e, t, n, r) {
                var s = e.offset,
                  a = e.offset + o;
                return (
                  (t.data = r.file.slice(s, a)),
                  (t.query.offset = e.offset),
                  (t.query.complete = a >= r.fileSize),
                  (t.query.context = e.context),
                  (t.onuploading = p),
                  (t.onload = m),
                  (t.onerror = d),
                  i(l, t)
                );
              })(e, g, 0, u));
          else {
            var n = r.genFileUrl(t.nosToken);
            'image' === t.type
              ? i(n + '?imageInfo', {
                  onload: function (n) {
                    try {
                      (n = JSON.parse(n)),
                        t.uploaddone(null, { docId: e.docId, w: n.Width, h: n.Height, orientation: n.Orientation || '', type: n.Type, size: n.Size || u.fileSize });
                    } catch (e) {
                      s(e);
                    }
                  },
                  onerror: function (r) {
                    if ('undefined' != typeof Image) {
                      var o = new Image();
                      (o.src = n),
                        (o.onload = function () {
                          t.uploaddone(null, { docId: e.docId, w: o.width, h: o.height, size: u.fileSize });
                        }),
                        (o.onerror = function (e) {
                          s(e);
                        });
                    } else s(r);
                  },
                })
              : 'video' === t.type || 'audio' === t.type
              ? i(n + '?vinfo', {
                  onload: function (n) {
                    try {
                      (n = JSON.parse(n)).GetVideoInfo && n.GetVideoInfo.VideoInfo && (n = n.GetVideoInfo.VideoInfo),
                        t.uploaddone(null, {
                          docId: e.docId,
                          w: n.Width,
                          h: n.Height,
                          dur: n.Duration,
                          orientation: n.Rotate,
                          audioCodec: n.AudioCodec,
                          videoCodec: n.VideoCodec,
                          container: n.Container,
                          size: n.Size || u.fileSize,
                        });
                    } catch (e) {
                      s(e);
                    }
                  },
                  onerror: s,
                })
              : t.uploaddone(null, { docId: e.docId, size: u.fileSize });
          }
          function s(e) {
            a.onError(e);
          }
        }
        function d(r) {
          var o = r && r.code;
          function s() {
            try {
              if (r.result) var e = JSON.parse(r.result);
              else e = r;
              a.onError(e);
            } catch (e) {
              a.onError(e);
            }
          }
          0 === u.fileUploadedSize && t.nosLbsUrls && t.nosLbsUrls.length > 0 && 'abort' !== o
            ? t.edgeList
              ? c < t.edgeList.length - 1
                ? e(t, n, a, c + 1)
                : s()
              : (function (e, t, n, r) {
                  return new Promise(function (o, s) {
                    function a() {
                      i(n[e], {
                        query: { version: '1.0', bucketname: t },
                        method: 'GET',
                        onerror: c,
                        onload: function (e) {
                          try {
                            (e = JSON.parse(e)) && e.upload && e.upload.length ? o(e.upload) : c();
                          } catch (e) {
                            c();
                          }
                        },
                      });
                    }
                    function c() {
                      r.onLbsUrlFail(n[e]), e < n.length - 1 ? (e++, a()) : o([]);
                    }
                    a();
                  });
                })(0, t.nosToken.bucket, t.nosLbsUrls, a).then(function (r) {
                  r.length > 0 ? ((t.edgeList = r), t.updateNosEdgeList && t.updateNosEdgeList(r), e(t, n, a, c + 1)) : s();
                })
            : s();
        }
        'number' != typeof c && (c = -1),
          t.edgeList && t.edgeList.length && ((c = c > 0 ? c : 0), (l = t.edgeList[c])),
          (l += '/' + t.nosToken.bucket + '/' + t.nosToken.objectName);
        var f = t.data.file && t.data.file.type;
        if (!f || f.indexOf('/') < 0) {
          var y = (t.fileInputName || '').split('.').pop();
          'image' === t.type ? (f = 'image/' + ('jpg' === y ? 'jpeg' : y)) : ('audio' !== t.type && 'video' !== t.type) || (f = s[y]);
        }
        var g = {
          query: { offset: 0, complete: o >= u.fileSize, version: '1.0' },
          headers: { 'Content-Type': f || 'application/octet-stream', 'x-nos-token': t.nosToken.token },
          method: 'POST',
          timeout: 0,
          onaftersend: function () {
            t.beginupload(a);
          },
          onuploading: p,
          onload: m,
          onerror: d,
        };
        return (g.data = u.file.slice(0, o)), i(l, g);
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(11).fn;
      (r.isConnected = function () {
        return !!this.protocol && this.protocol.isConnected();
      }),
        (r.connect = function () {
          this.protocol.connect(!0);
        }),
        (r.disconnect = function (e) {
          (e = e || {}), this.protocol.disconnect(e.done);
        });
    },
    function (e, t, n) {
      'use strict';
      var r = s(n(2)),
        o = s(n(21)),
        i = s(n(48));
      function s(e) {
        return e && e.__esModule ? e : { default: e };
      }
      var a = n(11).fn,
        c = n(0),
        u = n(168),
        l = n(6),
        p = n(1),
        m = n(88),
        d = n(169),
        f = n(17),
        y = n(89);
      (a.sendText = function (e) {
        var t = e,
          n = t.loc_x,
          r = t.loc_y,
          s = t.loc_z,
          a = (0, i.default)(t, ['loc_x', 'loc_y', 'loc_z']);
        return (
          void 0 === n || void 0 === r || void 0 === s
            ? (e = (0, o.default)({}, a))
            : ('number' != typeof e.loc_x && (e.loc_x = 0), 'number' != typeof e.loc_y && (e.loc_y = 0), 'number' != typeof e.loc_z && (e.loc_z = 0)),
          this.processCallback(e),
          (e.msg = new this.message.TextMessage(e)),
          this.sendMsg(e)
        );
      }),
        (a.previewFile = function (e) {
          if (
            (f.startUniErrCache('nos', { user_id: this.account, action: 'upload' }),
            c.verifyOptions(e, 'done', 'msg::previewFile'),
            e.type || (e.type = 'file'),
            c.verifyParamPresentJustOne(e, 'dataURL blob fileInput filePath wxFilePath fileObject', 'msg::previewFile'),
            c.exist(e.maxSize) && c.verifyParamType('maxSize', e.maxSize, 'number', 'api::previewFile'),
            c.exist(e.commonUpload) && c.verifyParamType('commonUpload', e.commonUpload, 'boolean', 'api::previewFile'),
            e.nosSurvivalTime
              ? (c.verifyParamType('nosSurvivalTime', e.nosSurvivalTime, 'number', 'api::Base.getInstance'),
                c.verifyParamMin('nosSurvivalTime', e.nosSurvivalTime, 86400, 'api::Base.getInstance'))
              : (e.nosSurvivalTime = this.nosSurvivalTime),
            (e.filePath = e.filePath || e.wxFilePath),
            delete e.wxFilePath,
            e.dataURL)
          )
            e.blob = y.fromDataURL(e.dataURL);
          else if (e.blob);
          else if (e.fileInput) {
            if (((e.fileInput = c.verifyFileInput(e.fileInput, 'msg::previewFile')), e.fileInput.files)) {
              if (!e.fileInput.files.length)
                return void e.done(l.newNoFileError('请选择' + e.type + '文件', { callFunc: 'msg::previewFile', fileInput: e.fileInput }), e);
              e.fileSize = e.fileInput.files[0].size;
            }
            e.fileInputName = c.getFileName(e.fileInput);
          }
          this.processCallback(e);
          var t = JSON.stringify(m.genResponseBody(e.type) || {}).replace(/"/gi, '\\"'),
            n = null,
            r = e.transcode ? 'getNosTokenTrans' : 'getNosToken';
          if (e.transcode) {
            c.verifyOptions(e, 'fileInput', 'msg::previewFile');
            var o = c.getFileInfo(e.fileInput);
            n = { transToken: { name: o.name, type: o.transcodeType, transType: 'png' === e.transcode ? 11 : 10, size: o.size, body: t } };
          } else n = t;
          this[r]({
            responseBody: n,
            nosToken: { nosScene: e.nosScene || this.nosScene, nosSurvivalTime: e.nosSurvivalTime },
            callback: function (t, n) {
              t ? e.done(t) : (e.transcode ? ((e.nosToken = n.nosToken), (e.docId = n.docId)) : (e.nosToken = n), this._doPreviewFile(e));
            }.bind(this),
          });
        }),
        (a._doPreviewFile = function (e) {
          var t = this;
          f.startUniErrCache('nos', { user_id: this.account, action: 'upload' });
          var n,
            o = e.uploaddone,
            i = p.genUploadUrl(e.nosToken.bucket),
            s = p.chunkUploadUrl;
          t.logger.info('_doPreviewFile: start upload'),
            e.commonUpload || !s || p.isWeixinApp || p.isNodejs || p.isRN
              ? ((e.commonUpload = !0), (n = i))
              : (this.logger.info('use chunkUrl: ', s, p.nosLbsUrls),
                (n = s),
                (e.nosLbsUrls = p.nosLbsUrls),
                t.edgeList
                  ? (e.edgeList = t.edgeList)
                  : (e.updateNosEdgeList = function (e) {
                      t.edgeList = e;
                    }));
          var a = this.assembleUploadParams(e.nosToken);
          function u(n, r, i) {
            if ((t.logger.info('_doPreviewFile: upload done', n && n.message), (e.uploaddone = o), n))
              return (
                f.updateUniErrCache('nos', { operation_type: 'transfer', error: n && n.message }), f.concludeUniErrCache('nos', 1), void e.done(n, e.callback.options)
              );
            if (
              (f.concludeUniErrCache('nos', 0),
              (r = m.parseResponse(r, t.options.exifOrientation)),
              i || ((r.url = p.genDownloadUrl(e.nosToken, a.Object, p.serverNosConfig.cdnDomain)), e.nosToken.shortUrl && (r._url_safe = e.nosToken.shortUrl)),
              c.exist(e.fileInputName))
            )
              r.name = e.fileInputName;
            else if (e.blob) {
              var s = e.blob.name;
              if (((r.name = s || 'blob-' + r.md5), !s)) {
                var u = e.blob.type;
                r.ext = u.slice(u.lastIndexOf('/') + 1);
              }
            } else e.filePath ? (r.name = e.filePath) : e.fileObject && (r.name = e.fileObject.fileName);
            if (!r.ext) {
              var l = r.name.lastIndexOf('.');
              r.ext = -1 === l ? 'unknown' : r.name.slice(l + 1);
            }
            (r.size = r.size || 0), e.done(null, c.copy(r));
          }
          if (p.isWeixinApp)
            c.verifyOptions(e, 'filePath', 'msg::_doPreviewFile'),
              t.fileQuickTransfer(e, u, function () {
                var r = wx.uploadFile({
                  url: n,
                  filePath: e.filePath,
                  name: 'file',
                  formData: a,
                  fail: function (e) {
                    u({ code: 'FAILED', msg: e }), t.logger.error('error:', 'api::msg:upload file failed', e);
                  },
                  success: function (e) {
                    if (200 === e.statusCode)
                      try {
                        u(null, JSON.parse(e.data));
                      } catch (n) {
                        t.logger.error('error:', 'parse wx upload file res error', n), u({ code: 'PARSE_WX_UPLOAD_FILE_RES_ERROR', str: e.data, msg: e.errMsg });
                      }
                    else u({ code: e.statusCode, msg: e.errMsg });
                  },
                });
                'function' == typeof e.uploadprogress &&
                  r &&
                  (t.logger.info('_doPreviewFile::mini uploadprogress'),
                  r.onProgressUpdate(function (t) {
                    e.uploadprogress({ total: t.totalBytesExpectedToSend, loaded: t.totalBytesSent, percentage: t.progress, percentageText: t.progress + '%' });
                  }));
              });
          else if (p.isNodejs) {
            var y = {
              url: n,
              name: 'file',
              formData: a,
              success: function (e) {
                if (200 === e.statusCode)
                  try {
                    u(null, JSON.parse(e.data));
                  } catch (n) {
                    t.protocol.logger.error('error:', 'parse nodejs upload file res error', n),
                      u({ code: 'PARSE_NODEJS_UPLOAD_FILE_RES_ERROR', str: e.data, msg: e.errMsg });
                  }
                else u({ code: e.statusCode, msg: e.errMsg });
              },
              fail: function (e) {
                u({ code: 'FAILED', msg: e }), t.protocol.logger.error('error:', 'api::msg:upload file failed', e);
              },
            };
            if (e.filePath) y.filePath = e.filePath;
            else {
              if ('object' !== (0, r.default)(e.fileObject)) throw new l('Nodejs上传fileObject参数类型应如 {fileName:..,fileData:..} ');
              y.fileData = e.fileObject.fileData;
            }
            t.fileQuickTransfer(e, u, function () {
              d.uploadFile(y);
            });
          } else if (p.isRN) {
            var g = {
              url: n,
              name: 'file',
              formData: a,
              filePath: e.filePath,
              success: function (e) {
                if (e.ok && 200 === e.status)
                  try {
                    var n = e.headers.map && e.headers.map.etag;
                    (e.md5 = n ? ('string' == typeof n ? n : n[0]) : 'UNKNOWN'), u(null, e);
                  } catch (n) {
                    t.protocol.logger.error('error:', 'parse React Native upload file res error', n), u({ code: 'PARSE_React_Native_UPLOAD_FILE_RES_ERROR', res: e });
                  }
                else u({ code: e.status, msg: e.statusText });
              },
              fail: function (e) {
                u({ code: 'FAILED', msg: e }), t.protocol.logger.error('error:', 'api::msg:upload file failed', e);
              },
            };
            t.fileQuickTransfer(e, u, function () {
              d.uploadFile(g);
            });
          } else
            (e.uploaddone = u),
              (e.url = n),
              (e.params = a),
              (e.fileName = 'file'),
              t.fileQuickTransfer(e, u, function () {
                return new d(e);
              });
        }),
        (a.fileQuickTransfer = function (e, t, n) {
          var r = this;
          (e = e || {}), t instanceof Function || (t = function () {}), n instanceof Function || (n = function () {});
          var o = e.fastPass;
          if (o)
            try {
              (o = JSON.parse(o)), (e.fastPass = o);
            } catch (e) {
              r.protocol.logger.error('快传参数解析失败');
            }
          var i = e.fileInputName || e.name || (e.blob && e.blob.name) || '',
            s = e.fileSize || e.size || (e.blob && e.blob.size) || 0,
            a = o ? ((o.md5 || e.digest || '') + '').trim() : '',
            c = e.type || (e.blob && e.blob.type);
          if (a && s >= p.threshold) {
            var u = !0,
              l = { name: i, md5: a, ext: i.slice(i.lastIndexOf('.') + 1), type: c };
            switch (c) {
              case 'image':
                o && o.w && o.h ? ((l.w = o.w), (l.h = o.h)) : ((u = !1), r.protocol.logger.error('快传 image 文件缺少参数 w 或 h'));
                break;
              case 'video':
                o && o.w && o.h && o.dur ? ((l.w = o.w), (l.h = o.h), (l.dur = o.dur)) : ((u = !1), r.protocol.logger.error('快传 video 文件缺少参数 w 或 h 或 dur'));
                break;
              case 'audio':
                o && o.dur ? (l.dur = o.dur) : ((u = !1), r.protocol.logger.error('快传 audio 文件缺少参数 dur'));
            }
            if (!u) return void n();
            var m = { fileQuickTransfer: { md5: a } };
            return (
              s && (m.fileQuickTransfer.size = s),
              this.protocol.sendCmd('fileQuickTransfer', m, function (e, o, i) {
                (!e && i && i.fileQuickTransfer && i.fileQuickTransfer.url) || (r.protocol.logger.error('misc::fileQuickTransfer: not found', e, o), n()),
                  i && i.fileQuickTransfer && i.fileQuickTransfer.threshold && (p.threshold = i.fileQuickTransfer.threshold || 0),
                  i &&
                    i.fileQuickTransfer &&
                    i.fileQuickTransfer.url &&
                    ((l.size = s || i.fileQuickTransfer.size),
                    (l.url = i.fileQuickTransfer.url),
                    i.fileQuickTransfer._url_safe && (l._url_safe = i.fileQuickTransfer._url_safe),
                    t(e, l, !0));
              })
            );
          }
          n();
        }),
        (a.sendFile = function (e) {
          if (
            (e.type || (e.type = 'file'),
            c.verifyParamPresentJustOne(e, 'dataURL blob fileInput file filePath wxFilePath fileObject', 'msg::sendFile'),
            c.exist(e.maxSize) && c.verifyParamType('maxSize', e.maxSize, 'number', 'api::previewFile'),
            c.exist(e.commonUpload) && c.verifyParamType('commonUpload', e.commonUpload, 'boolean', 'api::previewFile'),
            this.processCallback(e),
            (e.filePath = e.filePath || e.wxFilePath),
            delete e.wxFilePath,
            e.dataURL)
          )
            this._previewAndSendFile(e);
          else if (e.blob) this._previewAndSendFile(e);
          else if (e.fileInput) {
            if (((e.fileInput = c.verifyFileInput(e.fileInput, 'msg::sendFile')), e.fileInput.files && !e.fileInput.files.length))
              return void e.done(l.newNoFileError('请选择' + e.type + '文件', { callFunc: 'msg::sendFile', fileInput: e.fileInput }), e.callback.options);
            this._previewAndSendFile(e);
          } else if (e.filePath || e.fileObject) this._previewAndSendFile(e);
          else if (e.file) {
            var t,
              n = e.file._url_safe;
            return n && ((t = e.file.url), (e.file.url = n), delete e.file._url_safe), (e.msg = new this.message.FileMessage(e)), this.sendMsg(e, t);
          }
        }),
        (a._previewAndSendFile = function (e) {
          var t = this;
          c.verifyCallback(e, 'uploaddone beforesend', 'msg::_previewAndSendFile'), f.startUniErrCache('nos', { user_id: this.account, action: 'upload' });
          var n = e.done;
          (e.done = function (r, o) {
            if (((e.done = n), r)) e.uploaddone(r, e.callback.options), e.done(r, e.callback.options);
            else {
              if (/chatroom/.test(e.scene)) return;
              var i;
              e.uploaddone(null, c.copy(o));
              var s = o._url_safe;
              s && ((i = o.url), (o.url = s), delete o._url_safe), (e.file = o), (e.msg = new t.message.FileMessage(e)), e.beforesend(t.sendMsg(e, i));
            }
          }),
            t.previewFile(e);
        }),
        (a.assembleUploadParams = function (e) {
          return e ? { Object: decodeURIComponent(e.objectName), 'x-nos-token': e.token, 'x-nos-entity-type': 'json' } : null;
        }),
        (a.deleteFile = function (e) {
          c.verifyParamPresentJustOne(e, 'docId', 'msg::deleteFile'),
            this.removeFile({
              docId: e.docId,
              callback: function (t, n) {
                t ? e.error && e.error(t, n) : e.success && e.success(n);
              },
            });
        }),
        (a.getFile = function (e) {
          c.verifyParamPresentJustOne(e, 'docId', 'msg::getFile'),
            this.fetchFile({
              docId: e.docId,
              callback: function (t, n) {
                t ? e.error && e.error(t, n) : e.success && e.success(n.info);
              },
            });
        }),
        (a.getFileList = function (e) {
          var t = e.fromDocId,
            n = void 0 === t ? '' : t,
            r = e.limit,
            o = void 0 === r ? 10 : r,
            i = { limit: o };
          n && (i.fromDocId = n),
            this.fetchFileList({
              fileListParam: i,
              callback: function (t, n) {
                t ? (o > 30 && (t.message = t.message + '::文档条数超过限制:30'), e.error && e.error(t, n)) : e.success && e.success(n);
              },
            });
        }),
        (a.sendGeo = function (e) {
          return this.processCallback(e), (e.msg = new this.message.GeoMessage(e)), this.sendMsg(e);
        }),
        (a.sendTipMsg = function (e) {
          return this.processCallback(e), (e.msg = new this.message.TipMessage(e)), this.sendMsg(e);
        }),
        (a.sendCustomMsg = function (e) {
          return this.processCallback(e), (e.msg = new this.message.CustomMessage(e)), this.sendMsg(e);
        }),
        (a.sendRobotMsg = function (e) {
          return this.processCallback(e), (e.msg = new this.message.RobotMessage(e)), this.sendMsg(e);
        }),
        (a.sendMsg = function (e, t) {
          var n,
            r = this.protocol,
            o = e.msg,
            i = {},
            s = !!e.isLocal;
          if (
            (this.logger.warn('sendMsg::start: ' + o.idClient),
            s && (e.time && (o.time = e.time), e.idClient && (o.idClient = e.idClient), e.localFrom && (n = e.localFrom + '')),
            e.resend && ('out' !== e.flow || 'fail' !== e.status))
          )
            return c.onError('只能重发发送失败的消息');
          (e.callback.options.idClient = o.idClient), this.beforeSendMsg(e, i);
          var a = (e.rtnMsg = this.formatReturnMsg(o, n));
          return (
            t &&
              !this.options.keepNosSafeUrl &&
              a.file &&
              ((a.file._url_safe = a.file.url), (a.file.url = t), 'audio' === a.type && (a.file.mp3Url = t + (~t.indexOf('?') ? '&' : '?') + 'audioTrans&type=mp3')),
            a.hasOwnProperty('chatroomId') && !a.chatroomId
              ? c.onError('聊天室未连接')
              : (s && ((a.status = 'success'), (a.isLocal = !0)),
                r.storeSendMsg && (i.promise = r.storeSendMsg(a)),
                (e.cbaop = function (e) {
                  if (e)
                    return (
                      7101 === e.code && (a.isInBlackList = !0), 'server' !== e.from ? ((a.status = 'fail'), r.updateSendMsgError && r.updateSendMsgError(a), a) : void 0
                    );
                }),
                s || (t && !this.options.keepNosSafeUrl && e.callback && (e.callback.originUrl = t), (i.msg = o), this.sendCmd(e.cmd, i, e.callback)),
                this.afterSendMsg(e),
                s &&
                  setTimeout(function () {
                    (a = c.simpleClone(a)), e.done(null, a);
                  }, 0),
                c.copy(a))
          );
        }),
        (a.beforeSendMsg = function () {}),
        (a.afterSendMsg = function () {}),
        (a.formatReturnMsg = function (e, t) {
          return (e = c.copy(e)), this.protocol.completeMsg(e), (e.status = 'sending'), t && (e.from = t), (e = this.message.reverse(e));
        }),
        (a.resendMsg = function (e) {
          return c.verifyOptions(e, 'msg', 'msg::resendMsg'), this.trimMsgFlag(e), (e.resend = !0), this._sendMsgByType(e);
        }),
        (a.forwardMsg = function (e) {
          return (
            c.verifyOptions(e, 'msg', 'msg::forwardMsg'),
            this.trimMsgFlag(e),
            this.beforeForwardMsg(e),
            (e.forward = !0),
            (e.msg.idClient = c.guid()),
            this._sendMsgByType(e)
          );
        }),
        (a.trimMsgFlag = function (e) {
          e && e.msg && ((e.msg = c.copy(e.msg)), delete e.msg.resend, delete e.msg.forward);
        }),
        (a.beforeForwardMsg = function () {}),
        (a._sendMsgByType = function (e) {
          switch (
            (c.verifyOptions(e, 'msg', 'msg::_sendMsgByType'),
            c.verifyParamValid('msg.type', e.msg.type, this.message.validTypes, 'msg::_sendMsgByType'),
            c.merge(e, e.msg),
            e.type)
          ) {
            case 'text':
              return this.sendText(e);
            case 'image':
            case 'audio':
            case 'video':
            case 'file':
              return this.sendFile(e);
            case 'geo':
              return this.sendGeo(e);
            case 'custom':
              return this.sendCustomMsg(e);
            case 'tip':
              return this.sendTipMsg(e);
            default:
              throw new l('不能发送类型为 ' + e.type + ' 的消息');
          }
        }),
        (a.parseRobotTemplate = function (e) {
          if (/<template[^>\/]+\/>/.test(e)) return { raw: e, json: [{ type: 'text', name: '', text: '' }] };
          if (!/<template[^>\/]+>/.test(e)) return { raw: e, json: [{ type: 'text', name: '', text: e }] };
          var t = new u({ escapeMode: !1 });
          e = e.replace(/<template [^>]+>/, '<template>');
          var n = t.xml2js(e);
          (n = n.template.LinearLayout), Array.isArray(n) || (n = [n]);
          var r = [];
          return (
            (n = n.forEach(function (e) {
              e.image && (r = r.concat(i(e))),
                e.text && (r = r.concat(o(e))),
                e.link &&
                  (r = r.concat(
                    (function (e) {
                      if (e.link) {
                        var t = e.link;
                        Array.isArray(t) || (t = [t]),
                          (t = t.map(function (e) {
                            return (
                              e.image && (e.image = i(e)),
                              e.text && (e.text = o(e)),
                              'url' === e._type
                                ? ((e.type = 'url'), (e.style = e._style || ''), (e.target = e._target), delete e._target, delete e._style)
                                : 'block' === e._type &&
                                  ((e.type = 'block'),
                                  (e.style = e._style || ''),
                                  (e.params = e._params || ''),
                                  (e.target = e._target),
                                  delete e._params,
                                  delete e._target,
                                  delete e._style),
                              delete e._type,
                              e
                            );
                          })),
                          (e.link = t);
                      }
                      return e.link;
                    })(e)
                  ));
            })),
            { raw: e, json: r }
          );
          function o(e) {
            return (
              Array.isArray(e.text) || (e.text = [e.text]),
              (e.text = e.text.map(function (e) {
                return { type: 'text', name: e._name, text: e.__text };
              })),
              e.text
            );
          }
          function i(e) {
            return (
              Array.isArray(e.image) || (e.image = [e.image]),
              (e.image = e.image.map(function (e) {
                return { type: 'image', name: e._name, url: e._url };
              })),
              e.image
            );
          }
        });
    },
    function (e, t, n) {
      var r, o, i;
      !(function (n, s) {
        'use strict';
        (o = []),
          void 0 ===
            (i =
              'function' ==
              typeof (r = function (e) {
                return function (t) {
                  (t = t || {}),
                    (function () {
                      (t.arrayAccessForm = t.arrayAccessForm || 'none'),
                        (t.emptyNodeForm = t.emptyNodeForm || 'text'),
                        (t.jsAttributeFilter = t.jsAttributeFilter),
                        (t.jsAttributeConverter = t.jsAttributeConverter),
                        (t.attributeConverters = t.attributeConverters || []),
                        (t.datetimeAccessFormPaths = t.datetimeAccessFormPaths || []),
                        (t.arrayAccessFormPaths = t.arrayAccessFormPaths || []),
                        (t.xmldomOptions = t.xmldomOptions || {}),
                        void 0 === t.enableToStringFunc && (t.enableToStringFunc = !0);
                      void 0 === t.skipEmptyTextNodesForObj && (t.skipEmptyTextNodesForObj = !0);
                      void 0 === t.stripWhitespaces && (t.stripWhitespaces = !0);
                      void 0 === t.useDoubleQuotes && (t.useDoubleQuotes = !0);
                      void 0 === t.ignoreRoot && (t.ignoreRoot = !1);
                      void 0 === t.escapeMode && (t.escapeMode = !0);
                      void 0 === t.attributePrefix && (t.attributePrefix = '_');
                      void 0 === t.selfClosingElements && (t.selfClosingElements = !0);
                      void 0 === t.keepCData && (t.keepCData = !1);
                      void 0 === t.jsDateUTC && (t.jsDateUTC = !1);
                    })(),
                    (function () {
                      function e(e) {
                        var t = String(e);
                        return 1 === t.length && (t = '0' + t), t;
                      }
                      'function' != typeof String.prototype.trim &&
                        (String.prototype.trim = function () {
                          return this.replace(/^\s+|^\n+|(\s|\n)+$/g, '');
                        });
                      'function' != typeof Date.prototype.toISOString &&
                        (Date.prototype.toISOString = function () {
                          return (
                            this.getUTCFullYear() +
                            '-' +
                            e(this.getUTCMonth() + 1) +
                            '-' +
                            e(this.getUTCDate()) +
                            'T' +
                            e(this.getUTCHours()) +
                            ':' +
                            e(this.getUTCMinutes()) +
                            ':' +
                            e(this.getUTCSeconds()) +
                            '.' +
                            String((this.getUTCMilliseconds() / 1e3).toFixed(3)).slice(2, 5) +
                            'Z'
                          );
                        });
                    })();
                  var n = { ELEMENT_NODE: 1, TEXT_NODE: 3, CDATA_SECTION_NODE: 4, COMMENT_NODE: 8, DOCUMENT_NODE: 9 };
                  function r(e) {
                    var t = e.localName;
                    return null == t && (t = e.baseName), (null != t && '' !== t) || (t = e.nodeName), t;
                  }
                  function o(e) {
                    return 'string' == typeof e
                      ? e.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
                      : e;
                  }
                  function i(e, n, r) {
                    switch (t.arrayAccessForm) {
                      case 'property':
                        e[n] instanceof Array ? (e[n + '_asArray'] = e[n]) : (e[n + '_asArray'] = [e[n]]);
                    }
                    if (!(e[n] instanceof Array) && t.arrayAccessFormPaths.length > 0) {
                      for (var o = !1, i = 0; i < t.arrayAccessFormPaths.length; i++) {
                        var s = t.arrayAccessFormPaths[i];
                        if ('string' == typeof s) {
                          if (s === r) {
                            o = !0;
                            break;
                          }
                        } else if (s instanceof RegExp) {
                          if (s.test(r)) {
                            o = !0;
                            break;
                          }
                        } else if ('function' == typeof s && s(n, r)) {
                          o = !0;
                          break;
                        }
                      }
                      o && (e[n] = [e[n]]);
                    }
                  }
                  function s(e) {
                    var t = e.split(/[-T:+Z]/g),
                      n = new Date(t[0], t[1] - 1, t[2]),
                      r = t[5].split('.');
                    if ((n.setHours(t[3], t[4], r[0]), r.length > 1 && n.setMilliseconds(r[1]), t[6] && t[7])) {
                      var o = 60 * t[6] + Number(t[7]),
                        i = /\d\d-\d\d:\d\d$/.test(e) ? '-' : '+';
                      (o = 0 + ('-' === i ? -1 * o : o)), n.setMinutes(n.getMinutes() - o - n.getTimezoneOffset());
                    } else
                      -1 !== e.indexOf('Z', e.length - 1) &&
                        (n = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate(), n.getHours(), n.getMinutes(), n.getSeconds(), n.getMilliseconds())));
                    return n;
                  }
                  function a(e, o) {
                    for (var a = { __cnt: 0 }, u = e.childNodes, l = 0; l < u.length; l++) {
                      var p = u.item(l),
                        m = r(p);
                      p.nodeType !== n.COMMENT_NODE &&
                        (a.__cnt++,
                        null == a[m]
                          ? ((a[m] = c(p, o + '.' + m)), i(a, m, o + '.' + m))
                          : (a[m] instanceof Array || ((a[m] = [a[m]]), i(a, m, o + '.' + m)), (a[m][a[m].length] = c(p, o + '.' + m))));
                    }
                    for (var d = 0; d < e.attributes.length; d++) {
                      var f = e.attributes.item(d);
                      a.__cnt++;
                      for (var y = f.value, g = 0; g < t.attributeConverters.length; g++) {
                        var h = t.attributeConverters[g];
                        h.test.call(null, f.name, f.value) && (y = h.convert.call(null, f.name, f.value));
                      }
                      a[t.attributePrefix + f.name] = y;
                    }
                    var v = e.prefix;
                    return (
                      v && (a.__cnt++, (a.__prefix = v)),
                      a['#text'] &&
                        ((a.__text = a['#text']),
                        a.__text instanceof Array && (a.__text = a.__text.join('\n')),
                        t.escapeMode &&
                          (a.__text = a.__text
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#x27;/g, "'")
                            .replace(/&amp;/g, '&')),
                        t.stripWhitespaces && (a.__text = a.__text.trim()),
                        delete a['#text'],
                        'property' === t.arrayAccessForm && delete a['#text_asArray'],
                        (a.__text = (function (e, n, r) {
                          if (t.datetimeAccessFormPaths.length > 0)
                            for (var o = r.split('.#')[0], i = 0; i < t.datetimeAccessFormPaths.length; i++) {
                              var a = t.datetimeAccessFormPaths[i];
                              if ('string' == typeof a) {
                                if (a === o) return s(e);
                              } else if (a instanceof RegExp) {
                                if (a.test(o)) return s(e);
                              } else if ('function' == typeof a && a(o)) return s(e);
                            }
                          return e;
                        })(a.__text, 0, o + '.#text'))),
                      a.hasOwnProperty('#cdata-section') &&
                        ((a.__cdata = a['#cdata-section']), delete a['#cdata-section'], 'property' === t.arrayAccessForm && delete a['#cdata-section_asArray']),
                      1 === a.__cnt && a.__text
                        ? (a = a.__text)
                        : 0 === a.__cnt && 'text' === t.emptyNodeForm
                        ? (a = '')
                        : a.__cnt > 1 &&
                          void 0 !== a.__text &&
                          t.skipEmptyTextNodesForObj &&
                          ((t.stripWhitespaces && '' === a.__text) || '' === a.__text.trim()) &&
                          delete a.__text,
                      delete a.__cnt,
                      t.keepCData || a.hasOwnProperty('__text') || !a.hasOwnProperty('__cdata') || 1 !== Object.keys(a).length
                        ? (t.enableToStringFunc &&
                            (a.__text || a.__cdata) &&
                            (a.toString = function () {
                              return (this.__text ? this.__text : '') + (this.__cdata ? this.__cdata : '');
                            }),
                          a)
                        : a.__cdata
                        ? a.__cdata
                        : ''
                    );
                  }
                  function c(e, o) {
                    return e.nodeType === n.DOCUMENT_NODE
                      ? (function (e) {
                          for (var o = {}, i = e.childNodes, s = 0; s < i.length; s++) {
                            var a = i.item(s);
                            if (a.nodeType === n.ELEMENT_NODE) {
                              var u = r(a);
                              t.ignoreRoot ? (o = c(a, u)) : (o[u] = c(a, u));
                            }
                          }
                          return o;
                        })(e)
                      : e.nodeType === n.ELEMENT_NODE
                      ? a(e, o)
                      : e.nodeType === n.TEXT_NODE || e.nodeType === n.CDATA_SECTION_NODE
                      ? e.nodeValue
                      : null;
                  }
                  function u(e, n, r, i) {
                    var s = '<' + (e && e.__prefix ? e.__prefix + ':' : '') + n;
                    if (r)
                      for (var a = 0; a < r.length; a++) {
                        var c = r[a],
                          u = e[c];
                        t.escapeMode && (u = o(u)),
                          (s += ' ' + c.substr(t.attributePrefix.length) + '='),
                          t.useDoubleQuotes ? (s += '"' + u + '"') : (s += "'" + u + "'");
                      }
                    return (s += i ? ' />' : '>');
                  }
                  function l(e, t) {
                    return '</' + (e && e.__prefix ? e.__prefix + ':' : '') + t + '>';
                  }
                  function p(e, n) {
                    return (
                      ('property' === t.arrayAccessForm && ((r = n.toString()), (o = '_asArray'), -1 !== r.indexOf(o, r.length - o.length))) ||
                      0 === n.toString().indexOf(t.attributePrefix) ||
                      0 === n.toString().indexOf('__') ||
                      e[n] instanceof Function
                    );
                    var r, o;
                  }
                  function m(e) {
                    var t = 0;
                    if (e instanceof Object) for (var n in e) p(e, n) || t++;
                    return t;
                  }
                  function d(e) {
                    var n = [];
                    if (e instanceof Object) for (var r in e) -1 === r.toString().indexOf('__') && 0 === r.toString().indexOf(t.attributePrefix) && n.push(r);
                    return n;
                  }
                  function f(e) {
                    var n = '';
                    return (
                      e instanceof Object
                        ? (n += (function (e) {
                            var n = '';
                            e.__cdata && (n += '<![CDATA[' + e.__cdata + ']]>');
                            (e.__text || 'number' == typeof e.__text || 'boolean' == typeof e.__text) && (t.escapeMode ? (n += o(e.__text)) : (n += e.__text));
                            return n;
                          })(e))
                        : null !== e && (t.escapeMode ? (n += o(e)) : (n += e)),
                      n
                    );
                  }
                  function y(e, n, r) {
                    var o = '';
                    if (t.jsAttributeFilter && t.jsAttributeFilter.call(null, n, e)) return o;
                    if ((t.jsAttributeConverter && (e = t.jsAttributeConverter.call(null, n, e)), (null != e && '' !== e) || !t.selfClosingElements))
                      if ('object' == typeof e)
                        if ('[object Array]' === Object.prototype.toString.call(e))
                          o += (function (e, t, n) {
                            var r = '';
                            if (0 === e.length) r += u(e, t, n, !0);
                            else for (var o = 0; o < e.length; o++) r += y(e[o], t, d(e[o]));
                            return r;
                          })(e, n, r);
                        else if (e instanceof Date) (o += u(e, n, r, !1)), (o += t.jsDateUTC ? e.toUTCString() : e.toISOString()), (o += l(e, n));
                        else {
                          var i = m(e);
                          i > 0 || 'number' == typeof e.__text || 'boolean' == typeof e.__text || e.__text || e.__cdata
                            ? ((o += u(e, n, r, !1)), (o += g(e)), (o += l(e, n)))
                            : t.selfClosingElements
                            ? (o += u(e, n, r, !0))
                            : ((o += u(e, n, r, !1)), (o += l(e, n)));
                        }
                      else (o += u(e, n, r, !1)), (o += f(e)), (o += l(e, n));
                    else o += u(e, n, r, !0);
                    return o;
                  }
                  function g(e) {
                    var t = '',
                      n = m(e);
                    if (n > 0)
                      for (var r in e)
                        if (!p(e, r)) {
                          var o = e[r],
                            i = d(o);
                          t += y(o, r, i);
                        }
                    return (t += f(e));
                  }
                  function h(n) {
                    if (void 0 === n) return null;
                    if ('string' != typeof n) return null;
                    var r = null,
                      o = null;
                    if (e) (r = new e(t.xmldomOptions)), (o = r.parseFromString(n, 'text/xml'));
                    else if (window && window.DOMParser) {
                      r = new window.DOMParser();
                      var i = null,
                        s = window.ActiveXObject || 'ActiveXObject' in window;
                      if (!s)
                        try {
                          i = r.parseFromString('INVALID', 'text/xml').childNodes[0].namespaceURI;
                        } catch (e) {
                          i = null;
                        }
                      try {
                        (o = r.parseFromString(n, 'text/xml')), null !== i && o.getElementsByTagNameNS(i, 'parsererror').length > 0 && (o = null);
                      } catch (e) {
                        o = null;
                      }
                    } else 0 === n.indexOf('<?') && (n = n.substr(n.indexOf('?>') + 2)), ((o = new ActiveXObject('Microsoft.XMLDOM')).async = 'false'), o.loadXML(n);
                    return o;
                  }
                  (this.asArray = function (e) {
                    return null == e ? [] : e instanceof Array ? e : [e];
                  }),
                    (this.toXmlDateTime = function (e) {
                      return e instanceof Date ? e.toISOString() : 'number' == typeof e ? new Date(e).toISOString() : null;
                    }),
                    (this.asDateTime = function (e) {
                      return 'string' == typeof e ? s(e) : e;
                    }),
                    (this.xml2dom = function (e) {
                      return h(e);
                    }),
                    (this.dom2js = function (e) {
                      return c(e, null);
                    }),
                    (this.js2dom = function (e) {
                      var t = this.js2xml(e);
                      return h(t);
                    }),
                    (this.xml2js = function (e) {
                      var t = h(e);
                      return null != t ? this.dom2js(t) : null;
                    }),
                    (this.js2xml = function (e) {
                      return g(e);
                    }),
                    (this.getVersion = function () {
                      return '3.1.1';
                    });
                };
              })
                ? r.apply(t, o)
                : r) || (e.exports = i);
      })();
    },
    function (e, t, n) {
      'use strict';
      var r = n(1),
        o = n(0),
        i = n(6),
        s = n(18).upload,
        a = n(17),
        c = n(18).chunkUpload,
        u = n(18).abort,
        l = o.supportFormData;
      function p(e) {
        var t = this;
        (t.options = o.copy(e)),
          o.verifyOptions(e, 'url fileName'),
          o.verifyParamPresentJustOne(e, 'blob fileInput'),
          o.verifyCallback(e, 'beginupload uploadprogress uploaddone'),
          console.log(e.url),
          e.fileInput && (e.fileInput = o.verifyFileInput(e.fileInput)),
          e.type && o.verifyFileType(e.type),
          e.timeout ? o.verifyParamType('timeout', e.timeout, 'number') : (e.timeout = 6e5),
          o.verifyFileUploadCallback(e),
          (e.data = {}),
          e.params && o.merge(e.data, e.params);
        var n = e.fileName,
          u = e.fileInput;
        if (l) {
          if (u) {
            var p = e.type ? o.filterFiles(u.files, e.type) : [].slice.call(u.files, 0);
            if (!p || !p.length)
              return void e.uploaddone(
                i.newWrongFileTypeError('未读取到' + e.type + '类型的文件, 请确保文件选择节点的文件不为空, 并且请确保选择了' + e.type + '类型的文件')
              );
            e.data[n] = p[0];
            var m = u.files[0].size;
          } else if (e.blob) {
            if (((e.data[n] = e.blob), 'file' !== e.type && e.blob.type && -1 === e.blob.type.indexOf(e.type)))
              return void e.uploaddone(i.newWrongFileTypeError('未读取到' + e.type + '类型的文件, 请确保选择了' + e.type + '类型的文件'));
            m = e.blob.size;
          }
          if (e.maxSize && m > e.maxSize) return void e.uploaddone(i.newFileTooLargeError('上传文件大小超过' + e.maxSize + '限制'));
          if (!e.commonUpload)
            return m > r.chunkMaxSize
              ? void e.uploaddone(i.newFileTooLargeError('直传文件大小超过' + r.chunkMaxSize + '限制'))
              : ((t.onLbsUrlFail = function (t) {
                  console.log(t),
                    a.startUniErrCache('nos', { user_id: e.account, action: 'upload' }),
                    a.updateUniErrCache('nos', { operation_type: 'transfer', error: 'lbs failed', target: t });
                }),
                void (t.sn = c(e, n, t, -1)));
          if (m > r.commonMaxSize) return void e.uploaddone(i.newFileTooLargeError('普通上传文件大小超过' + r.commonMaxSize + '限制'));
        } else o.dataset(u, 'name', n), (e.data.input = u);
        var d = {
          data: e.data,
          onaftersend: function () {
            e.beginupload(t);
          },
          onuploading: function (t) {
            var n = Math.floor((1e4 * t.loaded) / t.total) / 100,
              r = { docId: e.docId, total: t.total, loaded: t.loaded, percentage: n, percentageText: n + '%' };
            e.fileInput && (r.fileInput = e.fileInput), e.blob && (r.blob = e.blob), e.uploadprogress(r);
          },
          onload: function (n) {
            (n.docId = e.docId), n.Error ? t.onError(n) : e.uploaddone(null, n);
          },
          onerror: function (n) {
            try {
              if (n.result) var r = JSON.parse(n.result);
              else r = n;
              t.onError(r);
            } catch (r) {
              console.log('error: ignore error if could not parse obj.result', r), e.uploaddone(new i(n.message, n.code), t.options);
            }
          },
        };
        l || (d.mode = 'iframe'), (d.putFileAtEnd = !0), (t.sn = s(e.url, d));
      }
      (p.prototype.onError = function (e) {
        var t,
          n,
          r,
          o = this.options;
        (n = (t = (e = e || {}).Error || e || {}).Code || t.code || 'unknown'), (r = t.Message || t.message || '未知错误'), o.uploaddone(new i(n + '(' + r + ')', n));
      }),
        (p.prototype.abort = function () {
          u(this.sn);
        }),
        (e.exports = p);
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(0),
        i = n(11).fn,
        s = n(90),
        a = n(88),
        c = n(6);
      (i.transDoc = function (e) {
        o.verifyOptions(e, 'fileInput done', 'nos::transDoc');
        try {
          var t = e.fileInput.files[0],
            n = (e.fileInputName = t.name),
            r = { ppt: 1, pptx: 2, pdf: 3, doc: 6, docx: 7 },
            i = n.substring(n.lastIndexOf('.') + 1);
          if (['ppt', 'pdf', 'pptx', 'doc', 'docx'].indexOf(i) < 0)
            return void e.done(c.newNoFileError('请上传正确格式的文件【ppt, pptx, pdf, doc, docx】', { callFunc: 'nos: transDoc', fileInput: e.fileInput }), e);
        } catch (t) {
          return void e.done(c.newNoFileError('请上传正确的文件节点', { callFunc: 'msg::previewFile', fileInput: e.fileInput }), e);
        }
        var s = JSON.stringify(a.genResponseBody('file') || {}).replace(/"/gi, '\\"'),
          u = { transToken: { name: n, type: r[i], transType: 'png' === e.transcode ? 11 : 10, size: t.size, body: s } };
        this.getNosTokenTrans({
          responseBody: u,
          nosToken: { nosScene: e.nosScene || this.nosScene, nosSurvivalTime: e.nosSurvivalTime },
          callback: function (t, n) {
            t ? e.done(t) : ((e.nosToken = n.nosToken), (e.docId = n.docId), this._doPreviewFile(e));
          }.bind(this),
        });
      }),
        (i.getSimpleNosToken = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          return (e.num = 1), o.verifyOptions(e), this.cbAndSendCmd('getSimpleNosToken', e);
        }),
        (i.getNosToken = function (e) {
          var t = e.callback,
            n = e.nosToken,
            r = e.responseBody,
            o = { tag: n.nosScene };
          n.nosSurvivalTime && n.nosSurvivalTime !== 1 / 0 && (o.expireSec = n.nosSurvivalTime), this.sendCmd('getNosToken', { responseBody: r, nosToken: o }, t);
        }),
        (i.getNosTokenTrans = function (e) {
          this.sendCmd('getNosTokenTrans', e.responseBody, e.callback);
        }),
        (i.packFileDownloadName = function (e) {
          o.verifyOptions(e, 'url name', !0, '', 'nos::packFileDownloadName');
          var t = e.url;
          return t + o.genUrlSep(t) + 'download=' + encodeURIComponent(e.name);
        }),
        (i.audioToMp3 = function (e) {
          o.verifyOptions(e, 'url', 'nos::audioToMp3');
          var t = e.url;
          return t + o.genUrlSep(t) + 'audioTrans&type=mp3';
        }),
        (i.removeFile = function (e) {
          this.sendCmd('removeFile', e, e.callback);
        }),
        (i.fetchFile = function (e) {
          this.sendCmd('fetchFile', e, e.callback);
        }),
        (i.fetchFileList = function (e) {
          this.sendCmd('fetchFileList', e, e.callback);
        }),
        (i.stripImageMeta = function (e) {
          return this.beforeProcessImage(e, 'stripmeta');
        }),
        (i.qualityImage = function (e) {
          return this.beforeProcessImage(e, 'quality');
        }),
        (i.interlaceImage = function (e) {
          return this.beforeProcessImage(e, 'interlace');
        }),
        (i.rotateImage = function (e) {
          return this.beforeProcessImage(e, 'rotate');
        }),
        (i.blurImage = function (e) {
          return this.beforeProcessImage(e, 'blur');
        }),
        (i.cropImage = function (e) {
          return this.beforeProcessImage(e, 'crop');
        }),
        (i.thumbnailImage = function (e) {
          return this.beforeProcessImage(e, 'thumbnail');
        }),
        (i.beforeProcessImage = function (e, t) {
          var n = o.copy(e);
          return (n.type = t), (e.ops = [n]), this.processImage(e);
        }),
        (i.processImage = function (e) {
          var t = this;
          o.verifyOptions(e, 'url ops', !0, '', 'nos::processImage'), o.verifyParamType('ops', e.ops, 'array', 'nos::processImage');
          var n = e.ops.map(function (e) {
            return (
              o.verifyOptions(e, 'type', !0, '', 'nos::processImage'),
              o.verifyParamValid('type', e.type, s.validTypes, 'nos::processImage'),
              t['gen' + e.type.slice(0, 1).toUpperCase() + e.type.slice(1) + 'Op'](e)
            );
          });
          t.processCallback(e), t.sendCmd('processImage', { url: e.url, imageOps: n }, e.callback);
        }),
        (i.genStripmetaOp = function (e) {
          return new s({ type: e.type, stripmeta: e.strip ? 1 : 0 });
        }),
        (i.genQualityOp = function (e) {
          o.verifyOptions(e, 'quality', !0, '', 'nos::genQualityOp'),
            o.verifyParamType('quality', e.quality, 'number', 'nos::genQualityOp'),
            o.verifyParamMin('quality', e.quality, 0, 'nos::genQualityOp'),
            o.verifyParamMax('quality', e.quality, 100, 'nos::genQualityOp');
          var t = Math.round(e.quality);
          return new s({ type: e.type, qualityQuality: t });
        }),
        (i.genInterlaceOp = function (e) {
          return new s({ type: e.type });
        }),
        (i.genRotateOp = function (e) {
          for (o.verifyOptions(e, 'angle', !0, '', 'nos::genRotateOp'), o.verifyParamType('angle', e.angle, 'number', 'nos::genRotateOp'); e.angle < 0; )
            e.angle = e.angle + 360;
          e.angle = e.angle % 360;
          var t = Math.round(e.angle);
          return new s({ type: e.type, rotateAngle: t });
        }),
        (i.genBlurOp = function (e) {
          o.verifyOptions(e, 'radius sigma', 'nos::genBlurOp'),
            o.verifyParamType('radius', e.radius, 'number', 'nos::genBlurOp'),
            o.verifyParamMin('radius', e.radius, 1, 'nos::genBlurOp'),
            o.verifyParamMax('radius', e.radius, 50, 'nos::genBlurOp'),
            o.verifyParamType('sigma', e.sigma, 'number', 'nos::genBlurOp'),
            o.verifyParamMin('sigma', e.sigma, 0, 'nos::genBlurOp');
          var t = Math.round(e.radius),
            n = Math.round(e.sigma);
          return new s({ type: e.type, blurRadius: t, blurSigma: n });
        }),
        (i.genCropOp = function (e) {
          o.verifyOptions(e, 'x y width height', 'nos::genCropOp'),
            o.verifyParamType('x', e.x, 'number', 'nos::genCropOp'),
            o.verifyParamMin('x', e.x, 0, 'nos::genCropOp'),
            o.verifyParamType('y', e.y, 'number', 'nos::genCropOp'),
            o.verifyParamMin('y', e.y, 0, 'nos::genCropOp'),
            o.verifyParamType('width', e.width, 'number', 'nos::genCropOp'),
            o.verifyParamMin('width', e.width, 0, 'nos::genCropOp'),
            o.verifyParamType('height', e.height, 'number', 'nos::genCropOp'),
            o.verifyParamMin('height', e.height, 0, 'nos::genCropOp');
          var t = Math.round(e.x),
            n = Math.round(e.y),
            r = Math.round(e.width),
            i = Math.round(e.height);
          return new s({ type: e.type, cropX: t, cropY: n, cropWidth: r, cropHeight: i });
        }),
        (i.genThumbnailOp =
          ((r = { cover: 'z', contain: 'x', crop: 'y' }),
          function (e) {
            o.verifyOptions(e, 'mode', 'nos::genThumbnailOp'),
              o.verifyParamValid('mode', e.mode, Object.keys(r), 'nos::genThumbnailOp'),
              'contain' === e.mode ? o.verifyParamAtLeastPresentOne(e, 'width height', 'nos::genThumbnailOp') : o.verifyOptions(e, 'width height', 'nos::genThumbnailOp'),
              o.undef(e.width) && (e.width = 0),
              o.undef(e.height) && (e.height = 0),
              o.verifyParamType('width', e.width, 'number', 'nos::genThumbnailOp'),
              o.verifyParamMin('width', e.width, 0, 'nos::genThumbnailOp'),
              o.verifyParamType('height', e.height, 'number', 'nos::genThumbnailOp'),
              o.verifyParamMin('height', e.height, 0, 'nos::genThumbnailOp');
            var t = Math.round(e.width),
              n = Math.round(e.height),
              i = new s({ type: e.type, thumbnailMode: r[e.mode], thumbnailWidth: t, thumbnailHeight: n });
            if ('crop' === e.mode && o.notundef(e.axis)) {
              o.undef(e.axis.x) && (e.axis.x = 5),
                o.undef(e.axis.y) && (e.axis.y = 5),
                o.verifyParamMin('axis.x', e.axis.x, 0, 'nos::genThumbnailOp'),
                o.verifyParamMax('axis.x', e.axis.x, 10, 'nos::genThumbnailOp'),
                o.verifyParamMin('axis.y', e.axis.y, 0, 'nos::genThumbnailOp'),
                o.verifyParamMax('axis.y', e.axis.y, 10, 'nos::genThumbnailOp');
              var a = Math.round(e.axis.x),
                c = Math.round(e.axis.y);
              (i.thumbnailAxisX = a), (i.thumbnailAxisY = c);
            }
            return (
              o.notundef(e.enlarge) && (o.verifyParamType('enlarge', e.enlarge, 'boolean', 'nos::genThumbnailOp'), e.enlarge && (i.thumbnailEnlarge = 1)),
              (i.thumbnailToStatic = this.options.thumbnailToStatic ? 1 : 0),
              i
            );
          })),
        (i.getNosOriginUrl = function (e) {
          o.verifyOptions(e, 'safeShortUrl', !0, '', 'nos::getNosOriginUrl'),
            o.verifyParamType('safeShortUrl', e.safeShortUrl, 'string', 'nos::getNosOriginUrl'),
            /^http(s)?:/.test(e.safeShortUrl) && ~e.safeShortUrl.indexOf('im_url=1')
              ? (this.processCallback(e), this.sendCmd('getNosOriginUrl', { nosFileUrlTag: { safeUrl: e.safeShortUrl } }, e.callback))
              : e.done(new c('参数 “safeShortUrl” 内容非文件安全短链', { callFunc: 'nos: getNosOriginUrl' }), e);
        });
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(2),
        i = (r = o) && r.__esModule ? r : { default: r },
        s = n(30);
      var a,
        c = n(0),
        u = n(11).fn;
      (u.viewImageSync = function (e) {
        var t = this.options;
        c.verifyOptions(e, 'url', 'nos::viewImageSync');
        var n = e.url,
          r = (0, s.url2object)(n),
          o = r.protocol,
          a = r.hostname,
          u = r.path,
          l = r.query;
        if (
          ('boolean' == typeof e.strip && (l.stripmeta = e.strip ? 1 : 0),
          'number' == typeof e.quality &&
            (c.verifyParamMin('quality', e.quality, 0, 'nos::viewImageSync'),
            c.verifyParamMax('quality', e.quality, 100, 'nos::viewImageSync'),
            (l.quality = Math.round(e.quality))),
          'boolean' == typeof e.interlace && (l.interlace = e.interlace ? 1 : 0),
          'number' == typeof e.rotate && (l.rotate = Math.round(e.rotate)),
          'object' === (0, i.default)(e.thumbnail))
        ) {
          var p = e.thumbnail.mode || 'crop',
            m = e.thumbnail.width,
            d = e.thumbnail.height;
          if (m >= 0 && d >= 0 && m < 4096 && d < 4096 && (m > 0 || d > 0)) {
            switch (p) {
              case 'crop':
                p = 'y';
                break;
              case 'contain':
                p = 'x';
                break;
              case 'cover':
                p = 'z';
                break;
              default:
                p = 'x';
            }
            l.thumbnail = '' + m + p + d;
          }
        }
        if (t.downloadUrl) {
          var f = (0, s.url2object)(e.url),
            y = t.downloadUrl,
            g = f.path,
            h = g.indexOf('/');
          if (-1 !== h) {
            var v = g.substring(0, h),
              b = g.substring(h + 1);
            y = y.replace('{bucket}', v).replace('{object}', b);
          }
          var T = (0, s.url2object)(y);
          return (0, s.object2url)({ protocol: T.protocol, hostname: T.hostname, path: T.path, query: c.merge(T.query, l) });
        }
        return (0, s.object2url)({ protocol: o, hostname: a, path: u, query: l });
      }),
        (u.viewImageStripMeta = function (e) {
          c.verifyOptions(e, 'url strip', 'nos::viewImageStripMeta'), c.verifyParamType('strip', e.strip, 'boolean', 'nos::viewImageStripMeta');
          var t = 'stripmeta=' + (e.strip ? 1 : 0),
            n = (0, s.genUrlSep)(e.url);
          return e.url + n + t;
        }),
        (u.viewImageQuality = function (e) {
          c.verifyOptions(e, 'url quality', 'nos::viewImageQuality'),
            c.verifyParamType('quality', e.quality, 'number', 'nos::viewImageQuality'),
            c.verifyParamMin('quality', e.quality, 0, 'nos::viewImageQuality'),
            c.verifyParamMax('quality', e.quality, 100, 'nos::viewImageQuality');
          var t = 'quality=' + Math.round(e.quality),
            n = (0, s.genUrlSep)(e.url);
          return e.url + n + t;
        }),
        (u.viewImageInterlace = function (e) {
          c.verifyOptions(e, 'url', 'nos::viewImageInterlace');
          var t = (0, s.genUrlSep)(e.url);
          return e.url + t + 'interlace=1';
        }),
        (u.viewImageRotate = function (e) {
          for (c.verifyOptions(e, 'url angle', 'nos::viewImageRotate'), c.verifyParamType('angle', e.angle, 'number', 'nos::viewImageRotate'); e.angle < 0; )
            e.angle = e.angle + 360;
          e.angle = e.angle % 360;
          var t = 'rotate=' + Math.round(e.angle),
            n = (0, s.genUrlSep)(e.url);
          return e.url + n + t;
        }),
        (u.viewImageBlur = function (e) {
          c.verifyOptions(e, 'url radius sigma', 'nos::viewImageBlur'),
            c.verifyParamType('radius', e.radius, 'number', 'nos::viewImageBlur'),
            c.verifyParamMin('radius', e.radius, 1, 'nos::viewImageBlur'),
            c.verifyParamMax('radius', e.radius, 50, 'nos::viewImageBlur'),
            c.verifyParamType('sigma', e.sigma, 'number', 'nos::viewImageBlur'),
            c.verifyParamMin('sigma', e.sigma, 0, 'nos::viewImageBlur');
          var t = 'blur=' + Math.round(e.radius) + 'x' + Math.round(e.sigma),
            n = (0, s.genUrlSep)(e.url);
          return e.url + n + t;
        }),
        (u.viewImageCrop = function (e) {
          c.verifyOptions(e, 'url x y width height', 'nos::viewImageCrop'),
            c.verifyParamType('x', e.x, 'number', 'nos::viewImageCrop'),
            c.verifyParamMin('x', e.x, 0, 'nos::viewImageCrop'),
            c.verifyParamType('y', e.y, 'number', 'nos::viewImageCrop'),
            c.verifyParamMin('y', e.y, 0, 'nos::viewImageCrop'),
            c.verifyParamType('width', e.width, 'number', 'nos::viewImageCrop'),
            c.verifyParamMin('width', e.width, 0, 'nos::viewImageCrop'),
            c.verifyParamType('height', e.height, 'number', 'nos::viewImageCrop'),
            c.verifyParamMin('height', e.height, 0, 'nos::viewImageCrop');
          var t = 'crop=' + Math.round(e.x) + '_' + Math.round(e.y) + '_' + Math.round(e.width) + '_' + Math.round(e.height),
            n = (0, s.genUrlSep)(e.url);
          return e.url + n + t;
        }),
        (u.viewImageThumbnail =
          ((a = { cover: 'z', contain: 'x', crop: 'y' }),
          function (e) {
            c.verifyOptions(e, 'url mode', 'nos::viewImageThumbnail'),
              c.verifyParamValid('mode', e.mode, Object.keys(a), 'nos::viewImageThumbnail'),
              'contain' === e.mode
                ? c.verifyParamAtLeastPresentOne(e, 'width height', 'nos::viewImageThumbnail')
                : c.verifyOptions(e, 'width height', 'nos::viewImageThumbnail'),
              c.undef(e.width) && (e.width = 0),
              c.undef(e.height) && (e.height = 0),
              c.verifyParamType('width', e.width, 'number', 'nos::viewImageThumbnail'),
              c.verifyParamMin('width', e.width, 0, 'nos::viewImageThumbnail'),
              c.verifyParamType('height', e.height, 'number', 'nos::viewImageThumbnail'),
              c.verifyParamMin('height', e.height, 0, 'nos::viewImageThumbnail');
            var t = Math.round(e.width),
              n = Math.round(e.height),
              r = 'thumbnail=' + t + a[e.mode] + n;
            'crop' === e.mode &&
              c.notundef(e.axis) &&
              (c.undef(e.axis.x) && (e.axis.x = 5),
              c.undef(e.axis.y) && (e.axis.y = 5),
              c.verifyParamMin('axis.x', e.axis.x, 0, 'nos::viewImageThumbnail'),
              c.verifyParamMax('axis.x', e.axis.x, 10, 'nos::viewImageThumbnail'),
              c.verifyParamMin('axis.y', e.axis.y, 0, 'nos::viewImageThumbnail'),
              c.verifyParamMax('axis.y', e.axis.y, 10, 'nos::viewImageThumbnail'),
              (r = r + '&axis=' + Math.round(e.axis.x) + '_' + Math.round(e.axis.y))),
              c.notundef(e.enlarge) && (c.verifyParamType('enlarge', e.enlarge, 'boolean', 'nos::viewImageThumbnail'), e.enlarge && (r += '&enlarge=1'));
            var o = (0, s.genUrlSep)(e.url);
            return e.url + o + r;
          }));
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(2),
        i = (r = o) && r.__esModule ? r : { default: r };
      var s = n(0),
        a = n(11).fn;
      function c(e, t, n, r) {
        var o = !1,
          i = '';
        if ((1 === n ? e.indexOf(t) >= 0 && ((o = !0), (i = t)) : 2 === n && (i = new RegExp(t, 'g')).test(e) && (o = !0), o && '' !== i))
          switch (r) {
            case 1:
              return e.replace(i, '**');
            case 2:
              return { code: 2 };
            case 3:
              return { code: 3 };
          }
        return e;
      }
      function u(e, t) {
        for (var n = t.match, r = t.operate, o = e, s = 0; s < t.keys.length; s++) {
          var a = t.keys[s],
            u = a.match || n,
            l = a.operate || r;
          try {
            if ('object' === (void 0 === (o = c(o, a.key, u, l)) ? 'undefined' : (0, i.default)(o))) return o;
          } catch (e) {
            this.logger.warn('misc::filterContent: js cannot parse this regexp ', e);
          }
        }
        return o;
      }
      (a.uploadSdkLogUrl = function (e) {
        return s.verifyOptions(e, 'url', 'misc::uploadSdkLogUrl'), this.cbAndSendCmd('uploadSdkLogUrl', e);
      }),
        (a.getClientAntispamLexicon = function (e) {
          var t = this,
            n = (e = e || {}).done;
          n instanceof Function || (n = function () {}), (e = { clientAntispam: { version: 0 } });
          var r = this;
          return this.protocol.sendCmd('getClientAntispam', e, function (e, o, i) {
            e ? (r.protocol.logger.error('misc::getClientAntispamLexicon:', e), n.call(t, e, {})) : ((r.antispamLexicon = i.clientAntispam || {}), n.call(t, null, i));
          });
        }),
        (a.filterClientAntispam = function (e) {
          var t = e.content,
            n = e.antispamLexicon;
          if (!t) return { code: 404, errmsg: '待反垃圾文本content不存在' };
          n = n || this.antispamLexicon || {};
          var r = this.antispamLexicon && this.antispamLexicon.thesaurus;
          if (!r) return { code: 404, errmsg: '没有反垃圾词库或者词库格式不合法' };
          try {
            r = JSON.parse(r).thesaurus;
          } catch (e) {
            return this.protocol.logger.error('misc::filterClientAntispam: parse thesaurus error'), { code: 500, errmsg: '反垃圾词库格式不合法' };
          }
          for (var o = t, s = 0; s < r.length; s++)
            if ('object' === (void 0 === (o = u.call(this, o, r[s])) ? 'undefined' : (0, i.default)(o))) {
              if (2 === o.code) return { code: 200, type: 2, errmsg: '建议拒绝发送', content: t, result: '' };
              if (3 === o.code) return { code: 200, type: 3, errmsg: '建议服务器处理反垃圾，发消息带上字段clientAntiSpam', content: t, result: t };
            }
          return o === t ? { code: 200, type: 0, errmsg: '', content: t, result: o } : { code: 200, type: 1, errmsg: '已对特殊字符做了过滤', content: t, result: o };
        }),
        (a.getServerTime = function (e) {
          this.processCallback(e), this.sendCmd('getServerTime', {}, e.callback);
        }),
        (a.getNosAccessToken = function (e) {
          s.verifyOptions(e, 'url', 'misc::getNosAccessToken'), this.processCallback(e);
          var t = { url: e.url };
          e.userAgent && (t.userAgent = e.userAgentv),
            e.ext && (t.ext = e.ext),
            this.sendCmd('getNosAccessToken', { nosAccessTokenTag: t }, function (t, n, r) {
              var o = r && r.nosAccessTokenTag && r.nosAccessTokenTag.token,
                i = e.url,
                s = o ? { token: o, resUrl: i.indexOf('?') ? i + '&token=' + o : i + '?token=' + o } : {};
              e.done(t, s);
            });
        }),
        (a.deleteNosAccessToken = function (e) {
          s.verifyOptions(e, 'token', 'misc::deleteNosAccessToken'),
            this.processCallback(e),
            this.sendCmd('deleteNosAccessToken', { nosAccessTokenTag: { token: e.token } }, e.callback);
        });
    },
    function (e, t, n) {
      'use strict';
      var r = n(11).fn,
        o = n(0),
        i = n(18),
        s = n(1),
        a = n(16);
      ((a = a || {}).name = a.name || ''),
        (a.version = a.version || ''),
        (r.reportLogs = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = this,
            n = t.options,
            r = s.ntServerAddress;
          if (r) {
            var c = s.info;
            e = o.merge(e, {
              appkey: n.appKey,
              uid: n.account,
              os: 'web',
              session: t.protocol.sdkSession || '',
              ver: c.sdkVersion,
              type: t.subType,
              platform: '' + a.name.toLowerCase() + a.version.replace(/(\.\d+)+$/, ''),
            });
            var u = r + o.genUrlSep(r),
              l = [];
            for (var p in e) l.push(p + '=' + e[p]);
            (u += l.join('&')),
              i(u, {
                proxyUrl: o.url2origin(u) + '/lbs/res/cors/nej_proxy_frame.html',
                timeout: s.xhrTimeout,
                onload: function () {},
                onerror: function (e) {
                  t.logger.error('report::ajax report error', e);
                },
              });
          }
        });
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(2),
        i = (r = o) && r.__esModule ? r : { default: r };
      var s = n(11).fn,
        a = n(0),
        c = n(60),
        u = n(91);
      (s.signalingCreate = function () {
        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          t = e.type,
          n = e.channelName,
          r = e.ext;
        return (
          a.verifyOptions(e, 'type', 'api::signalling'),
          this.sendCmdUsePromise('signalingCreate', { avSignalTag: { type: t, channelName: n, ext: r } })
            .then(function (e) {
              var t = e.avSignalTag;
              return Promise.resolve(t);
            })
            .catch(function (e) {
              return Promise.reject(u.parseAvSignalError(e));
            })
        );
      }),
        (s.signalingDelay = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          return (
            a.verifyOptions(e, 'channelId', 'api::signalling'),
            this.sendCmdUsePromise('signalingDelay', { avSignalTag: e })
              .then(function (e) {
                var t = e.avSignalTag;
                return Promise.resolve(t);
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
          );
        }),
        (s.signalingClose = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = e.offlineEnabled;
          return (
            a.verifyOptions(e, 'channelId', 'api::signalling'),
            this.sendCmdUsePromise('signalingClose', { avSignalTag: a.merge(e, { isSave: !0 === t ? 1 : 0 }) })
              .then(function (e) {
                var t = e.avSignalTag;
                return (t.offlineEnabled = 1 === t.isSave), delete t.isSave, Promise.resolve(t);
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
          );
        }),
        (s.signalingJoin = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = e.offlineEnabled;
          return (
            a.verifyOptions(e, 'channelId', 'api::signalling'),
            this.sendCmdUsePromise('signalingJoin', { avSignalTag: a.merge(e, { isSave: !0 === t ? 1 : 0 }) })
              .then(function (e) {
                var t = e.avSignalTag,
                  n = t.members;
                return (
                  'string' == typeof t.members &&
                    (n = JSON.parse(t.members).map(function (e) {
                      return u.parseAvSignalMember(e);
                    })),
                  (t.members = n),
                  Promise.resolve(t)
                );
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
          );
        }),
        (s.signalingLeave = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = e.offlineEnabled;
          return (
            a.verifyOptions(e, 'channelId', 'api::signalling'),
            this.sendCmdUsePromise('signalingLeave', { avSignalTag: a.merge(e, { isSave: !0 === t ? 1 : 0 }) })
              .then(function (e) {
                var t = e.avSignalTag;
                return (t.offlineEnabled = 1 === t.isSave), delete t.isSave, Promise.resolve(t);
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
          );
        }),
        (s.signalingGetChannelInfo = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = e.channelName;
          return (
            a.verifyOptions(e, 'channelName', 'api::signalling'),
            this.sendCmdUsePromise('signalingGetChannelInfo', { avSignalTag: { channelName: t } })
              .then(function (e) {
                var t = e.avSignalTag,
                  n = t.members;
                return (
                  'string' == typeof t.members &&
                    (n = JSON.parse(t.members).map(function (e) {
                      return u.parseAvSignalMember(e);
                    })),
                  (t.members = n),
                  Promise.resolve(t)
                );
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
          );
        }),
        (s.signalingInvite = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            t = e.account,
            n = e.offlineEnabled,
            r = e.pushInfo,
            o = void 0 === r ? {} : r;
          a.verifyOptions(e, 'channelId requestId account', 'api::signalling'),
            'object' === (0, i.default)(o.pushPayload) && (o.pushPayload = JSON.stringify(o.pushPayload));
          var s = a.merge(e, o, { to: t, isSave: !0 === n ? 1 : 0, needPush: !0 === o.needPush ? 1 : 0, needBadge: !1 === o.needBadge ? 0 : 1 });
          return this.sendCmdUsePromise('signalingInvite', { avSignalTag: s })
            .then(function (e) {
              var t = e.avSignalTag;
              return (t.offlineEnabled = 1 === t.isSave), (t.needBadge = 1 === t.needBadge), (t.needPush = 1 === t.needPush), delete t.isSave, Promise.resolve(t);
            })
            .catch(function (e) {
              return Promise.reject(u.parseAvSignalError(e));
            });
        }),
        (s.signalingCancel = function (e) {
          var t = e.account,
            n = e.offlineEnabled;
          return (
            a.verifyOptions(e, 'channelId requestId account', 'api::signalling'),
            this.sendCmdUsePromise('signalingCancel', { avSignalTag: a.merge(e, { to: t, isSave: !0 === n ? 1 : 0 }) })
              .then(function (e) {
                var t = e.avSignalTag;
                return (t.offlineEnabled = 1 === t.isSave), delete t.isSave, Promise.resolve(t);
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
          );
        }),
        (s.signalingCreateAndJoin = function (e) {
          var t = this,
            n = e.channelName,
            r = e.uid,
            o = void 0 === r ? 0 : r,
            i = e.offlineEnabled,
            s = void 0 === i || i,
            c = e.attachExt,
            u = void 0 === c ? '' : c;
          return this.signalingCreate(e)
            .catch(function (e) {
              return 10405 === e.code
                ? (t.logger.warn('api::avSignal:signalingCall room already exists:', e), t.signalingGetChannelInfo({ channelName: n }))
                : Promise.reject(e);
            })
            .then(function (e) {
              var n = { channelId: e.channelId, offlineEnabled: s, attachExt: u };
              return o && a.merge(n, { uid: o }), t.signalingJoin(n);
            });
        }),
        (s.signalingCall = function (e) {
          var t = this,
            n = e.account,
            r = e.offlineEnabled,
            o = e.requestId;
          a.verifyOptions(e, 'type requestId account', 'api::signalling');
          var i = '';
          return this.signalingCreateAndJoin(e).then(function (s) {
            (i = s.channelId || i), t.logger.info('api::avSignal:signalingCall join:', i);
            var a = { channelId: i, account: n, requestId: o, offlineEnabled: r, attachExt: e.attachExt || '', pushInfo: e.pushInfo || {} };
            return t.signalingInvite(a);
          });
        }),
        (s.signalingReject = function (e) {
          var t = e.account,
            n = e.offlineEnabled;
          return (
            a.verifyOptions(e, 'channelId requestId account', 'api::signalling'),
            this.sendCmdUsePromise('signalingReject', { avSignalTag: a.merge(e, { to: t, isSave: !0 === n ? 1 : 0 }) })
              .then(function (e) {
                var t = e.avSignalTag;
                return (t.offlineEnabled = 1 === t.isSave), delete t.isSave, Promise.resolve(t);
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
          );
        }),
        (s.signalingAccept = function (e) {
          var t = this,
            n = e.account,
            r = e.offlineEnabled;
          return (
            a.verifyOptions(e, 'channelId requestId account', 'api::signalling'),
            this.sendCmdUsePromise('signalingAccept', { avSignalTag: a.merge(e, { to: n, isSave: !0 === r ? 1 : 0 }) })
              .then(function (e) {
                var t = e.avSignalTag;
                return (t.offlineEnabled = 1 === t.isSave), delete t.isSave, Promise.resolve(t);
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
              .then(function (n) {
                if (e.autoJoin) {
                  var r = { channelId: e.channelId, offlineEnabled: e.offlineEnabled, attachExt: e.joinAttachExt, uid: e.uid };
                  return t.signalingJoin(r);
                }
                return n;
              })
          );
        }),
        (s.signalingControl = function (e) {
          var t = e.account;
          return (
            a.verifyOptions(e, 'channelId', 'api::signalling'),
            this.sendCmdUsePromise('signalingControl', { avSignalTag: a.merge(e, t ? { to: t } : {}) })
              .then(function (e) {
                var t = e.avSignalTag;
                return Promise.resolve(t);
              })
              .catch(function (e) {
                return Promise.reject(u.parseAvSignalError(e));
              })
          );
        }),
        (s.signalingSync = function () {
          return this.sendCmdUsePromise('sync', { sync: { avSignal: 0 } })
            .then(function (e) {
              var t = e.avSignalTag;
              return Promise.resolve(t);
            })
            .catch(function (e) {
              return Promise.reject(u.parseAvSignalError(e));
            });
        }),
        (s.signalingMarkMsgRead = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          a.verifyOptions(e, 'msgid', 'api::signalling');
          var t = c.idMap.avSignal,
            n = void 0;
          return (n = 'string' == typeof e.msgid ? [e.msgid] : e.msgid), this.sendCmd('batchMarkRead', { sid: t.id, cid: t.signalingNotify, ids: n });
        });
    },
    function (e, t, n) {
      'use strict';
      var r = n(24).fn,
        o = n(6),
        i = n(176),
        s = n(92),
        a = n(1),
        c = n(17),
        u = n(0);
      (r.initConnect = function () {
        (this.socket = null),
          (this.retryCount = 0),
          (this.connecting = !1),
          (this.shouldReconnect = !0),
          (this.hasNotifyDisconnected = !1),
          (this.doLogout = !1),
          c.initUniErrReport({ appKey: this.options.appKey });
      }),
        (r.resetConnect = function () {
          var e = this.options;
          u.notundef(e.needReconnect)
            ? (u.verifyParamType('needReconnect', e.needReconnect, 'boolean', 'link::resetConnect'), (this.needReconnect = e.needReconnect))
            : (this.needReconnect = !0),
            this.logger.info('link::resetConnect: needReconnect ' + this.needReconnect),
            u.notundef(e.reconnectionAttempts) && u.verifyParamType('reconnectionAttempts', e.reconnectionAttempts, 'number', 'link::resetConnect'),
            u.notundef(e.noCacheLinkUrl) && u.verifyParamType('noCacheLinkUrl', e.noCacheLinkUrl, 'boolean', 'link::resetConnect'),
            (this.reconnectionAttempts = 'number' == typeof e.reconnectionAttempts ? e.reconnectionAttempts : 1 / 0),
            (this.backoff = new i({ min: a.reconnectionDelay, max: a.reconnectionDelayMax, jitter: a.reconnectionJitter }));
        }),
        (r.connect = function () {
          if ((clearTimeout(this.connectTimer), this.isConnected())) this.logger.warn('link::connect: already connected');
          else if (this.connecting) this.logger.warn('link::connect: already connecting');
          else if (
            (c.restore(),
            this.autoconnect || c.startUniErrCache('login', { user_id: this.options.account, action: 'manual_login' }),
            (this.connecting = !0),
            (this.hasNotifyDisconnected = !1),
            (this.shouldReconnect = !0),
            this.socket && this.forceDisconnect(),
            this.logger.info('link::connect: connect to new socket, autoconnect is ' + this.autoconnect),
            'string' == typeof this.options.socketUrl)
          )
            this.connectToUrl(this.options.socketUrl);
          else {
            var e = this.getNextSocketUrl();
            e && !this.options.noCacheLinkUrl ? this.connectToUrl(e) : this.refreshSocketUrl();
          }
        }),
        (r.getNextSocketUrl = function () {
          return this.socketUrls.shift();
        }),
        (r.isConnected = function () {
          return !!this.socket && !!this.socket.socket && this.socket.socket.connected;
        }),
        (r.connectToUrl = function (e) {
          var t = this;
          if (((e = e || ''), (t.url = e), t.logger.info('link::connectToUrl: ' + e), 'undefined' == typeof window)) {
            var n = u.getGlobal(),
              r = e.split(':');
            n && !n.location && r.length > 1 && (n.location = { protocol: r.shift(), port: r.pop(), hostname: r.join('') }), (this.options.transports = ['websocket']);
          }
          var o = this.options.transports || ['websocket', 'xhr-polling'];
          (t.socket = s.connect(e, { transports: o, reconnect: !1, 'force new connection': !0, 'connect timeout': a.connectTimeout })),
            t.logger.info('link::connectToUrl: socket url: ' + e + ', transports: ' + JSON.stringify(o)),
            (t.handshakeUrl = e),
            t.socket.on('connect', t.onConnect.bind(t)),
            t.socket.on('handshake_failed', t.onHandshakeFailed.bind(t)),
            t.socket.on('connect_failed', t.onConnectFailed.bind(t)),
            t.socket.on('error', t.onError.bind(t)),
            t.socket.on('message', t.onMessage.bind(t)),
            t.socket.on('disconnect', function (n) {
              t.logger.warn('link::connectToUrl: socket url: ' + e + ', disconnected'),
                (t.hasLogin = !1),
                t.doLogout ? t.logout() : t.onDisconnect('link::socketDisconnect');
            });
        }),
        (r.disconnect = function (e) {
          var t = this;
          function n(n) {
            t.logger.info('link::disconnect: socket finally closed, ', n), clearTimeout(t.disconnectCallbackTimer), e(n);
          }
          e instanceof Function || (e = function () {}),
            clearTimeout(t.connectTimer),
            (t.disconnectCallbackTimer = setTimeout(function () {
              e.call(t, 'mark disconnected due to timeout');
            }, 1e4)),
            this.onlineListener &&
              'undefined' != typeof window &&
              u.isFunction(window.removeEventListener) &&
              (window.removeEventListener('online', this.onlineListener), window.removeEventListener('offline', this.offlineListener)),
            t.socket && t.socket.socket && t.socket.socket.transport
              ? (t.socket.socket.transport.onDisconnectDone = function (e) {
                  n(e);
                })
              : n(null),
            t.isConnected()
              ? (t.logger.warn('link::disconnect: start disconnecting'), t.logout())
              : t.connecting
              ? (t.logger.warn('link::disconnect: abort connecting'), t.disconnectSocket())
              : (t.logger.warn('link::disconnect: start otherwise'),
                (t.connecting = !1),
                (t.shouldReconnect = !1),
                (t.socket = null),
                (t.autoconnect = !1),
                t.options.ondisconnect({ callFunc: 'link::disconnect', message: 'manually disconnect status' }));
        }),
        (r.onConnect = function () {
          this.backoff && this.backoff.reset(),
            (this.retryCount = 0),
            (this.connecting = !1),
            (this.shouldReconnect = !0),
            (this.hasNotifyDisconnected = !1),
            this.logger.info('link::onConnect: socket onconnected, start login'),
            c.updateUniSuccCache('login', { operation_type: 'TCP', target: this.url }),
            this.login(),
            this.api.reportLogs({ event: 'ws_connected' });
        }),
        (r.onHandshakeFailed = function () {
          this.logger.warn('link::onHandshakeFailed: shandshake failed'),
            this.api.reportLogs({ event: 'ws_handshake_failed' }),
            c.updateUniErrCache('login', { operation_type: 'TCP', error: 'ws_handshake_failed', target: this.handshakeUrl }),
            this.onDisconnect('link::onHandshakeFailed');
        }),
        (r.onConnectFailed = function () {
          this.api.reportLogs({ event: 'ws_connect_failed' }), this.onDisconnect('link::onConnectFailed');
        }),
        (r.onError = function () {
          var e = arguments[0];
          if (e) {
            if (
              (c.updateUniErrCache('login', { operation_type: 'TCP', error: 'connect_timeout' }),
              this.api.reportLogs({ event: 'connect_timeout' }),
              void 0 !== e.x5ImgDecodeStatus)
            )
              return;
            if ('[object Object]' === Object.prototype.toString.call(e) && Object.keys(e).length <= 0) return;
            this.onMiscError('连接错误', new o(e, 'LINK_ERROR', { callFunc: 'link::onError' }));
          }
          this.connecting = !1;
        }),
        (r.onDisconnect = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : null;
          this.logger.warn('socket::onDisconnect: ' + e),
            (this.connecting = !1),
            this.markAllCallbackInvalid(o.newNetworkError({ callFunc: e })),
            this.stopHeartbeat(),
            this.reconnect();
        }),
        (r.willReconnect = function () {
          return this.shouldReconnect && this.needReconnect && this.retryCount < this.reconnectionAttempts;
        }),
        (r.reconnect = function () {
          this.willReconnect()
            ? (c.startUniErrCache('login', { user_id: this.options.account, action: 'auto_login' }),
              this.socket && (this.logger.info('link::reconnect: try to force disconnect'), this.forceDisconnect()),
              this.doReconnect())
            : this.notifyDisconnect();
        }),
        (r.doReconnect = function () {
          var e = this;
          this.logger.warn('doReconnect'), (e.socket = null), e.retryCount++, (e.hasLogin = !1);
          var t = e.backoff.duration();
          e.logger.info('link::reconnect: will retry after ' + t + 'ms, retryCount ' + e.retryCount);
          var n = e.options.onwillreconnect({ retryCount: e.retryCount, duration: t });
          clearTimeout(e.connectTimer),
            (e.connectTimer = setTimeout(function () {
              1 == +e.options.authType && n instanceof Promise
                ? (e.logger.info('link::reconnect: wait onwillreconnect promise'),
                  n.finally(function () {
                    return e.connect();
                  }))
                : e.connect();
            }, t));
        }),
        (r.notifyConnectError = function (e) {
          var t = o.newConnectError({ message: e, callFunc: 'link::notifyConnectError' });
          this.logger.error('link::notifyConnectError:', t), this.options.onerror(t);
        }),
        (r.notifyDisconnect = function (e) {
          this.hasNotifyDisconnected
            ? this.logger.warn('notifyDisconnect:: already notified')
            : ((this.hasNotifyDisconnected = !0),
              this.disconnectSocket(),
              this.forceDisconnect(),
              ((e = e || new o()).retryCount = this.retryCount),
              (e.willReconnect = this.willReconnect()),
              this.backoff && this.backoff.reset(),
              (this.retryCount = 0),
              (this.autoconnect = !1),
              this.logger.info('link::notifyDisconnect: ondisconnected', e),
              this.options.ondisconnect(e),
              c.concludeUniErrCache('login', 1),
              this.onWbNotifyHangup instanceof Function && this.onWbNotifyHangup({ content: { account: this.account, channelId: null, timetag: +Date() } }));
        }),
        (r.disconnectSocket = function () {
          if (this.isConnected() || this.connecting) {
            (this.connecting = !1), (this.shouldReconnect = !1);
            try {
              this.socket.disconnect();
            } catch (e) {
              this.socket && 'function' == typeof this.socket.removeAllListeners && this.socket.removeAllListeners(),
                this.logger.info('link::disconnectSocket: disconnect failed, error ', e);
            }
          }
        }),
        (r.initOnlineListener = function (e) {
          this.needReconnect && this.options && this.options.quickReconnect
            ? 'undefined' != typeof window && u.isFunction(window.addEventListener)
              ? this.onlineListener ||
                ((this.onlineListener = function () {
                  var e = this;
                  if ((this.logger.log('onlineListener start'), !this || !this.isConnected() || this.connecting))
                    return void this.logger.log('onlineListener disconnected or connecting', this && this.isConnected(), this.connecting);
                  this.stopHeartbeat(),
                    this.sendCmd('heartbeat', null, function (t) {
                      if (t) {
                        e.logger.info('onlineListener heartbeat detect error', t);
                        try {
                          e.forceDisconnect(), e.onDisconnect('link::onHeartbeat');
                        } catch (t) {
                          e.logger.info('onlineListener heartbeat websocket.onclose', t);
                        }
                      } else e.logger.log('onlineListener heartbeat detect success');
                    });
                }.bind(this)),
                (this.offlineListener = function (e) {
                  this.logger.log('offlineListener enter'),
                    this.forceDisconnect(),
                    this.options.ondisconnect && this.options.ondisconnect({ callFunc: 'link::offlineListener', message: 'offlineListener disconnect' }),
                    this.onDisconnect('link::offlineListener');
                }.bind(this)),
                this.logger.info('initOnlineListener success'),
                window.addEventListener('online', this.onlineListener),
                window.addEventListener('offline', this.offlineListener))
              : this.logger.warn('initOnlineListener no window.addEventListener')
            : this.logger.warn('initOnlineListener no quickReconnect');
        }),
        (r.forceDisconnect = function () {
          var e = this.socket || {};
          this.socket = null;
          try {
            'function' == typeof e.removeAllListeners && e.removeAllListeners(), 'function' == typeof e.disconnect && e.disconnect();
          } catch (e) {
            this.logger.error('forceDisconnect:: oldSocket error', e || e.message);
          }
          this.hasLogin = !1;
        });
    },
    function (e, t) {
      function n(e) {
        (e = e || {}),
          (this.ms = e.min || 100),
          (this.max = e.max || 1e4),
          (this.factor = e.factor || 2),
          (this.jitter = e.jitter > 0 && e.jitter <= 1 ? e.jitter : 0),
          (this.attempts = 0);
      }
      (e.exports = n),
        (n.prototype.duration = function () {
          var e = this.ms * Math.pow(this.factor, this.attempts++);
          if (this.jitter) {
            var t = Math.random(),
              n = Math.floor(t * this.jitter * e);
            e = 0 == (1 & Math.floor(10 * t)) ? e - n : e + n;
          }
          return 0 | Math.min(e, this.max);
        }),
        (n.prototype.reset = function () {
          this.attempts = 0;
        }),
        (n.prototype.setMin = function (e) {
          this.ms = e;
        }),
        (n.prototype.setMax = function (e) {
          this.max = e;
        }),
        (n.prototype.setJitter = function (e) {
          this.jitter = e;
        });
    },
    function (e, t) {
      e.exports = function (e) {
        return (
          e.webpackPolyfill ||
            ((e.deprecate = function () {}),
            (e.paths = []),
            e.children || (e.children = []),
            Object.defineProperty(e, 'loaded', {
              enumerable: !0,
              get: function () {
                return e.l;
              },
            }),
            Object.defineProperty(e, 'id', {
              enumerable: !0,
              get: function () {
                return e.i;
              },
            }),
            (e.webpackPolyfill = 1)),
          e
        );
      };
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(21),
        i = (r = o) && r.__esModule ? r : { default: r };
      var s,
        a = n(24).fn,
        c = n(6),
        u = n(16),
        l = n(62),
        p = n(9),
        m = n(1),
        d = n(17),
        f = n(0),
        y = f.notundef;
      (a.login = function () {
        this.doLogin();
      }),
        (a.doLogin = function () {
          var e = this,
            t = this;
          Promise.resolve()
            .then(function () {
              return t.assembleLogin();
            })
            .then(function (n) {
              var r = e.socket && e.socket.socket && e.socket.socket.sessionid;
              if (r) {
                if ((e.socketIds || (e.socketIds = {}), e.socketIds[r])) return void e.logger.warn('onConnect::repeat login', r);
                e.socketIds[r] = !0;
              } else e.logger.warn('onConnect:: no socketId ', e.socket && e.socket.socket);
              e.logger.warn('link::doLogin: ' + r + ' appLogin is ' + n.login.appLogin), t.sendCmd('login', (0, i.default)({}, n), t.onLogin.bind(t));
            });
        }),
        (a.genSessionKey =
          ((s = {}),
          function () {
            var e = this.name;
            return (s[e] = s[e] || f.guid());
          })),
        (a.assembleIMLogin = function () {
          var e = this.options,
            t = e.account;
          this.sdkSession = this.genSessionKey();
          var n = {
            appLogin: this.autoconnect ? 0 : 1,
            appKey: e.appKey,
            account: t,
            token: e.token,
            sdkVersion: m.info.sdkVersion,
            sdkHumanVersion: m.info.sdkHumanVersion,
            protocolVersion: m.info.protocolVersion,
            os: '[object Object]' === u.os.toString() ? u.os.family : u.os.toString(),
            browser: u.name + ' ' + u.version,
            clientType: m.CLIENTTYPE || 16,
            session: this.sdkSession,
            deviceId: p.deviceId,
            isReactNative: m.isRN ? 1 : 0,
            customTag: e.customTag || '',
            sdkType: 0,
          };
          return (
            (n.userAgent = 'Native/' + m.info.sdkHumanVersion),
            m.isBrowser ? (n.sdkType = 0) : m.isRN ? (n.sdkType = 2) : m.isWeixinApp && (n.sdkType = 6),
            e.customClientType && (n.customClientType = +e.customClientType),
            e.authType && (n.authType = +e.authType),
            e.loginExt && (n.loginExt = e.loginExt),
            n
          );
        }),
        (a.onLogin = function (e, t) {
          var n = this,
            r = 0;
          (n.loginResult = t),
            e
              ? t.chatroom ||
                (d.updateUniErrCache('login', { operation_type: 'protocol', error: e }), d.concludeUniErrCache('login', 1), n.onAuthError(e, 'link::onLogin'))
              : ((this.heartbeatFail = 0),
                (this.hasLogin = !0),
                (this.autoconnect = !0),
                n.startHeartbeat(),
                n.afterLogin(t),
                n.initOnlineListener(),
                (r = 5e3),
                t.chatroom || (d.updateUniSuccCache('login', { operation_type: 'protocol', target: '2-2' }), d.concludeUniErrCache('login', 0))),
            !0 === n.options.logReport &&
              setTimeout(function () {
                var e = { appKey: n.options.appKey, sdk_ver: m.info.version, deviceId: p.deviceId };
                t.chatroom || d.reportErrEvent(e);
              }, r);
        }),
        (a.afterLogin = f.emptyFunc),
        (a.notifyLogin = function () {
          var e = this.loginResult;
          this.logger.info('link::notifyLogin: on connect', e), this.options.onconnect(e);
        }),
        (a.logout = function () {
          d.pause();
          var e = 'done disconnect';
          if (this.doLogout) return (this.doLogout = !1), (e = 'done logout'), void this.onAuthError(new c(e, 'logout'), 'link::logout');
          if (this.isConnected()) {
            var t = new c(e, 'logout');
            this.onAuthError(t, 'link::logout');
          }
        }),
        (a.onKicked = function (e) {
          var t = e.content,
            n = t.from,
            r = t.reason,
            o = t.custom,
            i = t.customClientType,
            s = { reason: this.kickedReasons[r] || 'unknown', message: this.kickedMessages[r] || '未知原因' };
          if (
            (y(n) && (s.from = l.reverseType(n)),
            y(o) && (s.custom = o),
            +i > 0 && (s.customClientType = i),
            this.logger.warn('link::onKicked:', s),
            'silentlyKick' !== s.reason)
          ) {
            var a = new c('被踢了', 'kicked');
            f.merge(a, s), this.onAuthError(a, 'link::onKicked');
          } else this.logger.warn('link::onKicked: silentlyKick'), this.forceDisconnect(), this.onDisconnect('link::onKicked');
        }),
        (a.onAuthError = function (e, t) {
          var n = e && e.code;
          if ((this.logger.error('onAuthError ', t, n), /^(Error_Internet_Disconnected|Error_Timeout|Error_Connection_Socket_State_not_Match)$/.test(n)))
            return this.forceDisconnect(), void this.onDisconnect('link::onAuthError::' + n);
          ((e = e || c.newConnectionError({ callFunc: t })).callFunc = e.callFunc || t || null),
            (this.shouldReconnect = !1),
            this.markAllCallbackInvalid(e),
            this.notifyDisconnect(e);
        });
    },
    function (e, t, n) {
      'use strict';
      var r = n(24).fn,
        o = n(1);
      (r.processLink = function (e) {
        switch (e.cmd) {
          case 'heartbeat':
            this.startHeartbeat();
        }
      }),
        (r.startHeartbeat = function () {
          var e = this;
          e.stopHeartbeat(),
            (e.heartbeatTimer = setTimeout(function () {
              e.sendCmd('heartbeat', null, e.onHeartbeat.bind(e));
            }, o.heartbeatInterval));
        }),
        (r.stopHeartbeat = function () {
          this.heartbeatTimer && (clearTimeout(this.heartbeatTimer), (this.heartbeatTimer = null));
        }),
        (r.onHeartbeat = function (e, t) {
          if (e) {
            if (this.syncing) return this.logger.warn('onHeartbeat::ignore error in connecting'), void this.startHeartbeat();
            (e.callFunc = 'link::onHeartbeat'),
              this.onCustomError('heartbeat error', e),
              this.heartbeatFail++,
              this.logger.warn('onHeartbeat::error ', e.code, e),
              'Error_Timeout' === e.code &&
                (this.getOnlineStatus()
                  ? this.heartbeatFail > 1
                    ? (this.forceDisconnect(), this.onDisconnect('link::onHeartbeat'))
                    : this.sendCmd('heartbeat', null, this.onHeartbeat.bind(this))
                  : this.startHeartbeat());
          } else this.heartbeatFail = 0;
        }),
        (r.getOnlineStatus =
          'undefined' != typeof navigator && 'boolean' == typeof navigator.onLine
            ? function () {
                return navigator.onLine;
              }
            : function () {
                return !0;
              }),
        (r.heartbeat = function () {});
    },
    function (e, t, n) {
      'use strict';
      var r = n(24).fn,
        o = n(90),
        i = n(1),
        s = (n(0), n(9));
      (r.processMisc = function (e) {
        switch (e.cmd) {
          case 'getSimpleNosToken':
            e.error || (e.obj = e.content.nosTokens[0]);
            break;
          case 'getNosToken':
            e.error || (e.obj = e.content.nosToken);
            break;
          case 'uploadSdkLogUrl':
            e.error ? this.logger.error('uploadSdkLogUrl::error', e.error) : this.logger.info('uploadSdkLogUrl::success', e.obj && e.obj.url);
            break;
          case 'notifyUploadLog':
            e.error || (i.isRN ? this.uploadLocalLogRN() : i.isBrowser && this.uploadLocalLogWeb(), this.emitAPI({ type: 'notifyUploadLog' }));
            break;
          case 'audioToText':
            e.error || (e.obj.text = e.content.text);
            break;
          case 'processImage':
            (e.obj.imageOps = o.reverseImageOps(e.obj.imageOps)), e.error || (e.obj = { url: e.content.url });
            break;
          case 'getNosTokenTrans':
            e.error || (e.obj = { nosToken: e.content.nosToken, docId: e.content.docId });
            break;
          case 'getNosOriginUrl':
            e.error || (e.obj = e.content.nosFileUrlTag.originUrl);
            break;
          case 'notifyTransLog':
            e.error || this.emitAPI({ type: 'notifyTransLog', obj: e.content.transInfo });
            break;
          case 'fetchFile':
          case 'fetchFileList':
          case 'removeFile':
            e.error || (e.obj = e.content);
            break;
          case 'getServerTime':
            e.obj = e.content && e.content.time;
            break;
          case 'getNosCdnHost':
            this.getNosCdnHost(e);
        }
      }),
        (r.uploadLocalLogRN = function (e) {
          if (i.isRN && s.rnfs) {
            var t = s.rnfs,
              n = this,
              r = t.nimIndex,
              o = (t.nimIndex + 1) % 2;
            t.nimPromise = t.nimPromise
              .then(function () {
                return Promise.all([t.exists(a(r)), t.exists(a(o))]);
              })
              .then(function (e) {
                return e && (e[0] || e[1])
                  ? e[0] && e[1]
                    ? t
                        .copyFile(a(o), a(2))
                        .then(function () {
                          return t.readFile(a(r));
                        })
                        .then(function (e) {
                          return t.appendFile(a(2), e);
                        })
                    : e[0]
                    ? t.copyFile(a(r), a(2))
                    : void (e[1] && t.copyFile(a(o), a(2)))
                  : Promise.reject();
              })
              .then(function (e) {
                return new Promise(function (e, r) {
                  n.api.previewFile({
                    filePath: a(2),
                    done: function (r, o) {
                      if (
                        (Promise.all([t.unlink(a(2)), t.unlink(a(1)), t.unlink(a(0))]).finally(function () {
                          e();
                        }),
                        r)
                      )
                        n.logger.error('nim::uploadLocalLogRN:previewFile:error', r);
                      else {
                        var i = o.url;
                        i.indexOf('?') > 0 ? (i += '&') : (i += '?'), (i += 'download=' + new Date().getTime() + '_rn.log'), n.api.uploadSdkLogUrl({ url: i });
                      }
                    },
                  });
                });
              })
              .catch(function (e) {
                t.unlink(a(2)).catch(function (e) {}), n.logger.error('nim::protocol::uploadLocalLogRN', e);
              });
          }
          function a(e) {
            return t.DocumentDirectoryPath + '/nimlog_' + e + '.log';
          }
        }),
        (r.uploadLocalLogWeb = function () {
          var e = this;
          !1 !== this.options.dbLog && this.logger._local
            ? this.logger._local
                .fetchLog()
                .then(function (t) {
                  e.api.previewFile({
                    blob: new Blob([t.logs], { type: 'text/plain' }),
                    done: function (n, r) {
                      if (n) e.logger.error('uploadLocalLogWeb::previewFile:error', n);
                      else {
                        e.logger.log('uploadLocalLogWeb::previewFile:success', r);
                        var o = r.url;
                        (o += (o.indexOf('?') > 0 ? '&' : '?') + 'download=' + new Date().getTime() + '_web.log'),
                          e.api.uploadSdkLogUrl({ url: o }),
                          e.logger._local
                            .deleteLogs(t.time)
                            .then(function () {
                              e.logger.log('uploadLocalLogWeb::deleteLogs success');
                            })
                            .catch(function (t) {
                              return e.logger.error('uploadLocalLogWeb::deleteLogs:error ,', t);
                            });
                      }
                    },
                  });
                })
                .catch(function (t) {
                  e.logger.error('uploadLocalLogWeb::fetchLog:error', t);
                })
            : this.logger.warn('uploadLocalLogWeb::no dbLog');
        }),
        (r.getNosCdnHost = function (e) {
          var t = this,
            n = e.error;
          if ((n && ((n.callFunc = 'events::getNosCdnHost'), t.onCustomError('getNosCdnHost', 'EVENT_GET_NOS_CDN_HOST_ERROR', n)), e.content && e.content.nosConfigTag)) {
            var r = e.content.nosConfigTag,
              o = '',
              s = '';
            0 !== r.expire && r.cdnDomain
              ? -1 === r.expire
                ? ((o = r.cdnDomain), (s = r.objectNamePrefix))
                : ((o = r.cdnDomain),
                  (s = r.objectNamePrefix),
                  t.nosCdnHostTimer && clearTimeout(t.nosCdnHostTimer),
                  (t.nosCdnHostTimer = setTimeout(function () {
                    t.sendCmd('getNosCdnHost', {});
                  }, 800 * parseInt(r.expire))))
              : ((o = ''), (s = '')),
              (i.serverNosConfig.cdnDomain = o),
              (i.serverNosConfig.objectPrefix = s),
              i.hasLocalStorage && (localStorage.setItem('nim_cdn_domain', o), localStorage.setItem('nim_object_prefix', s));
          }
        });
    },
    function (e, t, n) {
      'use strict';
      var r = n(24).fn,
        o = n(0),
        i = n(91);
      r.processAvSignal = function (e) {
        switch (e.cmd) {
          case 'signalingCreate':
          case 'signalingDelay':
          case 'signalingClose':
          case 'signalingJoin':
          case 'signalingLeave':
          case 'signalingInvite':
          case 'signalingCancel':
          case 'signalingReject':
          case 'signalingAccept':
          case 'signalingControl':
          case 'signalingSyncMsgRead':
          case 'signalingGetChannelInfo':
            break;
          case 'signalingNotify':
            this.onSignalingNotify(e);
            break;
          case 'signalingMutilClientSyncNotify':
            this.onSignalingMutilClientSyncNotify(e);
            break;
          case 'signalingUnreadMessageSyncNotify':
            this.onSignalingUnreadMessageSyncNotify(e);
            break;
          case 'signalingChannelsSyncNotify':
            this.onSignalingMembersSyncNotify(e);
            break;
          default:
            this.logger.warn('avSignal::unhandled cmd:', e.cmd);
        }
      };
      var s = function () {
        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
        if (
          (e.needPush && (e.needPush = '1' === e.needPush),
          e.needBadge && (e.needBadge = '1' === e.needBadge),
          e.channelInValid && (e.channelInValid = '1' === e.channelInValid),
          e.attach)
        ) {
          var t = JSON.parse(e.attach);
          e.eventType = i.parseAvSignalType(t.type);
        }
        if (e.members) {
          var n = JSON.parse(e.members);
          e.members = n.map(function (e) {
            return i.parseAvSignalMember(e);
          });
        }
        return e;
      };
      (r.onSignalingNotify = function (e) {
        if (e.error) {
          var t = e.error;
          this.logger.error('protocal::avSignal:onSignalingNotify error', t), this.emitAPI({ type: 'error', error: t }), this.options.onerror(t);
        } else {
          e.raw && e.raw.r && e.raw.r.length && e.content && e.content.avSignalTag && (e.content.avSignalTag.msgid = e.raw.r[0]);
          var n = e.content.avSignalTag;
          (n = Array.isArray(n)
            ? n.map(function (e) {
                return s(e);
              })
            : s(n)),
            this.emitAPI({ type: 'signalingNotify', obj: n }),
            o.isFunction(this.options.onSignalingNotify) && this.options.onSignalingNotify(n);
        }
      }),
        (r.onSignalingMutilClientSyncNotify = function (e) {
          if (e.error) {
            var t = e.error;
            this.logger.error('protocal::avSignal:onSignalingMutilClientSyncNotify error', t), this.emitAPI({ type: 'error', error: t }), this.options.onerror(t);
          } else {
            var n = e.content.avSignalTag;
            (n = Array.isArray(n)
              ? n.map(function (e) {
                  return s(e);
                })
              : s(n)),
              this.emitAPI({ type: 'signalingMutilClientSyncNotify', obj: n }),
              o.isFunction(this.options.onSignalingMutilClientSyncNotify) && this.options.onSignalingMutilClientSyncNotify(n);
          }
        }),
        (r.onSignalingUnreadMessageSyncNotify = function (e) {
          if (e.error) {
            var t = e.error;
            this.logger.error('protocal::avSignal:onSignalingUnreadMessageSyncNotify error', t), this.emitAPI({ type: 'error', error: t }), this.options.onerror(t);
          } else {
            var n = e.content.avSignalTag;
            Array.isArray(n) &&
              (n = n.map(function (e) {
                return s(e);
              })),
              this.emitAPI({ type: 'signalingUnreadMessageSyncNotify', obj: n }),
              o.isFunction(this.options.onSignalingUnreadMessageSyncNotify) && this.options.onSignalingUnreadMessageSyncNotify(n);
          }
        }),
        (r.onSignalingMembersSyncNotify = function (e) {
          if (e.error) {
            var t = e.error;
            this.logger.error('protocal::avSignal:onSignalingMembersSyncNotify error', t), this.emitAPI({ type: 'error', error: t }), this.options.onerror(t);
          } else {
            var n = e.content.avSignalTag;
            Array.isArray(n) || (n = [n]),
              (n = n.map(function (e) {
                return s(e);
              })),
              this.emitAPI({ type: 'signalingChannelsSyncNotify', obj: n }),
              o.isFunction(this.options.onSignalingMembersSyncNotify) && this.options.onSignalingMembersSyncNotify(n);
          }
        });
    },
    function (e, t, n) {
      'use strict';
      e.exports = {
        negotiateTransportTag: { version: -1, serializeList: 1, serialize: 101 },
        initTransportTag: {},
        nosToken: { objectName: 1, token: 2, bucket: 3, expireTime: 4, expireSec: 7, tag: 8, shortUrl: 9 },
        audioToText: { url: 2 },
        imageOp: {
          type: 0,
          stripmeta: 1,
          typeType: 2,
          blurRadius: 3,
          blurSigma: 4,
          qualityQuality: 5,
          cropX: 6,
          cropY: 7,
          cropWidth: 8,
          cropHeight: 9,
          rotateAngle: 10,
          pixelPixel: 11,
          thumbnailMode: 12,
          thumbnailWidth: 13,
          thumbnailHeight: 14,
          thumbnailAxisX: 15,
          thumbnailAxisY: 16,
          thumbnailCenterX: 17,
          thumbnailCenterY: 18,
          thumbnailEnlarge: 19,
          thumbnailToStatic: 20,
          watermarkType: 21,
          watermarkGravity: 22,
          watermarkDissolve: 23,
          watermarkDx: 24,
          watermarkDy: 25,
          watermarkImage: 26,
          watermarkText: 27,
          watermarkFont: 28,
          watermarkFontSize: 29,
          watermarkFontColor: 30,
          interlace: 31,
        },
        robot: { account: 4, nick: 5, avatar: 6, intro: 7, config: 8, valid: 9, createTime: 10, updateTime: 11, custid: 12, botid: 13, bindTime: 14 },
        clientAntispam: { version: 1, md5: 2, nosurl: 3, thesaurus: 4 },
        fileQuickTransfer: { md5: 1, url: 2, size: 3, threshold: 4 },
        transToken: { name: 1, type: 2, transType: 3, size: 4, extra: 5, body: 6 },
        transInfo: { docId: 1, name: 2, prefix: 3, size: 4, type: 5, state: 6, transType: 7, transSize: 8, pageCount: 9, picInfo: 10, extra: 11, flag: 12 },
        nosFileUrlTag: { safeUrl: 0, originUrl: 1 },
        nosAccessTokenTag: { token: 0, url: 1, userAgent: 2, ext: 3 },
        fileListParam: { fromDocId: 1, limit: 2 },
        avSignalTag: {
          type: 1,
          channelName: 2,
          channelId: 3,
          channelCreateTime: 4,
          channelExpireTime: 5,
          creator: 6,
          ext: 7,
          channelInValid: 8,
          from: 10,
          to: 11,
          requestId: 12,
          needPush: 13,
          pushTitle: 14,
          pushContent: 15,
          pushPayload: 16,
          needBadge: 17,
          members: 18,
          attach: 19,
          attachExt: 20,
          isSave: 21,
          msgid: 22,
          uid: 23,
          time: 24,
        },
        login: {
          clientType: 3,
          os: 4,
          sdkVersion: 6,
          appLogin: 8,
          protocolVersion: 9,
          pushTokenName: 10,
          pushToken: 11,
          deviceId: 13,
          appKey: 18,
          account: 19,
          browser: 24,
          session: 26,
          deviceInfo: 32,
          sdkType: 41,
          userAgent: 42,
          isReactNative: 112,
          token: 1e3,
          customTag: 38,
          customClientType: 39,
          sdkHumanVersion: 40,
          authType: 115,
          loginExt: 116,
        },
        loginRes: { lastLoginDeviceId: 17, customTag: 38, connectionId: 102, ip: 103, port: 104, country: 106, hasXMPush: 111 },
        loginPort: { type: 3, os: 4, mac: 5, deviceId: 13, account: 19, deviceInfo: 32, connectionId: 102, ip: 103, time: 109, customTag: 38, customClientType: 39 },
        aosPushInfo: { pushType: 110, hasTokenPreviously: 111 },
        sync: {
          myInfo: 1,
          offlineMsgs: 2,
          teams: 3,
          netcallMsgs: 6,
          roamingMsgs: 7,
          relations: 9,
          friends: 11,
          sessions: 12,
          friendUsers: 13,
          msgReceipts: 14,
          myTeamMembers: 15,
          donnop: 16,
          deleteMsg: 17,
          sessionAck: 18,
          robots: 19,
          broadcastMsgs: 20,
          avSignal: 21,
          superTeams: 22,
          myInfoInSuperTeams: 23,
          superTeamRoamingMsgs: 24,
          deleteSuperTeamMsg: 25,
          superTeamSessionAck: 26,
          deleteMsgSelf: 27,
          stickTopSessions: 28,
          sessionHistoryMsgsDelete: 29,
          filterMsgs: 100,
        },
        donnop: { open: 1 },
        sessionReqTag: { minTimestamp: 1, maxTimestamp: 2, needLastMsg: 3, limit: 4, hasMore: 5 },
        session: { id: 1, updateTime: 2, ext: 3, lastMsg: 4 },
        superTeam: {
          teamId: 1,
          name: 3,
          type: 4,
          owner: 5,
          level: 6,
          selfCustom: 7,
          valid: 8,
          memberNum: 9,
          memberUpdateTime: 10,
          createTime: 11,
          updateTime: 12,
          validToCurrentUser: 13,
          intro: 14,
          announcement: 15,
          joinMode: 16,
          bits: 17,
          custom: 18,
          serverCustom: 19,
          avatar: 20,
          beInviteMode: 21,
          inviteMode: 22,
          updateTeamMode: 23,
          updateCustomMode: 24,
          mute: 100,
          muteType: 101,
        },
        superTeamMember: {
          teamId: 1,
          account: 3,
          type: 4,
          nickInTeam: 5,
          bits: 7,
          active: 8,
          valid: 9,
          createTime: 10,
          updateTime: 11,
          custom: 12,
          mute: 13,
          invitoraccid: 14,
          joinTime: 15,
        },
        team: {
          teamId: 1,
          name: 3,
          type: 4,
          owner: 5,
          level: 6,
          selfCustom: 7,
          valid: 8,
          memberNum: 9,
          memberUpdateTime: 10,
          createTime: 11,
          updateTime: 12,
          validToCurrentUser: 13,
          intro: 14,
          announcement: 15,
          joinMode: 16,
          bits: 17,
          custom: 18,
          serverCustom: 19,
          avatar: 20,
          beInviteMode: 21,
          inviteMode: 22,
          updateTeamMode: 23,
          updateCustomMode: 24,
          mute: 100,
          muteType: 101,
        },
        teamMember: { teamId: 1, account: 3, type: 4, nickInTeam: 5, bits: 7, active: 8, valid: 9, joinTime: 10, updateTime: 11, custom: 12, mute: 13, invitorAccid: 14 },
        msg: {
          scene: 0,
          to: 1,
          from: 2,
          fromClientType: 4,
          fromDeviceId: 5,
          fromNick: 6,
          time: 7,
          type: 8,
          body: 9,
          attach: 10,
          idClient: 11,
          idServer: 12,
          resend: 13,
          userUpdateTime: 14,
          custom: 15,
          pushPayload: 16,
          pushContent: 17,
          apnsAccounts: 18,
          apnsContent: 19,
          apnsForcePush: 20,
          yidunEnable: 21,
          antiSpamContent: 22,
          antiSpamBusinessId: 23,
          clientAntiSpam: 24,
          antiSpamUsingYidun: 25,
          needMsgReceipt: 26,
          needUpdateSession: 28,
          replyMsgFromAccount: 29,
          replyMsgToAccount: 30,
          replyMsgTime: 31,
          replyMsgIdServer: 32,
          replyMsgIdClient: 33,
          threadMsgFromAccount: 34,
          threadMsgToAccount: 35,
          threadMsgTime: 36,
          threadMsgIdServer: 37,
          threadMsgIdClient: 38,
          delete: 39,
          callbackExt: 40,
          subType: 41,
          yidunAntiCheating: 42,
          env: 43,
          yidunAntiSpamExt: 44,
          yidunAntiSpamRes: 45,
          isHistoryable: 100,
          isRoamingable: 101,
          isSyncable: 102,
          isMuted: 104,
          cc: 105,
          isInBlackList: 106,
          isPushable: 107,
          isOfflinable: 108,
          isUnreadable: 109,
          needPushNick: 110,
          isReplyMsg: 111,
          tempTeamMemberCount: 112,
        },
        threadMsgReq: { beginTime: 1, endTime: 2, lastMsgId: 3, limit: 4, reverse: 5 },
        threadMsgsMeta: { total: 1, lastMsgTime: 2 },
        comment: { from: 1, body: 2, time: 3, custom: 4, needPush: 5, needBadge: 6, pushTitle: 7, apnsText: 8, pushPayload: 9 },
        commentReq: { scene: 1, from: 2, to: 3, time: 4, idServer: 5, idClient: 6, timestamp: 100 },
        commentRes: { scene: 1, from: 2, to: 3, time: 4, idServer: 5, idClient: 6, detail: 7, modify: 8, timestamp: 100 },
        collect: { id: 1, type: 2, data: 3, custom: 4, uniqueId: 5, createTime: 6, updateTime: 7 },
        collectQuery: { beginTime: 1, endTime: 2, lastMsgId: 3, limit: 4, reverse: 5, type: 6 },
        stickTopSession: { id: 1, topCustom: 2, createTime: 3, updateTime: 4 },
        pinTag: { pinFrom: 1, pinCustom: 2, createTime: 3, updateTime: 4 },
        msgPinReq: { sessionId: 1, timetag: 2 },
        msgPinRes: { scene: 1, from: 2, to: 3, time: 4, idServer: 5, idClient: 6, pinFrom: 7, pinCustom: 8 },
        msgReceipt: { to: 1, from: 2, time: 7, idClient: 11 },
        teamMsgReceipt: { teamId: 0, idServer: 1, read: 100, unread: 101, idClient: 102, account: 103 },
        deleteMsgSelfTag: { scene: 1, from: 2, to: 3, idServer: 4, idClient: 5, time: 6, deletedTime: 7, custom: 8 },
        sysMsg: {
          time: 0,
          type: 1,
          to: 2,
          from: 3,
          ps: 4,
          attach: 5,
          idServer: 6,
          sendToOnlineUsersOnly: 7,
          apnsText: 8,
          pushPayload: 9,
          deletedIdClient: 10,
          deletedIdServer: 11,
          yidunEnable: 12,
          antiSpamContent: 13,
          deletedMsgTime: 14,
          deletedMsgFromNick: 15,
          opeAccount: 16,
          env: 21,
          callbackExt: 22,
          cc: 105,
          isPushable: 107,
          isUnreadable: 109,
          needPushNick: 110,
        },
        broadcastMsg: { broadcastId: 1, fromAccid: 2, fromUid: 3, timestamp: 4, body: 5 },
        friend: { account: 4, flag: 5, beflag: 6, source: 7, alias: 8, bits: 9, custom: 10, createTime: 11, updateTime: 12, serverex: 13 },
        user: { account: 1, nick: 3, avatar: 4, sign: 5, gender: 6, email: 7, birth: 8, tel: 9, custom: 10, createTime: 12, updateTime: 13 },
        specialRelation: { account: 0, isMuted: 1, isBlacked: 2, createTime: 3, updateTime: 4 },
        msgType: {
          text: 0,
          picture: 1,
          audio: 2,
          video: 3,
          location: 4,
          notification: 5,
          file: 6,
          netcall_audio: 7,
          netcall_vedio: 8,
          datatunnel_new: 9,
          tips: 10,
          robot: 11,
          custom: 100,
        },
        msgEvent: {
          type: 1,
          value: 2,
          idClient: 3,
          custom: 4,
          validTime: 5,
          broadcastType: 6,
          sync: 7,
          validTimeType: 8,
          durable: 9,
          time: 10,
          idServer: 11,
          clientType: 12,
          serverConfig: 13,
          serverCustom: 14,
          appid: 101,
          account: 103,
          enableMultiClient: 104,
          consid: 106,
        },
        msgEventSubscribe: { type: 1, subscribeTime: 2, sync: 3, to: 102, from: 104, time: 105 },
        clearMsgsParams: { account: 1, delRoam: 2 },
        clearMsgsParamsWithSync: { type: 0, otherAccid: 1, isDeleteRoam: 2, toTid: 3, isSyncSelf: 4, fromAccid: 5, time: 6, ext: 7 },
        msgFullSearchRequestTag: {
          keyword: 1,
          fromTime: 2,
          toTime: 3,
          sessionLimit: 4,
          msgLimit: 5,
          order: 6,
          p2pList: 7,
          teamList: 8,
          senderList: 9,
          msgTypeList: 10,
          msgSubTypeList: 11,
        },
        msgTimingFullSearchRequestTag: {
          keyword: 1,
          fromTime: 2,
          toTime: 3,
          msgLimit: 5,
          order: 6,
          p2pList: 7,
          teamList: 8,
          senderList: 9,
          msgTypeList: 10,
          msgSubTypeList: 11,
        },
        delFriendParams: { delAlias: 1 },
        proxyTag: { zone: 1, path: 2, method: 3, header: 4, body: 5 },
        proxyMsgTag: { from: 1, body: 2, time: 3 },
        sessionAckTag: { scene: 1, to: 2, timetag: 3 },
      };
    },
    function (e, t, n) {
      'use strict';
      e.exports = {
        negotiateTransportTag: { '-1': 'version', 1: 'serializeList', 101: 'serialize' },
        initTransportTag: {},
        nosToken: { 1: 'objectName', 2: 'token', 3: 'bucket', 4: 'expireTime', 7: 'expireSec', 8: 'tag', 9: 'shortUrl' },
        audioToText: { 2: 'url' },
        imageOp: {
          0: 'type',
          1: 'stripmeta',
          2: 'typeType',
          3: 'blurRadius',
          4: 'blurSigma',
          5: 'qualityQuality',
          6: 'cropX',
          7: 'cropY',
          8: 'cropWidth',
          9: 'cropHeight',
          10: 'rotateAngle',
          11: 'pixelPixel',
          12: 'thumbnailMode',
          13: 'thumbnailWidth',
          14: 'thumbnailHeight',
          15: 'thumbnailAxisX',
          16: 'thumbnailAxisY',
          17: 'thumbnailCenterX',
          18: 'thumbnailCenterY',
          19: 'thumbnailEnlarge',
          20: 'thumbnailToStatic',
          21: 'watermarkType',
          22: 'watermarkGravity',
          23: 'watermarkDissolve',
          24: 'watermarkDx',
          25: 'watermarkDy',
          26: 'watermarkImage',
          27: 'watermarkText',
          28: 'watermarkFont',
          29: 'watermarkFontSize',
          30: 'watermarkFontColor',
          31: 'interlace',
        },
        robot: {
          4: 'account',
          5: 'nick',
          6: 'avatar',
          7: 'intro',
          8: 'config',
          9: 'valid',
          10: 'createTime',
          11: 'updateTime',
          12: 'custid',
          13: 'botid',
          14: 'bindTime',
          _6_safe: '_avatar_safe',
        },
        clientAntispam: { 1: 'version', 2: 'md5', 3: 'nosurl', 4: 'thesaurus' },
        fileQuickTransfer: { 1: 'md5', 2: 'url', 3: 'size', 4: 'threshold', _2_safe: '_url_safe' },
        transToken: { 1: 'name', 2: 'type', 3: 'transType', 4: 'size', 5: 'extra', 6: 'body' },
        transInfo: {
          1: 'docId',
          2: 'name',
          3: 'prefix',
          4: 'size',
          5: 'type',
          6: 'state',
          7: 'transType',
          8: 'transSize',
          9: 'pageCount',
          10: 'picInfo',
          11: 'extra',
          12: 'flag',
        },
        nosFileUrlTag: { 0: 'safeUrl', 1: 'originUrl' },
        nosAccessTokenTag: { 0: 'token', 1: 'url', 2: 'userAgent', 3: 'ext' },
        nosConfigTag: { 1: 'bucket', 2: 'cdnDomain', 3: 'expire', 4: 'objectNamePrefix' },
        fileListParam: { 1: 'fromDocId', 2: 'limit' },
        avSignalTag: {
          1: 'type',
          2: 'channelName',
          3: 'channelId',
          4: 'channelCreateTime',
          5: 'channelExpireTime',
          6: 'creator',
          7: 'ext',
          8: 'channelInValid',
          10: 'from',
          11: 'to',
          12: 'requestId',
          13: 'needPush',
          14: 'pushTitle',
          15: 'pushContent',
          16: 'pushPayload',
          17: 'needBadge',
          18: 'members',
          19: 'attach',
          20: 'attachExt',
          21: 'isSave',
          22: 'msgid',
          23: 'uid',
          24: 'time',
        },
        login: {
          3: 'clientType',
          4: 'os',
          6: 'sdkVersion',
          8: 'appLogin',
          9: 'protocolVersion',
          10: 'pushTokenName',
          11: 'pushToken',
          13: 'deviceId',
          18: 'appKey',
          19: 'account',
          24: 'browser',
          26: 'session',
          32: 'deviceInfo',
          38: 'customTag',
          39: 'customClientType',
          40: 'sdkHumanVersion',
          112: 'isReactNative',
          115: 'authType',
          116: 'loginExt',
          1000: 'token',
        },
        loginRes: { 17: 'lastLoginDeviceId', 38: 'customTag', 102: 'connectionId', 103: 'ip', 104: 'port', 106: 'country', 111: 'hasXMPush' },
        loginPort: {
          3: 'type',
          4: 'os',
          5: 'mac',
          13: 'deviceId',
          19: 'account',
          32: 'deviceInfo',
          38: 'customTag',
          39: 'customClientType',
          102: 'connectionId',
          103: 'ip',
          109: 'time',
        },
        aosPushInfo: { 110: 'pushType', 111: 'hasTokenPreviously' },
        sync: {
          1: 'myInfo',
          2: 'offlineMsgs',
          3: 'teams',
          6: 'netcallMsgs',
          7: 'roamingMsgs',
          9: 'relations',
          11: 'friends',
          12: 'sessions',
          13: 'friendUsers',
          14: 'msgReceipts',
          15: 'myTeamMembers',
          16: 'donnop',
          17: 'deleteMsg',
          18: 'sessionAck',
          19: 'robots',
          20: 'broadcastMsgs',
          21: 'avSignal',
          22: 'superTeams',
          23: 'myInfoInSuperTeams',
          24: 'superTeamRoamingMsgs',
          25: 'deleteSuperTeamMsg',
          26: 'superTeamSessionAck',
          27: 'deleteMsgSelf',
          28: 'stickTopSessions',
          29: 'sessionHistoryMsgsDelete',
          100: 'filterMsgs',
        },
        donnop: { 1: 'open' },
        sessionReqTag: { 1: 'minTimestamp', 2: 'maxTimestamp', 3: 'needLastMsg', 4: 'limit', 5: 'hasMore' },
        session: { 1: 'id', 2: 'updateTime', 3: 'ext', 4: 'lastMsg', 5: 'lastMsgType' },
        superTeam: {
          1: 'teamId',
          3: 'name',
          4: 'type',
          5: 'owner',
          6: 'level',
          7: 'selfCustom',
          8: 'valid',
          9: 'memberNum',
          10: 'memberUpdateTime',
          11: 'createTime',
          12: 'updateTime',
          13: 'validToCurrentUser',
          14: 'intro',
          15: 'announcement',
          16: 'joinMode',
          17: 'bits',
          18: 'custom',
          19: 'serverCustom',
          20: 'avatar',
          21: 'beInviteMode',
          22: 'inviteMode',
          23: 'updateTeamMode',
          24: 'updateCustomMode',
          100: 'mute',
          101: 'muteType',
          _20_safe: '_avatar_safe',
        },
        superTeamMember: {
          1: 'teamId',
          3: 'account',
          4: 'type',
          5: 'nickInTeam',
          7: 'bits',
          8: 'active',
          9: 'valid',
          10: 'createTime',
          11: 'updateTime',
          12: 'custom',
          13: 'mute',
          14: 'invitoraccid',
          15: 'joinTime',
        },
        team: {
          1: 'teamId',
          3: 'name',
          4: 'type',
          5: 'owner',
          6: 'level',
          7: 'selfCustom',
          8: 'valid',
          9: 'memberNum',
          10: 'memberUpdateTime',
          11: 'createTime',
          12: 'updateTime',
          13: 'validToCurrentUser',
          14: 'intro',
          15: 'announcement',
          16: 'joinMode',
          17: 'bits',
          18: 'custom',
          19: 'serverCustom',
          20: 'avatar',
          21: 'beInviteMode',
          22: 'inviteMode',
          23: 'updateTeamMode',
          24: 'updateCustomMode',
          100: 'mute',
          101: 'muteType',
          _20_safe: '_avatar_safe',
        },
        teamMember: {
          1: 'teamId',
          3: 'account',
          4: 'type',
          5: 'nickInTeam',
          7: 'bits',
          8: 'active',
          9: 'valid',
          10: 'joinTime',
          11: 'updateTime',
          12: 'custom',
          13: 'mute',
          14: 'invitorAccid',
        },
        msg: {
          0: 'scene',
          1: 'to',
          2: 'from',
          4: 'fromClientType',
          5: 'fromDeviceId',
          6: 'fromNick',
          7: 'time',
          8: 'type',
          9: 'body',
          10: 'attach',
          11: 'idClient',
          12: 'idServer',
          13: 'resend',
          14: 'userUpdateTime',
          15: 'custom',
          16: 'pushPayload',
          17: 'pushContent',
          18: 'apnsAccounts',
          19: 'apnsContent',
          20: 'apnsForcePush',
          21: 'yidunEnable',
          22: 'antiSpamContent',
          23: 'antiSpamBusinessId',
          24: 'clientAntiSpam',
          25: 'antiSpamUsingYidun',
          26: 'needMsgReceipt',
          28: 'needUpdateSession',
          29: 'replyMsgFromAccount',
          30: 'replyMsgToAccount',
          31: 'replyMsgTime',
          32: 'replyMsgIdServer',
          33: 'replyMsgIdClient',
          34: 'threadMsgFromAccount',
          35: 'threadMsgToAccount',
          36: 'threadMsgTime',
          37: 'threadMsgIdServer',
          38: 'threadMsgIdClient',
          39: 'delete',
          40: 'callbackExt',
          41: 'subType',
          42: 'yidunAntiCheating',
          43: 'env',
          44: 'yidunAntiSpamExt',
          45: 'yidunAntiSpamRes',
          100: 'isHistoryable',
          101: 'isRoamingable',
          102: 'isSyncable',
          104: 'isMuted',
          105: 'cc',
          106: 'isInBlackList',
          107: 'isPushable',
          108: 'isOfflinable',
          109: 'isUnreadable',
          110: 'needPushNick',
          111: 'isReplyMsg',
          112: 'tempTeamMemberCount',
        },
        threadMsgReq: { 1: 'beginTime', 2: 'endTime', 3: 'lastMsgId', 4: 'limit', 5: 'reverse' },
        threadMsgsMeta: { 1: 'total', 2: 'lastMsgTime' },
        comment: { 1: 'from', 2: 'body', 3: 'time', 4: 'custom', 5: 'needPush', 6: 'needBadge', 7: 'pushTitle', 8: 'apnsText', 9: 'pushPayload' },
        commentReq: { 1: 'scene', 2: 'from', 3: 'to', 4: 'time', 5: 'idServer', 6: 'idClient', 100: 'timestamp' },
        commentRes: { 1: 'scene', 2: 'from', 3: 'to', 4: 'time', 5: 'idServer', 6: 'idClient', 7: 'detail', 8: 'modify', 100: 'timestamp' },
        collect: { 1: 'id', 2: 'type', 3: 'data', 4: 'custom', 5: 'uniqueId', 6: 'createTime', 7: 'updateTime' },
        collectQuery: { 1: 'beginTime', 2: 'endTime', 3: 'lastMsgId', 4: 'limit', 5: 'reverse', 6: 'type' },
        stickTopSession: { 1: 'id', 2: 'topCustom', 3: 'createTime', 4: 'updateTime' },
        pinTag: { 1: 'pinFrom', 2: 'pinCustom', 3: 'createTime', 4: 'updateTime' },
        msgPinReq: { 1: 'sessionId', 2: 'timetag' },
        msgPinRes: { 1: 'scene', 2: 'from', 3: 'to', 4: 'time', 5: 'idServer', 6: 'idClient', 7: 'pinFrom', 8: 'pinCustom' },
        msgReceipt: { 1: 'to', 2: 'from', 7: 'time', 11: 'idClient' },
        teamMsgReceipt: { 0: 'teamId', 1: 'idServer', 100: 'read', 101: 'unread', 102: 'idClient', 103: 'account' },
        deleteMsgSelfTag: { 1: 'scene', 2: 'from', 3: 'to', 4: 'idServer', 5: 'idClient', 6: 'time', 7: 'deletedTime', 8: 'custom' },
        sysMsg: {
          0: 'time',
          1: 'type',
          2: 'to',
          3: 'from',
          4: 'ps',
          5: 'attach',
          6: 'idServer',
          7: 'sendToOnlineUsersOnly',
          8: 'apnsText',
          9: 'pushPayload',
          10: 'deletedIdClient',
          11: 'deletedIdServer',
          12: 'yidunEnable',
          13: 'antiSpamContent',
          14: 'deletedMsgTime',
          15: 'deletedMsgFromNick',
          16: 'opeAccount',
          21: 'env',
          22: 'callbackExt',
          105: 'cc',
          107: 'isPushable',
          109: 'isUnreadable',
          110: 'needPushNick',
        },
        broadcastMsg: { 1: 'broadcastId', 2: 'fromAccid', 3: 'fromUid', 4: 'timestamp', 5: 'body' },
        friend: { 4: 'account', 5: 'flag', 6: 'beflag', 7: 'source', 8: 'alias', 9: 'bits', 10: 'custom', 11: 'createTime', 12: 'updateTime', 13: 'serverex' },
        user: {
          1: 'account',
          3: 'nick',
          4: 'avatar',
          5: 'sign',
          6: 'gender',
          7: 'email',
          8: 'birth',
          9: 'tel',
          10: 'custom',
          12: 'createTime',
          13: 'updateTime',
          _4_safe: '_avatar_safe',
        },
        specialRelation: { 0: 'account', 1: 'isMuted', 2: 'isBlacked', 3: 'createTime', 4: 'updateTime' },
        msgType: {
          0: 'text',
          1: 'picture',
          2: 'audio',
          3: 'video',
          4: 'location',
          5: 'notification',
          6: 'file',
          7: 'netcall_audio',
          8: 'netcall_vedio',
          9: 'datatunnel_new',
          10: 'tips',
          11: 'robot',
          100: 'custom',
        },
        msgEvent: {
          1: 'type',
          2: 'value',
          3: 'idClient',
          4: 'custom',
          5: 'validTime',
          6: 'broadcastType',
          7: 'sync',
          8: 'validTimeType',
          9: 'durable',
          10: 'time',
          11: 'idServer',
          12: 'clientType',
          13: 'serverConfig',
          14: 'serverCustom',
          101: 'appid',
          103: 'account',
          104: 'enableMultiClient',
          106: 'consid',
        },
        msgEventSubscribe: { 1: 'type', 2: 'subscribeTime', 3: 'sync', 102: 'to', 104: 'from', 105: 'time' },
        clearMsgsParams: { 1: 'account', 2: 'delRoam' },
        clearMsgsParamsWithSync: { 0: 'type', 1: 'otherAccid', 2: 'delRoam', 3: 'toTid', 4: 'isSyncSelf', 5: 'fromAccid', 6: 'time', 7: 'ext' },
        msgFullSearchRequestTag: {
          1: 'keyword',
          2: 'fromTime',
          3: 'toTime',
          4: 'sessionLimit',
          5: 'msgLimit',
          6: 'order',
          7: 'p2pList',
          8: 'teamList',
          9: 'senderList',
          10: 'msgTypeList',
          11: 'msgSubTypeList',
        },
        delFriendParams: { 1: 'delAlias' },
        proxyTag: { 1: 'zone', 2: 'path', 3: 'method', 4: 'header', 5: 'body' },
        proxyMsgTag: { 1: 'from', 2: 'body', 3: 'time' },
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = n(60),
        i = r.merge({}, o.idMap, {
          chatroom: {
            id: 13,
            login: 2,
            kicked: 3,
            logout: 4,
            sendMsg: 6,
            msg: 7,
            getChatroomMembers: 8,
            getHistoryMsgs: 9,
            markChatroomMember: 11,
            closeChatroom: 12,
            getChatroom: 13,
            updateChatroom: 14,
            updateMyChatroomMemberInfo: 15,
            getChatroomMembersInfo: 16,
            kickChatroomMember: 17,
            updateChatroomMemberTempMute: 19,
            queueOffer: 20,
            queuePoll: 21,
            queueList: 22,
            peak: 23,
            queueDrop: 24,
            queueInit: 25,
            queueChange: 26,
            updateTagMembersTempMute: 30,
            getChatroomMembersByTag: 31,
            getChatroomMemberCountByTag: 32,
            updateCoordinate: 33,
            notifyCdnInfo: 99,
          },
          user: { id: 3, syncRobot: 16 },
        }),
        s = r.merge({}, o.cmdConfig, {
          login: {
            sid: i.chatroom.id,
            cid: i.chatroom.login,
            params: [
              { type: 'byte', name: 'type' },
              { type: 'Property', name: 'login' },
              { type: 'Property', name: 'imLogin' },
            ],
          },
          logout: { sid: i.chatroom.id, cid: i.chatroom.logout },
          sendMsg: { sid: i.chatroom.id, cid: i.chatroom.sendMsg, params: [{ type: 'Property', name: 'msg' }] },
          getChatroomMembers: {
            sid: i.chatroom.id,
            cid: i.chatroom.getChatroomMembers,
            params: [
              { type: 'byte', name: 'type' },
              { type: 'long', name: 'time' },
              { type: 'int', name: 'limit' },
            ],
          },
          getHistoryMsgs: {
            sid: i.chatroom.id,
            cid: i.chatroom.getHistoryMsgs,
            params: [
              { type: 'long', name: 'timetag' },
              { type: 'int', name: 'limit' },
              { type: 'bool', name: 'reverse' },
              { type: 'LongArray', name: 'msgTypes' },
            ],
          },
          markChatroomMember: {
            sid: i.chatroom.id,
            cid: i.chatroom.markChatroomMember,
            params: [
              { type: 'string', name: 'account' },
              { type: 'int', name: 'type' },
              { type: 'bool', name: 'isAdd' },
              { type: 'int', name: 'level' },
              { type: 'string', name: 'custom' },
            ],
          },
          closeChatroom: { sid: i.chatroom.id, cid: i.chatroom.closeChatroom, params: [{ type: 'string', name: 'custom' }] },
          getChatroom: { sid: i.chatroom.id, cid: i.chatroom.getChatroom },
          updateChatroom: {
            sid: i.chatroom.id,
            cid: i.chatroom.updateChatroom,
            params: [
              { type: 'Property', name: 'chatroom' },
              { type: 'bool', name: 'needNotify' },
              { type: 'String', name: 'custom' },
            ],
          },
          updateMyChatroomMemberInfo: {
            sid: i.chatroom.id,
            cid: i.chatroom.updateMyChatroomMemberInfo,
            params: [
              { type: 'Property', name: 'chatroomMember' },
              { type: 'bool', name: 'needNotify' },
              { type: 'String', name: 'custom' },
              { type: 'bool', name: 'needSave' },
            ],
          },
          getChatroomMembersInfo: { sid: i.chatroom.id, cid: i.chatroom.getChatroomMembersInfo, params: [{ type: 'StrArray', name: 'accounts' }] },
          kickChatroomMember: {
            sid: i.chatroom.id,
            cid: i.chatroom.kickChatroomMember,
            params: [
              { type: 'string', name: 'account' },
              { type: 'string', name: 'custom' },
            ],
          },
          updateChatroomMemberTempMute: {
            sid: i.chatroom.id,
            cid: i.chatroom.updateChatroomMemberTempMute,
            params: [
              { type: 'String', name: 'account' },
              { type: 'long', name: 'duration' },
              { type: 'bool', name: 'needNotify' },
              { type: 'String', name: 'custom' },
            ],
          },
          queueOffer: {
            sid: i.chatroom.id,
            cid: i.chatroom.queueOffer,
            params: [
              { type: 'string', name: 'elementKey' },
              { type: 'string', name: 'elementValue' },
              { type: 'bool', name: 'transient' },
              { type: 'string', name: 'elementAccount' },
            ],
          },
          queuePoll: { sid: i.chatroom.id, cid: i.chatroom.queuePoll, params: [{ type: 'string', name: 'elementKey' }] },
          queueList: { sid: i.chatroom.id, cid: i.chatroom.queueList },
          peak: { sid: i.chatroom.id, cid: i.chatroom.peak },
          queueDrop: { sid: i.chatroom.id, cid: i.chatroom.queueDrop },
          queueInit: { sid: i.chatroom.id, cid: i.chatroom.queueInit, params: [{ type: 'int', name: 'limit' }] },
          queueChange: {
            sid: i.chatroom.id,
            cid: i.chatroom.queueChange,
            params: [
              { type: 'StrStrMap', name: 'elementMap' },
              { type: 'bool', name: 'needNotify' },
              { type: 'string', name: 'notifyExt' },
            ],
          },
          updateTagMembersTempMute: { sid: i.chatroom.id, cid: i.chatroom.updateTagMembersTempMute, params: [{ type: 'Property', name: 'tagMuteReq' }] },
          updateCoordinate: { sid: i.chatroom.id, cid: i.chatroom.updateCoordinate, params: [{ type: 'Property', name: 'coordinateReq' }] },
          getChatroomMemberCountByTag: { sid: i.chatroom.id, cid: i.chatroom.getChatroomMemberCountByTag, params: [{ type: 'String', name: 'tag' }] },
          getChatroomMembersByTag: { sid: i.chatroom.id, cid: i.chatroom.getChatroomMembersByTag, params: [{ type: 'Property', name: 'tagMemberReq' }] },
          notifyCdnInfo: { sid: i.chatroom.id, cid: i.chatroom.notifyCdnInfo },
          syncRobot: { sid: i.user.id, cid: i.user.syncRobot, params: [{ type: 'long', name: 'timetag' }] },
        }),
        a = r.merge({}, o.packetConfig, {
          '4_10': { service: 'notify' },
          '4_11': { service: 'notify' },
          '3_16': { service: 'chatroom', cmd: 'syncRobot', response: [{ type: 'PropertyArray', name: 'robots', entity: 'robot' }] },
          '13_2': {
            service: 'chatroom',
            cmd: 'login',
            response: [
              { type: 'Property', name: 'chatroom' },
              { type: 'Property', name: 'chatroomMember' },
              { type: 'Property', name: 'chatroomCdnInfo' },
            ],
          },
          '13_3': {
            service: 'chatroom',
            cmd: 'kicked',
            response: [
              { type: 'Number', name: 'reason' },
              { type: 'String', name: 'custom' },
            ],
          },
          '13_4': { service: 'chatroom', cmd: 'logout' },
          '13_6': { service: 'chatroom', cmd: 'sendMsg', response: [{ type: 'Property', name: 'msg' }] },
          '13_7': { service: 'chatroom', cmd: 'msg', response: [{ type: 'Property', name: 'msg' }] },
          '13_8': { service: 'chatroom', cmd: 'getChatroomMembers', response: [{ type: 'PropertyArray', name: 'members', entity: 'chatroomMember' }] },
          '13_9': { service: 'chatroom', cmd: 'getHistoryMsgs', response: [{ type: 'PropertyArray', name: 'msgs', entity: 'msg' }] },
          '13_11': { service: 'chatroom', cmd: 'markChatroomMember', response: [{ type: 'Property', name: 'chatroomMember' }] },
          '13_12': { service: 'chatroom', cmd: 'closeChatroom' },
          '13_13': { service: 'chatroom', cmd: 'getChatroom', response: [{ type: 'Property', name: 'chatroom' }] },
          '13_14': { service: 'chatroom', cmd: 'updateChatroom' },
          '13_15': { service: 'chatroom', cmd: 'updateMyChatroomMemberInfo' },
          '13_16': { service: 'chatroom', cmd: 'getChatroomMembersInfo', response: [{ type: 'PropertyArray', name: 'members', entity: 'chatroomMember' }] },
          '13_17': { service: 'chatroom', cmd: 'kickChatroomMember' },
          '13_19': { service: 'chatroom', cmd: 'updateChatroomMemberTempMute' },
          '13_20': { service: 'chatroom', cmd: 'queueOffer' },
          '13_21': {
            service: 'chatroom',
            cmd: 'queuePoll',
            response: [
              { type: 'String', name: 'elementKey' },
              { type: 'String', name: 'elementValue' },
            ],
          },
          '13_22': { service: 'chatroom', cmd: 'queueList', response: [{ type: 'KVArray', name: 'queueList' }] },
          '13_23': {
            service: 'chatroom',
            cmd: 'peak',
            response: [
              { type: 'String', name: 'elementKey' },
              { type: 'String', name: 'elementValue' },
            ],
          },
          '13_24': { service: 'chatroom', cmd: 'queueDrop' },
          '13_25': { service: 'chatroom', cmd: 'queueInit' },
          '13_26': { service: 'chatroom', cmd: 'queueChange', response: [{ type: 'StrArray', name: 'elementKeyArray' }] },
          '13_30': { service: 'chatroom', cmd: 'updateTagMembersTempMute' },
          '13_33': { service: 'chatroom', cmd: 'updateCoordinate' },
          '13_31': { service: 'chatroom', cmd: 'getChatroomMembersByTag', response: [{ type: 'PropertyArray', name: 'members', entity: 'chatroomMember' }] },
          '13_32': { service: 'chatroom', cmd: 'getChatroomMemberCountByTag', response: [{ type: 'long', name: 'count' }] },
          '13_99': { service: 'chatroom', cmd: 'notifyCdnInfo', response: [{ type: 'Property', name: 'chatroomCdnInfo' }] },
        });
      e.exports = { idMap: i, cmdConfig: s, packetConfig: a };
    },
    function (e, t, n) {
      'use strict';
      e.exports = {
        imLogin: {
          clientType: 3,
          os: 4,
          sdkVersion: 6,
          appLogin: 8,
          protocolVersion: 9,
          pushTokenName: 10,
          pushToken: 11,
          deviceId: 13,
          appKey: 18,
          account: 19,
          browser: 24,
          session: 26,
          deviceInfo: 32,
          sdkType: 41,
          userAgent: 42,
          isReactNative: 112,
          token: 1e3,
          customTag: 38,
        },
        nosToken: { objectName: 1, token: 2, bucket: 3, expireTime: 4, expireSec: 7, tag: 8, shortUrl: 9 },
        audioToText: { url: 2 },
        imageOp: {
          type: 0,
          stripmeta: 1,
          typeType: 2,
          blurRadius: 3,
          blurSigma: 4,
          qualityQuality: 5,
          cropX: 6,
          cropY: 7,
          cropWidth: 8,
          cropHeight: 9,
          rotateAngle: 10,
          pixelPixel: 11,
          thumbnailMode: 12,
          thumbnailWidth: 13,
          thumbnailHeight: 14,
          thumbnailAxisX: 15,
          thumbnailAxisY: 16,
          thumbnailCenterX: 17,
          thumbnailCenterY: 18,
          thumbnailEnlarge: 19,
          thumbnailToStatic: 20,
          watermarkType: 21,
          watermarkGravity: 22,
          watermarkDissolve: 23,
          watermarkDx: 24,
          watermarkDy: 25,
          watermarkImage: 26,
          watermarkText: 27,
          watermarkFont: 28,
          watermarkFontSize: 29,
          watermarkFontColor: 30,
          interlace: 31,
        },
        robot: { account: 4, nick: 5, avatar: 6, intro: 7, config: 8, valid: 9, createTime: 10, updateTime: 11, custid: 12, botid: 13, bindTime: 14 },
        clientAntispam: { version: 1, md5: 2, nosurl: 3, thesaurus: 4 },
        fileQuickTransfer: { md5: 1, url: 2, size: 3, threshold: 4 },
        transToken: { name: 1, type: 2, transType: 3, size: 4, extra: 5, body: 6 },
        transInfo: { docId: 1, name: 2, prefix: 3, size: 4, type: 5, state: 6, transType: 7, transSize: 8, pageCount: 9, picInfo: 10, extra: 11, flag: 12 },
        nosFileUrlTag: { safeUrl: 0, originUrl: 1 },
        nosAccessTokenTag: { token: 0, url: 1, userAgent: 2, ext: 3 },
        fileListParam: { fromDocId: 1, limit: 2 },
        avSignalTag: {
          type: 1,
          channelName: 2,
          channelId: 3,
          channelCreateTime: 4,
          channelExpireTime: 5,
          creator: 6,
          ext: 7,
          channelInValid: 8,
          from: 10,
          to: 11,
          requestId: 12,
          needPush: 13,
          pushTitle: 14,
          pushContent: 15,
          pushPayload: 16,
          needBadge: 17,
          members: 18,
          attach: 19,
          attachExt: 20,
          isSave: 21,
          msgid: 22,
          uid: 23,
          time: 24,
        },
        login: {
          appKey: 1,
          account: 2,
          deviceId: 3,
          chatroomId: 5,
          appLogin: 8,
          chatroomNick: 20,
          chatroomAvatar: 21,
          chatroomCustom: 22,
          chatroomEnterCustom: 23,
          session: 26,
          isAnonymous: 38,
          tags: 39,
          notifyTargetTags: 40,
          loc_x: 43,
          loc_y: 44,
          loc_z: 45,
          distance: 46,
        },
        chatroom: {
          id: 1,
          name: 3,
          announcement: 4,
          broadcastUrl: 5,
          custom: 12,
          createTime: 14,
          updateTime: 15,
          queuelevel: 16,
          creator: 100,
          onlineMemberNum: 101,
          mute: 102,
        },
        msg: {
          idClient: 1,
          type: 2,
          attach: 3,
          custom: 4,
          resend: 5,
          userUpdateTime: 6,
          fromNick: 7,
          fromAvatar: 8,
          fromCustom: 9,
          yidunEnable: 10,
          antiSpamContent: 11,
          skipHistory: 12,
          body: 13,
          antiSpamBusinessId: 14,
          clientAntiSpam: 15,
          antiSpamUsingYidun: 16,
          time: 20,
          from: 21,
          chatroomId: 22,
          fromClientType: 23,
          highPriority: 25,
          callbackExt: 27,
          subType: 28,
          yidunAntiCheating: 29,
          env: 30,
          notifyTargetTags: 31,
          yidunAntiSpamExt: 32,
          yidunAntiSpamRes: 33,
          loc_x: 34,
          loc_y: 35,
          loc_z: 36,
        },
        chatroomMember: {
          chatroomId: 1,
          account: 2,
          type: 3,
          level: 4,
          nick: 5,
          avatar: 6,
          custom: 7,
          online: 8,
          guest: 9,
          enterTime: 10,
          blacked: 12,
          gaged: 13,
          valid: 14,
          updateTime: 15,
          tempMuted: 16,
          tempMuteDuration: 17,
        },
        chatroomCdnInfo: { enable: 1, cdnUrls: 2, timestamp: 3, interval: 4, decryptType: 5, decryptKey: 6, timeout: 7 },
        tagMemberReq: { tag: 1, time: 2, limit: 3 },
        tagMuteReq: { tag: 1, duration: 2, needNotify: 3, custom: 4, notifyTargetTags: 5 },
        coordinateReq: { x: 1, y: 2, z: 3, distance: 4 },
      };
    },
    function (e, t, n) {
      'use strict';
      e.exports = {
        imLogin: {
          3: 'clientType',
          4: 'os',
          6: 'sdkVersion',
          8: 'appLogin',
          9: 'protocolVersion',
          10: 'pushTokenName',
          11: 'pushToken',
          13: 'deviceId',
          18: 'appKey',
          19: 'account',
          24: 'browser',
          26: 'session',
          32: 'deviceInfo',
          38: 'customTag',
          41: 'sdkType',
          42: 'userAgent',
          112: 'isReactNative',
          1000: 'token',
        },
        nosToken: { 1: 'objectName', 2: 'token', 3: 'bucket', 4: 'expireTime', 7: 'expireSec', 8: 'tag', 9: 'shortUrl' },
        audioToText: { 2: 'url' },
        imageOp: {
          0: 'type',
          1: 'stripmeta',
          2: 'typeType',
          3: 'blurRadius',
          4: 'blurSigma',
          5: 'qualityQuality',
          6: 'cropX',
          7: 'cropY',
          8: 'cropWidth',
          9: 'cropHeight',
          10: 'rotateAngle',
          11: 'pixelPixel',
          12: 'thumbnailMode',
          13: 'thumbnailWidth',
          14: 'thumbnailHeight',
          15: 'thumbnailAxisX',
          16: 'thumbnailAxisY',
          17: 'thumbnailCenterX',
          18: 'thumbnailCenterY',
          19: 'thumbnailEnlarge',
          20: 'thumbnailToStatic',
          21: 'watermarkType',
          22: 'watermarkGravity',
          23: 'watermarkDissolve',
          24: 'watermarkDx',
          25: 'watermarkDy',
          26: 'watermarkImage',
          27: 'watermarkText',
          28: 'watermarkFont',
          29: 'watermarkFontSize',
          30: 'watermarkFontColor',
          31: 'interlace',
        },
        robot: {
          4: 'account',
          5: 'nick',
          6: 'avatar',
          7: 'intro',
          8: 'config',
          9: 'valid',
          10: 'createTime',
          11: 'updateTime',
          12: 'custid',
          13: 'botid',
          14: 'bindTime',
          _6_safe: '_avatar_safe',
        },
        clientAntispam: { 1: 'version', 2: 'md5', 3: 'nosurl', 4: 'thesaurus' },
        fileQuickTransfer: { 1: 'md5', 2: 'url', 3: 'size', 4: 'threshold', _2_safe: '_url_safe' },
        transToken: { 1: 'name', 2: 'type', 3: 'transType', 4: 'size', 5: 'extra', 6: 'body' },
        transInfo: {
          1: 'docId',
          2: 'name',
          3: 'prefix',
          4: 'size',
          5: 'type',
          6: 'state',
          7: 'transType',
          8: 'transSize',
          9: 'pageCount',
          10: 'picInfo',
          11: 'extra',
          12: 'flag',
        },
        nosFileUrlTag: { 0: 'safeUrl', 1: 'originUrl' },
        nosAccessTokenTag: { 0: 'token', 1: 'url', 2: 'userAgent', 3: 'ext' },
        fileListParam: { 1: 'fromDocId', 2: 'limit' },
        avSignalTag: {
          1: 'type',
          2: 'channelName',
          3: 'channelId',
          4: 'channelCreateTime',
          5: 'channelExpireTime',
          6: 'creator',
          7: 'ext',
          8: 'channelInValid',
          10: 'from',
          11: 'to',
          12: 'requestId',
          13: 'needPush',
          14: 'pushTitle',
          15: 'pushContent',
          16: 'pushPayload',
          17: 'needBadge',
          18: 'members',
          19: 'attach',
          20: 'attachExt',
          21: 'isSave',
          22: 'msgid',
          23: 'uid',
          24: 'time',
        },
        login: {
          1: 'appKey',
          2: 'account',
          3: 'deviceId',
          5: 'chatroomId',
          8: 'appLogin',
          20: 'chatroomNick',
          21: 'chatroomAvatar',
          22: 'chatroomCustom',
          23: 'chatroomEnterCustom',
          26: 'session',
          38: 'isAnonymous',
          39: 'tags',
          40: 'notifyTargetTags',
          43: 'loc_x',
          44: 'loc_y',
          45: 'loc_z',
          46: 'distance',
          _21_safe: '_chatroomAvatar_safe',
        },
        chatroom: {
          1: 'id',
          3: 'name',
          4: 'announcement',
          5: 'broadcastUrl',
          12: 'custom',
          14: 'createTime',
          15: 'updateTime',
          16: 'queuelevel',
          100: 'creator',
          101: 'onlineMemberNum',
          102: 'mute',
        },
        msg: {
          1: 'idClient',
          2: 'type',
          3: 'attach',
          4: 'custom',
          5: 'resend',
          6: 'userUpdateTime',
          7: 'fromNick',
          8: 'fromAvatar',
          9: 'fromCustom',
          10: 'yidunEnable',
          11: 'antiSpamContent',
          12: 'skipHistory',
          13: 'body',
          14: 'antiSpamBusinessId',
          15: 'clientAntiSpam',
          16: 'antiSpamUsingYidun',
          20: 'time',
          21: 'from',
          22: 'chatroomId',
          23: 'fromClientType',
          25: 'highPriority',
          27: 'callbackExt',
          28: 'subType',
          29: 'yidunAntiCheating',
          30: 'env',
          31: 'notifyTargetTags',
          32: 'yidunAntiSpamExt',
          33: 'yidunAntiSpamRes',
          34: 'loc_x',
          35: 'loc_y',
          36: 'loc_z',
          _8_safe: '_fromAvatar_safe',
        },
        chatroomMember: {
          1: 'chatroomId',
          2: 'account',
          3: 'type',
          4: 'level',
          5: 'nick',
          6: 'avatar',
          7: 'custom',
          8: 'online',
          9: 'guest',
          10: 'enterTime',
          12: 'blacked',
          13: 'gaged',
          14: 'valid',
          15: 'updateTime',
          16: 'tempMuted',
          17: 'tempMuteDuration',
          _6_safe: '_avatar_safe',
        },
        chatroomCdnInfo: { 1: 'enable', 2: 'cdnUrls', 3: 'timestamp', 4: 'interval', 5: 'decryptType', 6: 'decryptKey', 7: 'timeout' },
        nosConfigTag: { 1: 'bucket', 2: 'cdnDomain', 3: 'expire', 4: 'objectNamePrefix' },
      };
    },
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    function (e, t, n) {
      'use strict';
      var r = n(197),
        o = n(198),
        i = n(199),
        s = n(214);
      function a(e, t, n) {
        var r = e;
        return o(t) ? ((n = t), 'string' == typeof e && (r = { uri: e })) : (r = s(t, { uri: e })), (r.callback = n), r;
      }
      function c(e, t, n) {
        return u((t = a(e, t, n)));
      }
      function u(e) {
        if (void 0 === e.callback) throw new Error('callback argument missing');
        var t = !1,
          n = function (n, r, o) {
            t || ((t = !0), e.callback(n, r, o));
          };
        function r() {
          var e = void 0;
          if (
            ((e = l.response
              ? l.response
              : l.responseText ||
                (function (e) {
                  try {
                    if ('document' === e.responseType) return e.responseXML;
                    var t = e.responseXML && 'parsererror' === e.responseXML.documentElement.nodeName;
                    if ('' === e.responseType && !t) return e.responseXML;
                  } catch (e) {}
                  return null;
                })(l)),
            h)
          )
            try {
              e = JSON.parse(e);
            } catch (e) {}
          return e;
        }
        function o(e) {
          return clearTimeout(p), e instanceof Error || (e = new Error('' + (e || 'Unknown XMLHttpRequest Error'))), (e.statusCode = 0), n(e, v);
        }
        function s() {
          if (!u) {
            var t;
            clearTimeout(p), (t = e.useXDR && void 0 === l.status ? 200 : 1223 === l.status ? 204 : l.status);
            var o = v,
              s = null;
            return (
              0 !== t
                ? ((o = { body: r(), statusCode: t, method: d, headers: {}, url: m, rawRequest: l }),
                  l.getAllResponseHeaders && (o.headers = i(l.getAllResponseHeaders())))
                : (s = new Error('Internal XMLHttpRequest Error')),
              n(s, o, o.body)
            );
          }
        }
        var a,
          u,
          l = e.xhr || null;
        l || (l = e.cors || e.useXDR ? new c.XDomainRequest() : new c.XMLHttpRequest());
        var p,
          m = (l.url = e.uri || e.url),
          d = (l.method = e.method || 'GET'),
          f = e.body || e.data,
          y = (l.headers = e.headers || {}),
          g = !!e.sync,
          h = !1,
          v = { body: void 0, headers: {}, statusCode: 0, method: d, url: m, rawRequest: l };
        if (
          ('json' in e &&
            !1 !== e.json &&
            ((h = !0),
            y.accept || y.Accept || (y.Accept = 'application/json'),
            'GET' !== d &&
              'HEAD' !== d &&
              (y['content-type'] || y['Content-Type'] || (y['Content-Type'] = 'application/json'), (f = JSON.stringify(!0 === e.json ? f : e.json)))),
          (l.onreadystatechange = function () {
            4 === l.readyState && setTimeout(s, 0);
          }),
          (l.onload = s),
          (l.onerror = o),
          (l.onprogress = function () {}),
          (l.onabort = function () {
            u = !0;
          }),
          (l.ontimeout = o),
          l.open(d, m, !g, e.username, e.password),
          g || (l.withCredentials = !!e.withCredentials),
          !g &&
            e.timeout > 0 &&
            (p = setTimeout(function () {
              if (!u) {
                (u = !0), l.abort('timeout');
                var e = new Error('XMLHttpRequest timeout');
                (e.code = 'ETIMEDOUT'), o(e);
              }
            }, e.timeout)),
          l.setRequestHeader)
        )
          for (a in y) y.hasOwnProperty(a) && l.setRequestHeader(a, y[a]);
        else if (
          e.headers &&
          !(function (e) {
            for (var t in e) if (e.hasOwnProperty(t)) return !1;
            return !0;
          })(e.headers)
        )
          throw new Error('Headers cannot be set on an XDomainRequest object');
        return 'responseType' in e && (l.responseType = e.responseType), 'beforeSend' in e && 'function' == typeof e.beforeSend && e.beforeSend(l), l.send(f || null), l;
      }
      (e.exports = c),
        (e.exports.default = c),
        (c.XMLHttpRequest = r.XMLHttpRequest || function () {}),
        (c.XDomainRequest = 'withCredentials' in new c.XMLHttpRequest() ? c.XMLHttpRequest : r.XDomainRequest),
        (function (e, t) {
          for (var n = 0; n < e.length; n++) t(e[n]);
        })(['get', 'put', 'post', 'patch', 'head', 'delete'], function (e) {
          c['delete' === e ? 'del' : e] = function (t, n, r) {
            return ((n = a(t, n, r)).method = e.toUpperCase()), u(n);
          };
        });
    },
    function (e, t, n) {
      (function (t) {
        var n;
        (n = 'undefined' != typeof window ? window : void 0 !== t ? t : 'undefined' != typeof self ? self : {}), (e.exports = n);
      }).call(this, n(20));
    },
    function (e, t) {
      e.exports = function (e) {
        var t = n.call(e);
        return (
          '[object Function]' === t ||
          ('function' == typeof e && '[object RegExp]' !== t) ||
          ('undefined' != typeof window && (e === window.setTimeout || e === window.alert || e === window.confirm || e === window.prompt))
        );
      };
      var n = Object.prototype.toString;
    },
    function (e, t, n) {
      var r = n(200),
        o = n(213);
      e.exports = function (e) {
        if (!e) return {};
        var t = {};
        return (
          o(r(e).split('\n'), function (e) {
            var n,
              o = e.indexOf(':'),
              i = r(e.slice(0, o)).toLowerCase(),
              s = r(e.slice(o + 1));
            void 0 === t[i] ? (t[i] = s) : ((n = t[i]), '[object Array]' === Object.prototype.toString.call(n) ? t[i].push(s) : (t[i] = [t[i], s]));
          }),
          t
        );
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(64),
        o = n(94),
        i = n(96),
        s = n(99),
        a = n(212),
        c = r.call(Function.call, s());
      o(c, { getPolyfill: s, implementation: i, shim: a }), (e.exports = c);
    },
    function (e, t, n) {
      'use strict';
      var r = Array.prototype.slice,
        o = Object.prototype.toString;
      e.exports = function (e) {
        var t = this;
        if ('function' != typeof t || '[object Function]' !== o.call(t)) throw new TypeError('Function.prototype.bind called on incompatible ' + t);
        for (var n, i = r.call(arguments, 1), s = Math.max(0, t.length - i.length), a = [], c = 0; c < s; c++) a.push('$' + c);
        if (
          ((n = Function(
            'binder',
            'return function (' + a.join(',') + '){ return binder.apply(this,arguments); }'
          )(function () {
            if (this instanceof n) {
              var o = t.apply(this, i.concat(r.call(arguments)));
              return Object(o) === o ? o : this;
            }
            return t.apply(e, i.concat(r.call(arguments)));
          })),
          t.prototype)
        ) {
          var u = function () {};
          (u.prototype = t.prototype), (n.prototype = new u()), (u.prototype = null);
        }
        return n;
      };
    },
    function (e, t, n) {
      'use strict';
      var r = Array.prototype.slice,
        o = n(95),
        i = Object.keys,
        s = i
          ? function (e) {
              return i(e);
            }
          : n(203),
        a = Object.keys;
      (s.shim = function () {
        Object.keys
          ? (function () {
              var e = Object.keys(arguments);
              return e && e.length === arguments.length;
            })(1, 2) ||
            (Object.keys = function (e) {
              return o(e) ? a(r.call(e)) : a(e);
            })
          : (Object.keys = s);
        return Object.keys || s;
      }),
        (e.exports = s);
    },
    function (e, t, n) {
      'use strict';
      var r;
      if (!Object.keys) {
        var o = Object.prototype.hasOwnProperty,
          i = Object.prototype.toString,
          s = n(95),
          a = Object.prototype.propertyIsEnumerable,
          c = !a.call({ toString: null }, 'toString'),
          u = a.call(function () {}, 'prototype'),
          l = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
          p = function (e) {
            var t = e.constructor;
            return t && t.prototype === e;
          },
          m = {
            $applicationCache: !0,
            $console: !0,
            $external: !0,
            $frame: !0,
            $frameElement: !0,
            $frames: !0,
            $innerHeight: !0,
            $innerWidth: !0,
            $onmozfullscreenchange: !0,
            $onmozfullscreenerror: !0,
            $outerHeight: !0,
            $outerWidth: !0,
            $pageXOffset: !0,
            $pageYOffset: !0,
            $parent: !0,
            $scrollLeft: !0,
            $scrollTop: !0,
            $scrollX: !0,
            $scrollY: !0,
            $self: !0,
            $webkitIndexedDB: !0,
            $webkitStorageInfo: !0,
            $window: !0,
          },
          d = (function () {
            if ('undefined' == typeof window) return !1;
            for (var e in window)
              try {
                if (!m['$' + e] && o.call(window, e) && null !== window[e] && 'object' == typeof window[e])
                  try {
                    p(window[e]);
                  } catch (e) {
                    return !0;
                  }
              } catch (e) {
                return !0;
              }
            return !1;
          })();
        r = function (e) {
          var t = null !== e && 'object' == typeof e,
            n = '[object Function]' === i.call(e),
            r = s(e),
            a = t && '[object String]' === i.call(e),
            m = [];
          if (!t && !n && !r) throw new TypeError('Object.keys called on a non-object');
          var f = u && n;
          if (a && e.length > 0 && !o.call(e, 0)) for (var y = 0; y < e.length; ++y) m.push(String(y));
          if (r && e.length > 0) for (var g = 0; g < e.length; ++g) m.push(String(g));
          else for (var h in e) (f && 'prototype' === h) || !o.call(e, h) || m.push(String(h));
          if (c)
            for (
              var v = (function (e) {
                  if ('undefined' == typeof window || !d) return p(e);
                  try {
                    return p(e);
                  } catch (e) {
                    return !1;
                  }
                })(e),
                b = 0;
              b < l.length;
              ++b
            )
              (v && 'constructor' === l[b]) || !o.call(e, l[b]) || m.push(l[b]);
          return m;
        };
      }
      e.exports = r;
    },
    function (e, t, n) {
      'use strict';
      var r = n(97),
        o = r('%Object%'),
        i = r('%TypeError%'),
        s = r('%String%'),
        a = n(205),
        c = n(206),
        u = n(207),
        l = n(208),
        p = n(209),
        m = n(65),
        d = n(210),
        f = n(98),
        y = {
          ToPrimitive: d,
          ToBoolean: function (e) {
            return !!e;
          },
          ToNumber: function (e) {
            return +e;
          },
          ToInteger: function (e) {
            var t = this.ToNumber(e);
            return c(t) ? 0 : 0 !== t && u(t) ? l(t) * Math.floor(Math.abs(t)) : t;
          },
          ToInt32: function (e) {
            return this.ToNumber(e) >> 0;
          },
          ToUint32: function (e) {
            return this.ToNumber(e) >>> 0;
          },
          ToUint16: function (e) {
            var t = this.ToNumber(e);
            if (c(t) || 0 === t || !u(t)) return 0;
            var n = l(t) * Math.floor(Math.abs(t));
            return p(n, 65536);
          },
          ToString: function (e) {
            return s(e);
          },
          ToObject: function (e) {
            return this.CheckObjectCoercible(e), o(e);
          },
          CheckObjectCoercible: function (e, t) {
            if (null == e) throw new i(t || 'Cannot call method on ' + e);
            return e;
          },
          IsCallable: m,
          SameValue: function (e, t) {
            return e === t ? 0 !== e || 1 / e == 1 / t : c(e) && c(t);
          },
          Type: function (e) {
            return null === e
              ? 'Null'
              : void 0 === e
              ? 'Undefined'
              : 'function' == typeof e || 'object' == typeof e
              ? 'Object'
              : 'number' == typeof e
              ? 'Number'
              : 'boolean' == typeof e
              ? 'Boolean'
              : 'string' == typeof e
              ? 'String'
              : void 0;
          },
          IsPropertyDescriptor: function (e) {
            if ('Object' !== this.Type(e)) return !1;
            var t = { '[[Configurable]]': !0, '[[Enumerable]]': !0, '[[Get]]': !0, '[[Set]]': !0, '[[Value]]': !0, '[[Writable]]': !0 };
            for (var n in e) if (f(e, n) && !t[n]) return !1;
            var r = f(e, '[[Value]]'),
              o = f(e, '[[Get]]') || f(e, '[[Set]]');
            if (r && o) throw new i('Property Descriptors may not be both accessor and data descriptors');
            return !0;
          },
          IsAccessorDescriptor: function (e) {
            return void 0 !== e && (a(this, 'Property Descriptor', 'Desc', e), !(!f(e, '[[Get]]') && !f(e, '[[Set]]')));
          },
          IsDataDescriptor: function (e) {
            return void 0 !== e && (a(this, 'Property Descriptor', 'Desc', e), !(!f(e, '[[Value]]') && !f(e, '[[Writable]]')));
          },
          IsGenericDescriptor: function (e) {
            return void 0 !== e && (a(this, 'Property Descriptor', 'Desc', e), !this.IsAccessorDescriptor(e) && !this.IsDataDescriptor(e));
          },
          FromPropertyDescriptor: function (e) {
            if (void 0 === e) return e;
            if ((a(this, 'Property Descriptor', 'Desc', e), this.IsDataDescriptor(e)))
              return { value: e['[[Value]]'], writable: !!e['[[Writable]]'], enumerable: !!e['[[Enumerable]]'], configurable: !!e['[[Configurable]]'] };
            if (this.IsAccessorDescriptor(e)) return { get: e['[[Get]]'], set: e['[[Set]]'], enumerable: !!e['[[Enumerable]]'], configurable: !!e['[[Configurable]]'] };
            throw new i('FromPropertyDescriptor must be called with a fully populated Property Descriptor');
          },
          ToPropertyDescriptor: function (e) {
            if ('Object' !== this.Type(e)) throw new i('ToPropertyDescriptor requires an object');
            var t = {};
            if (
              (f(e, 'enumerable') && (t['[[Enumerable]]'] = this.ToBoolean(e.enumerable)),
              f(e, 'configurable') && (t['[[Configurable]]'] = this.ToBoolean(e.configurable)),
              f(e, 'value') && (t['[[Value]]'] = e.value),
              f(e, 'writable') && (t['[[Writable]]'] = this.ToBoolean(e.writable)),
              f(e, 'get'))
            ) {
              var n = e.get;
              if (void 0 !== n && !this.IsCallable(n)) throw new TypeError('getter must be a function');
              t['[[Get]]'] = n;
            }
            if (f(e, 'set')) {
              var r = e.set;
              if (void 0 !== r && !this.IsCallable(r)) throw new i('setter must be a function');
              t['[[Set]]'] = r;
            }
            if ((f(t, '[[Get]]') || f(t, '[[Set]]')) && (f(t, '[[Value]]') || f(t, '[[Writable]]')))
              throw new i('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
            return t;
          },
        };
      e.exports = y;
    },
    function (e, t, n) {
      'use strict';
      var r = n(97),
        o = r('%TypeError%'),
        i = r('%SyntaxError%'),
        s = n(98),
        a = {
          'Property Descriptor': function (e, t) {
            if ('Object' !== e.Type(t)) return !1;
            var n = { '[[Configurable]]': !0, '[[Enumerable]]': !0, '[[Get]]': !0, '[[Set]]': !0, '[[Value]]': !0, '[[Writable]]': !0 };
            for (var r in t) if (s(t, r) && !n[r]) return !1;
            var i = s(t, '[[Value]]'),
              a = s(t, '[[Get]]') || s(t, '[[Set]]');
            if (i && a) throw new o('Property Descriptors may not be both accessor and data descriptors');
            return !0;
          },
        };
      e.exports = function (e, t, n, r) {
        var s = a[t];
        if ('function' != typeof s) throw new i('unknown record type: ' + t);
        if (!s(e, r)) throw new o(n + ' must be a ' + t);
        console.log(s(e, r), r);
      };
    },
    function (e, t) {
      e.exports =
        Number.isNaN ||
        function (e) {
          return e != e;
        };
    },
    function (e, t) {
      var n =
        Number.isNaN ||
        function (e) {
          return e != e;
        };
      e.exports =
        Number.isFinite ||
        function (e) {
          return 'number' == typeof e && !n(e) && e !== 1 / 0 && e !== -1 / 0;
        };
    },
    function (e, t) {
      e.exports = function (e) {
        return e >= 0 ? 1 : -1;
      };
    },
    function (e, t) {
      e.exports = function (e, t) {
        var n = e % t;
        return Math.floor(n >= 0 ? n : n + t);
      };
    },
    function (e, t, n) {
      'use strict';
      var r = Object.prototype.toString,
        o = n(211),
        i = n(65),
        s = function (e) {
          var t;
          if ((t = arguments.length > 1 ? arguments[1] : '[object Date]' === r.call(e) ? String : Number) === String || t === Number) {
            var n,
              s,
              a = t === String ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
            for (s = 0; s < a.length; ++s) if (i(e[a[s]]) && ((n = e[a[s]]()), o(n))) return n;
            throw new TypeError('No default value');
          }
          throw new TypeError('invalid [[DefaultValue]] hint supplied');
        };
      e.exports = function (e) {
        return o(e) ? e : arguments.length > 1 ? s(e, arguments[1]) : s(e);
      };
    },
    function (e, t) {
      e.exports = function (e) {
        return null === e || ('function' != typeof e && 'object' != typeof e);
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(94),
        o = n(99);
      e.exports = function () {
        var e = o();
        return (
          r(
            String.prototype,
            { trim: e },
            {
              trim: function () {
                return String.prototype.trim !== e;
              },
            }
          ),
          e
        );
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(65),
        o = Object.prototype.toString,
        i = Object.prototype.hasOwnProperty;
      e.exports = function (e, t, n) {
        if (!r(t)) throw new TypeError('iterator must be a function');
        var s;
        arguments.length >= 3 && (s = n),
          '[object Array]' === o.call(e)
            ? (function (e, t, n) {
                for (var r = 0, o = e.length; r < o; r++) i.call(e, r) && (null == n ? t(e[r], r, e) : t.call(n, e[r], r, e));
              })(e, t, s)
            : 'string' == typeof e
            ? (function (e, t, n) {
                for (var r = 0, o = e.length; r < o; r++) null == n ? t(e.charAt(r), r, e) : t.call(n, e.charAt(r), r, e);
              })(e, t, s)
            : (function (e, t, n) {
                for (var r in e) i.call(e, r) && (null == n ? t(e[r], r, e) : t.call(n, e[r], r, e));
              })(e, t, s);
      };
    },
    function (e, t) {
      e.exports = function () {
        for (var e = {}, t = 0; t < arguments.length; t++) {
          var r = arguments[t];
          for (var o in r) n.call(r, o) && (e[o] = r[o]);
        }
        return e;
      };
      var n = Object.prototype.hasOwnProperty;
    },
    function (e, t, n) {
      'use strict';
      var r,
        o = n(2),
        i = (r = o) && r.__esModule ? r : { default: r };
      function s(e) {
        var t = this,
          n = e.url || null;
        (t.level = { debug: 0, log: 1, info: 2, warn: 3, error: 4 }[e.level] || 0),
          (t.logCache = []),
          (t.logNum = 1),
          (t.timeInterval = 5e3),
          (window.onerror = function (e, n, r, o, i) {
            t.error(i);
          }),
          setInterval(function () {
            t.logCache.length > 0 && n && t.postLogs(n, t.logCache);
          }, t.timeInterval);
      }
      (s.prototype.debug = function () {
        this.level > 0 || (console.debug.apply(this, arguments), this.cacheLogs.apply(this, ['[degbug]'].concat(arguments)));
      }),
        (s.prototype.log = function () {
          this.level > 1 || (console.log.apply(this, arguments), this.cacheLogs.apply(this, ['[log]'].concat(arguments)));
        }),
        (s.prototype.info = function () {
          this.level > 2 || (console.info.apply(this, arguments), this.cacheLogs.apply(this, ['[info]'].concat(arguments)));
        }),
        (s.prototype.warn = function () {
          this.level > 3 || (console.warn.apply(this, arguments), this.cacheLogs.apply(this, ['[warn]'].concat(arguments)));
        }),
        (s.prototype.error = function () {
          this.level > 4 || (console.error.apply(this, arguments), this.cacheLogs.apply(this, ['[error]'].concat(arguments)));
        }),
        (s.prototype.cacheLogs = function (e, t) {
          for (var n = [], r = 0; r < t.length; r++) {
            var o = t[r];
            'object' === (void 0 === o ? 'undefined' : (0, i.default)(o)) ? n.push(JSON.stringify(o)) : n.push(o);
          }
          var s = this.logNum++ + ' ' + e + ' ' + n.join('; ');
          this.logCache.push(s.replace('%c', ''));
        }),
        (s.prototype.postLogs = function (e, t) {
          var n = this,
            r = new XMLHttpRequest();
          (r.onreadystatechange = function () {
            4 === r.readyState && (200 === r.status ? (console.info('LoggerPlugin::日志上报完成'), (n.logCache = []), (n.timeInterval = 5e3)) : (n.timeInterval += 5e3));
          }),
            r.open('POST', e),
            r.setRequestHeader('Content-Type', 'plain/text;charset=utf-8'),
            (r.timeout = 360),
            r.send(t.join('\n'));
        }),
        (e.exports = s);
    },
    function (e, t, n) {
      'use strict';
      var r = n(9);
      e.exports = function (e) {
        var t, n, o, i;
        e.db && (r.db = e.db),
          e.rnfs &&
            ((r.rnfs = e.rnfs),
            r.rnfs.size || (r.rnfs.size = 1048576),
            (r.rnfs.nimPromise =
              ((t = r.rnfs),
              (n = t.size / 2 - 256),
              (i = 0),
              (o = r.rnfs.DocumentDirectoryPath + '/nimlog_' + i + '.log'),
              t
                .exists(o)
                .then(function (e) {
                  return e ? t.stat(o) : Promise.reject(0);
                })
                .then(function (e) {
                  return e && e.size > n ? Promise.reject(1) : Promise.reject(0);
                })
                .catch(function (e) {
                  return 'number' == typeof e ? (t.nimIndex = e) : console.error('initRnfs::ERROR', e), Promise.resolve();
                }))));
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = r.notundef,
        i = r.undef;
      function s(e) {
        o(e.name) && (this.name = '' + e.name),
          o(e.announcement) && (this.announcement = '' + e.announcement),
          o(e.broadcastUrl) && (this.broadcastUrl = '' + e.broadcastUrl),
          o(e.custom) && (this.custom = '' + e.custom),
          o(e.queuelevel) && (this.queuelevel = parseInt(e.queuelevel));
      }
      (s.reverse = function (e) {
        var t = r.copy(e);
        return (
          i(t.announcement) && (t.announcement = ''),
          i(t.broadcastUrl) && (t.broadcastUrl = ''),
          i(t.custom) && (t.custom = ''),
          o(t.createTime) && (t.createTime = +t.createTime),
          o(t.updateTime) && (t.updateTime = +t.updateTime),
          o(t.onlineMemberNum) && (t.onlineMemberNum = +t.onlineMemberNum),
          o(t.mute) && (t.mute = '1' === t.mute),
          t
        );
      }),
        (e.exports = s);
    },
    function (e, t, n) {
      var r, o, i;
      e.exports =
        ((r = n(25)),
        (i = (o = r).lib.WordArray),
        (o.enc.Base64 = {
          stringify: function (e) {
            var t = e.words,
              n = e.sigBytes,
              r = this._map;
            e.clamp();
            for (var o = [], i = 0; i < n; i += 3)
              for (
                var s =
                    (((t[i >>> 2] >>> (24 - (i % 4) * 8)) & 255) << 16) |
                    (((t[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 255) << 8) |
                    ((t[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 255),
                  a = 0;
                a < 4 && i + 0.75 * a < n;
                a++
              )
                o.push(r.charAt((s >>> (6 * (3 - a))) & 63));
            var c = r.charAt(64);
            if (c) for (; o.length % 4; ) o.push(c);
            return o.join('');
          },
          parse: function (e) {
            var t = e.length,
              n = this._map,
              r = this._reverseMap;
            if (!r) {
              r = this._reverseMap = [];
              for (var o = 0; o < n.length; o++) r[n.charCodeAt(o)] = o;
            }
            var s = n.charAt(64);
            if (s) {
              var a = e.indexOf(s);
              -1 !== a && (t = a);
            }
            return (function (e, t, n) {
              for (var r = [], o = 0, s = 0; s < t; s++)
                if (s % 4) {
                  var a = n[e.charCodeAt(s - 1)] << ((s % 4) * 2),
                    c = n[e.charCodeAt(s)] >>> (6 - (s % 4) * 2),
                    u = a | c;
                  (r[o >>> 2] |= u << (24 - (o % 4) * 8)), o++;
                }
              return i.create(r, o);
            })(e, t, r);
          },
          _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
        }),
        r.enc.Base64);
    },
    function (e, t, n) {
      var r, o, i, s, a, c, u, l;
      e.exports =
        ((r = n(25)),
        n(309),
        n(310),
        (i = (o = r).lib),
        (s = i.Base),
        (a = i.WordArray),
        (c = o.algo),
        (u = c.MD5),
        (l = c.EvpKDF =
          s.extend({
            cfg: s.extend({ keySize: 4, hasher: u, iterations: 1 }),
            init: function (e) {
              this.cfg = this.cfg.extend(e);
            },
            compute: function (e, t) {
              for (var n, r = this.cfg, o = r.hasher.create(), i = a.create(), s = i.words, c = r.keySize, u = r.iterations; s.length < c; ) {
                n && o.update(n), (n = o.update(e).finalize(t)), o.reset();
                for (var l = 1; l < u; l++) (n = o.finalize(n)), o.reset();
                i.concat(n);
              }
              return (i.sigBytes = 4 * c), i;
            },
          })),
        (o.EvpKDF = function (e, t, n) {
          return l.create(n).compute(e, t);
        }),
        r.EvpKDF);
    },
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    function (e, t, n) {
      'use strict';
      n(100);
      var r = n(77);
      n(112)(r), (e.exports = r);
    },
    function (e, t, n) {
      'use strict';
      n(66).fn.refreshSocketUrl = function () {
        (this.socketUrlsBackup = this.socketUrlsBackup || []),
          (this.socketUrls = this.socketUrlsBackup.slice(0)),
          this.logger.info('link::refreshSocketUrl'),
          this.connectToUrl(this.getNextSocketUrl());
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(66).fn,
        o = n(9),
        i = n(0);
      (r.assembleLogin = function () {
        var e = this.options;
        this.sdkSession = this.genSessionKey();
        var t = { appKey: e.appKey, account: e.account, deviceId: o.deviceId, chatroomId: e.chatroomId, session: this.sdkSession, appLogin: this.autoconnect ? 1 : 0 },
          n = !0;
        if (
          (void 0 === e.loc_x || void 0 === e.loc_y || void 0 === e.loc_z
            ? (n = !1)
            : ('number' != typeof e.loc_x && (e.loc_x = 0), 'number' != typeof e.loc_y && (e.loc_y = 0), 'number' != typeof e.loc_z && (e.loc_z = 0)),
          (t = i.merge(
            t,
            i.filterObj(
              e,
              n
                ? 'chatroomNick chatroomAvatar chatroomCustom chatroomEnterCustom isAnonymous notifyTargetTags loc_x loc_y loc_z distance'
                : 'chatroomNick chatroomAvatar chatroomCustom chatroomEnterCustom isAnonymous notifyTargetTags distance'
            )
          )),
          e.tags && e.tags.length > 0)
        )
          try {
            t.tags = JSON.stringify(e.tags);
          } catch (t) {
            this.logger.error('assembleLogin::format tags error', e.tags, t);
          }
        return { type: 1, login: t, imLogin: this.assembleIMLogin() };
      }),
        (r.afterLogin = function (e) {
          var t = e.chatroom;
          this.sendCmd('getNosCdnHost', {}), (this.chatroom = t), this.notifyLogin();
        }),
        (r.kickedReasons = ['', 'chatroomClosed', 'managerKick', 'samePlatformKick', 'silentlyKick', 'blacked']),
        (r.kickedMessages = ['', '聊天室关闭了', '被房主或者管理员踢出', '不允许同一个账号在多个地方同时登录', '悄悄被踢', '被拉黑了']);
    },
    function (e, t, n) {
      'use strict';
      var r = n(66).fn,
        o = n(0),
        i = n(18),
        s = n(306),
        a = n(218),
        c = n(311),
        u = n(312),
        l = n(313);
      (r.completeMsg = function (e) {
        (e.chatroomId = this.chatroom && this.chatroom.id), (e.from = this.options.account), (e.fromClientType = 'Web'), e.time || (e.time = +new Date());
      }),
        (r.onMsg = function (e) {
          var t = this.message.reverse(e.content.msg);
          this.checkMsgUnique(t) ? (this.msgBuffer.push(t), this.msgFlushTimer || this.startMsgFlushTimer()) : this.logger.warn('onMsg::msg::repeat', t.idClient);
        }),
        (r.startMsgFlushTimer = function () {
          var e = this,
            t = e.options;
          e.msgFlushTimer = setTimeout(function () {
            var n = e.msgBuffer.splice(0, t.msgBufferSize);
            e.options.onmsgs(n), e.msgBuffer.length ? e.startMsgFlushTimer() : delete e.msgFlushTimer;
          }, t.msgBufferInterval);
        }),
        (r.checkMsgUnique = o.genCheckUniqueFunc('idClient')),
        (r.onSendMsg = function (e) {
          var t = e.obj.msg;
          e.error ? (t.status = 'fail') : ((t = e.content.msg).status = 'success'),
            Object.assign(t, e.obj.msg),
            (t = this.message.reverse(t)),
            this.checkMsgUnique(t),
            (e.obj = t);
        }),
        (r.onHistoryMsgs = function (e) {
          e.error || (e.obj || (e.obj = {}), (e.obj.msgs = this.message.reverseMsgs(e.content.msgs)));
        }),
        (r.onCdnMsgInfo = function (e) {
          if (e) {
            e.cdnUrls && (e.cdnUrls = e.cdnUrls.split('|')),
              e.interval && (e.interval = 1e3 * parseInt(e.interval)),
              e.timeout && (e.timeout = +e.timeout),
              e.enable && (e.enable = +e.enable),
              e.timestamp && ((e.timestamp = +e.timestamp), this.correctCdnTime(e.timestamp));
            var t = !this.cdnInfo.enable && e.enable;
            Object.assign(this.cdnInfo, e), t && this.queryCdnMsgs();
          }
        }),
        (r.correctCdnTime = function (e) {
          e &&
            'number' == typeof e &&
            (this.cdnInfo || (this.cdnInfo = {}),
            (this.cdnInfo.timestamp = e),
            (this.cdnInfo.localTime = +new Date()),
            (this.cdnInfo.lastNow = null),
            this.logger.info('correctCdnTime: timestamp, localTime', e, this.cdnInfo.localTime, new Date(e), new Date(this.cdnInfo.localTime)));
        }),
        (r.queryCdnMsgs = function (e) {
          var t = this;
          if (this.cdnInfo && this.cdnInfo.enable && this.isConnected()) {
            this.queryCdnTimer = setTimeout(function () {
              return t.queryCdnMsgs();
            }, this.cdnInfo.interval);
            var n = +new Date();
            if (
              ((n = n - this.cdnInfo.localTime + this.cdnInfo.timestamp),
              (n -= n % this.cdnInfo.interval),
              this.cdnInfo.lastNow !== n && this.cdnInfo.cdnUrls && this.cdnInfo.cdnUrls.length)
            ) {
              this.cdnInfo.cdnUrls.push(this.cdnInfo.cdnUrls.shift());
              var r = this,
                o = this.cdnInfo.decryptKey,
                p = this.cdnInfo.timeout || Math.ceil(this.cdnInfo.interval / 2),
                m = this.cdnInfo.cdnUrls.slice(0);
              (e = e || 0),
                (function t() {
                  if (e >= 3) return void r.finalFail++;
                  if (!m.length) return;
                  var d = m.shift().replace('#time', n);
                  var f = d.split('/')[2];
                  var y = +new Date();
                  i(d, {
                    timeout: p,
                    onload: function (e) {
                      if (r.cdnInfo.lastNow > n) r.logger.warn('queryCdnMsgs::doQuery cdnInfo.lastNow > now, will throw data ', r.cdnInfo.lastNow, n, e);
                      else {
                        (r.cdnInfo.lastNow = n), r.afterQueryCdn(f, +new Date() - y, !0);
                        try {
                          e = JSON.parse(e);
                        } catch (e) {
                          r.logger.warn('queryCdnMsgs::doQuery::onload parse res error: ', e);
                        }
                        if (e && e.data) {
                          e.ptm && (r.cdnInfo.timeout = e.ptm), e.pis && (r.cdnInfo.interval = 1e3 * e.pis);
                          var t,
                            i,
                            p = !0 === e.e ? ((t = e.data), (i = o), s.decrypt(t, a.parse(i), { mode: c, padding: u }).toString(l)) : e.data;
                          r.onCdnMsgsSmoothly(p, n, 1e3 * e.c);
                        }
                      }
                    },
                    onerror: function (n) {
                      if ((e++, r.afterQueryCdn(f, +new Date() - y, !1), 404 === n.status)) {
                        var o;
                        try {
                          var i = JSON.parse(n.result);
                          404 === i.code && i.timestamp && (o = i.timestamp);
                        } catch (e) {
                          r.logger.warn('queryCdnMsgs::doQuery::parse 404 result error', e, n);
                        }
                        !o && n.date && (o = +new Date(n.date)), o && (r.correctCdnTime(o), clearTimeout(r.queryCdnTimer), r.queryCdnMsgs(e));
                      } else t();
                    },
                  });
                })();
            }
          }
        }),
        (r.onCdnMsgsSmoothly = function (e, t, n) {
          try {
            e = JSON.parse(e);
          } catch (e) {
            this.logger.warn('onCdnMsgsSmoothly::JSON.parse error', e);
          }
          if ((this.logger.info('receive cdn msgs ' + e.length + ' and request time is ' + new Date(t)), Array.isArray(e) && e.length)) {
            var r = this,
              o = this.options.msgBufferInterval,
              i = Math.ceil((e.length * o) / n);
            s(),
              clearInterval(r.cdnSmoothTimer),
              (r.cdnSmoothTimer = setInterval(function () {
                return s();
              }, o));
          }
          function s() {
            r.isConnected() &&
              (e.splice(0, i).forEach(function (e) {
                var t = r.parser.syncUnserialize(e, 'msg');
                r.onMsg({ content: { msg: t } });
              }),
              e.length || clearInterval(r.cdnSmoothTimer));
          }
        }),
        (r.resetCdnData = function () {
          (this.cdnData = {}), (this.finalFail = 0), (this.cdnDataTime = +new Date());
        }),
        (r.initCdnData = function () {
          this.resetCdnData(),
            o.isFunction(this.options.onCdnRequestData)
              ? ((this.options.cdnRequestDataInterval = this.options.cdnRequestDataInterval || 3e4),
                (this.afterQueryCdn = function (e, t, n) {
                  var r = this;
                  this.cdnData[e] || (this.cdnData[e] = { success: 0, fail: 0, sr: 0, fr: 0, smr: 0, fmr: 0 }),
                    n
                      ? (this.cdnData[e].success++, (this.cdnData[e].sr += t), t > this.cdnData[e].smr && (this.cdnData[e].smr = t))
                      : (this.cdnData[e].fail++, (this.cdnData[e].fr += t), t > this.cdnData[e].fmr && (this.cdnData[e].fmr = t)),
                    +new Date() - this.cdnDataTime < this.options.cdnRequestDataInterval ||
                      (Object.keys(this.cdnData).forEach(function (e) {
                        (r.cdnData[e].sr = r.cdnData[e].sr / r.cdnData[e].success || 0), (r.cdnData[e].fr = r.cdnData[e].fr / r.cdnData[e].fail || 0);
                      }),
                      this.options.onCdnRequestData(Object.assign({}, this.cdnData), this.finalFail),
                      this.resetCdnData());
                }))
              : (this.afterQueryCdn = function () {});
        });
    },
    function (e, t, n) {
      var r;
      e.exports =
        ((r = n(25)),
        n(218),
        n(308),
        n(219),
        n(114),
        (function () {
          var e = r,
            t = e.lib.BlockCipher,
            n = e.algo,
            o = [],
            i = [],
            s = [],
            a = [],
            c = [],
            u = [],
            l = [],
            p = [],
            m = [],
            d = [];
          !(function () {
            for (var e = [], t = 0; t < 256; t++) e[t] = t < 128 ? t << 1 : (t << 1) ^ 283;
            var n = 0,
              r = 0;
            for (t = 0; t < 256; t++) {
              var f = r ^ (r << 1) ^ (r << 2) ^ (r << 3) ^ (r << 4);
              (f = (f >>> 8) ^ (255 & f) ^ 99), (o[n] = f), (i[f] = n);
              var y = e[n],
                g = e[y],
                h = e[g],
                v = (257 * e[f]) ^ (16843008 * f);
              (s[n] = (v << 24) | (v >>> 8)),
                (a[n] = (v << 16) | (v >>> 16)),
                (c[n] = (v << 8) | (v >>> 24)),
                (u[n] = v),
                (v = (16843009 * h) ^ (65537 * g) ^ (257 * y) ^ (16843008 * n)),
                (l[f] = (v << 24) | (v >>> 8)),
                (p[f] = (v << 16) | (v >>> 16)),
                (m[f] = (v << 8) | (v >>> 24)),
                (d[f] = v),
                n ? ((n = y ^ e[e[e[h ^ y]]]), (r ^= e[e[r]])) : (n = r = 1);
            }
          })();
          var f = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54],
            y = (n.AES = t.extend({
              _doReset: function () {
                if (!this._nRounds || this._keyPriorReset !== this._key) {
                  for (
                    var e = (this._keyPriorReset = this._key),
                      t = e.words,
                      n = e.sigBytes / 4,
                      r = 4 * ((this._nRounds = n + 6) + 1),
                      i = (this._keySchedule = []),
                      s = 0;
                    s < r;
                    s++
                  )
                    s < n
                      ? (i[s] = t[s])
                      : ((u = i[s - 1]),
                        s % n
                          ? n > 6 && s % n == 4 && (u = (o[u >>> 24] << 24) | (o[(u >>> 16) & 255] << 16) | (o[(u >>> 8) & 255] << 8) | o[255 & u])
                          : ((u = (o[(u = (u << 8) | (u >>> 24)) >>> 24] << 24) | (o[(u >>> 16) & 255] << 16) | (o[(u >>> 8) & 255] << 8) | o[255 & u]),
                            (u ^= f[(s / n) | 0] << 24)),
                        (i[s] = i[s - n] ^ u));
                  for (var a = (this._invKeySchedule = []), c = 0; c < r; c++) {
                    if (((s = r - c), c % 4)) var u = i[s];
                    else u = i[s - 4];
                    a[c] = c < 4 || s <= 4 ? u : l[o[u >>> 24]] ^ p[o[(u >>> 16) & 255]] ^ m[o[(u >>> 8) & 255]] ^ d[o[255 & u]];
                  }
                }
              },
              encryptBlock: function (e, t) {
                this._doCryptBlock(e, t, this._keySchedule, s, a, c, u, o);
              },
              decryptBlock: function (e, t) {
                var n = e[t + 1];
                (e[t + 1] = e[t + 3]),
                  (e[t + 3] = n),
                  this._doCryptBlock(e, t, this._invKeySchedule, l, p, m, d, i),
                  (n = e[t + 1]),
                  (e[t + 1] = e[t + 3]),
                  (e[t + 3] = n);
              },
              _doCryptBlock: function (e, t, n, r, o, i, s, a) {
                for (var c = this._nRounds, u = e[t] ^ n[0], l = e[t + 1] ^ n[1], p = e[t + 2] ^ n[2], m = e[t + 3] ^ n[3], d = 4, f = 1; f < c; f++) {
                  var y = r[u >>> 24] ^ o[(l >>> 16) & 255] ^ i[(p >>> 8) & 255] ^ s[255 & m] ^ n[d++],
                    g = r[l >>> 24] ^ o[(p >>> 16) & 255] ^ i[(m >>> 8) & 255] ^ s[255 & u] ^ n[d++],
                    h = r[p >>> 24] ^ o[(m >>> 16) & 255] ^ i[(u >>> 8) & 255] ^ s[255 & l] ^ n[d++],
                    v = r[m >>> 24] ^ o[(u >>> 16) & 255] ^ i[(l >>> 8) & 255] ^ s[255 & p] ^ n[d++];
                  (u = y), (l = g), (p = h), (m = v);
                }
                (y = ((a[u >>> 24] << 24) | (a[(l >>> 16) & 255] << 16) | (a[(p >>> 8) & 255] << 8) | a[255 & m]) ^ n[d++]),
                  (g = ((a[l >>> 24] << 24) | (a[(p >>> 16) & 255] << 16) | (a[(m >>> 8) & 255] << 8) | a[255 & u]) ^ n[d++]),
                  (h = ((a[p >>> 24] << 24) | (a[(m >>> 16) & 255] << 16) | (a[(u >>> 8) & 255] << 8) | a[255 & l]) ^ n[d++]),
                  (v = ((a[m >>> 24] << 24) | (a[(u >>> 16) & 255] << 16) | (a[(l >>> 8) & 255] << 8) | a[255 & p]) ^ n[d++]),
                  (e[t] = y),
                  (e[t + 1] = g),
                  (e[t + 2] = h),
                  (e[t + 3] = v);
              },
              keySize: 8,
            }));
          e.AES = t._createHelper(y);
        })(),
        r.AES);
    },
    function (e, t) {
      if (void 0 === __WEBPACK_EXTERNAL_MODULE__307__) {
        var n = new Error("Cannot find module 'crypto'");
        throw ((n.code = 'MODULE_NOT_FOUND'), n);
      }
      e.exports = __WEBPACK_EXTERNAL_MODULE__307__;
    },
    function (e, t, n) {
      var r;
      e.exports =
        ((r = n(25)),
        (function (e) {
          var t = r,
            n = t.lib,
            o = n.WordArray,
            i = n.Hasher,
            s = t.algo,
            a = [];
          !(function () {
            for (var t = 0; t < 64; t++) a[t] = (4294967296 * e.abs(e.sin(t + 1))) | 0;
          })();
          var c = (s.MD5 = i.extend({
            _doReset: function () {
              this._hash = new o.init([1732584193, 4023233417, 2562383102, 271733878]);
            },
            _doProcessBlock: function (e, t) {
              for (var n = 0; n < 16; n++) {
                var r = t + n,
                  o = e[r];
                e[r] = (16711935 & ((o << 8) | (o >>> 24))) | (4278255360 & ((o << 24) | (o >>> 8)));
              }
              var i = this._hash.words,
                s = e[t + 0],
                c = e[t + 1],
                d = e[t + 2],
                f = e[t + 3],
                y = e[t + 4],
                g = e[t + 5],
                h = e[t + 6],
                v = e[t + 7],
                b = e[t + 8],
                T = e[t + 9],
                S = e[t + 10],
                k = e[t + 11],
                M = e[t + 12],
                x = e[t + 13],
                _ = e[t + 14],
                w = e[t + 15],
                C = i[0],
                P = i[1],
                O = i[2],
                A = i[3];
              (C = u(C, P, O, A, s, 7, a[0])),
                (A = u(A, C, P, O, c, 12, a[1])),
                (O = u(O, A, C, P, d, 17, a[2])),
                (P = u(P, O, A, C, f, 22, a[3])),
                (C = u(C, P, O, A, y, 7, a[4])),
                (A = u(A, C, P, O, g, 12, a[5])),
                (O = u(O, A, C, P, h, 17, a[6])),
                (P = u(P, O, A, C, v, 22, a[7])),
                (C = u(C, P, O, A, b, 7, a[8])),
                (A = u(A, C, P, O, T, 12, a[9])),
                (O = u(O, A, C, P, S, 17, a[10])),
                (P = u(P, O, A, C, k, 22, a[11])),
                (C = u(C, P, O, A, M, 7, a[12])),
                (A = u(A, C, P, O, x, 12, a[13])),
                (O = u(O, A, C, P, _, 17, a[14])),
                (C = l(C, (P = u(P, O, A, C, w, 22, a[15])), O, A, c, 5, a[16])),
                (A = l(A, C, P, O, h, 9, a[17])),
                (O = l(O, A, C, P, k, 14, a[18])),
                (P = l(P, O, A, C, s, 20, a[19])),
                (C = l(C, P, O, A, g, 5, a[20])),
                (A = l(A, C, P, O, S, 9, a[21])),
                (O = l(O, A, C, P, w, 14, a[22])),
                (P = l(P, O, A, C, y, 20, a[23])),
                (C = l(C, P, O, A, T, 5, a[24])),
                (A = l(A, C, P, O, _, 9, a[25])),
                (O = l(O, A, C, P, f, 14, a[26])),
                (P = l(P, O, A, C, b, 20, a[27])),
                (C = l(C, P, O, A, x, 5, a[28])),
                (A = l(A, C, P, O, d, 9, a[29])),
                (O = l(O, A, C, P, v, 14, a[30])),
                (C = p(C, (P = l(P, O, A, C, M, 20, a[31])), O, A, g, 4, a[32])),
                (A = p(A, C, P, O, b, 11, a[33])),
                (O = p(O, A, C, P, k, 16, a[34])),
                (P = p(P, O, A, C, _, 23, a[35])),
                (C = p(C, P, O, A, c, 4, a[36])),
                (A = p(A, C, P, O, y, 11, a[37])),
                (O = p(O, A, C, P, v, 16, a[38])),
                (P = p(P, O, A, C, S, 23, a[39])),
                (C = p(C, P, O, A, x, 4, a[40])),
                (A = p(A, C, P, O, s, 11, a[41])),
                (O = p(O, A, C, P, f, 16, a[42])),
                (P = p(P, O, A, C, h, 23, a[43])),
                (C = p(C, P, O, A, T, 4, a[44])),
                (A = p(A, C, P, O, M, 11, a[45])),
                (O = p(O, A, C, P, w, 16, a[46])),
                (C = m(C, (P = p(P, O, A, C, d, 23, a[47])), O, A, s, 6, a[48])),
                (A = m(A, C, P, O, v, 10, a[49])),
                (O = m(O, A, C, P, _, 15, a[50])),
                (P = m(P, O, A, C, g, 21, a[51])),
                (C = m(C, P, O, A, M, 6, a[52])),
                (A = m(A, C, P, O, f, 10, a[53])),
                (O = m(O, A, C, P, S, 15, a[54])),
                (P = m(P, O, A, C, c, 21, a[55])),
                (C = m(C, P, O, A, b, 6, a[56])),
                (A = m(A, C, P, O, w, 10, a[57])),
                (O = m(O, A, C, P, h, 15, a[58])),
                (P = m(P, O, A, C, x, 21, a[59])),
                (C = m(C, P, O, A, y, 6, a[60])),
                (A = m(A, C, P, O, k, 10, a[61])),
                (O = m(O, A, C, P, d, 15, a[62])),
                (P = m(P, O, A, C, T, 21, a[63])),
                (i[0] = (i[0] + C) | 0),
                (i[1] = (i[1] + P) | 0),
                (i[2] = (i[2] + O) | 0),
                (i[3] = (i[3] + A) | 0);
            },
            _doFinalize: function () {
              var t = this._data,
                n = t.words,
                r = 8 * this._nDataBytes,
                o = 8 * t.sigBytes;
              n[o >>> 5] |= 128 << (24 - (o % 32));
              var i = e.floor(r / 4294967296),
                s = r;
              (n[15 + (((o + 64) >>> 9) << 4)] = (16711935 & ((i << 8) | (i >>> 24))) | (4278255360 & ((i << 24) | (i >>> 8)))),
                (n[14 + (((o + 64) >>> 9) << 4)] = (16711935 & ((s << 8) | (s >>> 24))) | (4278255360 & ((s << 24) | (s >>> 8)))),
                (t.sigBytes = 4 * (n.length + 1)),
                this._process();
              for (var a = this._hash, c = a.words, u = 0; u < 4; u++) {
                var l = c[u];
                c[u] = (16711935 & ((l << 8) | (l >>> 24))) | (4278255360 & ((l << 24) | (l >>> 8)));
              }
              return a;
            },
            clone: function () {
              var e = i.clone.call(this);
              return (e._hash = this._hash.clone()), e;
            },
          }));
          function u(e, t, n, r, o, i, s) {
            var a = e + ((t & n) | (~t & r)) + o + s;
            return ((a << i) | (a >>> (32 - i))) + t;
          }
          function l(e, t, n, r, o, i, s) {
            var a = e + ((t & r) | (n & ~r)) + o + s;
            return ((a << i) | (a >>> (32 - i))) + t;
          }
          function p(e, t, n, r, o, i, s) {
            var a = e + (t ^ n ^ r) + o + s;
            return ((a << i) | (a >>> (32 - i))) + t;
          }
          function m(e, t, n, r, o, i, s) {
            var a = e + (n ^ (t | ~r)) + o + s;
            return ((a << i) | (a >>> (32 - i))) + t;
          }
          (t.MD5 = i._createHelper(c)), (t.HmacMD5 = i._createHmacHelper(c));
        })(Math),
        r.MD5);
    },
    function (e, t, n) {
      var r, o, i, s, a, c, u, l;
      e.exports =
        ((r = n(25)),
        (i = (o = r).lib),
        (s = i.WordArray),
        (a = i.Hasher),
        (c = o.algo),
        (u = []),
        (l = c.SHA1 =
          a.extend({
            _doReset: function () {
              this._hash = new s.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
            },
            _doProcessBlock: function (e, t) {
              for (var n = this._hash.words, r = n[0], o = n[1], i = n[2], s = n[3], a = n[4], c = 0; c < 80; c++) {
                if (c < 16) u[c] = 0 | e[t + c];
                else {
                  var l = u[c - 3] ^ u[c - 8] ^ u[c - 14] ^ u[c - 16];
                  u[c] = (l << 1) | (l >>> 31);
                }
                var p = ((r << 5) | (r >>> 27)) + a + u[c];
                (p +=
                  c < 20
                    ? 1518500249 + ((o & i) | (~o & s))
                    : c < 40
                    ? 1859775393 + (o ^ i ^ s)
                    : c < 60
                    ? ((o & i) | (o & s) | (i & s)) - 1894007588
                    : (o ^ i ^ s) - 899497514),
                  (a = s),
                  (s = i),
                  (i = (o << 30) | (o >>> 2)),
                  (o = r),
                  (r = p);
              }
              (n[0] = (n[0] + r) | 0), (n[1] = (n[1] + o) | 0), (n[2] = (n[2] + i) | 0), (n[3] = (n[3] + s) | 0), (n[4] = (n[4] + a) | 0);
            },
            _doFinalize: function () {
              var e = this._data,
                t = e.words,
                n = 8 * this._nDataBytes,
                r = 8 * e.sigBytes;
              return (
                (t[r >>> 5] |= 128 << (24 - (r % 32))),
                (t[14 + (((r + 64) >>> 9) << 4)] = Math.floor(n / 4294967296)),
                (t[15 + (((r + 64) >>> 9) << 4)] = n),
                (e.sigBytes = 4 * t.length),
                this._process(),
                this._hash
              );
            },
            clone: function () {
              var e = a.clone.call(this);
              return (e._hash = this._hash.clone()), e;
            },
          })),
        (o.SHA1 = a._createHelper(l)),
        (o.HmacSHA1 = a._createHmacHelper(l)),
        r.SHA1);
    },
    function (e, t, n) {
      var r, o, i, s, a, c, u;
      e.exports =
        ((r = n(25)),
        (i = (o = r).lib),
        (s = i.Base),
        (a = o.enc),
        (c = a.Utf8),
        (u = o.algo),
        void (u.HMAC = s.extend({
          init: function (e, t) {
            (e = this._hasher = new e.init()), 'string' == typeof t && (t = c.parse(t));
            var n = e.blockSize,
              r = 4 * n;
            t.sigBytes > r && (t = e.finalize(t)), t.clamp();
            for (var o = (this._oKey = t.clone()), i = (this._iKey = t.clone()), s = o.words, a = i.words, u = 0; u < n; u++) (s[u] ^= 1549556828), (a[u] ^= 909522486);
            (o.sigBytes = i.sigBytes = r), this.reset();
          },
          reset: function () {
            var e = this._hasher;
            e.reset(), e.update(this._iKey);
          },
          update: function (e) {
            return this._hasher.update(e), this;
          },
          finalize: function (e) {
            var t = this._hasher,
              n = t.finalize(e);
            t.reset();
            var r = t.finalize(this._oKey.clone().concat(n));
            return r;
          },
        })));
    },
    function (e, t, n) {
      var r, o;
      e.exports =
        ((r = n(25)),
        n(114),
        (r.mode.ECB =
          (((o = r.lib.BlockCipherMode.extend()).Encryptor = o.extend({
            processBlock: function (e, t) {
              this._cipher.encryptBlock(e, t);
            },
          })),
          (o.Decryptor = o.extend({
            processBlock: function (e, t) {
              this._cipher.decryptBlock(e, t);
            },
          })),
          o)),
        r.mode.ECB);
    },
    function (e, t, n) {
      var r;
      e.exports = ((r = n(25)), n(114), r.pad.Pkcs7);
    },
    function (e, t, n) {
      var r;
      e.exports = ((r = n(25)), r.enc.Utf8);
    },
    function (e, t, n) {
      'use strict';
      var r = n(66).fn,
        o = n(113);
      (r.onChatroomMembersInfo = r.onChatroomMembers =
        function (e) {
          e.error || (e.obj.members = o.reverseMembers(e.content.members));
        }),
        (r.onGetChatroomMemberCountByTag = function (e) {
          e.error || (e.obj = e.content);
        }),
        (r.onMarkChatroomMember = function (e) {
          e.error || (e.obj.member = o.reverse(e.content.chatroomMember));
        }),
        (r.onSyncRobot = function (e) {
          !e.error && this.options.onrobots ? this.options.onrobots(null, e.content) : this.ontions.onrobots(e.error, {});
        });
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = function (e) {
          this.account = e.account;
        },
        i = o.prototype,
        s = (i.Message = n(33)),
        a = (i.TextMessage = n(316)),
        c = (i.FileMessage = n(78)),
        u = (i.GeoMessage = n(320)),
        l = (i.NotificationMessage = n(321)),
        p = (i.CustomMessage = n(322)),
        m = (i.TipMessage = n(323)),
        d = (i.RobotMessage = n(324));
      (i.validTypes = s.validTypes),
        (i.reverse = function (e) {
          var t;
          switch (s.getType(e)) {
            case 'text':
              t = a.reverse(e);
              break;
            case 'image':
            case 'audio':
            case 'video':
            case 'file':
              t = c.reverse(e);
              break;
            case 'geo':
              t = u.reverse(e);
              break;
            case 'notification':
              t = l.reverse(e);
              break;
            case 'custom':
              t = p.reverse(e);
              break;
            case 'tip':
              t = m.reverse(e);
              break;
            case 'robot':
              t = d.reverse(e);
              break;
            default:
              t = s.reverse(e);
          }
          return s.setExtra(t, this.account), t;
        }),
        (i.reverseMsgs = function (e, t) {
          var n,
            o,
            i = this;
          return e.map(function (e) {
            return (e = i.reverse(e)), t && ((n = t.modifyObj) && (e = r.merge(e, n)), (o = t.mapper), r.isFunction(o) && (e = o(e))), e;
          });
        }),
        (e.exports = o);
    },
    function (e, t, n) {
      'use strict';
      var r = n(33),
        o = n(0);
      function i(e) {
        o.verifyOptions(e, 'text', 'msg::TextMessage'), (e.type = 'text'), r.call(this, e), (this.attach = e.text), (this.body = '');
      }
      (i.prototype = Object.create(r.prototype)),
        (i.reverse = function (e) {
          var t = r.reverse(e);
          return (t.text = e.attach), t;
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = n(78);
      function i() {}
      (i.prototype = Object.create(o.prototype)),
        (i.verifyFile = function (e, t) {
          r.verifyOptions(e, 'w h', !0, 'file.', t);
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      'use strict';
      var r = n(78),
        o = n(0);
      function i() {}
      (i.prototype = Object.create(r.prototype)),
        (i.verifyFile = function (e, t) {
          o.verifyOptions(e, 'dur', !0, 'file.', t);
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      'use strict';
      var r = n(78),
        o = n(0);
      function i() {}
      (i.prototype = Object.create(r.prototype)),
        (i.verifyFile = function (e, t) {
          o.verifyOptions(e, 'dur w h', !0, 'file.', t);
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      'use strict';
      var r = n(33),
        o = n(0);
      function i(e) {
        (e.type = 'geo'),
          o.verifyOptions(e, 'geo', 'msg::GeoMessage'),
          o.verifyOptions(e.geo, 'lng lat title', !0, 'geo.', 'msg::GeoMessage'),
          o.verifyParamType('geo.lng', e.geo.lng, 'number', 'msg::GeoMessage'),
          o.verifyParamType('geo.lat', e.geo.lat, 'number', 'msg::GeoMessage'),
          o.verifyParamType('geo.title', e.geo.title, 'string', 'msg::GeoMessage'),
          r.call(this, e),
          (this.attach = JSON.stringify(e.geo));
      }
      (i.prototype = Object.create(r.prototype)),
        (i.reverse = function (e) {
          var t = r.reverse(e);
          return (e.attach = e.attach ? '' + e.attach : ''), (t.geo = e.attach ? JSON.parse(e.attach) : {}), t;
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      'use strict';
      var r = n(0).notundef,
        o = n(33),
        i = {
          301: 'memberEnter',
          302: 'memberExit',
          303: 'blackMember',
          304: 'unblackMember',
          305: 'gagMember',
          306: 'ungagMember',
          307: 'addManager',
          308: 'removeManager',
          309: 'addCommon',
          310: 'removeCommon',
          311: 'closeChatroom',
          312: 'updateChatroom',
          313: 'kickMember',
          314: 'addTempMute',
          315: 'removeTempMute',
          316: 'updateMemberInfo',
          317: 'updateQueue',
          318: 'muteRoom',
          319: 'unmuteRoom',
          320: 'batchUpdateQueue',
          321: 'addTempMuteTag',
          322: 'removeTempMuteTag',
          324: 'batchQueueOffer',
          323: 'deleteChatroomMsg',
        };
      function s() {}
      (s.prototype = Object.create(o.prototype)),
        (s.reverse = function (e) {
          var t = o.reverse(e);
          if (((e.attach = e.attach ? '' + e.attach : ''), e.attach)) {
            var n = JSON.parse(e.attach);
            if (((t.attach = { type: i[n.id] }), r(n.data))) {
              var s = n.data;
              if (
                (r(s.operator) && (t.attach.from = s.operator),
                r(s.opeNick) && (t.attach.fromNick = s.opeNick),
                r(s.target) && (t.attach.to = s.target),
                r(s.tarNick) && (t.attach.toNick = s.tarNick),
                r(s.muteDuration) && (t.attach.duration = parseInt(s.muteDuration, 10)),
                'memberEnter' === t.attach.type &&
                  (r(s.muted) ? (t.attach.gaged = 1 == +s.muted) : (t.attach.gaged = !1),
                  r(s.tempMuted) ? (t.attach.tempMuted = 1 == +s.tempMuted) : (t.attach.tempMuted = !1),
                  r(s.muteTtl) ? (t.attach.tempMuteDuration = +s.muteTtl) : (t.attach.tempMuteDuration = 0)),
                'deleteChatroomMsg' === t.attach.type && ((t.attach.msgId = s.msgId), (t.attach.msgTime = s.msgTime)),
                r(s.ext) && (t.attach.custom = s.ext),
                r(s.queueChange))
              ) {
                var a = JSON.parse(s.queueChange);
                switch (a._e) {
                  case 'OFFER':
                    t.attach.queueChange = { type: 'OFFER', elementKey: a.key, elementValue: a.content };
                    break;
                  case 'POLL':
                    t.attach.queueChange = { type: 'POLL', elementKey: a.key, elementValue: a.content };
                    break;
                  case 'DROP':
                    t.attach.queueChange = { type: 'DROP' };
                    break;
                  case 'PARTCLEAR':
                  case 'BATCH_UPDATE':
                    t.attach.queueChange = { type: a._e, elementKv: a.kvObject };
                    break;
                  case 'BATCH_OFFER':
                    t.attach.queueChange = { type: a._e, elements: a.elements };
                }
              }
            }
          } else t.attach = {};
          return t;
        }),
        (e.exports = s);
    },
    function (e, t, n) {
      'use strict';
      var r = n(33),
        o = n(0);
      function i(e) {
        o.verifyOptions(e, 'content', 'msg::CustomMessage'),
          (e.type = 'custom'),
          r.call(this, e),
          'string' != typeof e.content && (e.content = JSON.stringify(e.content)),
          (this.attach = e.content);
      }
      (i.prototype = Object.create(r.prototype)),
        (i.reverse = function (e) {
          var t = r.reverse(e);
          return (t.content = e.attach), t;
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      'use strict';
      var r = n(33),
        o = n(0);
      function i(e) {
        o.verifyOptions(e, 'tip', 'msg::TipMessage'), (e.type = 'tip'), r.call(this, e), (this.attach = e.tip);
      }
      (i.prototype = Object.create(r.prototype)),
        (i.reverse = function (e) {
          var t = r.reverse(e);
          return (t.tip = e.attach), t;
        }),
        (e.exports = i);
    },
    function (e, t, n) {
      'use strict';
      var r = n(33),
        o = n(0),
        i = { welcome: '00', text: '01', link: '03' },
        s = { '01': 'text', '02': 'image', '03': 'answer', 11: 'template' };
      function a(e) {
        o.verifyOptions(e, 'content', 'msg::RobotMessage');
        var t = e.content;
        switch (t.type) {
          case 'welcome':
            o.undef(e.body) && (this.body = '欢迎消息');
            break;
          case 'text':
            o.verifyOptions(t, 'content', 'msg::RobotMessage'), o.undef(e.body) && (this.body = t.content);
            break;
          case 'link':
            o.verifyOptions(t, 'target', 'msg::RobotMessage');
        }
        t.type && (t.type = i[t.type]), (t = { param: t, robotAccid: e.robotAccid }), (this.attach = JSON.stringify(t)), (e.type = 'robot'), r.call(this, e);
      }
      (a.prototype = Object.create(r.prototype)),
        (a.reverse = function (e) {
          var t = r.reverse(e);
          if ('robot' === t.type) {
            var n = JSON.parse(e.attach);
            if ((n.param && (n.param.type = s[n.param.type] || 'unknown'), n.robotMsg)) {
              var i = (n = o.merge(n, n.robotMsg)).message;
              'bot' === n.flag
                ? (n.message = i.map(function (e) {
                    return (e.type = s[e.type] || 'unknown'), e;
                  }))
                : n.flag,
                delete n.robotMsg;
            }
            t.content = n;
          }
          return t;
        }),
        (e.exports = a);
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = r.undef,
        i = n(77).fn;
      i.beforeSendMsg = function (e) {
        e.cmd = 'sendMsg';
      };
      var s = { text: 0, image: 1, audio: 2, video: 3, geo: 4, notification: 5, file: 6, tip: 10, robot: 11, custom: 100 };
      i.getHistoryMsgs = function (e) {
        r.verifyOptions(e),
          o(e.timetag) ? (e.timetag = 0) : r.verifyParamType('timetag', e.timetag, 'number', 'msg::getHistoryMsgs'),
          o(e.limit) ? (e.limit = 100) : r.verifyParamType('limit', e.limit, 'number', 'msg::getHistoryMsgs'),
          o(e.reverse) ? (e.reverse = !1) : r.verifyParamType('reverse', e.reverse, 'boolean', 'msg::getHistoryMsgs'),
          o(e.msgTypes)
            ? (e.msgTypes = [])
            : Array.isArray(e.msgTypes)
            ? ((e.msgTypes = e.msgTypes.map(function (e) {
                return s[e];
              })),
              (e.msgTypes = e.msgTypes.filter(function (e) {
                return 'number' == typeof e;
              })))
            : 'number' == typeof s[e.msgTypes]
            ? (e.msgTypes = [s[e.msgTypes]])
            : (e.msgTypes = []);
        this.processCallback(e),
          this.sendCmd('getHistoryMsgs', e, function (t, n, r) {
            Array.isArray(r) &&
              (r = r.map(function (e) {
                return s[e.type] && (e.type = s[e.type]), e;
              })),
              e.callback(t, n, r);
          });
      };
    },
    function (e, t, n) {
      'use strict';
      var r = n(0),
        o = r.undef,
        i = r.verifyOptions,
        s = r.verifyParamType,
        a = n(113),
        c = n(77).fn;
      (c.updateMyChatroomMemberInfo = function (e) {
        i(e, 'member needNotify', 'member::updateMyChatroomMemberInfo'),
          s('needNotify', e.needNotify, 'boolean', 'member::updateMyChatroomMemberInfo'),
          (e.needSave = e.needSave || !1),
          s('needSave', e.needSave, 'boolean', 'member::updateMyChatroomMemberInfo'),
          this.processCustom(e),
          this.processCallback(e),
          (e.chatroomMember = new a(e.member)),
          this.sendCmd('updateMyChatroomMemberInfo', e);
      }),
        (c.getChatroomMembers = function (e) {
          i(e, 'guest', 'member::getChatroomMembers'),
            s('guest', e.guest, 'boolean', 'member::getChatroomMembers'),
            o(e.time) ? (e.time = 0) : s('time', e.time, 'number', 'member::getChatroomMembers'),
            o(e.limit) ? (e.limit = 100) : s('limit', e.limit, 'number', 'member::getChatroomMembers'),
            this.processCallback(e),
            e.guest ? (e.type = !1 === e.desc ? 3 : 1) : (e.type = e.onlyOnline ? 2 : 0),
            this.sendCmd('getChatroomMembers', e);
        }),
        (c.getChatroomMembersByTag = function (e) {
          i(e, 'tag', 'getChatroomMembersByTag::rag'),
            o(e.time) ? (e.time = 0) : s('time', e.time, 'number', 'getChatroomMembersByTag::time'),
            o(e.limit) ? (e.limit = 100) : s('limit', e.limit, 'number', 'getChatroomMembersByTag::limit'),
            this.processCallback(e),
            this.sendCmd('getChatroomMembersByTag', { tagMemberReq: r.filterObj(e, 'tag limit time'), callback: e.callback });
        }),
        (c.getChatroomMemberCountByTag = function (e) {
          i(e, 'tag', 'getChatroomMemberCountByTag::rag'), this.processCallback(e), this.sendCmd('getChatroomMemberCountByTag', e);
        }),
        (c.getChatroomMembersInfo = function (e) {
          i(e, 'accounts', 'member::getChatroomMembersInfo'),
            s('accounts', e.accounts, 'array', 'member::getChatroomMembersInfo'),
            this.processCallback(e),
            this.sendCmd('getChatroomMembersInfo', e);
        }),
        (c.markChatroomIdentity = function (e) {
          i(e, 'identity', 'member::markChatroomIdentity'),
            (e.type = { manager: 1, common: 2, black: -1, mute: -2 }[e.identity]),
            delete e.identity,
            isNaN(e.type)
              ? i(e, 'identity', 'member::markChatroomIdentity. The valid value of the identity is "manager" or "common" or "black" or "mute".')
              : this.markChatroomMember(e);
        }),
        (c.markChatroomManager = function (e) {
          (e.type = 1), this.markChatroomMember(e);
        }),
        (c.markChatroomCommonMember = function (e) {
          (e.type = 2), this.markChatroomMember(e);
        }),
        (c.markChatroomBlacklist = function (e) {
          (e.type = -1), this.markChatroomMember(e);
        }),
        (c.markChatroomGaglist = function (e) {
          (e.type = -2), this.markChatroomMember(e);
        }),
        (c.markChatroomMember = function (e) {
          i(e, 'account type isAdd', 'member::markChatroomMember'),
            s('isAdd', e.isAdd, 'boolean', 'member::markChatroomMember'),
            o(e.level) ? (e.level = 0) : s('level', e.level, 'number', 'member::markChatroomMember');
          this.processCustom(e), this.processCallback(e), this.sendCmd('markChatroomMember', e);
        }),
        (c.kickChatroomMember = function (e) {
          i(e, 'account', 'member::kickChatroomMember'), this.processCustom(e), this.processCallback(e), this.sendCmd('kickChatroomMember', e);
        }),
        (c.updateChatroomMemberTempMute = function (e) {
          i(e, 'account duration needNotify', 'member::updateChatroomMemberTempMute'),
            s('duration', e.duration, 'number', 'member::updateChatroomMemberTempMute'),
            s('needNotify', e.needNotify, 'boolean', 'member::updateChatroomMemberTempMute'),
            this.processCustom(e),
            this.processCallback(e),
            this.sendCmd('updateChatroomMemberTempMute', e);
        }),
        (c.updateTagMembersTempMute = function (e) {
          i(e, 'tag duration needNotify', 'member::updateTagMembersTempMute'),
            s('duration', e.duration, 'number', 'member::updateTagMembersTempMute'),
            s('needNotify', e.needNotify, 'boolean', 'member::updateTagMembersTempMute'),
            this.processCustom(e),
            this.processCallback(e);
          var t = r.filterObj(e, 'tag duration custom notifyTargetTags');
          (t.needNotify = e.needNotify ? 1 : 0), this.sendCmd('updateTagMembersTempMute', { tagMuteReq: t, callback: e.callback });
        }),
        (c.updateCoordinate = r.throttle(
          function (e) {
            var t = !0;
            void 0 === e.x || void 0 === e.y || void 0 === e.z
              ? (t = !1)
              : ('number' != typeof e.x && (e.x = 0), 'number' != typeof e.y && (e.y = 0), 'number' != typeof e.z && (e.z = 0)),
              this.processCallback(e);
            var n = r.filterObj(e, t ? 'x y z distance' : 'distance');
            this.sendCmd('updateCoordinate', { coordinateReq: n, callback: e.callback });
          },
          200,
          {},
          function (e) {
            e && e.done && e.done({ code: 416, chatroomId: this.options.chatroomId });
          }
        )),
        (c.getRobotList = function (e) {
          o(e.timetag) && (e.timetag = 0), this.processCallback(e), this.sendCmd('syncRobot', e);
        });
    },
    function (e, t, n) {
      'use strict';
      var r = n(77).fn,
        o = n(0);
      (r.queueOffer = function (e) {
        o.verifyOptions(e, 'elementKey elementValue', 'msg::queueOffer');
        var t = { elementKey: e.elementKey, elementValue: e.elementValue, transient: !!e.transient };
        e.elementAccount && (t.elementAccount = e.elementAccount), this.processCallback(e), this.sendCmd('queueOffer', t, e.callback);
      }),
        (r.queuePoll = function () {
          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          (e.elementKey = e.elementKey || ''), this.processCallback(e), this.sendCmd('queuePoll', e, e.callback);
        }),
        (r.queueList = function (e) {
          this.processCallback(e), this.sendCmd('queueList', e, e.callback);
        }),
        (r.peak = function (e) {
          this.processCallback(e), this.sendCmd('peak', e, e.callback);
        }),
        (r.queueDrop = function (e) {
          this.processCallback(e), this.sendCmd('queueDrop', e, e.callback);
        }),
        (r.queueChange = function (e) {
          o.verifyOptions(e, 'elementMap', 'msg::queueOffer'),
            e.needNotify ? ((e.needNotify = !0), o.verifyOptions(e, 'notifyExt', 'msg::queueOffer')) : (e.needNotify = !1),
            this.processCallback(e),
            this.sendCmd('queueChange', e, e.callback);
        });
    },
  ]);
});
