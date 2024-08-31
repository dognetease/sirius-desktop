/*
 *  统一配置获取dom结构
 *  根据配置文件，动态生成Form表单
 */
import React, { useEffect, useState, useContext } from 'react';
import { Form, Space, Radio, Checkbox } from 'antd';
import { ReactComponent as ComLogo } from '@/images/icons/edm/logo.svg';
import { ReactComponent as User } from '@/images/icons/edm/user.svg';
import { ReactComponent as AdminIcon } from '@/images/icons/edm/admin.svg';
import { ReactComponent as DeleteIcon } from '@/images/icons/edm/deleteIconBig.svg';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { customerBaseKey } from 'api';
import * as allComs from './Components/index';
const { Option } = allComs.Select;
import style from './FormComponents.module.scss';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
/**
 * @param list
 * @param multiple
 * @param radioWrap
 *
 */
interface ComsProps {
  list: any;
  companyId?: string; // 校验公司名称需要
  multiple?: boolean;
  radioWrap?: boolean;
  radioValue?: number;
  checkValue?: boolean;
  isEditMainContact?: boolean; // 是否编辑主联系人
  onRadioChange?: (param) => void; // checkbox和radio 公用事件
  className?: string;
}
const FormComponents = ({ list, radioValue, onRadioChange, isEditMainContact, checkValue, companyId, className }: ComsProps) => {
  const baseSelect = useAppSelector(state => state.customerReducer.baseSelect);
  console.log('xxxxbaseSelectist-item', baseSelect);
  /*
   *   form.item 配置
   */
  const formItemLayout = (item, level1Field?, level1Index?: number) => {
    let layout = {} as any;
    if (level1Field) {
      if (item.type === 'Complex') {
        if (item.name === 'contact_name_box') {
          layout['label'] = `${item.label}${level1Field.name + 1}`;
        } else {
          layout['label'] = item.label;
        }
      } else {
        const defaultLaylout = ['name', 'label'];
        Object.keys(item).forEach(key => {
          if (defaultLaylout.includes(key)) {
            // form.list name 值需要特殊处理
            if (key === 'name') {
              let layoutName = [level1Field.name, item[key]];
              let layoutFieldKey = [level1Field.fieldKey, item[key]];
              layout[key] = layoutName;
              layout['fieldKey'] = layoutFieldKey;
            } else {
              layout[key] = `${item[key]}`;
            }
          }
          if (item?.ruleType) {
            layout['rules'] = [{ required: item.required, message: item.message, type: item?.ruleType }];
          } else {
            layout['rules'] = [{ required: item.required, message: item.message }];
          }
          layout['validateTrigger'] = ['onBlur', 'onChange'];
          if (item.asyncCheck) {
            let isError = (item?.errArrMap || []).some(child => child.row === level1Index && child.col === 0);
            layout['rules'].push({
              validator: (_, value: string) => {
                console.log('xxxlevel1Index', level1Index, item);
                return item.asyncCheck(value, item, isError);
              },
              validateTrigger: 'onBlur',
            });
          }
        });
      }
    } else {
      if (item.type !== 'Complex') {
        const defaultLaylout = ['name', 'label'];
        Object.keys(item).forEach(key => {
          if (defaultLaylout.includes(key)) {
            layout[key] = item[key];
          }
        });
        layout['rules'] = [{ required: item.required, message: item.message }];
        if (item.asyncCheck) {
          layout['validateTrigger'] = ['onBlur', 'onChange'];
          layout['rules'].push({
            validator: (_, value: string) => {
              return item.asyncCheck(value, item);
            },
            validateTrigger: 'onBlur',
          });
        }
      } else {
        layout['label'] = item.label;
        layout['required'] = item.required;
      }
    }
    // 配置名称校验规则
    if (item.name === 'company_name' && item.required) {
      layout['validateTrigger'] = ['onBlur', 'onChange'];
      layout['rules'] = [{ required: item.required, message: item.message }];
      if (item.asyncCheck) {
        layout['validateTrigger'] = ['onBlur', 'onChange'];
        layout['rules'].push({
          validator: (_, value: string) => {
            return item.asyncCheck(value, item);
          },
          validateTrigger: 'onBlur',
        });
      }
      // layout['rules'] = [
      //     { required: item.required, message: item.message },
      //     {
      //         validator: (_, value: string) =>  {
      //             return item.asyncCheck(value, item);
      //         },
      //         validateTrigger: 'onBlur'
      //     }
      // ]
    }
    if (item.normFile) {
      layout['getValueFromEvent'] = item.normFile;
    }
    return layout;
  };
  /*
   *   component 配置
   */
  const componentLayout = item => {
    let layout = {} as any;
    if (item.maxLength) {
      layout['maxLength'] = item.maxLength;
    }
    if (item.placeholder) {
      layout['placeholder'] = item.placeholder;
    }
    if (item.width) {
      layout['style'] = { width: 252 };
    }
    if (item.mode) {
      layout['mode'] = item.mode;
    }
    // option 下拉选项优于具体的配置
    // if (item.options) {
    //     layout['options'] = item.options;
    // }
    if (item.onSearch) {
      layout['onSearch'] = item.onSearch;
      layout['showSearch'] = true;
      layout['options'] = item.options;
    }
    if (item.className) {
      layout['className'] = item.className;
    }
    if (item.mode === 'multiple') {
      layout['optionFilterProp'] = 'children';
    }
    console.log('xxx-layout', layout);
    return layout;
  };
  const renderItem = (item, index, level1Field?, level1Index?, remove?) => {
    let Component = allComs[item.type];
    // select
    if (item.type === 'Select') {
      return (
        <Component {...componentLayout(item)}>
          {item.options && item.options.length
            ? item.options.map((el, elIndex) => {
                return (
                  <Option key={elIndex} value={el.value}>
                    {' '}
                    {el.label}
                  </Option>
                );
              })
            : baseSelect &&
              baseSelect[item.selectField as customerBaseKey] &&
              baseSelect[item.selectField as customerBaseKey].map((el, elIndex) => {
                return (
                  <Option key={elIndex} value={el.value}>
                    {' '}
                    {el.label}
                  </Option>
                );
              })}
        </Component>
      );
    }
    // ClientSelect
    if (item.type === 'ClientSelect') {
      return <Component item={item} />;
    }
    // tags
    if (item.type === 'Tags') {
      return <Component labeltype={item.labelType} placeholder={item.placeholder} />;
    }
    // CascaserArea
    if (item.type === 'CascaserArea') {
      return <Component {...componentLayout(item)} />;
    }
    // Input
    if (item.type === 'Input') {
      return <Component {...componentLayout(item)} />;
    }
    // Upload
    if (item.type === 'Upload') {
      return <Component {...level1Field} />;
    }
    if (item.type === 'Complex') {
      return (
        <Space key={index} style={{ alignItems: 'center', position: 'relative' }} align="baseline">
          {item.children.map((childItem, childIndex) => {
            if (childItem.type === 'Upload') {
              let uploadLayout = {};
              // form-list
              if (level1Field) {
                uploadLayout = {
                  key: childIndex,
                  name: childItem.name,
                  level1Fieldname: level1Field.name,
                  fieldKey: level1Field.fieldKey,
                  isFormList: true,
                  Logo: User,
                };
              } else {
                uploadLayout = {
                  key: childIndex,
                  name: childItem.name,
                  isFormList: false,
                  Logo: ComLogo,
                };
              }
              return renderItem(childItem, childIndex, {
                ...uploadLayout,
              });
            } else {
              if (level1Field) {
                return (
                  <Form.Item {...formItemLayout(childItem, level1Field)} key={childIndex} className={`form-item-${childItem.name}`} noStyle>
                    {renderItem(childItem, childIndex)}
                  </Form.Item>
                );
              } else {
                return (
                  <Form.Item {...formItemLayout(childItem)} key={childIndex} className={`form-item-${childItem.name}`} noStyle>
                    {renderItem(childItem, childIndex)}
                  </Form.Item>
                );
              }
            }
          })}
        </Space>
      );
    }
    // TextArea
    if (item.type === 'TextArea') {
      return <Component maxLength={item.maxLength} placeholder={item.placeholder} />;
    }
    // Cascader
    if (item.type === 'Cascader') {
      return (
        <Component
          suffixIcon={<DownTriangle />}
          placement="bottomLeft"
          getPopupContainer={triggerNode => triggerNode.parentNode}
          options={baseSelect[item.selectField as customerBaseKey]}
          placeholder={item.placeholder}
        />
      );
    }
    // DatePicker
    if (item.type === 'DatePicker') {
      return (
        <Component
          key={index}
          style={{ width: '100%' }}
          format={item.dateFormat}
          dropdownClassName="edm-date-picker-dropdown-wrap"
          getPopupContainer={triggerNode => triggerNode.parentNode}
          placeholder={item.placeholder}
        />
      );
    }
    if (item.type === 'PicturesWall') {
      let picturesLayout = {
        ...level1Field,
        key: index,
        name: item.name,
        label: item.label,
      };
      return <Component {...picturesLayout} />;
    }
    // SocialPlatform
    if (item.type === 'SocialPlatform') {
      const getConfig = () => {
        if (level1Field) {
          return {
            key: index,
            firstName: level1Field.name,
            level1Index: level1Index,
            name: item.name,
            label: item.label,
            selectField: item.selectField,
            item: item,
          };
        } else {
          return {
            key: index,
            name: item.name,
            label: item.label,
            selectField: item.selectField,
            item: item,
            noWrap: true,
          };
        }
      };
      return <Component {...getConfig()} />;
    }
    // Telephones
    if (item.type === 'Telephones') {
      return <Component key={index} firstName={level1Field.name} level1Index={level1Index} item={item} name={item.name} label={item.label} />;
    }
    if (item.type === 'Radio') {
      return (
        <div key={index}>
          {item.isCheckBox ? (
            <Checkbox checked={checkValue} disabled={isEditMainContact} onChange={onRadioChange}>
              {getIn18Text('SHEZHIZHUYAOLIANXIREN')} <AdminIcon />{' '}
            </Checkbox>
          ) : (
            <Radio value={Number(level1Field.key)}>
              {getIn18Text('SHEZHIZHUYAOLIANXIREN')} <AdminIcon />
            </Radio>
          )}
          {level1Index !== 0 && (
            <div onClick={() => remove(level1Field.name)} className={style.contactDelete}>
              {' '}
              <DeleteIcon /> <span>{getIn18Text('SHANCHU')}</span>
            </div>
          )}
        </div>
      );
    }
    // 其它组件
    return <Component maxLength={item.maxLength} placeholder={item.placeholder} />;
  };
  const rednerFormItem = (configList, level1Field?, level1Index?, remove?) => {
    const renderList = configList.map((item, index) => {
      /*
       * 图片组件内部已经包含form.item
       */
      if (item.type === 'PicturesWall') {
        if (level1Field) {
          let wallConfig = {
            isFormList: true,
            level1Fieldname: level1Field.name,
            fieldKey: level1Field.fieldKey,
          };
          return renderItem(item, index, wallConfig);
        } else {
          return renderItem(item, index);
        }
      }
      if (item.type === 'Upload' || item.type === 'ClientSelect') {
        return renderItem(item, index);
      }
      if (item.type === 'Telephones' || item.type === 'SocialPlatform') {
        return renderItem(item, index, level1Field, level1Index);
      }
      if (item.type === 'Radio') {
        return renderItem(item, index, level1Field, level1Index, remove);
      }
      return (
        <Form.Item key={item.name} className={`form-item-${item.name}`} {...formItemLayout(item, level1Field, level1Index)}>
          {renderItem(item, index, level1Field)}
        </Form.Item>
      );
    });
    console.log('xxx-renderList', renderList);
    if (level1Field) {
      return (
        <div key={level1Index} className={`${style.contactItemCard} ${'contactItemScrollCard'}`}>
          {renderList}
        </div>
      );
    }
    return renderList;
  };
  const [formListFiled, setFormListFiled] = useState<string>('');
  const [configList, setConfigList] = useState<any>([]);
  useEffect(() => {
    if (list && list.constructor === Object && list.type === 'contactWrap') {
      const { name, children } = list;
      setFormListFiled(name);
      let newList = children.filter(item => item.type === 'Input');
      setConfigList(children);
    } else {
      setConfigList(list);
    }
  }, [list]);
  // 外层包裹一层
  if (formListFiled) {
    return (
      <div className={`${style.formComponentsWrap}`}>
        <Radio.Group onChange={onRadioChange} value={radioValue}>
          <Form.List name={formListFiled}>
            {(level1Fields, { add, remove }) => <>{level1Fields.map((level1Field, level1Index) => rednerFormItem(configList, level1Field, level1Index, remove))}</>}
          </Form.List>
        </Radio.Group>
      </div>
    );
  } else {
    return <div className={`${style.formComponentsWrap} ${className}`}>{rednerFormItem(configList)}</div>;
  }
};
export default FormComponents;
