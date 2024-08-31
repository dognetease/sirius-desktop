import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { api, apis, EdmCustomsApi, resBuysersBase } from 'api';
import React, { useEffect, useState } from 'react';
import { getIn18Text } from 'api';
import { Tooltip } from 'antd';
import classnames from 'classnames';
import style from '../../customsDetail.module.scss';
import { ReactComponent as StarIcon } from '@/images/icons/customs/star-line.svg';
import { ReactComponent as StarHoverIcon } from '@/images/icons/customs/star-selected.svg';
const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

interface SubCompanyButtonProps {
  baseData: Partial<resBuysersBase>;
  onChangeCollectId?(params: { collectId?: null | string | number; country?: string; companyName?: string }): void;
}

export default (props: SubCompanyButtonProps) => {
  const {
    baseData: { collectId },
    onChangeCollectId,
  } = props;
  const [currentCollectId, setCurrentCollectId] = useState(collectId);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    setCurrentCollectId(collectId);
  }, [collectId]);

  const handleToggleSub = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    const { companyName = '', country = '', originCompanyName = '' } = props.baseData;
    if (!currentCollectId) {
      try {
        const newCollectId = await edmCustomsApi.addCompanySub({
          companyName,
          country,
          originCompanyName,
        });
        onChangeCollectId?.({
          collectId: newCollectId,
          companyName,
          country,
        });
        setCurrentCollectId(newCollectId);
        SiriusMessage.success({
          content: '公司订阅成功，系统将为您及时推送该公司动态',
        });
      } catch (error) {}
    } else {
      try {
        await edmCustomsApi.deleteCompanySub(currentCollectId);
        setCurrentCollectId(null);
        onChangeCollectId?.({
          collectId: null,
          companyName,
          country,
        });
        SiriusMessage.success({
          content: '已取消订阅，系统将不再向您推送该公司动态',
        });
      } catch (error) {}
    }
    setLoading(false);
  };
  return (
    <Tooltip title={currentCollectId ? '取消订阅公司' : '订阅公司'}>
      <div className={classnames(style.titleBtnStar)} onClick={handleToggleSub}>
        {currentCollectId ? <StarHoverIcon /> : <StarIcon />}
      </div>
    </Tooltip>
  );
};
