const traversalBr = (node: ChildNode) => {
  if (node && node.nodeType === 3) {
    if (node.nodeValue && node.nodeValue.replaceAll(' ', '').replaceAll('\n', '')) {
      node.nodeValue = node.nodeValue.replace(/\n/g, '<br />');
    }
  }
  let childNodes = node.childNodes;
  let item;
  for (let i = 0; i < childNodes.length; i++) {
    item = childNodes[i];
    if (!['STYLE', 'BODY', 'META', 'TITLE', 'LINK', 'BASE', 'SCRIPT'].includes(item.nodeName)) {
      traversalBr(item);
    }
  }
};
export default traversalBr;
