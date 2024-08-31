import { apiHolder, getIn18Text } from 'api';
import classnames from 'classnames';
import React, { useState, useEffect, useRef } from 'react';
import { api, apis, InsertWhatsAppApi, WaOrgKeyword, WaOrgKeywordTriggerType } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Drawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { TongyongShanchu } from '@sirius/icons';
import style from './index.module.scss';
import cls from 'classnames';
import EmptyImg from './icons/empty.png';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';

const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

export const SensitiveWordSetting = (props: { visible: boolean; onClose: () => void }) => {
  const { visible, onClose } = props;
  const [type, setType] = useState<WaOrgKeywordTriggerType>('ALL');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<WaOrgKeyword[]>([]);
  const isWindows = systemApi.isElectron() && !isMac;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const submittable = !!keyword.trim().length;

  const fetchList = ({ showLoading = true } = {}) => {
    showLoading && setLoading(true);
    whatsAppApi
      .getKeywordList()
      .then(res => {
        setList(res.content);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAddClick = () => {
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    });
  };

  const add = () => {
    if (!submittable) {
      SiriusMessage.error(getIn18Text('MINGANCIBUNENGWEIKONG'));
      return;
    }
    whatsAppApi.addKeyword({ keyword, triggerType: type }).then(() => {
      SiriusMessage.success(getIn18Text('TIANJIACHENGGONG'));
      setKeyword('');
      fetchList({ showLoading: false });
    });
  };

  const deleteKeyword = (id: string) => {
    setLoading(true);
    setKeyword('');
    setEditing(false);
    whatsAppApi
      .deleteKeyword(id)
      .then(() => {
        SiriusMessage.success(getIn18Text('SHANCHUCHENGGONG'));
        fetchList();
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchList();
  }, []);

  const listFiltered = list.filter(item => item.triggerType === type);

  return (
    <Drawer
      title={getIn18Text('MINGANCI')}
      visible={visible}
      closable
      onClose={onClose}
      width={504}
      className={cls(style.keywordDrawer, {
        [style.desktop]: isWindows,
      })}
      mask={false}
      getContainer={false}
      style={{ position: 'absolute' }}
    >
      <Tabs
        className={style.tabs}
        activeKey={type}
        onChange={type => {
          setType(type as WaOrgKeywordTriggerType);
          setKeyword('');
          setEditing(false);
        }}
      >
        <Tabs.TabPane key="ALL" tab="收发会话" />
        <Tabs.TabPane key="RECEIVE" tab="收会话" />
        <Tabs.TabPane key="SEND" tab="发会话" />
      </Tabs>
      {loading ? (
        <div className={style.loadingWrapper}>
          <LoadingOutlined style={{ fontSize: 24 }} spin />
        </div>
      ) : (
        <>
          {!listFiltered.length && !editing && (
            <div className={style.emptyWrapper}>
              <img className={style.emptyImg} src={EmptyImg} />
              <div className={style.emptyDesc}>
                支持多语种设置敏感词
                <br />
                往来信息收发敏感词监测
              </div>
              <Button btnType="primary" onClick={handleAddClick}>
                添加敏感词
              </Button>
            </div>
          )}
          <div className={style.keywordList}>
            {listFiltered.map(item => (
              <div key={item.id} className={style.keywordItem}>
                <span className={style.itemName} title={item.keyword}>
                  {item.keyword}
                </span>
                <span className={style.actions}>
                  <TongyongShanchu wrapClassName={classnames('wmzz', style.actionIcon)} onClick={() => deleteKeyword(item.id)} />
                </span>
              </div>
            ))}
          </div>
          {(listFiltered.length || editing) && (
            <div className={style.footer}>
              {editing ? (
                <div className={style.editor}>
                  <Input
                    ref={inputRef}
                    allowClear
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder={getIn18Text('QINGSHURUMINGANCI')}
                    onPressEnter={() => submittable && add()}
                  />
                  <Button
                    type="button"
                    btnType="minorLine"
                    onClick={() => {
                      setKeyword('');
                      setEditing(false);
                    }}
                  >
                    {getIn18Text('QUXIAO')}
                  </Button>
                  <Button type="button" btnType="primary" disabled={!submittable} onClick={add}>
                    {getIn18Text('QUEREN')}
                  </Button>
                </div>
              ) : (
                <div className={style.add}>
                  <Button className={style.addKeyword} onClick={handleAddClick}>
                    添加敏感词
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
};
