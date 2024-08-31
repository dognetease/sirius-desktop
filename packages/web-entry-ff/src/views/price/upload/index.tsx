import React, { useState, useMemo } from 'react';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
import { Breadcrumb, Radio, Button, message } from 'antd';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import { navigate } from '@reach/router';
import { useMount, useLocalStorageState } from 'ahooks';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { getUnitableCrmHash } from '@web-unitable-crm/api/helper';
import style from './style.module.scss';
import { Excel, Image } from './file';
import FooterBar from '../../customer/components/footerBar';
import Preview from './previewModal';
import RouteSearch from '../routeSearch';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

const UploadPrice: React.FC = () => {
  const [localData, setLocalData] = useLocalStorageState<string>('ffms-upload-price-key');
  const [uploadType, setUploadType] = useState<string>(() => (localData ? localData : 'excel'));
  const [analyzeData, setAnalyzeData] = useState<FFMSRate.AnalyzeRes>();
  const [analyzeImageData, setAnalyzeImageData] = useState<FFMSRate.PricePicRes>();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [standardField, setStandardField] = useState<FFMSRate.StandardField[]>([]);
  const [preview, setPreview] = useState<boolean>(false);

  const getStandardField = () => {
    ffmsApi.getFfmsPriceTitle().then(res => {
      setStandardField(res);
    });
  };

  const submitDisabled = useMemo(() => {
    if (analyzeData?.analyzeId || standardField.some(item => typeof item.codeIndex === 'number')) {
      return false;
    }
    return true;
  }, [analyzeData, standardField]);

  const canPreview = useMemo(() => standardField.some(item => typeof item.codeIndex === 'number'), [standardField]);

  const saveImageData = (req: FFMSRate.SaveAnalyzePrice) => {
    setConfirmLoading(true);
    ffmsApi
      .saveFfmsAnalyzePicture(req)
      .then(res => {
        if (res.validCount) {
          navigate(getUnitableCrmHash('/price/effective?page=index'));
        } else {
          navigate(getUnitableCrmHash('/price/pending'));
        }
        message.success('导入成功');
      })
      .finally(() => setConfirmLoading(false));
  };

  const handleOk = () => {
    if (analyzeData) {
      let params = {
        analyzeId: analyzeData.analyzeId,
      };
      setConfirmLoading(true);
      ffmsApi.saveFfUploadData(params).then(res => {
        message.success('导入成功');
        setConfirmLoading(false);
        setAnalyzeData(undefined);
        navigate(getUnitableCrmHash('/price/effective?page=index'));
      });
    }
    if (analyzeImageData?.data) {
      let mappingRules = standardField.map(item => {
        return {
          label: item.label,
          value: item.value,
          index: typeof item.codeIndex === 'number' ? item.codeIndex : -1,
        };
      });
      let params = {
        ...analyzeImageData,
        mappingRules: mappingRules,
        map: true,
      };
      saveImageData(params);
    }
  };

  const initData = () => {
    setAnalyzeData(undefined);
    setAnalyzeImageData(undefined);
    setStandardField(pre => {
      return [...pre].map(item => {
        item.codeIndex = undefined;
        return item;
      });
    });
  };

  const back = () => {
    analyzeImageData
      ? SiriusModal.confirm({
          title: '退出上传报价？',
          content: '由于已识别的数据未导入到系统中，若退出上传，将不会保留识别到的数据',
          okText: '确定退出',
          cancelText: '取消',
          onOk: () => navigate(getUnitableCrmHash('/price/effective?page=index')),
        })
      : navigate(getUnitableCrmHash('/price/effective?page=index'));
  };

  useMount(() => {
    getStandardField();
  });

  return (
    <div className={style.ffUploadWrap}>
      <Breadcrumb>
        <Breadcrumb.Item className={style.breadcrumb} onClick={() => back()}>
          生效报价
        </Breadcrumb.Item>
        <Breadcrumb.Item>上传报价</Breadcrumb.Item>
      </Breadcrumb>
      <div className={style.ffUploadWrapContent}>
        <Radio.Group
          value={uploadType}
          buttonStyle="solid"
          onChange={e => {
            setUploadType(e.target.value);
            setLocalData(e.target.value);
            initData();
          }}
        >
          <Radio.Button value="excel">excel文件</Radio.Button>
          <Radio.Button value="image">图片识别</Radio.Button>
        </Radio.Group>
        <RouteSearch className={style.bgColor} />
        {uploadType === 'image' ? (
          <div className={canPreview ? style.preview : style.previewDisabled} onClick={() => canPreview && setPreview(true)}>
            <EyeOutlined /> 预览匹配效果
          </div>
        ) : null}
        <div className={style.main}>
          {uploadType === 'excel' ? (
            <Excel analyzeData={analyzeData} setAnalyzeData={setAnalyzeData} />
          ) : (
            <Image
              standardField={standardField}
              setStandardField={setStandardField}
              analyzeImageData={analyzeImageData}
              setAnalyzeImageData={setAnalyzeImageData}
              onCancel={initData}
            />
          )}
        </div>
      </div>
      <Preview
        visible={preview}
        standardField={standardField}
        analyzeImageData={analyzeImageData}
        onSuccess={() => setPreview(false)}
        onCancel={() => setPreview(false)}
      />
      <FooterBar keys={['']}>
        <Button onClick={() => back()}>取消</Button>
        <Button disabled={submitDisabled} loading={confirmLoading} onClick={() => handleOk()} type="primary">
          导入
        </Button>
      </FooterBar>
    </div>
  );
};

export default UploadPrice;
