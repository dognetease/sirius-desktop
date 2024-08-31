import React, { useEffect, useState, useRef, ReactElement, DOMElement } from 'react';
import { apiHolder, DataStoreApi, ProductTagEnum } from 'api';
import { ModalProps } from 'antd/lib/modal/Modal';
import { Modal, Button, Divider } from 'antd';
import ModalImg from './modalImg';
import OfflineGuard from '@web-common/components/UI/NetWatcher/offlineGuard';
import './format.scss';
import { constHttpCanceledToken } from 'api';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { getIn18Text } from 'api';
interface Props {
  visible: boolean;
  onCancel: () => void;
  showMfEdit: (groupId?: string, id?: string) => void;
}
const formatList = [
  {
    title: getIn18Text('XINGZHENGTONGZHI'),
    id: '4791136',
    imgs: [
      {
        id: '469165',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/c5b8f2ff1a2c40e685f1d7ea97e0e406.png',
      },
      {
        id: '33925650',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/e737d7203a2046d9b38cb7152940b862.png',
      },
      {
        id: '18990124',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/a6f0d5755f8545ac847da2362330c795.png',
      },
      {
        id: '18991211',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/5f9f59f46b584027947d8c61467d7665.png',
      },
    ],
  },
  {
    title: getIn18Text('FANGJIA/ZHUFU'),
    id: '4791137',
    imgs: [
      {
        id: '387313',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/f3c75c4ab28246089f7f73a7ea7e9829.jpeg',
      },
      {
        id: '33993156',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/550d610c775c46c490ff4f99ceb6c662.jpeg',
      },
      {
        id: '17676044',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/715a4df586ae462c9c451bbbefbe3a1f.jpeg',
      },
      {
        id: '115981',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/ed88c7de295d40fe962c0a2ca73e674d.jpeg',
      },
    ],
  },
  {
    title: getIn18Text('QIYEXUANCHUAN'),
    id: '4791138',
    imgs: [
      {
        id: '33993052',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/c524c0c1c18d4954b444246637b9ceb0.png',
      },
      {
        id: '48172271',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/cc1f112543644ee6bb616c1de12de82e.png',
      },
      {
        id: '34014266',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/f8daf99fd91a4828a77012c59bfa0927.png',
      },
      {
        id: '33998226',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/5beeca214c7d444ca2d789b620d72393.png',
      },
    ],
  },
  {
    title: getIn18Text('YAOQINGHAN'),
    id: '4791139',
    imgs: [
      {
        id: '411204',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/7968cf179ab24c818a8ab94a20c69197.png',
      },
      {
        id: '48172259',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/7e5e3980a6e44c69bea892f15a08951f.png',
      },
      {
        id: '48164112',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/33e7b615679c466289c48bf5fa0b4a69.png',
      },
      {
        id: '34010212',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/638f6b0948b844e99f8a47c7bbd50a5d.png',
      },
    ],
  },
  {
    title: getIn18Text('RENSHIZHAOPIN'),
    id: '4791140',
    imgs: [
      {
        id: '33925931',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/b127952baf504202be345c8a3a89038b.png',
      },
      {
        id: '33941317',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/a08ddc7ecd0c40f794e35a266ff5763e.png',
      },
      {
        id: '33968776',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/7b283f0ce7114397a7ce2077638f6646.png',
      },
      {
        id: '48186937',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/e21db9410bd14737bc3a4e19feac3e0a.png',
      },
    ],
  },
  {
    title: getIn18Text('NIANZHONGZONGJIE'),
    id: '4791141',
    imgs: [
      {
        id: '33937350',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/2023c2a5befc4792a1a62bcf6d0081f5.jpeg',
      },
      {
        id: '33939359',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/44ba22f8d552485da0a9bcc28f972e10.png',
      },
      {
        id: '33944966',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/411e7cda97374fc7b9a42e2c972a3458.jpeg',
      },
      {
        id: '33943393',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/bafa5a93fb844b38a43bacdf966a67ee.jpeg',
      },
    ],
  },
  {
    title: getIn18Text('CUXIAOHUODONG'),
    id: '4791142',
    imgs: [
      {
        id: '48188036',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/8396569980434545b50aab4cc7072c58.png',
      },
      {
        id: '34014811',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/a574c7f466b642c0a3da0faa6ae095f8.png',
      },
      {
        id: '48178125',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/32b07410237d4e8fbc1b756e024f186f.png',
      },
      {
        id: '48170887',
        url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/b5fec573aa6d481ca5e4df779e2a97b9.png',
      },
    ],
  },
];
const FORMAT_LINE_HEIGHT = 284 + 24;
const MailFormatModal: React.FC<Props> = props => {
  const { onCancel, visible, showMfEdit } = props;
  const [showBarShadow, setShowBarShadow] = useState(false);
  const [showTabIndex, setShowTabIndex] = useState(0);
  const refContainer = useRef<any>(null);
  const handleScroll = event => {
    const { scrollTop } = event.target;
    setShowBarShadow(scrollTop > 2);
    // 56为第一栏标题及边距的高度总和，用于指向第一个tab
    if (scrollTop <= 56) {
      setShowTabIndex(0);
    } else {
      setShowTabIndex(Math.floor((scrollTop - 56) / FORMAT_LINE_HEIGHT) + 1);
    }
  };
  const showTabImgLine = index => {
    if (refContainer && refContainer.current) {
      refContainer.current.scrollTop = index * FORMAT_LINE_HEIGHT;
    }
  };
  return (
    <Modal
      className="mailformat-modal"
      width="960px"
      title={
        <div>
          <ProductAuthTag tagName={ProductTagEnum.EMAIL_TEMPLATE}>{getIn18Text('TIANJIAYOUJIANMO')}</ProductAuthTag>
        </div>
      }
      footer={null}
      maskClosable={false}
      keyboard={false}
      visible={visible}
      onCancel={onCancel}
    >
      <div className="mailformat-modal-wrap">
        <div className={`mf-head ${showBarShadow ? 'shadow' : ''} `}>
          <div className="mf-tabs-warp">
            {formatList.map((item, index) => (
              <div
                className={`mf-tab ${index == showTabIndex ? 'active' : ''}`}
                key={index}
                onClick={() => {
                  showTabImgLine(index);
                }}
              >
                {item.title}
              </div>
            ))}
          </div>
          <div className="mf-tab-oper-warp" />
        </div>
        <OfflineGuard style={{ height: '500px' }}>
          <div className="mf-content" ref={refContainer} onScroll={handleScroll}>
            {formatList.map((item, index) => (
              <div className="mf-img-block" key={index}>
                <div className="mf-img-title">{item.title}</div>
                <div className="mf-img-list-wrap">
                  <div className="mf-img-list">
                    {item.imgs.map((innerItem, index) => (
                      <ModalImg
                        key={index}
                        showMfEdit={id => {
                          showMfEdit(item.id, id);
                        }}
                        url={innerItem.url}
                        id={innerItem.id}
                      />
                    ))}
                  </div>
                  <div
                    className="mf-img-more"
                    onClick={() => {
                      showMfEdit(item.id);
                    }}
                  >
                    <div className="mf-cicle-wrap">
                      <span className="mf-cicle" />
                      <span className="mf-cicle" />
                      <span className="mf-cicle" />
                    </div>
                    <div className="mf-img-more-title">{getIn18Text('GENGDUO')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </OfflineGuard>
      </div>
    </Modal>
  );
};
export default MailFormatModal;
