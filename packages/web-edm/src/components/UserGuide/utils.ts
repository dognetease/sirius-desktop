export const getStyleProperty = (element: HTMLElement & { currentStyle?: any }, propertyName: string, prefixVendor = false): string => {
  if (prefixVendor) {
    const prefixes = ['', '-webkit-', '-ms-', 'moz-', '-o-'];
    for (let counter = 0; counter < prefixes.length; counter++) {
      const prefixedProperty = prefixes[counter] + propertyName;
      const foundValue = getStyleProperty(element, prefixedProperty);

      if (foundValue) {
        return foundValue;
      }
    }
    return '';
  }
  let propertyValue = '';
  if (element.currentStyle) {
    propertyValue = element.currentStyle[propertyName];
  } else if (document.defaultView && document.defaultView.getComputedStyle) {
    propertyValue = document.defaultView.getComputedStyle(element, null).getPropertyValue(propertyName);
  }
  return propertyValue && propertyValue.toLowerCase ? propertyValue.toLowerCase() : propertyValue;
};

export function fixStackingContext(node: HTMLElement, fixPress: string) {
  let parentNode = node.parentNode as HTMLElement;
  while (parentNode) {
    if (!parentNode.tagName || parentNode.tagName.toLowerCase() === 'body') {
      break;
    }
    const zIndex = getStyleProperty(parentNode, 'z-index');
    const opacity = parseFloat(getStyleProperty(parentNode, 'opacity'));
    const transform = getStyleProperty(parentNode, 'transform', true);
    const transformStyle = getStyleProperty(parentNode, 'transform-style', true);
    const transformBox = getStyleProperty(parentNode, 'transform-box', true);
    const filter = getStyleProperty(parentNode, 'filter', true);
    const perspective = getStyleProperty(parentNode, 'perspective', true);

    // Stacking context gets disturbed if
    // - Parent has z-index
    // - Opacity is below 0
    // - Filter/transform or perspective is applied
    if (
      /[0-9]+/.test(zIndex) ||
      opacity < 1 ||
      (transform && transform !== 'none') ||
      (transformStyle && transformStyle !== 'flat') ||
      (transformBox && transformBox !== 'border-box') ||
      (filter && filter !== 'none') ||
      (perspective && perspective !== 'none')
    ) {
      parentNode.classList.add(fixPress);
    }

    parentNode = parentNode.parentNode as HTMLElement;
  }
}

export function getCalculatedPosition(node: HTMLElement) {
  const body = document.body;
  const documentElement = document.documentElement;
  const window = document.defaultView as Window;

  const scrollTop = window.pageYOffset || documentElement.scrollTop || body.scrollTop;
  const scrollLeft = window.pageXOffset || documentElement.scrollLeft || body.scrollLeft;
  const elementRect = node.getBoundingClientRect();

  return {
    top: elementRect.top + scrollTop,
    left: elementRect.left + scrollLeft,
    right: elementRect.left + scrollLeft + elementRect.width,
    bottom: elementRect.top + scrollTop + elementRect.height,
    width: elementRect.width,
    height: elementRect.height,
  };
}

export function canMakeRelative(node: HTMLElement) {
  const currentPosition = getStyleProperty(node, 'position');
  const avoidPositionsList = ['absolute', 'fixed', 'relative'];
  // Because if the element has any of these positions, making it
  // relative will break the UI
  return avoidPositionsList.indexOf(currentPosition) === -1;
}
