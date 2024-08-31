import React from 'react';
import style from '../../CustomsData/customs/table/table.module.scss';
import { ForwarderRecordItem, getIn18Text } from 'api';
import classNames from 'classnames';
import EllipsisTooltip from '../../Customer/components/ellipsisTooltip/ellipsisTooltip';
import NationFlag from '../../CustomsData/components/NationalFlag';
import Tooltip from '@web-common/components/UI/Tooltip';
import { ReactComponent as StarHoverIcon } from '@/images/icons/customs/star-selected.svg';
import { ReactComponent as StarIcon } from '@/images/icons/customs/star.svg';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { edmCustomsApi } from '../../globalSearch/constants';
import { SearchPropType } from '../../CustomsData/customs/table/buysersTable';

interface Prop {
  record: ForwarderRecordItem;
  value: string;
  changStarMark: (id: number, collectId?: number | string) => void;
  searchType?: SearchPropType;
  hideSubBtn?: boolean;
}

const PeersName: React.FC<Prop> = ({ record, value: text, changStarMark, searchType, hideSubBtn }) => {
  const deleteStar = (record: ForwarderRecordItem) => {
    const { collectId, id } = record;
    if (!collectId) {
      return;
    }
    edmCustomsApi.deleteCompanySub(collectId).then(() => {
      SiriusMessage.success({
        content: '已取消订阅，系统将不再向您推送该公司动态',
      });
      changStarMark(id);
    });
  };
  const addStar = (record: ForwarderRecordItem) => {
    const { companyName, country, originCompanyName, id } = record;
    edmCustomsApi
      .addCompanySub({
        companyName,
        country,
        originCompanyName,
      })
      .then(collectId => {
        SiriusMessage.success({
          content: '公司订阅成功，系统将为您及时推送该公司动态',
        });
        changStarMark(id, collectId);
      });
  };
  return (
    <div>
      <div
        className={classNames(style.companyNameItem, {
          [style.companyNameItemVisited]: record.visited,
        })}
        style={{ marginLeft: -20, paddingLeft: 20 }}
      >
        <EllipsisTooltip>
          <span className={style.companyNameText}>
            <span className={style.company} dangerouslySetInnerHTML={{ __html: text || record.companyName || '-' }} />
          </span>
        </EllipsisTooltip>
        {record.standardCountry ? <NationFlag showLabel={searchType !== 'forwarder'} name={record.standardCountry} /> : '-'}
        {hideSubBtn ? (
          ''
        ) : !!record.collectId ? (
          <Tooltip placement="top" title={getIn18Text('QUXIAODINGYUE')}>
            <a
              className={style.companyTextStarSelected}
              onClick={e => {
                e.stopPropagation();
                deleteStar(record);
              }}
            >
              <StarHoverIcon />
            </a>
          </Tooltip>
        ) : (
          <Tooltip placement="top" title={getIn18Text('DINGYUEGONGSI')}>
            <a
              className={style.companyTextStar}
              onClick={e => {
                e.stopPropagation();
                addStar(record);
              }}
            >
              <StarIcon />
            </a>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
export default PeersName;
