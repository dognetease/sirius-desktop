import React, { useEffect } from 'react';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import styles from './index.module.scss';
import { MaterielApi, ShareListReq, ShareWhatsappUserResponse, apiHolder, apis } from 'api';
import moment from 'moment';
import { useMap } from 'react-use';
import useContainerScroll from '../../../hooks/useContainerScroll';
import cls from 'classnames';
import { DrawerProps } from 'antd/lib/drawer';
import { ReactComponent as WaDefaultAvatar } from '@/images/icons/SNS/whatsapp-default-avatar.svg';
import { Avatar, Spin } from 'antd';

const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;

interface IProps extends DrawerProps {
  showModal: boolean;
  handleClose: () => void;
  onItem: (info: ShareWhatsappUserResponse) => void;
  shareId: string;
}

type PageType = { page: number; pageSize: number; totalSize?: number; totalPage: number };

const SendDetail = (props: IProps) => {
  const { showModal, handleClose, onItem, shareId, ...rest } = props;
  const [waShareList, setWAShareList] = React.useState<ShareWhatsappUserResponse[]>([]);
  const [pageParams, { set, setAll }] = useMap<PageType>({ page: 1, pageSize: 15, totalSize: 0, totalPage: 0 });
  const { reachBottom } = useContainerScroll('.send-detail-container', { safeBottomHeight: 0 });
  const [loading, setLoading] = React.useState(false);

  const fetchData = (params: ShareListReq) => {
    setLoading(true);
    materielApi
      .getWAShareList(params)
      .then(res => {
        const { content = [], page, pageSize, totalSize, totalPage } = res || {};
        setWAShareList([...waShareList, ...content]);
        setAll({ page, pageSize, totalSize, totalPage });
      })
      .catch(err => console.log('getWAShareList-err', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (reachBottom) {
      if (pageParams.totalPage <= pageParams.page) {
        console.log('到底了-.-');
      } else {
        // 更新任务收藏 list
        const params = {
          page: pageParams.page + 1,
          pageSize: pageParams.pageSize,
        };
        fetchData(params);
      }
    }
  }, [reachBottom, pageParams]);

  useEffect(() => {
    const data = { shareId, page: pageParams.page, pageSize: pageParams.pageSize };
    fetchData(data);
  }, [shareId]);

  return (
    <SiriusDrawer
      title={
        <>
          发送详情 <Spin spinning={loading} />
        </>
      }
      className={styles.sendWrap}
      visible={showModal}
      onClose={handleClose}
      maskStyle={{ backgroundColor: 'transparent' }}
      closable
      {...rest}
    >
      <div className={cls(styles.container, 'send-detail-container')}>
        <div className={styles.sendList}>
          {!!waShareList?.length &&
            waShareList.map((item, index) => {
              return (
                <div key={index} className={styles.sendItem} onClick={() => onItem(item)}>
                  <div className={styles.top}>
                    <Avatar className={styles.avatar} src={item?.chatAvatarUrl ? item.chatAvatarUrl : <WaDefaultAvatar />} size={42} />
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{item.chatName}</div>
                      <span className={styles.updateTime}>{moment(item.sendAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                  </div>
                  {/* <div className={styles.bottom}>{item.description}</div> */}
                </div>
              );
            })}
        </div>
      </div>
    </SiriusDrawer>
  );
};

export default SendDetail;
