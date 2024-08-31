import React, { FC, useState, useEffect, useContext } from 'react';
import { apiHolder, apis, EdmSendBoxApi, GetDiagnosisDetailRes } from 'api';

import { ValidatorWrapper } from './ValidatorWrapper';
import { Validator, Props } from './validator';
import { ValidatorContext } from './validator-context';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const ValidatorEntry: FC<
  {
    showValidator: boolean;
  } & Props
> = props => {
  const [data, setData] = useState<GetDiagnosisDetailRes>();
  const [showRecommend, setShowRecommend] = useState(false);
  const validatorProvider = useContext(ValidatorContext);

  const queryData = async () => {
    // setShow(true);
    try {
      const data = await edmApi.getDiagnosisDetail();
      setData(data);
      if (data.suggestSendCount != null && data.lastPeriodSendCount != null) {
        setShowRecommend(data.lastPeriodSendCount < data.suggestSendCount);
        validatorProvider?.dispatch({
          type: 'setValidatorResult',
          payload: {
            id: 'ValidatorResult',
            type: data.lastPeriodSendCount < data.suggestSendCount ? 0 : 1,
          },
        });
        // setShowRecommend(true);
      }
    } catch (err) {}
  };
  useEffect(() => {
    // 请求数据
    queryData();
  }, []);

  return (
    <>
      {props.showValidator && (
        <ValidatorWrapper data={data} showRecommend={showRecommend}>
          <Validator showRecommend={showRecommend} {...props} limitData={data} />
        </ValidatorWrapper>
      )}
    </>
  );
};
