
var wrapper = function(editor, content) {
  var $ = tinymce.dom.DomQuery;
  var Styles = tinymce.html.Styles;
  var DOMUtils = tinymce.dom.DOMUtils;
  var Tools = tinymce.util.Tools.resolve('tinymce.util.Tools');
  var fontSizes = Tools.explode('xx-small,small,medium,large,x-large,xx-large,300%');
  // font 标签 在修改字体颜色的时候不成功
  // <font color="xxx"> 这种颜色是用color属性控制的而非style
  var dealFont = function () {
    var domparser = new DOMParser();
    var serializer = new XMLSerializer();
    contentDoc = domparser.parseFromString(content, 'text/html');
    var DOM = DOMUtils(contentDoc);
    var fonts = $('font', contentDoc);
    var styles = Styles();
    fonts.each(function (index, node) {
      var props = styles.parse(node.getAttribute('style'));
      var color = node.getAttribute('color');
      var face = node.getAttribute('face');
      var size = node.getAttribute('size');
      if (color) {
          props.color = color;
      }
      if (face) {
          props['font-family'] = face;
      }
      if (size) {
          props['font-size'] = fontSizes[parseInt(node.getAttribute('size'), 10) - 1];
      }
      DOM.removeAllAttribs(node);
      node.setAttribute('style', styles.serialize(props));
      DOM.rename(node, 'span');
    })
    return serializer.serializeToString(contentDoc);
  }
  content = dealFont();
  return content;
}
// 在 setcontent 时调用 对邮件进行初始化处理
var formatContent = function (editor, content) {
  console.log('cuistomjscuistomjscuistomjscuistomjs', editor);
  // ! 下面一行做特殊case QIYE163-24522 处理，某封特殊邮件 里面有一个样式是  height: 100vh; 导致高度无限增加，此处用100%代替100vh
  var content = content.replaceAll('100vh', '100%');
  // var content = content.replaceAll('\n', '<br>');
  var content = wrapper(editor, content);
  return content;
}