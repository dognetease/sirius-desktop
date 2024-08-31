import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, Button } from 'antd';
import type { UploadFile } from 'antd';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import { api, apis, InsertWhatsAppApi } from 'api';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { TongyongShanchu, TongyongShuomingXian } from '@sirius/icons';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import VirtualList from './virtualList/index';
import FilterModal from './filterModal';
import { GroupTab } from './tabs/groupTab';
import { TextTab } from './tabs/textTab';
import { UploadTab } from './tabs/uploadTab';
import { CustomerTab } from './tabs/customerTab';
import style from './contactModal.module.scss';
import { track, WaAddContactsType } from '../../tracker';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

export interface TaskProps {
  keyWord: string;
  taskId: string;
  groupId: string;
  time: string;
}
interface Props {
  open: boolean;
  onClose: (open: boolean) => void;
  onContactsChange: (data: string[]) => void;
  remainCount: number;
  sessionWhatsAppNumbers?: string[];
  taskParmas: TaskProps;
}

const trackTabMap = {
  paste: 'enter',
  upload: 'stencil',
  marketSearch: 'group',
  customer: 'customer',
};
type keys = keyof typeof trackTabMap;

const ContactModal: React.FC<Props> = ({ open, onClose, onContactsChange, sessionWhatsAppNumbers, remainCount, taskParmas }) => {
  const [activeTab, setActiveTab] = useState<string>('paste');
  const [filterLoading, setFilterLoading] = useState<boolean>(false);
  const [originalList, setOriginalList] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState<string>();
  const originData = useRef<string[]>([]);
  const [pastedText, setPastedText] = useState<string>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const recVerify = async (checkWa: string[], lastWa: string[]): Promise<string[]> => {
    const currentTotal = [...checkWa];
    const currentWhatsApp = currentTotal.splice(0, 1000);
    const res = await whatsAppApi.maskVerifyWhatsappNumber(currentWhatsApp);
    const verifyNums = res.whatsAppFilterResults?.filter(item => item.exists).map(ele => ele.number) || [];
    if (currentTotal.length) {
      return recVerify(currentTotal, [...lastWa, ...verifyNums]);
    }
    return [...lastWa, ...verifyNums];
  };
  // node端每次校验1000个手机号
  const queueVerify = async (whatsApp: string[], clear?: () => void) => {
    if (remainCount === 0) {
      Toast.warning('目前发信量为零');
      return;
    }
    try {
      setFilterLoading(true);
      const verifyNums = await recVerify([...whatsApp], []);
      if (verifyNums.length) {
        const filterNums = whatsApp.length - verifyNums.length;
        filterNums ? Toast.success(`添加成功，已删除${filterNums}个号码错误信息`) : Toast.success('添加成功');
        setOriginalList([...new Set([...verifyNums, ...originalList])].slice(0, remainCount));
        originData.current = [...new Set([...verifyNums, ...originalList])].slice(0, remainCount);
        clear && clear();
      } else {
        Toast.warning(`已删除${whatsApp.length}个号码错误信息`);
      }
      setFilterLoading(false);
    } catch (err: any) {
      setFilterLoading(false);
      Toast.warning(err?.message || '网络错误');
    }
  };

  useEffect(() => {
    if (sessionWhatsAppNumbers?.length && open) {
      queueVerify(sessionWhatsAppNumbers);
    }
    if (taskParmas?.taskId || taskParmas?.groupId) {
      setActiveTab('marketSearch');
      // 根据任务id获取群成员
    }
  }, [sessionWhatsAppNumbers, taskParmas, remainCount, open]);

  useEffect(() => {
    if (searchValue) {
      const filterList = originData.current.filter(item => item.includes(searchValue));
      setOriginalList(filterList);
    } else {
      setOriginalList(originData.current);
    }
  }, [searchValue]);

  return (
    <Modal
      width={886}
      title="添加联系人"
      bodyStyle={{ maxHeight: 600, padding: '0 20px', overflow: 'hidden' }}
      visible={open}
      getContainer={document.body}
      onCancel={() => onClose(false)}
      footer={[
        <Button onClick={() => onClose(false)}>取消</Button>,
        <Button
          disabled={!originalList?.length}
          type="primary"
          onClick={() => {
            onContactsChange(originData.current.map(item => item)); // 保存numbers
            onClose(false);
          }}
        >
          确定
        </Button>,
      ]}
      // onCancel={() => {
      //   onClose(false);
      // }}
      // onOk={() => {
      //   onContactsChange(originData.current.map(item => item)); // 保存numbers
      //   onClose(false);
      // }}
      headerBottomLine={false}
      footerTopLine={false}
      isGlobal
    >
      <div className={style.container}>
        <div className={style.header}>选择群发对象：</div>
        <div className={style.contacts}>
          <div className={style.left}>
            <Tabs
              activeKey={activeTab}
              onChange={key => {
                setActiveTab(key);
                track.waAddContactsTrack(trackTabMap[key as keys] as WaAddContactsType);
              }}
              tabBarGutter={16}
            >
              <Tabs.TabPane tab={'手动添加'} key="paste">
                <TextTab addWhatsApp={queueVerify} value={pastedText} setValue={setPastedText} />
              </Tabs.TabPane>
              <Tabs.TabPane tab={'从文件添加'} key="upload">
                <UploadTab addWhatsApp={queueVerify} fileList={fileList} setFileList={setFileList} />
              </Tabs.TabPane>
              <Tabs.TabPane tab={'群组'} key="marketSearch">
                <GroupTab taskParmas={taskParmas} addWhatsApp={queueVerify} />
              </Tabs.TabPane>
              <Tabs.TabPane tab={'客户管理'} key="customer">
                <CustomerTab addWhatsApp={queueVerify} />
              </Tabs.TabPane>
            </Tabs>
          </div>
          <div className={style.right}>
            <div className={style.rightHeader}>
              <span className={style.total}>
                已添加 {originalList.length}/{remainCount}
              </span>
              <span style={{ flex: 1 }}>
                <Tooltip title={`每次可添加${remainCount}条，现在已经添加${originalList.length}`}>
                  <TongyongShuomingXian style={{ fontSize: 16 }} />
                </Tooltip>
              </span>
              <span
                className={style.btn}
                onClick={() => {
                  setOriginalList([]);
                  originData.current = [];
                }}
              >
                <TongyongShanchu /> 清空
              </span>
            </div>
            <div className={style.rightMain}>
              <Input
                value={searchValue}
                onChange={e => setSearchValue(e.target.value as string)}
                className={style.search}
                prefix={<SearchOutlined />}
                placeholder="请输入国家区号+手机号"
              />
              <VirtualList
                originalList={originalList.map(item => ({ number: item, sentCount: 0 }))}
                onDelete={whatsApp => {
                  setOriginalList(lastlist => {
                    const restList = lastlist.filter(item => item !== whatsApp);
                    originData.current = originData.current.filter(item => item !== whatsApp);
                    return restList;
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {filterLoading ? <FilterModal open={filterLoading} /> : null}
    </Modal>
  );
};

export default ContactModal;
