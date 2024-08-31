import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Select, Tree, Input, Space } from 'antd';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import _ from 'lodash';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import style from './index.module.scss';
import { getIn18Text } from 'api';

function flattenMyTree(tree: any) {
  function recurse(nodes: any, path: any): any {
    return _.map(nodes, function (node) {
      var newPath = _.union(path, [node.name]);
      return [_.assign({ pathname: newPath.join(' > '), level: path.length }, _.omit(node, 'children')), recurse(node.children, newPath)];
    });
  }
  return _.flattenDeep(recurse(tree, []));
}

interface Node {
  key: string;
  label: string;
  value: string;
  parentValue?: string;
  children?: Node[];
}
interface Props {
  value: string[];
  dataSource: any;
  updateFields: (values: any) => void;
}

const AreaSelect = (props: Props) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const [searchValue, setSearchValue] = useState('');
  const [area, setArea] = useState<string>();
  const dataSource = useMemo(() => {
    const newVal = _.cloneDeep(props.dataSource);
    function loop(root: any) {
      root.forEach((item: Node) => {
        const value = item.key;
        item.key = _.uniqueId();
        if (item.children) {
          item.children.forEach(subItem => {
            subItem.parentValue = item.key;
          });
          loop(item.children);
        }
      });
    }
    loop(newVal);
    return newVal;
  }, [props.dataSource]);
  const dataList = useMemo(() => {
    return flattenMyTree(dataSource);
  }, [dataSource]);

  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const onExpand = (newExpandedKeys: any) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onChange = (e: any) => {
    const { value } = e.target;
    const newExpandedKeys = dataList
      .map((item: any) => {
        if (item.label.indexOf(value) > -1) {
          return item.parentValue;
        }

        return null;
      })
      .filter((item, i, self) => item && self.indexOf(item) === i);
    setExpandedKeys(newExpandedKeys);
    setSearchValue(value);
    setAutoExpandParent(true);
    if (!value) {
      setExpandedKeys([]);
    }
  };
  const onSelect = (selectedKeys: any) => {
    setSelectedKeys(selectedKeys);
    const id = selectedKeys[0];
    const getNode = (root: Node[] | undefined, path: string[] = []) => {
      if (!root) {
        return;
      }
      for (let i = 0; i < root.length; i++) {
        path.push(root[i].label);
        if (root[i].key === id) {
          return {
            value: root[i].label,
            path,
          };
        } else if (root[i].children) {
          const result = getNode(root[i].children, path) as string;
          if (result) {
            return result;
          } else {
            path.pop();
          }
        } else {
          path.pop();
        }
      }
    };

    const { value, path } = getNode(dataSource) as { value: string; path: string[] };
    console.log('yao_value', value);
    console.log('yao_path', path);
    setArea(value);

    props.updateFields({ area: path });
    // @ts-ignore
    selectRef.current && selectRef.current.blur();
  };
  const onClear = () => {
    setArea('');
    setSearchValue('');
    setExpandedKeys([]);
    setSelectedKeys([]);
    props.updateFields({ area: [] });
  };
  const treeData = useMemo(() => {
    const loop = (data: any) =>
      data
        .map((item: any) => {
          const strTitle = item?.label || '';
          // console.log('yao', item)
          const index = strTitle.indexOf(searchValue);
          const beforeStr = strTitle.substring(0, index);
          const afterStr = strTitle.slice(index + searchValue.length);
          const save = index > -1 || !searchValue;
          const title =
            index > -1 ? (
              <span>
                {beforeStr}
                <span className="site-tree-search-value">{searchValue}</span>
                {afterStr}
              </span>
            ) : (
              <span>{strTitle}</span>
            );

          if (Array.isArray(item.children) && item.children.length > 0) {
            const children = loop(item.children);
            return {
              title,
              key: item.key,
              save: save || children.length > 0 || children.save,
              children,
            };
          }

          return {
            title,
            save,
            key: item.key,
            children: [],
          };
        })
        .filter((item: any) => item.save);

    return loop(dataSource);
  }, [searchValue]);
  const selectRef = useRef(null);
  const treeRef = useRef(null);
  useEffect(() => {
    if (props.value && props.value.length > 0) {
      const tail = props.value[props.value.length - 1];
      setArea(tail);
      const getNode = (root: Node[] | undefined, path: string[]) => {
        const val = path.shift();
        const found = root?.find(item => item.label === val);
        if (found) {
          if (path.length) {
            const result = getNode(found.children, path) as Node;
            if (result) {
              return result;
            }
          } else {
            return found;
          }
        }
      };

      const node = getNode(dataSource, props.value.slice()) as Node;
      if (node) {
        setSelectedKeys(node.key);
      }
    }

    return () => {};
  }, [props.value]);

  return (
    <Select
      style={{
        width: '100%',
      }}
      value={area}
      allowClear
      onClear={onClear}
      placeholder={getIn18Text('QINGXUANZEGUOJIADEQU')}
      ref={selectRef}
      suffixIcon={<DownTriangle />}
      dropdownRender={menu => (
        <div className={style.dropdown}>
          <Space
            style={{
              width: '100%',
              padding: '12px 12px 0',
            }}
          >
            <Input
              style={{
                width: '100%',
              }}
              prefix={<SearchOutlined className="site-form-item-icon" />}
              placeholder={getIn18Text('QINGSHURUNEIRONG')}
              value={searchValue}
              onChange={onChange}
            />
          </Space>
          <Space
            style={{
              padding: 0,
            }}
          >
            <Tree
              // @ts-ignore
              treeRef={treeRef}
              onExpand={onExpand}
              selectedKeys={selectedKeys}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              treeData={treeData}
              onSelect={onSelect}
              height={233}
            />
          </Space>
        </div>
      )}
    ></Select>
  );
};

export default AreaSelect;
