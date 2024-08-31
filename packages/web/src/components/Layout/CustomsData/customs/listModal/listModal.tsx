import React, { useState, useEffect } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './listModal.module.scss';
import { Pagination, PaginationProps, Empty, Spin } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import classNames from 'classnames';
import { apiHolder, apis, EdmCustomsApi, reqCustomsCompanyList, resCustomsCompanyList as listType } from 'api';
import { getIn18Text } from 'api';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
interface Props {
  visible: boolean;
  type?: 'buysers' | 'appliers';
  onCancel: () => void;
  companyName: string;
  country?: string;
  setDrawer?: (listItem: ListModalType) => void;
}
const defaultPagination: PaginationProps = {
  current: 1,
  defaultPageSize: 20,
  showSizeChanger: false,
  size: 'small',
  showTotal: total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`,
  total: 0,
  className: 'pagination-wrap pagination-customs',
};
export interface ListModalType {
  companyName: string;
  country: string;
  visited?: boolean;
}
const ListModal = ({ visible, onCancel, type, companyName, country, setDrawer }: Props) => {
  const [reqParams, setReqParams] = useState<reqCustomsCompanyList>({
    from: 1,
    size: 20,
    companyType: 'suppler',
    companyName: '',
  });
  const [companyListPag, setCompanyListPag] = useState<{
    current: number;
    total: number;
  }>({
    current: 1,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [list, setList] = useState<ListModalType[]>([]);
  useEffect(() => {
    if (companyName) {
      setLoading(true);
      const params = {
        ...reqParams,
        from: reqParams.from - 1,
        companyName,
        companyType: type === 'buysers' ? 'suppler' : ('buyer' as 'suppler' | 'buyer'),
        groupByCountry: true,
        country,
        returnCountry: true,
      };
      edmCustomsApi
        .customsCompanyList(params)
        .then(res => {
          console.log('company-list', res);
          const { total, companies } = res;
          setList(companies);
          setCompanyListPag({
            ...companyListPag,
            total,
          });
        })
        .finally(() => setLoading(false));
    }
  }, [reqParams, companyName]);
  const onChange = (page: number) => {
    setCompanyListPag({
      ...companyListPag,
      current: page as number,
    });
    setReqParams({
      ...reqParams,
      from: page as number,
    });
  };
  const renderContent = () => {
    if (loading) {
      return <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />;
    }
    if (list.length > 0) {
      return list.map((item, index) => {
        return (
          <div
            key={index}
            className={classNames(style.listItem, { [style.viewed]: item.visited })}
            onClick={() => {
              onCancel();
              setDrawer && setDrawer(item);
            }}
          >
            {item.companyName}
          </div>
        );
      });
    }
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  };
  return (
    <Modal
      className={style.modalWrap}
      title={type === 'buysers' ? getIn18Text('GONGYINGSHANG') : getIn18Text('CAIGOUSHANG')}
      width={476}
      bodyStyle={companyListPag.total > 20 ? { height: '536px', padding: '0 6px 0 24px' } : { maxHeight: '536px', minHeight: '188px', padding: '0 6px 0 24px' }}
      visible={visible}
      destroyOnClose={true}
      footer={null}
      onCancel={onCancel}
    >
      <>
        <div
          className={classNames(style.modalContent, loading && style.loadingWrapper, {
            [style.maxHeightStyle]: companyListPag.total <= 20,
          })}
        >
          {renderContent()}
        </div>
        {!!list.length && companyListPag.total > 20 && <Pagination {...defaultPagination} {...companyListPag} size="small" onChange={onChange} />}
      </>
    </Modal>
  );
};
export default ListModal;
