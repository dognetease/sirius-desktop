import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { Input, Table } from 'antd';
import { apiHolder, apis, WhatsAppApi, WhatsAppTemplateV2, RequestWhatsAppApprovedTemplatesV2 } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { showTemplatePreviewModal } from './templatePreview';
import { getPreviewTextFromTemplate } from '@/components/Layout/SNS/WhatsAppV2/utils';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import edmStyle from '@web-edm/edm.module.scss';
import style from './templatePicker.module.scss';
import { getIn18Text } from 'api';
interface TemplatePickerProps {
  visible: boolean;
  onPick: (template: WhatsAppTemplateV2) => void;
  onCancel: () => void;
  onInitialized?: (templates: WhatsAppTemplateV2[]) => void;
}
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const defaultParams: RequestWhatsAppApprovedTemplatesV2 = {
  templateName: '',
  page: 1,
  pageSize: 20,
};
const TemplatePicker: React.FC<TemplatePickerProps> = props => {
  const { visible, onPick, onCancel, onInitialized } = props;
  const initializedRef = useRef<boolean>(false);
  const [params, setParams] = useState<RequestWhatsAppApprovedTemplatesV2>(defaultParams);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [tableData, setTableData] = useState<WhatsAppTemplateV2[]>([]);
  const columns = [
    {
      title: getIn18Text('MOBANMINGCHENG'),
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: getIn18Text('MOBANNEIRONG'),
      dataIndex: 'structure',
      ellipsis: true,
      render: (_: any, template: WhatsAppTemplateV2) => getPreviewTextFromTemplate(template),
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      width: 170,
      dataIndex: 'createTime',
    },
    {
      title: getIn18Text('SHENQINGREN'),
      width: 90,
      ellipsis: true,
      dataIndex: 'createBy',
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 135,
      dataIndex: 'operations',
      className: style.operations,
      render: (_: any, template: WhatsAppTemplateV2) => {
        return (
          <>
            <a onClick={() => showTemplatePreviewModal(template)}>{getIn18Text('CHAKAN')}</a>
            <a onClick={() => onPick(template)}>{getIn18Text('SHIYONG')}</a>
          </>
        );
      },
    },
  ];
  useEffect(() => {
    let didCancel = false;
    setFetching(true);
    whatsAppApi
      .getApprovedTemplatesV2(params)
      .then(data => {
        if (didCancel) return;
        if (!data) return;
        setTableData(data.content || []);
        setTotal(data.totalSize || 0);
        if (!initializedRef.current && params === defaultParams && onInitialized) {
          onInitialized(data.content || []);
          initializedRef.current = true;
        }
      })
      .finally(() => {
        if (didCancel) return;
        setFetching(false);
      });
    return () => {
      didCancel = true;
    };
  }, [params]);
  return (
    <Modal className={classnames('edm', style.templatePicker)} width={736} title={getIn18Text('XIAOXIMOBANXUANZE')} footer={null} visible={visible} onCancel={onCancel}>
      <div className={classnames(edmStyle.filterBlock, style.filter)}>
        <Input
          placeholder={getIn18Text('QINGSHURUSOUSUONEIRONG')}
          prefix={<SearchIcon />}
          suffix={null}
          value={params.templateName}
          onChange={event =>
            setParams({
              ...params,
              templateName: event.target.value,
              page: 1,
            })
          }
          onBlur={event =>
            setParams({
              ...params,
              templateName: event.target.value,
              page: 1,
            })
          }
          onPressEnter={event =>
            setParams({
              ...params,
              templateName: event.currentTarget.value,
              page: 1,
            })
          }
          allowClear
        />
      </div>
      <Table
        className={edmStyle.contactTable}
        rowKey="id"
        columns={columns}
        loading={fetching}
        scroll={{ y: 330 }}
        dataSource={tableData}
        pagination={{
          className: 'pagination-wrap',
          size: 'small',
          total,
          current: params.page,
          pageSize: params.pageSize,
          pageSizeOptions: ['20', '50', '100'],
          showSizeChanger: true,
        }}
        onChange={pagination => {
          setParams(previous => ({
            ...params,
            pageSize: pagination.pageSize as number,
            page: pagination.pageSize === previous.pageSize ? (pagination.current as number) : 1,
          }));
        }}
      />
    </Modal>
  );
};
export default TemplatePicker;
