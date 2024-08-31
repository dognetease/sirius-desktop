/* eslint-disable camelcase */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Steps } from 'antd';
import { RcFile } from 'antd/lib/upload';
import { api, apis, CustomerApi, ResDMImport, ResParseTables } from 'api';
import classnames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { MapStatus, RowData } from './tableMapping';
import { FileUpload } from './step1';
import style from './dataTransfer.module.scss';
import { DataTransferResult } from './result';
import { DataMigrationStep2 } from './step2';
import { ReactComponent as StepFinishIcon } from '@/images/icons/edm/step-finish-icon.svg';
import { getIn18Text } from 'api';
const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const prepareImportReq = (data: Record<string, RowData[]>) => {
  const ret: Array<{
    file_name: string;
    default_value?: string;
    mapping_field_code: string;
    object_code: string;
    origin_column_number: string;
  }> = [];
  Object.keys(data).forEach(key => {
    const rowData = data[key];
    rowData.forEach(row => {
      if (row.mapping_field_code && row.object_code) {
        ret.push({
          file_name: key,
          mapping_field_code: row.mapping_field_code,
          object_code: row.object_code,
          origin_column_number: row.field_number,
          default_value: row.default_value,
        });
      }
    });
  });
  return ret;
};
const { Step } = Steps;
export const DataTransfer = (props: any) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firstUpload, setFirstUpload] = useState(true);
  const [files, setFiles] = useState<RcFile[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<ResParseTables>();
  const [sessionId, setSessionId] = useState('');
  const [mapParams, setMapParams] = useState<{
    [key: string]: RowData[];
  }>({});
  const clueImportRef = useRef<boolean>(false);
  const [canOverride, setCanOverride] = useState(false);
  const [allowEmptyMap, setAllowEmptyMap] = useState(false); // 是否检查有未映射字段
  const [importResult, setImportResult] = useState<ResDMImport>();
  const [firstShowHisotry, setFirstShowHistory] = useState(true);
  const [applyHistoryMapping, setApplyHistoryMapping] = useState(false);
  const parse = () => {
    const params = new FormData();
    params.append('session_id', sessionId);
    if (!firstUpload) {
      params.append('update_file', 'true');
    }
    files.forEach(f => params.append('files', f, f.name));
    setLoading(true);
    return customerApi
      .parseFiles(params)
      .then(res => {
        setUploadedFileIds(files.map(f => f.uid));
        setUploadResult(res);
        setFirstUpload(false);
        setMapParams({});
        setSessionId(res.session_id);
        return res;
      })
      .finally(() => setLoading(false));
  };
  const confirmOnContact = useCallback(
    () =>
      new Promise(resolve => {
        Modal.confirm({
          title: getIn18Text('TISHI'),
          content: getIn18Text('WEIXUANZE\u201CLIANXIREN\u201DDUIXIANG\uFF0CXIANGGUANSHUJUHUIDAORUXIANSUOLIEBIAO\uFF0CSHIFOUJIXU\uFF1F'),
          okText: getIn18Text('SHI'),
          cancelText: getIn18Text('FOU'),
          closable: true,
          onOk: () => {
            clueImportRef.current = true;
            resolve(true);
          },
          onCancel: () => resolve(false),
        });
      }),
    [clueImportRef]
  );
  // 调用时机
  const confirmAddClue = useCallback(
    () =>
      new Promise(resolve => {
        Modal.confirm({
          title: getIn18Text('TISHI'),
          content: getIn18Text('CUNZAIWUFAGUANLIANLIANXIRENDEKEHUSHUJU\uFF0CSHIFOUDAORUXIANSUOLIEBIAO\uFF1F'),
          okText: getIn18Text('SHI'),
          cancelText: getIn18Text('FOU'),
          onOk: () => {
            clueImportRef.current = true;
            resolve(true);
          },
          onCancel: () => resolve(false),
        });
      }),
    [clueImportRef]
  );
  const confirmApplyHisotryMap = () =>
    new Promise(resolve => {
      Modal.confirm({
        title: getIn18Text('TISHI'),
        content: getIn18Text('MOBANJIANCEDAOSHANGCIYIYOUYINGSHEGUANXI\uFF0CSHIFOUZIDONGTIANCHONG'),
        okText: getIn18Text('SHI'),
        cancelText: getIn18Text('FOU'),
        onOk() {
          setApplyHistoryMapping(true);
          resolve(true);
        },
        onCancel() {
          resolve(false);
        },
      });
    });
  const localValidMap = async () => {
    if (!allowEmptyMap) {
      const isAllFieldMapped = Object.keys(mapParams).every(key => mapParams[key].every(row => !row.mapStatus));
      if (!isAllFieldMapped) {
        Toast.warn(getIn18Text('CUNZAIWEIYINGSHEZIDUAN\uFF0CQINGGOUXUAN\u201CBUDAORUWEIYINGSHEZIDUAN\u201DXUANXIANGHOUJIXU\u3002'));
        return false;
      }
    }
    const isMapStatusResovled = Object.keys(mapParams).every(key => mapParams[key].every(row => row.mapStatus === 'success' || !row.mapStatus));
    if (!isMapStatusResovled) {
      // toast提示
      const hasFail = Object.keys(mapParams).some(key => mapParams[key].some(row => row.mapStatus === MapStatus.Error));
      Toast.warn({
        content: hasFail ? getIn18Text('CUNZAIYINGSHESHIBAIZIDUAN\uFF0CQINGXIUZHENGHOUZHONGSHI') : getIn18Text('ZIDUANYINGSHEYANZHENGZHONG\uFF0CQINGSHAOHOUZHONGSHI'),
      });
      return false;
    }
    // 必要字段检查
    const companyName = Object.keys(mapParams).some(key => mapParams[key].some(row => row.mapping_field_code === 'name'));
    const contactName = Object.keys(mapParams).some(key => mapParams[key].some(row => row.mapping_field_code === 'email'));
    if (!companyName) {
      Toast.warn(getIn18Text('GONGSIMINGCHENGWEIBITIANZIDUAN'));
      return false;
    }
    if (!contactName) {
      return confirmOnContact();
    }
    return true;
  };
  const remoteValidMap = () => {
    const maps = prepareImportReq(mapParams);
    return customerApi.validDMImport({
      session_id: sessionId,
      clue_import: clueImportRef.current,
      update: canOverride,
      field_mapping_list: maps,
    });
  };
  const doImport = () => {
    const maps = prepareImportReq(mapParams);
    return customerApi.doDMImport({
      session_id: sessionId,
      clue_import: clueImportRef.current,
      update: canOverride,
      field_mapping_list: maps,
    });
  };
  const next = async () => {
    const nextStep = step + 1;
    switch (step) {
      case 0: {
        if (files.length === 0) {
          return Toast.warn({ content: getIn18Text('QINGXUANZEWENJIAN') });
        }
        // 文件有改动，重新上传
        if (files.length !== uploadedFileIds.length || files.some(f => uploadedFileIds.indexOf(f.uid) === -1)) {
          parse().then(res => {
            if (res.history_field_mapping_list?.length > 0 && firstShowHisotry) {
              // confirm
              setFirstShowHistory(false);
              confirmApplyHisotryMap().finally(() => setStep(nextStep));
            } else {
              setApplyHistoryMapping(false);
              setStep(nextStep);
            }
          });
        } else {
          setStep(nextStep);
        }
        break;
      }
      case 1: {
        const flag = await localValidMap();
        if (!flag) return null;
        // console.log(prepareImportReq(mapParams));
        setLoading(true);
        remoteValidMap()
          .then(ret => {
            const _doImport = () =>
              doImport().then(res => {
                setImportResult(res);
                setStep(nextStep);
              });
            // 需要提示
            if (ret.need_clue_import) {
              return confirmAddClue().then(confirm => {
                if (confirm) {
                  return _doImport();
                }
                // todo: 弹窗操作只影响clueImport属性，这里可以合并
                return _doImport();
              });
            }
            // 直接导入成功
            setImportResult(ret);
            setStep(nextStep);
            return undefined;
          })
          .finally(() => setLoading(false));
        break;
      }
      default:
        break;
    }
    return null;
  };
  const prev = () => {
    setStep(step - 1);
  };
  // 再次导入
  const reset = () => {
    setStep(0);
    setFiles([]);
    setFirstUpload(true);
    setSessionId('');
    setMapParams({});
    setUploadResult(undefined);
    setAllowEmptyMap(false);
    clueImportRef.current = false;
    setCanOverride(false);
    setUploadedFileIds([]);
    setFirstShowHistory(true);
  };
  const selectedField = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.keys(mapParams).forEach(key =>
      mapParams[key].forEach(row => {
        if (row.object_code && row.mapping_field_code) {
          map[row.object_code + '_' + row.mapping_field_code] = true;
        }
      })
    );
    return map;
  }, [mapParams]);
  return (
    <div className={style.page} id="data-transfer-root">
      <div className={style.scrollContainer}>
        <h2>{getIn18Text('SHUJUQIANYI')}</h2>
        <div className={style.stepWrap}>
          <div className={style.steps}>
            <Steps current={step} className="edm-steps">
              <Step title={getIn18Text('WENJIANSHANGCHUAN')} description={getIn18Text('XUANZENINYAOSHANGCHUANDEWENJIAN')} icon={step > 0 ? <StepFinishIcon /> : null} />
              <Step title={getIn18Text('YINGSHE')} description={getIn18Text('XUANZEYINGSHEGUANXI')} icon={step > 1 ? <StepFinishIcon /> : null} />
              <Step title={getIn18Text('WANCHENG')} description={getIn18Text('WANCHENGSHUJUDAORU')} />
            </Steps>
          </div>
        </div>
        <div className={style.pageMain}>
          {step === 0 && <FileUpload files={files} onChange={setFiles} />}
          {step === 1 && (
            <DataMigrationStep2
              data={uploadResult}
              sessionId={sessionId}
              onMappingChange={(fileName, rowData) => {
                mapParams[fileName] = rowData;
                setMapParams({ ...mapParams });
              }}
              selectedField={selectedField}
              showHistoryMap={applyHistoryMapping}
              updateBaseInfo={props.updateBaseInfo}
            />
          )}
          {/* <div style={{ display: step === 1 ? '' : 'none'}}>
<DataMigrationStep2
data={uploadResult}
sessionId={sessionId}
onMappingChange={(fileName, rowData) => { mapParams[fileName] = rowData; setMapParams({ ...mapParams }); }}
selectedField={selectedField}
showHistoryMap={applyHistoryMapping}
/>
</div> */}
          {step === 2 && importResult && <DataTransferResult result={importResult} reset={reset} />}
        </div>
      </div>
      <div className={classnames(style.pageFooter, step === 1 ? style.showBorderTop : '')}>
        {step === 1 && (
          <>
            <Checkbox checked={allowEmptyMap} onChange={e => setAllowEmptyMap(e.target.checked)} style={{ marginRight: 24 }}>
              {getIn18Text('BUDAORUWEIYINGSHEZIDUAN')}
            </Checkbox>
            <Checkbox checked={canOverride} onChange={e => setCanOverride(e.target.checked)}>
              {getIn18Text('DAORUDEKEHU/LIANXIRENYUYIYOUSHUJUZHONGFUSHI\uFF0CGENGXINSHUJU')}
            </Checkbox>
          </>
        )}
        <div style={{ marginLeft: 32 }}>
          {step === 1 && (
            <Button type="default" onClick={prev}>
              {getIn18Text('SHANGYIBU')}
            </Button>
          )}
          {step < 2 && (
            <Button type="primary" onClick={next} style={{ marginLeft: 12 }} loading={loading}>
              {getIn18Text('XIAYIBU')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
