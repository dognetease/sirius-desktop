/**
 *  ⚠️⚠️⚠️ 此文件已经废弃 引用的地方为 packages/web/src/components/Layout/CustomsData/customs/customsDetail/customsSupplierDetail.tsx
 * 引用文件已废弃
 */
import React from 'react';
import { customsContactItem as contactsType, resCustomsContact, getIn18Text } from 'api';
import { Checkbox, Pagination, PaginationProps, Tooltip } from 'antd';
import InfoBox from './infoBox/infoBox';
import style from './contacts.module.scss';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import PeopeContacts from './contacts/contacts';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';

interface Props {
  detail: Partial<resCustomsContact>;
  contactsList: contactsType[];
  pagination: PaginationProps;
  onChangePage: (page: number) => void;
  onMarketing: () => void;
  isHideInfoBox?: boolean;
  title?: React.ReactNode;
  excludeEmail?: boolean;
  setExcludeEmail?: (isExclude: boolean) => void;
  companyName: string;
  originCompanyName?: string;
  country: string;
  maketingLoading?: boolean;
  getAllContacts?(): Promise<contactsType[]>;
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

const BaseInfo: React.FC<Props> = ({
  detail,
  contactsList,
  pagination,
  onChangePage,
  onMarketing,
  isHideInfoBox,
  title,
  excludeEmail,
  setExcludeEmail,
  companyName,
  country,
  originCompanyName,
  getAllContacts,
}) => {
  const boxInfo = [
    {
      key: 'maxSupplerName',
      label: getIn18Text('LIANXIREN(GE)'),
      content: detail?.contactCount,
      isNumber: true,
    },
    {
      key: 'totalImportOfUsd',
      label: getIn18Text('LIANXIFANGSHI(GE)'),
      isNumber: true,
      content: detail?.mediaCount,
    },
  ];

  const rederInfoBox = () => boxInfo.map((item, index) => <InfoBox index={index} isContact {...item} />);

  const onChange = (page: number) => {
    onChangePage(page);
  };

  // 展示国家
  const PopoverCountry = () => (
    <Tooltip placement="bottomLeft" title={'不显示前缀为info、service、support等内容的公共邮箱'} trigger="hover">
      <div
        style={{
          paddingLeft: 5,
          color: '#FFAA00',
          cursor: 'pointer',
          height: 16,
          display: 'inline-block',
          verticalAlign: -3,
        }}
      >
        <QuestionIcon style={{ display: 'block' }} />
      </div>
    </Tooltip>
  );

  return (
    <div className={style.customsContact}>
      <div className={style.box}>{!isHideInfoBox && rederInfoBox()}</div>
      <FoldCard
        className={style.contactCard}
        headerClassName={style.contactCardHeader}
        title={
          title ? (
            title
          ) : (
            <span>
              {`${getIn18Text('LIANXIREN')}(${pagination.total})`}{' '}
              <Checkbox checked={excludeEmail} onChange={e => setExcludeEmail && setExcludeEmail(e.target.checked as boolean)} style={{ marginLeft: 16 }}>
                {getIn18Text('PAICHUGONGGONGYOUXIANG')}
                <PopoverCountry />
              </Checkbox>
            </span>
          )
        }
        folded={false}
        foldHeight={216}
        unfoldedText={''}
      >
        <PeopeContacts
          list={contactsList}
          // mode={infoFolded ? 'simple' : 'complete'}
          mode={'simple'}
          options={[]}
          onWriteMail={email => {}}
          onEdit={() => {}}
        />
      </FoldCard>
      <Pagination {...defaultPagination} {...pagination} size="small" onChange={onChange} />
    </div>
  );
};

BaseInfo.defaultProps = {
  isHideInfoBox: false,
};

export default BaseInfo;
