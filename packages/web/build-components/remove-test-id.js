'use strict';
exports.__esModule = true;
var ts = require('typescript');
function createRemoveTestIdTransformer() {
  var transfomer = function (context) {
    function isDataTestIdAttr(node) {
      if (node.kind === ts.SyntaxKind.JsxAttribute) {
        var fullText = node.getFullText();
        if (fullText && (fullText.indexOf('data-test-id=') === 0 || fullText.indexOf(`{{ 'data-test-id': `) === 0 || fullText.indexOf(`{{ 'data-test-id': `) === 0)) {
          // console.log('data-test-id=');
          return true;
        }
      }
      return false;
    }
    return function (sourceFile) {
      var visitNode = function (node) {
        if (ts.isJsxAttribute(node)) {
          if (isDataTestIdAttr(node)) {
            return undefined;
          }
        }
        return ts.visitEachChild(node, visitNode, context);
      };
      return ts.visitNode(sourceFile, visitNode);
    };
  };
  return transfomer;
}
module.exports = {
  createRemoveTestIdTransformer: createRemoveTestIdTransformer,
};
