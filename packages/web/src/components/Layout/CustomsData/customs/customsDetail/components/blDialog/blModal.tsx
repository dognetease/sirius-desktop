import React, { useState, useEffect } from 'react';
import { Descriptions } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './blModal.module.scss';
import { apiHolder, apis, EdmCustomsApi, reqCustomsCompanyList, resLading as listType } from 'api';
import { getIn18Text } from 'api';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
interface Props {
  visible: boolean;
  recordId: string;
  onCancel: () => void;
}
interface mapItemType {
  key: string;
  value: string;
  label: string;
  children?: mapItemType[];
}
const ListModal = ({ visible, recordId, onCancel }: Props) => {
  const map = [
    {
      key: 'shipmentInfo',
      value: '',
      label: getIn18Text('FAHUOXIANGQING'),
      children: [
        {
          key: 'billOfLadingNumber',
          value: '',
          label: getIn18Text('TIDANHAO'),
        },
        {
          key: 'billOfLadingType',
          value: '',
          label: getIn18Text('TIDANLEIXING'),
        },
        {
          key: 'mainBillOfLadingNumber',
          value: '',
          label: getIn18Text('ZHUTIDANHAO'),
        },
        {
          key: 'arrivalDate',
          value: '',
          label: getIn18Text('DAODARIQI'),
        },
        {
          key: 'shipmentOrigin',
          value: '',
          label: getIn18Text('FAHUODE'),
        },
        {
          key: 'shipmentDestination',
          value: '',
          label: getIn18Text('FAHUOMUDEDE'),
        },
        {
          key: 'portOfLading',
          value: '',
          label: getIn18Text('TIHUOGANG'),
        },
        {
          key: 'portOfUnlading',
          value: '',
          label: getIn18Text('XIEHUOGANG'),
        },
        {
          key: 'placeOfReceipt',
          value: '',
          label: getIn18Text('SHOUHUODEDIAN'),
        },
        {
          key: 'transportMethod',
          value: '',
          label: getIn18Text('YUNSHUFANGSHI'),
        },
        {
          key: 'vessel',
          value: '',
          label: getIn18Text('CHUANBO'),
        },
        {
          key: 'isContainerized',
          value: '',
          label: getIn18Text('JIZHUANGXIANG'),
        },
        {
          key: 'volume',
          value: '',
          label: getIn18Text('TIJI\uFF08BIAOZHUNXIANG\uFF09'),
        },
        {
          key: 'quantity',
          value: '',
          label: getIn18Text('SHULIANG'),
        },
        {
          key: 'measurement',
          value: '',
          label: getIn18Text('CELIANG'),
        },
        {
          key: 'weightKg',
          value: '',
          label: getIn18Text('ZHONGLIANG\uFF08GONGJIN\uFF09'),
        },
        {
          key: 'weightT',
          value: '',
          label: getIn18Text('ZHONGLIANG\uFF08DUN\uFF09'),
        },
        {
          key: 'weightOriginFormat',
          value: '',
          label: getIn18Text('ZHONGLIANG\uFF08YUANSHIGESHI\uFF09'),
        },
        {
          key: 'valueOfGoodsUSD',
          value: '',
          label: getIn18Text('HUOWUJIAZHI\uFF08MEIYUAN\uFF09'),
        },
        {
          key: 'frob',
          value: '',
          label: 'FROB',
        },
        {
          key: 'manifestNumber',
          value: '',
          label: getIn18Text('QINGDANBIANHAO'),
        },
        {
          key: 'inbondCode',
          value: '',
          label: getIn18Text('RUKUDAIMA'),
        },
        {
          key: 'numberOfContainers',
          value: '',
          label: getIn18Text('JIZHUANGXIANGSHULIANG'),
        },
        {
          key: 'hasLCL',
          value: '',
          label: getIn18Text('YOUPINXIANG'),
        },
      ],
    },
    {
      key: 'companyDetail',
      value: '',
      label: getIn18Text('GONGSIXIANGQING'),
      children: [
        {
          key: 'consignee',
          value: '',
          label: getIn18Text('SHOUHUOREN'),
        },
        {
          key: 'consigneeOriginFormat',
          value: '',
          label: getIn18Text('SHOUHUOREN\uFF08YUANJIAN\uFF09'),
        },
        {
          key: 'consigneeGlobalHQ',
          value: '',
          label: getIn18Text('SHOUHUORENQUANQIUZONGBU'),
        },
        {
          key: 'consigneeDomesticHQ',
          value: '',
          label: getIn18Text('SHOUHUORENGUONEIZONGBU'),
        },
        {
          key: 'consigneeUltimateParent',
          value: '',
          label: getIn18Text('SHOUHUORENZUIZHONGFU'),
        },
        {
          key: 'shipper',
          value: '',
          label: getIn18Text('TUOYUNREN'),
        },
        {
          key: 'shipperOriginFormat',
          value: '',
          label: getIn18Text('TUOYUNREN\uFF08YUANSHIGESHI\uFF09'),
        },
        {
          key: 'shipperGlobalHQ',
          value: '',
          label: getIn18Text('TUOYUNRENQUANQIUZONGBU'),
        },
        {
          key: 'shipperDomesticHQ',
          value: '',
          label: getIn18Text('TUOYUNRENGUONEIZONGBU'),
        },
        {
          key: 'shipperUltimateParent',
          value: '',
          label: getIn18Text('TUOYUNRENZHONGJIFUMU'),
        },
        {
          key: 'carrier',
          value: '',
          label: getIn18Text('YUNSHUGONGSI'),
        },
        {
          key: 'notifyParty',
          value: '',
          label: getIn18Text('TONGZHIFANG'),
        },
        {
          key: 'notifyPartySCAC',
          value: '',
          label: getIn18Text('TONGZHIDANGSHIREN SCAC'),
        },
      ],
    },
    {
      key: 'container',
      value: '',
      label: getIn18Text('JIZHUANGXIANG'),
      children: [
        {
          label: getIn18Text('ZHUANGXIANGBIANHAO'),
          key: 'containerNumbers',
          value: '',
        },
        {
          label: getIn18Text('HSBIANMA'),
          key: 'hsCode',
          value: '',
        },
        {
          label: getIn18Text('FAHUODEHUOWU'),
          key: 'goodsShipped',
          value: '',
        },
        {
          label: getIn18Text('TIJI\uFF08JIZHUANGXIANGBIAOZHUNXIANG\uFF09'),
          key: 'volumeContainerTEU',
          value: '',
        },
        {
          label: getIn18Text('RONGQIBIAOJI'),
          key: 'containerMarks',
          value: '',
        },
        {
          label: getIn18Text('FEN/PINXIANG'),
          key: 'dividedLCL',
          value: '',
        },
        {
          label: getIn18Text('RONGQIFUWULEIXING'),
          key: 'containerTypeOfService',
          value: '',
        },
        {
          label: getIn18Text('RONGQILEIXING'),
          key: 'containerTypes',
          value: '',
        },
        {
          label: getIn18Text('WEIXIANWUPIN'),
          key: 'dangerousGoods',
          value: '',
        },
      ],
    },
  ];
  const [mapList, setMapList] = useState<mapItemType[]>(map);
  type itemBaseKey = keyof listType;
  type baseKey = keyof listType['shipmentInfo'] & keyof listType['companyDetail'] & keyof listType['container'];
  useEffect(() => {
    if (visible && recordId) {
      edmCustomsApi.billOfLading({ recordId }).then(res => {
        console.log('xxxxbilling', res);
        mapList.map(item => {
          let mapData = res[item.key as itemBaseKey];
          item.children &&
            item.children.map(child => {
              child.value = (mapData && mapData[child.key as baseKey]) || '-';
            });
        });
        setMapList([...mapList]);
      });
    }
  }, [visible, recordId]);
  return (
    <Modal
      className={style.modalWrapDescriptions}
      title={getIn18Text('TIDANSHUJU')}
      width={768}
      bodyStyle={{ height: '500px', padding: '0 6px' }}
      visible={visible}
      destroyOnClose={true}
      footer={null}
      onCancel={onCancel}
    >
      <div className="sirius-scroll" style={{ height: 475, overflow: 'scroll', padding: '0 24px' }}>
        {mapList.map((item, index) => (
          <Descriptions style={{ paddingTop: 25 }} size={'small'} key={index} title={item.label} bordered column={2}>
            {item.children &&
              item.children.map((el, elIndex) => (
                <Descriptions.Item key={elIndex} label={el.label}>
                  {el.value}
                </Descriptions.Item>
              ))}
          </Descriptions>
        ))}
      </div>
    </Modal>
  );
};
export default ListModal;
