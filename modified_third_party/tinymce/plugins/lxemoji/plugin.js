(function() {
    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    function insertContact(editor, emoji) {
        editor.insertContent(emoji);
        return;
    }
    
    var getInsertEmojiActionAction = function(editor) {
        return editor.getParam('insertEmojiAction')
    }

    function registerCommand(editor) {
        editor.addCommand('insertEmojiAction', function() {
            var emojiIcon = document.querySelector(".tox-toolbar__group .tox-tbtn[aria-label='插入表情']");
            if (!emojiIcon) {
                emojiIcon = document.querySelector(".tox-toolbar__group .tox-tbtn[aria-label='Insert emoji']");
            }
            var emojiIconPosition = emojiIcon && emojiIcon.getBoundingClientRect  ? emojiIcon.getBoundingClientRect(): null;
            var insertEmojiAction = getInsertEmojiActionAction(editor);
            const position = {
                top: emojiIconPosition.top + 50,
                bottom: emojiIconPosition.bottom - 50,
                left: emojiIconPosition.left - 92,
                right: emojiIconPosition.right + 92,
            };
            insertEmojiAction && insertEmojiAction(position, function(emoji) {
                insertContact(editor, emoji);
            });
        });
    }

    function register(editor) {
        function exec(command) {
            return function(emojiIconPosition, fn) {
                editor.execCommand(command, emojiIconPosition, fn)
            }
        }
        editor.ui.registry.addButton('lxemoji', {
            text: '',
            icon: 'lxemoji',
            tooltip: 'Insert emoji',
            onAction: exec('insertEmojiAction'),
        })
    }

    function plugin() {
        global.add('lxemoji', function(editor) {
            register(editor);
            registerCommand(editor);
        })
    }

    plugin()
})()