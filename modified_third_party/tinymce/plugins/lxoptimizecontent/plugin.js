// 编辑器ai润色
(function() {
  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
  var getAction = function(editor) {
    return editor.getParam('aiWriteMailAction');
  };

  function registerCommand(editor) {
    editor.addCommand('optimizecontent', function(params) {
      var action = getAction(editor);
      var type = 'retouch';
      if (params && params.type) type = params.type;
      action && action(type);
    });
    editor.addCommand('attentionAction', function(itemApi, target) {
      var action = editor.getParam('AIWriteContentionShowAction');
      var targetRect = target.getBoundingClientRect()
      action && action({ left: targetRect.left - 200, top: targetRect.top + 40});
    });

    editor.on('changeCount', function(params) {
      var optimizemailUsed = document.querySelector('.ai-optimizemail-btn .used');
      var optimizemailTotal = document.querySelector('.ai-optimizemail-btn .total');

      var writemailUsed = document.querySelector('.ai-writemail-btn .used');
      var writemailTotal = document.querySelector('.ai-writemail-btn .total');

      if (params &&  params.used && optimizemailUsed) {
        optimizemailUsed.innerText = params.used
      }
      if (params && params.total && optimizemailTotal) {
        optimizemailTotal.innerText = params.total
      }

      if (params && params.used && writemailUsed) {
        writemailUsed.innerText = params.used
      }
      if (params && params.total && writemailTotal) {
        writemailTotal.innerText = params.total
      }
    })
  }

  function register(editor) {
    function exec(command) {
      return function(itemApi, target) {
        editor.execCommand(command, itemApi, target);
      };
    }
    editor.ui.registry.addButton('lxoptimizecontent', {
      text: 'AI optimize',
      tooltip: '',
      icon: 'aioptimizemail',
      classes: ['ai-optimizemail-btn', 'ai-text-color'],
      // beforeend: '<div class="ai-btn-text-count"><span class="used">10</span>/<span class="total">10</span></div>',
      beforeend: '<div style="font-size:10px;margin-left:2px;background: #3FDE9C;border-radius: 2px;height:14px;text-align:center;color:#fff;line-height:14px;width:28px;">限免</div>',
      onAction: exec('optimizecontent')
    });
    editor.ui.registry.addButton('lxAIWriteManual', {
      text: '',
      tooltip: '',
      icon: 'attention',
      classes: ['lxAIWriteManual'],
      onAction: exec('attentionAction')
    });
    editor.ui.registry.addMenuItem('lxcontextOptimize', {
      // icon: 'aioptimizemail',
      text: 'AI optimize',
      classes: ['ai-text-color'],
      onAction: function() {
          editor.execCommand('optimizecontent', { type: 'select' });
      }
    });
  }

  function plugin(params) {
    global.add('lxoptimizecontent', function(editor) {
      register(editor);
      registerCommand(editor);
    });
  }

  plugin();
})();
