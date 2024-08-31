/*
 * @Author: sunmingxin
 * @Date: 2021-10-08 17:59:17
 * @LastEditTime: 2021-10-25 21:56:08
 * @LastEditors: sunmingxin
 */
import React, { useState, useEffect, useContext } from 'react';
import { Select } from 'antd';
import { throttle } from 'lodash';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { clientContext } from '../../clientContext';
import removeIcon from '@/images/icons/close_modal.svg';
const RemoveIcon = ({ size = 8 }) => <img src={removeIcon} width={size} height={size} />;
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './mergeClientModal.module.scss';
import styles from '../../index.module.scss';
import { getIn18Text } from 'api';
export interface comsProps {
  visible: boolean;
  onCancel: (data: any) => void;
  companyIdList: string;
}
const AddLabelModal = (props: comsProps) => {
  const { visible, onCancel, companyIdList } = props;
  const [mainValue, setMainValue] = useState('');
  // const [labelList, setLabelList] = useState([]);
  const [labelList, setLabelList] = useState<string[]>([]);
  const [labelNameList, setLabelNameList] = useState<string[]>([]);
  const { state, dispatch, fetchTableData } = useContext(clientContext).value;
  const updateTableList = () => {
    fetchTableData();
  };
  const getLabelList = (tags?: string) => {
    const param = {
      key: tags,
      label_type: 0,
    };
    clientApi.getLabelList(param).then(res => {
      const label = res.map(item => item.label_name).slice(0, 50); // 默认截图最大的50个
      setLabelList(label);
    });
  };
  /**
   * 更改和添加tag
   */
  const handleTagsChange = tags => {
    console.log('tags', tags);
    setLabelNameList(tags);
    if (tags.length === 0 && labelList.length === 0) {
      getLabelList();
    }
  };
  /**
   * 搜索tag
   */
  const handleTagsSearch = tag => {
    console.log('搜素tag', tag);
    getLabelList(tag);
  };
  const tagOnfocus = () => {
    getLabelList();
  };
  /**
   * 页面初始化
   */
  useEffect(() => {
    // 默认选中第一个
  }, []);
  const formSubmit = () => {
    let params = {
      company_list: companyIdList,
      label_name_list: labelNameList.join(','),
    };
    clientApi.companyAddLabels(params).then(res => {
      console.log('标签添加成功', res);
      onCancel(true);
    });
    console.log('values-submit');
  };
  /**
   * 新建用户数据
   */
  return (
    <>
      <Modal
        className={style.addClientLableWrap}
        title={`批量添加标签`}
        width={532}
        bodyStyle={{ maxHeight: '481px' }}
        visible={visible}
        destroyOnClose={true}
        onCancel={onCancel}
        onOk={formSubmit}
      >
        <div className={style.modalContent}>
          <h1 className={style.title}>{getIn18Text('BIAOQIAN')}</h1>
          <Select
            mode="tags"
            showArrow={true}
            style={{ width: '100%' }}
            placeholder={getIn18Text('XUANZEBIAOQIAN')}
            dropdownClassName={styles.selectDropDown}
            onSearch={throttle(handleTagsSearch, 1000)}
            removeIcon={<RemoveIcon />}
            onFocus={tagOnfocus}
            onChange={handleTagsChange}
          >
            {labelList.map((item, index) => {
              return (
                <Select.Option key={index} value={item}>
                  {item}
                </Select.Option>
              );
            })}
          </Select>
        </div>
      </Modal>
    </>
  );
};
export default AddLabelModal;
