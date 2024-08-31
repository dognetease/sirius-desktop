/* eslint-disable array-callback-return */
/* eslint-disable no-nested-ternary */
import { isValidElement } from 'react';

function isImmutable(maybeImmutable) {
  return Boolean(maybeImmutable && maybeImmutable['@@__IMMUTABLE_ITERABLE__@@']) || Boolean(maybeImmutable && maybeImmutable['@@__IMMUTABLE_RECORD__@@']);
}

function isDefaultProp(defaultProps, key, value) {
  if (!defaultProps) {
    return false;
  }
  return defaultProps[key] === value;
}

function stringifyObject(object, opts) {
  let result;
  if (Array.isArray(object)) {
    result = object.map(item => stringifyObject(item));
  } else if (object && typeof object === 'object') {
    result = {};
    Object.keys(object).map(key => {
      let value = object[key];
      if (isValidElement(value)) {
        value = jsxToString(value, opts);
      } else if (Array.isArray(value)) {
        value = value.map(item => stringifyObject(item, opts));
      } else if (typeof value === 'object') {
        value = stringifyObject(value, opts);
      } else if (typeof value === 'function') {
        value = opts.useFunctionCode ? (opts.functionNameOnly ? value.name.toString() : value.toString()) : '...';
      }
      result[key] = value;
    });
  } else {
    result = object;
  }
  return result;
}

const _JSX_REGEXP = /"<.+>"/g;

function serializeItem(item, options, delimit = true) {
  let result;

  if (isImmutable(item)) {
    result = serializeItem(item.toJS(), options, delimit);
  } else if (typeof item === 'string') {
    result = delimit ? `'${item}'` : item;
  } else if (typeof item === 'number' || typeof item === 'boolean') {
    result = `${item}`;
  } else if (Array.isArray(item)) {
    const indentation = new Array((options.spacing || 0) + 1).join(' ');
    const delimiter = delimit ? ', ' : `\n${indentation}`;
    const items = item.map(i => serializeItem(i, options)).join(delimiter);
    result = delimit ? `[${items}]` : `${items}`;
  } else if (isValidElement(item)) {
    result = jsxToString(item, options);
  } else if (typeof item === 'object') {
    result = stringifyObject(item, options);
    result = result.replace ? result.replace(_JSX_REGEXP, match => match.slice(1, match.length - 1)) : '...';
  } else if (typeof item === 'function') {
    result = options.useFunctionCode ? (options.functionNameOnly ? item.name.toString() : item.toString()) : '...';
  }
  return result;
}

function jsxToString(component) {
  const componentData = {
    name: component?.type?.displayName || component?.type?.name || component?.type,
  };

  if (component.props) {
    componentData.props = Object.keys(component.props)
      .filter(key => key !== 'children' && !isDefaultProp(component.type.defaultProps, key, component.props[key]))
      .map(key => {
        let value = serializeItem(component.props[key], { key });
        if (typeof value !== 'string' || value[0] !== "'") {
          value = `{${value}}`;
        }
        const valueLines = value.split(/\r\n|\r|\n/);
        if (valueLines.length > 1) {
          value = valueLines.join('\n');
        }
        return `${key}=${value}`;
      })
      .join(' ');

    if (component.key) {
      componentData.props += `key='${component.key}'`;
    }

    if (componentData.props.length > 0) {
      componentData.props = ' ' + componentData.props;
    }
  }

  if (component?.props?.children) {
    if (Array.isArray(component.props.children)) {
      componentData.children = component.props.children
        .reduce((a, b) => a.concat(b), [])
        .filter(child => {
          if (child && !isValidElement(child)) {
            return true;
          }
          const childShouldBeRemoved = child && child.type;
          return childShouldBeRemoved;
        })
        .map(child => serializeItem(child, {}, false))
        .join('\n');
    } else {
      componentData.children = serializeItem(component.props.children, {}, false);
    }
    return (
      // eslint-disable-next-line max-len
      `<${typeof componentData.name === 'symbol' ? '' : componentData.name}${componentData.props}>${componentData.children}</${
        typeof componentData.name === 'symbol' ? '' : componentData.name
      }>`
    );
  }
  return `<${typeof componentData.name === 'symbol' ? '><' : componentData.name}${componentData.props}${typeof componentData.name === 'symbol' ? '' : ' '}/>`;
}

export default jsxToString;
