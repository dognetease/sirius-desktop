import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { Input, Table } from 'antd';
import { apiHolder, apis, WhatsAppApi, WhatsAppTemplate, RequestWhatsAppApprovedTemplates } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { showTemplatePreviewModal } from './templatePreview';
import { getPreviewTextFromTemplate, getTemplateAvailable } from '@/components/Layout/SNS/WhatsApp/utils';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import edmStyle from '@web-edm/edm.module.scss';
import style from './templatePicker.module.scss';
import { getIn18Text } from 'api';
interface TemplatePickerProps {
  visible: boolean;
  onPick: (template: WhatsAppTemplate) => void;
  onCancel: () => void;
  onInitialized?: (templates: WhatsAppTemplate[]) => void;
}
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const defaultParams = {
  templateName: '',
  start: 1,
  limit: 20,
};
const TemplatePicker: React.FC<TemplatePickerProps> = props => {
  const { visible, onPick, onCancel, onInitialized } = props;
  const initializedRef = useRef<boolean>(false);
  const [params, setParams] = useState<RequestWhatsAppApprovedTemplates>(defaultParams);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [tableData, setTableData] = useState<WhatsAppTemplate[]>([]);
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
      render: (_: any, template: WhatsAppTemplate) => getPreviewTextFromTemplate(template),
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
      render: (_: any, template: WhatsAppTemplate) => {
        if (!getTemplateAvailable(template)) return getIn18Text('BUZHICHIDEMOBANLEIXING');
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
      .getApprovedTemplates(params)
      .then(data => {
        if (didCancel) return;
        const templates = data.templates.map(template => {
          const structure = JSON.parse(template.structure as unknown as string);
          return { ...template, structure };
        });
        setTableData(templates);
        setTotal(data.size);
        if (!initializedRef.current && params === defaultParams && onInitialized) {
          onInitialized(templates);
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
              start: 1,
            })
          }
          onBlur={event =>
            setParams({
              ...params,
              templateName: event.target.value,
              start: 1,
            })
          }
          onPressEnter={event =>
            setParams({
              ...params,
              templateName: event.currentTarget.value,
              start: 1,
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
          current: params.start,
          pageSize: params.limit,
          pageSizeOptions: ['20', '50', '100'],
          showSizeChanger: true,
        }}
        onChange={pagination => {
          setParams(previous => ({
            ...params,
            limit: pagination.pageSize as number,
            start: pagination.pageSize === previous.limit ? (pagination.current as number) : 1,
          }));
        }}
      />
    </Modal>
  );
};
export default TemplatePicker;
