import React, { useState, useEffect } from 'react';
import { Select, SelectProps, TagProps } from 'antd';
import { throttle, debounce, divide } from 'lodash';
import { apiHolder, apis, MailEntryModel, CustomerApi, SystemApi, ContactApi, MailConfApi, ContactModel, MailApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import removeIcon from '@/images/icons/close_modal.svg';
const RemoveIcon = ({ size = 8 }) => <img src={removeIcon} width={size} height={size} />;
interface ComsProps extends SelectProps<string[]> {
  onChange: (param: string[]) => void;
  labeltype: number;
}
// label_type  客户是0  联系人是1
const Tags: React.FC<ComsProps> = props => {
  const { children, ...restProps } = props;
  console.log('tags-props', props);
  const [labelList, setLabelList] = useState<string[]>([]);
  /**
   * 更改和添加tag相关操作
   */
  const handleTagsSearch = tag => {
    console.log('搜素tag', tag);
    getLabelList(tag);
  };
  const tagOnfocus = () => {
    getLabelList();
  };
  const handleTagsChange = tags => {
    console.log('tags-change', tags);
    props.onChange(tags);
    if (tags.length === 0 && labelList.length === 0) {
      getLabelList();
    }
  };
  const getLabelList = (tags?: string) => {
    const param = {
      key: tags,
      label_type: props.labeltype,
    };
    clientApi.getLabelList(param).then(res => {
      const label = res.map(item => item.label_name).slice(0, 50); // 默认截图最大的50个
      setLabelList(label);
    });
  };
  // 默认加载标签
  useEffect(() => {
    getLabelList();
  }, [props.labeltype]);
  return (
    <Select
      {...restProps}
      removeIcon={<RemoveIcon />}
      dropdownClassName="edm-selector-dropdown"
      mode="tags"
      getPopupContainer={triggerNode => triggerNode.parentNode}
      onFocus={() => tagOnfocus}
      onChange={handleTagsChange}
      onSearch={throttle(handleTagsSearch, 1000)}
      value={props.value}
    >
      {labelList.map((item, index) => {
        return (
          <Select.Option key={index} value={item}>
            {item}
          </Select.Option>
        );
      })}
    </Select>
  );
};
export default Tags;
