import React, { useState, useEffect, useMemo } from 'react';
import { Upload, message, Spin, Tooltip } from 'antd';
import IconCard from '@web-common/components/UI/IconCard';
import icon from '@web-common/components/UI/Icons/svgs';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
const { TongyongShanchuMian, TongyongYiwenMian, TongyongTianjia } = icon;
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import type { UploadProps } from 'antd/es/upload/interface';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import classnames from 'classnames';
import { useEventListener } from 'ahooks';
import cloneDeep from 'lodash/cloneDeep';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import { ColumnsType } from 'antd/es/table';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import CustomScrollTable from '@web-entry-ff/components/scrollTable/scrollTable';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import style from './file.module.scss';

const { Dragger } = Upload;
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const systemApi = apiHolder.api.getSystemApi();
const TIPS = '不完整数据可能是因为无法有效识别造成，导入后需进一步补充完整方可生效';
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

interface Props {
  analyzeData?: FFMSRate.AnalyzeRes;
  setAnalyzeData: (data: FFMSRate.AnalyzeRes) => void;
}

export const Excel: React.FC<Props> = ({ analyzeData, setAnalyzeData }) => {
  const [status, setStatus] = useState<'pedding' | 'uploading' | 'success'>('pedding');
  const [uploading, setUploading] = useState<boolean>(false);
  const uploadUrl = systemApi.getUrl('ffRateUpload');

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .jpg, .jpeg, .png', // .jpg, .jpeg, .png
    showUploadList: false,
    action: uploadUrl,
    beforeUpload(file) {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (!isExcel) {
        message.warning('上传文件格式错误，请下载模板编辑后重新上传');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        message.error('文件大小需小于10M');
        return false;
      }
      return isLt2M;
    },
    onChange(info) {
      const { status, type } = info.file;
      if (status === 'uploading') {
        !uploading && setUploading(!uploading);
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        if (info?.file?.response.success) {
          setAnalyzeData(info?.file?.response?.data);
          setStatus('success');
          message.success(`${info.file.name} 解析成功`);
        } else {
          message.error(`${info?.file?.response?.message || '解析失败'} `);
        }
        setUploading(false);
      } else if (status === 'error') {
        setUploading(false);
        message.error('因格式出错解析失败，请尽量使用原模板上传。');
      }
    },
  };

  const uploadInit = () => {
    setStatus('pedding');
  };

  const downLoad = e => {
    e.stopPropagation();
    ffmsApi.ffRateTemplate().then(res => {
      res?.url ? (window.location.href = res.url) : message.error('下载链接异常');
    });
  };

  return (
    <div className={style.upload}>
      {status === 'success' ? (
        <>
          <div className={style.uploadSuccess}>
            <div className={style.uploadFile}>
              <IconCard type="xlsx" />
              <div>
                <div>{`文件名：${analyzeData?.filename}, 文件大小：${analyzeData?.filesize}`}</div>
                <span className={style.uploadInfo}>
                  {`共识别${analyzeData?.totalCount}条数据，其中${analyzeData?.validCount}条有效报价，${analyzeData?.invalidCount}条不完整数据`}
                  <Tooltip placement="bottom" trigger="hover" title={TIPS}>
                    <TongyongYiwenMian />
                  </Tooltip>
                </span>
              </div>
            </div>
            <TongyongShanchuMian onClick={uploadInit} />
          </div>
        </>
      ) : (
        <Spin spinning={uploading}>
          <Dragger {...props}>
            <div className={style.imageUploadWrap}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <div className={style.text}>点击选择或直接拖拽报价excl文件，快速生成报价。</div>
              <a onClick={downLoad}>下载报价文档模板</a>
            </div>
          </Dragger>
        </Spin>
      )}
    </div>
  );
};

interface ImageProps {
  standardField: FFMSRate.StandardField[];
  setStandardField: (data: FFMSRate.StandardField[]) => void;
  analyzeImageData?: FFMSRate.PricePicRes;
  setAnalyzeImageData: (data?: FFMSRate.PricePicRes) => void;
  onCancel: () => void;
}

export const Image: React.FC<ImageProps> = ({ standardField, setStandardField, analyzeImageData, setAnalyzeImageData, onCancel }) => {
  const [status, setStatus] = useState<'pedding' | 'uploading' | 'success'>('pedding');
  const [uploading, setUploading] = useState<boolean>(false);
  const uploadPicUrl = systemApi.getUrl('ffmsAnalyzePicture');
  const [percent, setPercent] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string>();
  const [image, setImage] = useState<File | null>(null);
  const [columns, setColumns] = useState<ColumnsType<Record<string, string>[]>>([]);
  const [options, setOptions] = useState<FFMSRate.Option[]>([]);
  const [canPrompt, setCanPrompt] = useState<boolean>(true);
  const [isHasMap, setIsHasMap] = useState<boolean>(false);

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.jpg, .jpeg, .png',
    showUploadList: false,
    action: uploadPicUrl,
    beforeUpload(file) {
      if (!IMAGE_TYPES.includes(file.type)) {
        message.error('请上传JPG、 JEPG、PNG格式的图片');
        return false;
      }
      setImage(file as File);
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        message.error('文件大小需小于10M');
        return false;
      }
      return isLt2M;
    },
    onChange(info) {
      const { status, type, percent } = info.file;
      if (status === 'uploading') {
        !uploading && setUploading(!uploading);
        setPercent(percent as number);
      }
      if (status === 'done') {
        setAnalyzeImageData(info?.file?.response?.data);
        setUploading(false);
        setStatus('success');
        message.success(`${info.file.name} 解析成功`);
      } else if (status === 'error') {
        setUploading(false);
        message.error('因格式出错解析失败，请尽量使用原模板上传。');
      }
    },
  };

  const imgPreview = (urls: string[]) => {
    let data = urls.map(url => ({
      downloadUrl: url,
      previewUrl: url,
      OriginUrl: url,
      size: 480,
    }));
    ImgPreview.preview({
      data,
      startIndex: 0,
    });
  };

  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(image);
      reader.onload = event => {
        if (event.target && event.target.result) {
          const blob = new Blob([event.target.result], { type: image.type });
          const blobURL = window.URL.createObjectURL(blob);
          setImageUrl(blobURL);
        }
      };
    }
  }, [image]);

  const onChange = (rowIndex: number, columnsIndex: number, value: string | number) => {
    setAnalyzeImageData(pre => {
      let curr = { ...pre };
      curr.data[rowIndex + 1][columnsIndex] = value;
      return { ...curr } as FFMSRate.PricePicRes;
    });
  };

  useEffect(() => {
    if (analyzeImageData && analyzeImageData.data) {
      let firstRow = analyzeImageData.data[0];
      let options: FFMSRate.Option[] = [];
      let columns: ColumnsType<Record<string, string>[]> = [];
      (firstRow || []).forEach((text, columnsIndex) => {
        options.push({ label: `字段${columnsIndex + 1}`, value: columnsIndex });
        columns.push({
          title: `字段${columnsIndex + 1}/${text}`,
          dataIndex: `columns${columnsIndex}`,
          render: (value, row, rowIndex) => <Input value={value} onChange={e => onChange(rowIndex, columnsIndex, e.target.value)}></Input>,
        });
      });
      setOptions(options);
      setColumns(columns);
    }
    if (analyzeImageData && Array.isArray(analyzeImageData?.mappingRules) && !isHasMap) {
      let cloneData = cloneDeep(standardField);
      cloneData.map((item, index) => {
        item.codeIndex = analyzeImageData.mappingRules[index]?.index > -1 ? analyzeImageData.mappingRules[index]?.index : undefined;
        return item;
      });
      setStandardField([...cloneData]);
      setIsHasMap(true);
    }
  }, [analyzeImageData, isHasMap]);

  const dataSource = useMemo(() => {
    if (analyzeImageData && analyzeImageData.data) {
      let dataSource: Record<string, string>[] = [];
      (analyzeImageData.data || []).forEach((row, index) => {
        const rowData = row.reduce((accumulator, currentValue, index) => ({ ...accumulator, [`columns${index}`]: currentValue }), { rowId: index + '' });
        dataSource.push(rowData);
      });
      return dataSource;
    }
    return [];
  }, [analyzeImageData]);

  const Warning = () => {
    SiriusModal.warning({
      title: '字段不可重复配置，将按最近一次的配置为准',
      content: '您上传的数据字段不可重复配置给多个系统字段，系统将以最近的配置操作为准，原本的系统字段配置关系会解除',
      okText: '知道了',
      hideCancel: true,
      onOk: () => {
        setCanPrompt(false);
      },
    });
  };

  const isCanBatchAssign = () => {
    const priceKey = ['20GP', '40GP', '40HQ'];
    return standardField
      .filter(item => priceKey.includes(item.value))
      .every(priceItem => {
        if (typeof priceItem?.codeIndex === 'number') {
          if (priceItem.codeIndex < 0) {
            return true;
          }
          return false;
        } else {
          return true;
        }
      });
  };
  const handleChange = (selectFiledIndex: number, codeIndex: number, selectFiledValue: string) => {
    let findIndex = standardField.findIndex(item => item?.codeIndex === codeIndex);
    const priceKey = ['20GP', '40GP', '40HQ'];
    // if (findIndex > -1) {
    //   canPrompt && Warning();
    // }
    let cloneData = cloneDeep(standardField);
    let priceHasSelectedValue = standardField.filter(item => priceKey.includes(item.value)).map(item => item.codeIndex);
    cloneData = cloneData.map((standardFieldItem, filedIndex) => {
      // 修改价格
      if (priceKey.includes(selectFiledValue)) {
        // 价格全部为空
        if (isCanBatchAssign()) {
          if (findIndex === filedIndex) {
            standardFieldItem.codeIndex = undefined;
          }
          if (priceKey.includes(standardFieldItem.value)) {
            standardFieldItem.codeIndex = codeIndex;
          }
        } else {
          // 价格是其他价格选择的
          if (!priceHasSelectedValue.includes(codeIndex) && standardFieldItem.codeIndex === codeIndex && !priceKey.includes(standardFieldItem.value)) {
            standardFieldItem.codeIndex = undefined;
          }
          if (selectFiledIndex === filedIndex) {
            standardFieldItem.codeIndex = codeIndex;
          }
        }
      } else {
        // 修改非价格
        if (standardFieldItem.codeIndex === codeIndex) {
          standardFieldItem.codeIndex = undefined;
        }
        if (selectFiledIndex === filedIndex) {
          standardFieldItem.codeIndex = codeIndex;
        }
      }
      return standardFieldItem;
    });
    setStandardField([...cloneData]);
  };

  const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    ffmsApi
      .ffmsAnalyzePicture(formData, {
        onUploadProgress: (event: ProgressEvent) => {
          setPercent(Math.ceil((event.loaded / event.total) * 100) as number);
        },
      })
      .then(res => {
        setAnalyzeImageData(res);
        setStatus('success');
        message.success('解析成功');
        setImage(file as File);
      })
      .finally(() => setUploading(false));
  };

  useEventListener('paste', event => {
    var items = event.clipboardData && event.clipboardData.items;
    var file = null;
    if (items && items.length) {
      for (var i = 0; i < items.length; i++) {
        file = items[i].getAsFile();
        if (items[i].type.indexOf('image') > -1 && status === 'pedding') {
          if (!IMAGE_TYPES.includes(items[i].type)) {
            message.error('请上传JPG、 JEPG、PNG格式的图片');
          } else {
            !uploading && uploadFile(file as File);
          }
        }
      }
    }
  });

  return (
    <div className={style.upload}>
      {status === 'success' ? (
        <>
          <div className={style.commonBox}>
            <h3 className={style.title}>图片</h3>
            <div className={style.previewImage}>
              <img className={style.image} src={imageUrl} alt="本地预览" />
              <div className={style.mask}>
                <div className={style.maskItem} onClick={() => imageUrl && imgPreview([imageUrl])}>
                  <EyeOutlined /> 预览
                </div>
                <div
                  className={style.maskItem}
                  onClick={() => {
                    setStatus('pedding');
                    setOptions([]);
                    setColumns([]);
                    setIsHasMap(false);
                    setAnalyzeImageData();
                    onCancel();
                  }}
                >
                  <DeleteOutlined /> 清除
                </div>
              </div>
            </div>
          </div>
          <div className={style.commonBox}>
            <h3 className={style.title}>配置到系统字段</h3>
            <p className={style.subTitle}>
              请将识别出的字段配置到“系统字段”中，配置过字段的数据才会导入到系统中（若配置到的系统字段均为<span className={style.warningText}>带*</span>
              字段，导入后报价立即生效，否则为待生效）
            </p>
            <div className={style.box}>
              {standardField.map((item, index) => (
                <div className={style.boxItem}>
                  <div className={classnames(style.dragBox, { [style.dragBoxRequired]: item.required })} key={index}>
                    <span> {item.label}</span>
                  </div>
                  <EnhanceSelect
                    onChange={(value: number) => handleChange(index, value, item.value)}
                    value={item?.codeIndex}
                    allowClear
                    size="small"
                    showSearch={true}
                    optionFilterProp="label"
                    options={options}
                    placeholder={'请选择映射字段'}
                    style={{ width: '100%' }}
                  ></EnhanceSelect>
                </div>
              ))}
            </div>
          </div>
          <div className={style.commonBox}>
            <h3 className={style.title}>调整数据</h3>
            <p className={style.subTitle}>若需调整数据，可点击表格操作调整（建议仅调整存在对应系统字段的数据）</p>
            <CustomScrollTable>
              <Table className={'customs-scroll'} rowId={'rowId'} scroll={{ x: 'max-content' }} pagination={false} dataSource={dataSource.slice(1)} columns={columns} />
            </CustomScrollTable>
          </div>
        </>
      ) : (
        <Spin spinning={uploading} tip={`${percent}%`}>
          <Dragger {...props}>
            <div className={style.imageUploadWrap}>
              <TongyongTianjia />
              <div className={style.text}>点击选择、直接拖拽或者复制图片，快速生成报价。</div>
              <div className={style.imgType}>支持JPG、 JEPG、PNG图片（具有边框的图片识别准确率更高）</div>
            </div>
          </Dragger>
        </Spin>
      )}
    </div>
  );
};
