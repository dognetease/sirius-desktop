(function() {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var global$Editor = tinymce.util.Tools.resolve('tinymce.Editor');

    var global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');

    var global$2 = tinymce.util.Tools.resolve('tinymce.util.Promise');

    var global$4 = tinymce.util.Tools.resolve('tinymce.util.ImageUploader');

    var global$Node = tinymce.util.Tools.resolve('tinymce.html.Node');

    var global$Serializer = tinymce.util.Tools.resolve('tinymce.html.Serializer');

    var $ = tinymce.util.Tools.resolve('tinymce.dom.DomQuery');

    var getUploadHandler = function(editor) {
        return editor.getParam('lx_images_upload_handler', null, 'function');
    };

    var getToolbarItems = function(editor) {
        return editor.getParam('lx_imagetools_toolbar', 'enlargement shrink natureSize delete changeImg');
    }

    var unique = 0;
    var offsetWidth = 0;
    var generate$1 = function(prefix) {
        var date = new Date();
        var time = date.getTime();
        var random = Math.floor(Math.random() * 1000000000);
        unique++;
        return prefix + '_' + random + unique + String(time);
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

    var get = function(xs, i) {
        return i >= 0 && i < xs.length ? Optional.some(xs[i]) : Optional.none();
    }

    var head = function(xs) {
        return get(xs, 0);
    }

    var findUntil = function(xs, pred, until) {
        for (var i = 0, len = xs.length; i < len; i++) {
            var x = xs[i];
            if (pred(x, i)) {
                return Optional.some(x);
            } else if (until(x, i)) {
                break;
            }
        }
        return Optional.none();
    };
    var find = function(xs, pred) {
        return findUntil(xs, pred, never);
    };

    var child = function(scope, predicate) {
        var pred = function(node) {
            return predicate(SugarElement.fromDom(node));
        };
        var result = find(scope.dom.childNodes, pred);
        return result.map(SugarElement.fromDom);
    };

    var child$1 = function(scope, selector) {
        return child(scope, function(e) {
            return is(e, selector);
        });
    };

    var fromHtml = function(html, scope) {
        var doc = scope || document;
        var div = doc.createElement('div');
        div.innerHTML = html;
        if (!div.hasChildNodes() || div.childNodes.length > 1) {
            console.error('HTML does not have a single root node', html);
            throw new Error('HTML must have a single root node');
        }
        return fromDom(div.childNodes[0]);
    };
    var fromTag = function(tag, scope) {
        var doc = scope || document;
        var node = doc.createElement(tag);
        return fromDom(node);
    };
    var fromText = function(text, scope) {
        var doc = scope || document;
        var node = doc.createTextNode(text);
        return fromDom(node);
    };
    var fromDom = function(node) {
        if (node === null || node === undefined) {
            throw new Error('Node cannot be null or undefined');
        }
        return { dom: node };
    };
    var fromPoint = function(docElm, x, y) {
        return Optional.from(docElm.dom.elementFromPoint(x, y)).map(fromDom);
    };
    var SugarElement = {
        fromHtml: fromHtml,
        fromTag: fromTag,
        fromText: fromText,
        fromDom: fromDom,
        fromPoint: fromPoint
    };

    var getFigureImg = function(elem) {
        return child$1(SugarElement.fromDom(elem), 'img');
    };

    var isFigure = function(editor, elem) {
        return editor.dom.is(elem, 'figure');
    };

    var isImage = function(editor, imgNode) {
        return editor.dom.is(imgNode, 'img:not([data-mce-object],[data-mce-placeholder])');
    };

    var isPlaceholderImage = function(imgElm) {
        return imgElm.nodeName === 'IMG' && (imgElm.hasAttribute('data-mce-object') || imgElm.hasAttribute('data-mce-placeholder'));
    };

    var getEditableImage = function(editor, node) {
        var isEditable = function(imgNode) {
            return isImage(editor, imgNode);
        };
        if (isFigure(editor, node)) {
            return getFigureImg(node).bind(function(img) {
                return isEditable(img.dom) ? Optional.some(img.dom) : Optional.none();
            });
        } else {
            return isEditable(node) ? Optional.some(node) : Optional.none();
        }
    };

    var getSelectedImage = function(editor) {
        var elem = editor.selection.getNode();
        var figureElm = editor.dom.getParent(elem, 'figure.image');
        if (figureElm !== null && isFigure(editor, figureElm)) {
            return getFigureImg(figureElm);
        } else if (isImage(editor, elem)) {
            return Optional.some(SugarElement.fromDom(elem));
        } else {
            return Optional.none();
        }
    };

    var register$1 = function(editor) {
        var wrapUploadSucc = function(result, id) {
            uploadSucc(editor, result, id);
        }
        var helpers = {
            createBlobCache: createBlobCache(editor),
            uploadImage: uploadImage(editor),
            wrapUploadSucc: wrapUploadSucc
        };
        editor.ui.registry.addToggleButton('lximg', {
            icon: 'image',
            tooltip: 'Insert image',
            inputFileClasses: ['mac-input-file-image'],
            inputFileAttr: { accept: 'image/*' },
            classes: ['position-group'],
            onFileChange: function(e) {
                var files = e.target.dom.files;
                if (files.length) {
                    global$1.each(files, function(file) {
                        changeFileInput(editor, file, helpers);
                    })
                }
            },
            onAction: function() {
                // editor.execCommand('mceLxUploadImage');
            },
            onSetup: function(buttonApi) {}
        });
        editor.ui.registry.addMenuItem('lxcontextimage', {
            // icon: 'image',
            text: 'Insert image',
            inputFileClasses: ['mac-input-file-image2'],
            inputFileAttr: { accept: 'image/*' },
            classes: ['position-group'],
            onFileChange: function(e) {
                var files = e.target.dom.files;
                if (files.length) {
                    global$1.each(files, function(file) {
                        changeFileInput(editor, file, helpers);
                    })
                }
            },
            onAction: function() {
                // editor.execCommand('mceLxUploadImage');
            }
        });
        editor.ui.registry.addMenuItem('lxcontextchangeimage', {
          text: 'changeImg',
          inputFileClasses: ['mac-input-file-image2'],
          inputFileAttr: { accept: 'image/*' },
          classes: ['position-group'],
          onFileChange: function(e) {
              var files = e.target.dom.files;
              if (files.length) {
                  global$1.each(files, function(file) {
                      changeFileInput(editor, file, helpers);
                  })
              }
          },
          onAction: function() {
          }
        });

        editor.ui.registry.addContextMenu('lximg', {
            update: function(element) {
                // return isFigure(editor, element) || isImage(editor, element) && !isPlaceholderImage(element) ? [''] : ['lxcontextimage'];
                return editor.selection.getContent() ? [''] : ['lxcontextimage'];
            }
        });
    }

    var uploadSucc = function(editor, res, id) {
        editor.undoManager.transact(function() {
            var src = res.url;
            var originUrl = res.originUrl;
            var el = editor.getBody().querySelector('[upload-id='+ id +']');
            // el.setAttribute('data-mce-src', src);
            el.setAttribute('data-timedate', new Date().getTime() + '');
            el.removeAttribute('upload-id');
            el.setAttribute('wirte-origin-src', originUrl);
            return el.setAttribute('src', src);
        });
    }

    var uploadFail = function() {}

    var createBlobCache = function(editor) {
        return function(file, blobUri, dataUrl) {
            return editor.editorUpload.blobCache.create({
                blob: file,
                blobUri: blobUri,
                name: file.name ? file.name.replace(/\.[^\.]+$/, '') : null,
                filename: file.name,
                base64: dataUrl.split(',')[1]
            });
        };
    };

    var uploadImage = function(editor) {
        return function(blobInfo) {
            return global$4(editor).upload([blobInfo], false).then(function(results) {
                if (results.length === 0) {
                    return global$2.reject('Failed to upload image');
                } else if (results[0].status === false) {
                    return global$2.reject(results[0].error);
                } else {
                    return results[0];
                }
            });
        };
    };

    var register = function(editor) {
        var wrapUploadSucc = function(src, id) {
            uploadSucc(editor, src, id);
        }
        var helpers = {
            createBlobCache: createBlobCache(editor),
            uploadImage: uploadImage(editor),
            wrapUploadSucc: wrapUploadSucc
        };
        var uploadHandler = getUploadHandler(editor);

        var uploadEl = document.createElement('input');
        uploadEl.setAttribute('type', 'file');
        uploadEl.setAttribute('hidden', true);
        uploadEl.setAttribute('accept', 'image/*');
        uploadEl.setAttribute('multiple', true);
        uploadEl.addEventListener('click', function(e) {
            e.target.value = null;
        });
        document.body.appendChild(uploadEl);
        uploadEl.addEventListener('change', function() {
            var files = uploadEl.files;
            if (files.length) {
                global$1.each(files, function(file) {
                    changeFileInput(editor, file, helpers);
                })
            }
        });
        editor.addCommand('mceLxUploadImage', function() {
            uploadEl.click();
        });
    }

    var blobToDataUri = function(blob) {
        return new global$2(function(resolve, reject) {
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

    var btnWrapperClick = function(e, restartFn, delFn) {
        var target = e.target;
        if (!target) return;
        if (target.className.includes('paste-img-restart')) {
            restartFn();
        } else if (target.className.includes('paste-img-del')) {
            delFn();
        }
    }

    var changeFileInput = function(editor, file, helpers) {
        var blobUri = URL.createObjectURL(file);
        var id = generate$1('img');
        var img = editor.dom.createHTML('img', { src: blobUri, 'upload-id': id, style: (!!offsetWidth) ? `width: ${offsetWidth}px; object-fit: cover`: 'max-width: 100%' });
        offsetWidth = 0;
        var load = editor.dom.createHTML('div', { class: "paste-img-load load-instance", contenteditable: false }, '图片上传中.....');
        var icon = editor.ui.registry.getAll().icons['upload-error'];
        var title = editor.dom.createHTML('div', { class: "paste-img-title" }, icon + '图片上传失败...');
        var reload = editor.dom.createHTML('div', { class: "paste-img-load paste-img-reload hide", contenteditable: false }, title);
        var holder = editor.dom.createHTML('div', { style: 'height: 70px; width: 200px', class: "holder" });
        var wrapper = editor.dom.createHTML('div', { style: 'position: relative', class: "upload-img-wrapper" }, img + holder + load + reload);
        editor.undoManager.transact(function() {
            editor.insertContent(wrapper);
        });
        uploadImg(editor, file, helpers, id, blobUri)
    }

    var uploadImg = function(editor, file, helpers, id, blobUri) {
        var finalize = function() {
            URL.revokeObjectURL(blobUri);
        };
        blobToDataUri(file).then(function(dataUrl) {
            var imgEl = editor.dom.select('[upload-id='+ id +']')[0];
            if (!imgEl) return;
            var parent = imgEl.parentElement;
            var load = editor.dom.select('.load-instance', parent);
            var holder = editor.dom.select('.holder', parent)[0];
            var reload = editor.dom.select('.paste-img-reload', parent)[0];
            function delLoad() {
                editor.dom.remove(parent);
                parent = null;
            }
            editor.dom.removeClass(load, 'hide');
            load[0].addEventListener('DOMNodeRemoved', delLoad);
            var blobInfo = helpers.createBlobCache(file, blobUri, dataUrl);
            helpers.uploadImage(blobInfo).then(function(result) {
                if (!parent) return;
                load[0].removeEventListener('DOMNodeRemoved', delLoad);
                var parentNode = parent.parentNode;
                if (parent.firstChild) {
                    parentNode.insertBefore(parent.firstChild, parent);
                }
                parentNode.removeChild(parent);
                // editor.fire('blur');
                uploadSucc(editor, result.url, id);
                helpers.wrapUploadSucc(result.url, id);
            }).catch(function(err) {
                if (!parent) return;
                // 图片上传失败后 重传 和 删除操作
                load[0].removeEventListener('DOMNodeRemoved', delLoad);
                editor.dom.addClass(load, 'hide');
                editor.dom.removeClass(reload, 'hide');
                if (reload && reload.childElementCount < 2) {
                    var wrapperContent = '<span class="btn paste-img-restart">重试</span><span class="btn paste-img-del">删除</span>';
                    var wrapper = editor.dom.create('div', { class: 'btn-wrapper' }, wrapperContent);
                    wrapper.addEventListener('click', function(e) {
                        btnWrapperClick(e, function() {
                            editor.dom.removeClass(load, 'hide');
                            editor.dom.addClass(reload, 'hide');
                            uploadImg(editor, file, helpers, id, blobUri);
                        }, function() {
                            editor.dom.remove(parent);
                            // editor.fire('blur');
                        });
                    });
                    reload.appendChild(wrapper);
                }
            }).finally(function() {
                finalize();
            });
        });
    }

    var register$2 = function(editor) {
        var cmd = function(command) {
            return function() {
                return editor.execCommand(command);
            };
        };
        editor.ui.registry.addButton('enlargement', {
            tooltip: 'enlargement',
            icon: 'enlargement-image',
            onAction: cmd('mceImageEnlargement')
        });
        editor.ui.registry.addButton('shrink', {
            tooltip: 'shrink',
            icon: 'shrink-image',
            onAction: cmd('mceImageShrink')
        });
        editor.ui.registry.addButton('natureSize', {
            tooltip: 'natureSize',
            icon: 'nature-size-image',
            onAction: cmd('mceImageNatureSize')
        });
        editor.ui.registry.addButton('delete', {
            tooltip: 'delete',
            icon: 'delete-Image',
            onAction: cmd('mceImageDelete')
        });
        editor.ui.registry.addButton('changeImg', {
          tooltip: 'changeImg',
          icon: 'change-Image',
          onAction: cmd('mceImageChange')
        });

        editor.ui.registry.addContextToolbar('lximagetools', {
            items: getToolbarItems(editor),
            predicate: function(elem) {
                return getEditableImage(editor, elem).isSome();
            },
            position: 'node',
            scope: 'node'
        });
    }

    var scale = function(editor, type) {
        return function() {
            getSelectedImage(editor).fold(function() {
                console.log('lx image scale error');
            }, function(img) {
                var imgDom = img.dom;
                var preWidth = imgDom.width;
                var preHeight = imgDom.height;
                var newAttr = {
                    width: preWidth * 1.1,
                    height: preHeight * 1.1,
                }
                if (type === 'down') {
                    newAttr = {
                        width: preWidth * .9,
                        height: preHeight * .9,
                    }
                    if (imgDom.naturalWidth * 0.1 > newAttr.width) {
                        // 最小尺寸是远来的0.1
                        return;
                    }
                }
                if (type === 'nature') {
                    newAttr = {
                        width: imgDom.naturalWidth,
                        height: imgDom.naturalHeight,
                    }
                }
                img.dom.style.maxWidth = newAttr.width + 'px';
                newAttr['data-mce-style'] = newAttr.width + 'px';
                editor.$(img.dom).attr(newAttr);
            })
        }
    }

    var remove = function(element) {
        var dom = element.dom;
        if (dom.parentNode !== null) {
            dom.parentNode.removeChild(dom);
        }
    };

    var deleteImage = function(editor) {
        return function() {
            getSelectedImage(editor).fold(function() {
                console.log('lx image delete error');
            }, remove)
        }
    }

    var change = function(element, editor) {
      var dom = element.dom;
      if (dom) {
        offsetWidth = element.dom.offsetWidth;
      }
      editor.execCommand('mceLxUploadImage')
    }

    var changeImage = function(editor) {
      return function() {
          getSelectedImage(editor).fold(function() {
              console.log('lx image change error');
          }, (element) => {
            change(element, editor)
          })
      }
    }

    var register$3 = function(editor) {
        global$1.each({
            mceImageEnlargement: scale(editor, 'up'),
            mceImageShrink: scale(editor, 'down'),
            mceImageNatureSize: scale(editor, 'nature'),
            mceImageDelete: deleteImage(editor),
            mceImageChange: changeImage(editor),
        }, function(fn, cms) {
            editor.addCommand(cms, fn);
        })
    }

    function Plugin(params) {
        global.add('lximg', function(editor) {
            register(editor);
            register$1(editor);
            register$2(editor);
            register$3(editor);
        })
    }
    Plugin()
}())
