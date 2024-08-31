import React from 'react';
import HistoryHeader from './historyHeader';
import OpenSea from '../openSea';
import style from './detail.module.scss';
import { AddressBookApi, apiHolder, apis, IAddressBookOpenSeaListReq } from 'api';
import { getBodyFixHeight } from '@web-common/utils/constant';
import classnames from 'classnames';
import addressBookStyle from '../../addressBook.module.scss';
import { getIn18Text } from 'api';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
interface AddressBookPublicHistoryDetailProps {
  qs?: {
    importName: string;
    importId: string;
    addressNum: string;
    deletedAddressNum: string;
  };
}
const AddressBookPublicHistoryDetail: React.FC<AddressBookPublicHistoryDetailProps> = props => {
  const { qs } = props;
  const { importName = '', importId = '', addressNum = '', deletedAddressNum = '' } = qs || {};
  // const formatShowTotal = (total: number) => {
  //   return <span style={{ position: 'absolute', left: 0 }}>共{total}个（原始导入{addressNum}个，已删除{deletedAddressNum}个）</span>
  // }
  return (
    <div className={classnames(style.container, addressBookStyle.addressBook)}>
      <HistoryHeader
        paths={[
          { name: getIn18Text('DEZHIBUGONGHAI'), url: '#edm?page=addressBookIndex&defaultTabKey=openSea' },
          { name: getIn18Text('LISHIDAORUMINGDAN'), url: '#edm?page=addressPublicHistoryIndex' },
          { name: getIn18Text('DAORUMINGDANXIANGQING'), url: '' },
        ]}
        title={getIn18Text('DAORUMINGDANXIANGQING')}
      />
      <div className={style.mainCont}>
        <OpenSea
          showTitle={false}
          containerStyles={{ padding: 0, background: 'transparent' }}
          showActionsRightBlock={false}
          showImportName={false}
          // extPaginationConfig={{
          //   showTotal(total, range) {
          //     return formatShowTotal(total)
          //   },
          // }}
          scrollHeight={`calc(100vh - ${getBodyFixHeight(true) ? 291 : 323}px)`}
          fetchMemberList={(params: IAddressBookOpenSeaListReq) => {
            return addressBookApi.addressBookOpenSeaList({
              ...params,
              importId: parseInt(importId),
            });
          }}
        />
      </div>
    </div>
  );
};
export default AddressBookPublicHistoryDetail;
