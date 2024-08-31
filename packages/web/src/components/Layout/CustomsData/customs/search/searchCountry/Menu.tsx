import React, { useCallback, useEffect } from 'react';
import { resCustomsStateCountry as countryItemType } from 'api';
import { CustomsCtx } from '../search';
import MenuItem from './MenuItem';
import { TreeNode } from './type';
import { Checkbox, Form, Select } from 'antd';
import styles from '../search.module.scss';
import { hasChildChecked, hasParentChecked } from './utils';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { getIn18Text } from 'api';
interface IProps {
  value: string[];
}
interface RowListProps {
  item: TreeNode[];
}
const RowList = (props: RowListProps) => {
  const { item } = props;
  const customCtx = React.useContext(CustomsCtx);
  const { value = [], handleSelectChange, flattenData, drawerForm, menuData, changeStatus } = customCtx;
  // const indeterminate = !checked && hasChildChecked(item, value);
  console.log('RowList-item: ', value, flattenData);
  const handleRegionChange = useCallback((event: CheckboxChangeEvent, item: TreeNode) => {
    const { checked } = event.target;
    handleSelectChange && handleSelectChange(item, checked);
    menuData?.[0]?.forEach(it => {
      if (it.code === item.code) {
        it?.countries?.forEach(x => {
          x.showBox = checked;
        });
      }
    });
  }, []);
  const handleOtherSelect = useCallback(
    (value: string) => {
      const curNode = flattenData.find(item => item.code === value) as TreeNode;
      handleSelectChange && handleSelectChange(curNode, true);
    },
    [flattenData]
  );
  const handleDeselect = useCallback(
    (value: string) => {
      const curNode = flattenData.find(item => item.code === value) as TreeNode;
      handleSelectChange && handleSelectChange(curNode, false);
    },
    [flattenData]
  );
  const handleOtherRegion = (event: CheckboxChangeEvent, node: TreeNode) => {
    const { checked } = event.target;
    handleSelectChange && handleSelectChange(node, checked);
    const otherCode = item.find(item => item.code === getIn18Text('QITAGUOJIADEQU'))?.countries?.map(m => m.code);
    if (checked) drawerForm.setFieldsValue({ otherCountry: otherCode });
    else drawerForm.setFieldsValue({ otherCountry: [] });
  };
  const handleClear = () => {
    const node = flattenData.find(f => f.code === getIn18Text('QITAGUOJIADEQU')) as TreeNode;
    handleSelectChange && handleSelectChange(node, false);
  };
  return (
    <div>
      {item
        .filter(item => item.code !== getIn18Text('QITAGUOJIADEQU'))
        .map((node: TreeNode) => {
          const checked = hasParentChecked(node, value);
          const indeterminate = !checked && hasChildChecked(node, value);
          return (
            <div className={styles.rowList}>
              <Checkbox
                className={styles.checkAll}
                checked={checked}
                indeterminate={indeterminate}
                onChange={e => {
                  handleRegionChange(e, node);
                  changeStatus();
                }}
              >
                {node.label}
              </Checkbox>
              <MenuItem node={node} />
            </div>
          );
        })}
      {item
        .filter(item => item.code === getIn18Text('QITAGUOJIADEQU'))
        .map((node: TreeNode) => {
          const checked = hasParentChecked(node, value);
          const indeterminate = !checked && hasChildChecked(node, value);
          return (
            <div className={styles.rowList}>
              <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                onChange={e => {
                  handleOtherRegion(e, node);
                  changeStatus();
                }}
              >
                {node.label}
              </Checkbox>
              <Form.Item name="otherCountry">
                <Select
                  maxTagCount={'responsive'}
                  mode="multiple"
                  showSearch
                  showArrow
                  allowClear={false}
                  optionFilterProp={'children'}
                  style={{ width: 190, verticalAlign: 'top' }}
                  placeholder={getIn18Text('QUANBUQITAGUOJIADEQU')}
                  onSelect={handleOtherSelect}
                  onDeselect={handleDeselect}
                  onClear={handleClear}
                >
                  {node.countries &&
                    node.countries.map((item, index) => {
                      return (
                        <Select.Option key={index} value={item.code}>
                          {item.label}
                        </Select.Option>
                      );
                    })}
                </Select>
              </Form.Item>
            </div>
          );
        })}
    </div>
  );
};
export const Menu = (props: IProps) => {
  const countryCtx = React.useContext(CustomsCtx);
  const { menuData } = countryCtx;
  return (
    <div className="menu-wrap">
      {menuData.map(item => {
        return <RowList item={item} />;
      })}
    </div>
  );
};
