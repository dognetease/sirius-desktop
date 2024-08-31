import { Input, Space, Checkbox, Col, Row, Tooltip } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { ReactComponent as IconAdd } from '@/images/icons/edm/template-group-add.svg';
import { ReactComponent as IconManage } from '@/images/icons/edm/template-group-manage.svg';
import { ReactComponent as IconWarn } from '@/images/icons/edm/icon_warning-red.svg';
import classes from './multiSelectContent.module.scss';
import classname from 'classnames';
import { getIn18Text } from 'api';
interface Props {
  // 可选数组
  dataList: any[];
  // 选中id数组
  selectedIds: (number | string)[];
  // 选中内容变化
  onCheckedChange: (selection: any) => void;
  // 左下方按钮
  createItems: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  // 右下方按钮
  manageItems: () => void;
  // 确认新建
  addItems: (name: string) => void;
  // 取消新建
  addCancel: () => void;
  // 错误提示信息
  errorMessage?: string;
  // 新建默认id
  createGroupId?: number | string;
  // 是否隐藏checkbox
  hideCheckbox?: boolean;
  // 操作权限
  permisson?: boolean;
  // 最大输入长度
  maxLength?: number;
  // 父组件类型拼音
  typePinyin?: string;
}
const MultiSelectContent: React.FC<Props> = ({
  dataList,
  selectedIds,
  onCheckedChange,
  createItems,
  manageItems,
  addItems,
  addCancel,
  errorMessage,
  createGroupId,
  hideCheckbox,
  permisson = true,
  maxLength = 12,
  typePinyin = 'FENZU',
}) => {
  const [totalList, setTotalList] = useState<any[]>([]);
  const [addName, setAddName] = useState<string>('');
  const inputRef = useRef(null);
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddName(event.target.value || '');
  };

  const beforeAddItems = () => {
    addItems(addName);
    setAddName('');
  };

  useEffect(() => {
    setTotalList(dataList);
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 0);
  }, [dataList]);

  return (
    <div className={classname(classes.group, hideCheckbox ? classes.groupHide : {})}>
      <Checkbox.Group onChange={onCheckedChange} value={selectedIds}>
        <Row className={classes.items}>
          {totalList.length <= 0 ? (
            <div className={classes.empty}>
              {getIn18Text(`ZANWU${typePinyin}`)}
              {permisson && (
                <>
                  ,&nbsp;
                  <span className={classes.create} onClick={createItems}>
                    {getIn18Text('LIJIXINZENG')}
                  </span>
                </>
              )}
            </div>
          ) : (
            totalList.map(item => {
              return (
                <Col key={item.id} span={24}>
                  {item.id !== createGroupId ? (
                    <div className={classes.item}>
                      <Checkbox
                        key={item.id}
                        value={item.id}
                        style={{ display: 'block', margin: '0' }}
                        disabled={selectedIds.length === 10 && !selectedIds.includes(item.id as number)}
                      >
                        <Tooltip title={item.name.length > 10 ? item.name : ''}>{item.name}</Tooltip>
                      </Checkbox>
                    </div>
                  ) : (
                    <Input.Group compact>
                      <div onClick={e => e.stopPropagation()}>
                        <Input
                          style={{ width: '100%' }}
                          ref={inputRef}
                          placeholder={getIn18Text(`QINGSHURU${typePinyin}MINGCHENG`)}
                          value={addName}
                          maxLength={maxLength}
                          onChange={onNameChange}
                          suffix={
                            <>
                              <span className={classes.inputBtn} style={{ marginRight: '12px' }} onClick={() => beforeAddItems()}>
                                {getIn18Text('QUEDING')}
                              </span>
                              <span className={classes.inputBtn} onClick={addCancel}>
                                {getIn18Text('QUXIAO')}
                              </span>
                            </>
                          }
                        />
                      </div>
                    </Input.Group>
                  )}
                </Col>
              );
            })
          )}
        </Row>
      </Checkbox.Group>
      {permisson && (
        <Space className={classes.footer}>
          <span className={classes.btns} onClick={createItems}>
            <IconAdd className={classes.svg} />
            {getIn18Text(`XINZENG${typePinyin}`)}
          </span>
          <span
            className={classes.btns}
            style={{ color: totalList.filter(item => item.id !== createGroupId).length === 0 ? '#C0C8D6' : '#232D47' }}
            onClick={() => {
              totalList.filter(item => item.id !== createGroupId).length > 0 && manageItems();
            }}
          >
            <IconManage className={classes.svg} />
            {getIn18Text(`GUANLI${typePinyin}`)}
          </span>
        </Space>
      )}
      <div className={classes.err}>
        {errorMessage && (
          <div className={classes.errText}>
            <IconWarn style={{ marginRight: '4px' }} /> {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectContent;
