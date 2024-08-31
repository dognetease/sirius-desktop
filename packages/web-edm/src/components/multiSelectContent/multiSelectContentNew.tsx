import { Input, Space, Checkbox, Col, Row, Tooltip, Modal } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { ReactComponent as IconAdd } from '@/images/icons/edm/template-group-add.svg';
import { ReactComponent as IconManage } from '@/images/icons/edm/template-group-manage.svg';
import { ReactComponent as IconWarn } from '@/images/icons/edm/icon_warning-red.svg';
import { ReactComponent as IconEdit } from '@/images/icons/edm/template-group-edit.svg';
import { ReactComponent as IconDelete } from '@/images/icons/edm/template-group-delete.svg';
import classes from './multiSelectContentNew.module.scss';
import classname from 'classnames';
import { ReactComponent as SelectedRightSvg } from '@/images/icons/edm/yingxiao/selected-right2.svg';
import { ReactComponent as IconManage2 } from '@/images/icons/edm/yingxiao/template-group-manage2.svg';
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
  //
  status?: 'create' | 'edit';
  saveAllEdit?: () => void;
  deleteItem: (item: any) => void;
  editItem: (item: any) => void;
  editId: number | string | undefined;
  editName: string;
  saveItem: (item: any) => void;
  onCancel: () => void;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isShow: boolean;
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
  status = 'create',
  saveAllEdit,
  deleteItem,
  editItem,
  editId,
  editName,
  saveItem,
  onCancel,
  onNameChange,
  isShow,
}) => {
  const [totalList, setTotalList] = useState<any[]>([]);
  const [addName, setAddName] = useState<string>('');
  const [checkedValue, setCheckedValue] = useState<any[]>([]);
  const [isFirst, setIsFirst] = useState<boolean>(true);
  const inputRef = useRef(null);
  const nameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'create') {
      setAddName(event.target.value || '');
    } else {
      onNameChange(event);
    }
  };

  const beforeAddItems = () => {
    addItems(addName);
    setAddName('');
  };

  const checkSelected = (id: any) => {
    return status === 'create' && checkedValue.includes(id);
  };

  const beforeDeleteItem = item => {
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUQUERENSHANCHU'),
      onOk: async () => {
        deleteItem(item);
      },
    });
  };

  useEffect(() => {
    setTotalList(dataList);
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 0);
  }, [dataList]);

  useEffect(() => {
    if (isShow && dataList.length > 0 && isFirst) {
      setCheckedValue([dataList[0].id]);
      onCheckedChange([dataList[0].id]);
      setIsFirst(false);
    }
  }, [isShow]);

  return (
    <div className={classname(classes.group, hideCheckbox ? classes.groupHide : {})}>
      {permisson && (
        <Space className={classes.footer}>
          <span className={classes.title}>{status === 'edit' ? getIn18Text('GUANLIBIANLIANG') : getIn18Text('XUANZEBIANLIANG')}</span>
          <div className={classes.btnsGroup}>
            {status === 'edit' ? (
              <>
                <span className={classes.btns} onClick={saveAllEdit}>
                  {getIn18Text('WANCHENG')}
                </span>
              </>
            ) : (
              <>
                <span className={classes.btns} onClick={createItems}>
                  <IconAdd className={classes.svg} />
                  {getIn18Text('XINZENG')}
                </span>
                <span
                  className={classes.btns}
                  style={{ color: totalList.filter(item => item.id !== createGroupId).length === 0 ? '#C0C8D6' : '#232D47' }}
                  onClick={() => {
                    totalList.filter(item => item.id !== createGroupId).length > 0 && manageItems();
                  }}
                >
                  {totalList.filter(item => item.id !== createGroupId).length === 0 ? <IconManage2 className={classes.svg} /> : <IconManage className={classes.svg} />}
                  {getIn18Text('GUANLI')}
                </span>
              </>
            )}
          </div>
        </Space>
      )}
      <Checkbox.Group
        onChange={valuse => {
          setCheckedValue(valuse);
          onCheckedChange(valuse);
        }}
        value={selectedIds}
      >
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
                  {(status === 'create' && item.id !== createGroupId) || (status === 'edit' && editId !== item.id) ? (
                    <div className={classname(classes.item, checkSelected(item.id) ? classes.itemSelect : '')}>
                      {
                        <>
                          <Checkbox
                            key={item.id}
                            value={item.id}
                            style={{ display: 'block', margin: '0' }}
                            disabled={selectedIds.length === 10 && !selectedIds.includes(item.id as number)}
                          >
                            <Tooltip title={item.name.length > 10 ? item.name : ''}>
                              <span style={{ color: checkSelected(item.id) ? '#4C6AFF' : '#545A6E' }}>{item.name}</span>
                            </Tooltip>
                          </Checkbox>
                          {checkSelected(item.id) && <SelectedRightSvg className={classes.icon} />}
                          {status === 'edit' && (
                            <div className={classes.btnsEdit}>
                              <IconEdit
                                className={classes.editIcon}
                                onClick={() => {
                                  editItem(item);
                                  setTimeout(() => {
                                    inputRef.current?.focus();
                                  }, 0);
                                }}
                              />
                              <IconDelete className={classes.deleteIcon} onClick={() => beforeDeleteItem(item)} />
                            </div>
                          )}
                        </>
                      }
                    </div>
                  ) : (
                    <Input.Group compact style={{ background: '#F2F5FF', padding: '3px 12px' }}>
                      <div onClick={e => e.stopPropagation()} style={{ width: '100%' }}>
                        <Input
                          style={{ width: 'calc(100% - 75px)' }}
                          ref={inputRef}
                          placeholder={getIn18Text(`QINGSHURU${typePinyin}MINGCHENG`)}
                          value={status === 'edit' ? editName : addName}
                          maxLength={maxLength}
                          onChange={nameChange}
                        />
                        <span style={{ marginLeft: '12px' }}>
                          {status === 'edit' ? (
                            <>
                              <span
                                className={classes.inputBtn}
                                style={{ marginRight: '12px' }}
                                onClick={() => {
                                  saveItem(item);
                                }}
                              >
                                {getIn18Text('QUEDING')}
                              </span>
                              <span className={classes.inputBtn} style={{ color: '#545A6E' }} onClick={onCancel}>
                                {getIn18Text('QUXIAO')}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={classes.inputBtn} style={{ marginRight: '12px' }} onClick={() => beforeAddItems()}>
                                {getIn18Text('QUEDING')}
                              </span>
                              <span className={classes.inputBtn} style={{ color: '#545A6E' }} onClick={addCancel}>
                                {getIn18Text('QUXIAO')}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </Input.Group>
                  )}
                </Col>
              );
            })
          )}
        </Row>
      </Checkbox.Group>
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
