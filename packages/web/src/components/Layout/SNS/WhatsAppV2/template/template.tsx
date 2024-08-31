import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { Button } from 'antd';
import { ColumnsType } from 'antd/es/table';
import {
  apiHolder,
  apis,
  WhatsAppApi,
  WhatsAppTemplate,
  WhatsAppTemplateStatus,
  getWhatsAppTemplateStatusName,
  WhatsAppTemplateStatusColor,
  RequestWhatsAppTemplatesV2,
  WhatsAppTemplateV2,
} from 'api';
import { navigate } from '@reach/router';
import { getPreviewTextFromTemplate } from '@/components/Layout/SNS/WhatsAppV2/utils';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import TemplateEditor from '../components/template/templateEditor';
import { showTemplatePreviewModal } from '../components/template/templatePreview';
import TemplateNotice from '@/images/icons/whatsApp/template-notice.png';
import { EmptyList } from '@web-edm/components/empty/empty';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import edmStyle from '@web-edm/edm.module.scss';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { getIn18Text } from 'api';
import { useWaContextV2 } from '../context/WaContextV2';
import style from './template.module.scss';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const WhatsAppTemplateStatusName = getWhatsAppTemplateStatusName();
const TEMPLATE_STATUS_OPTIONS = Object.entries(WhatsAppTemplateStatusName).map(([value, text]) => ({ value, text }));
const Template = () => {
  const { refreshOrgStatus, refreshAllotPhones } = useWaContextV2();
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplateV2 | null>(null);
  const [params, setParams] = useState<RequestWhatsAppTemplatesV2>({
    templateName: '',
    templateStatus: undefined,
    page: 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [tableData, setTableData] = useState<WhatsAppTemplateV2[]>([]);
  const [drafting, setDrafting] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { layout, growRef, scrollY } = useResponsiveTable();
  const columns: ColumnsType<WhatsAppTemplateV2> = [
    {
      title: getIn18Text('MOBANMINGCHENG'),
      dataIndex: 'name',
      className: style.templateNameWidth,
      ellipsis: true,
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      width: 90,
      dataIndex: 'status',
      render: (text: keyof typeof WhatsAppTemplateStatusName) => {
        const statusName = WhatsAppTemplateStatusName[text];
        const backgroundColor = WhatsAppTemplateStatusColor[text];
        return (
          <span className={style.templateStatusLabel} style={{ backgroundColor }}>
            {statusName}
          </span>
        );
      },
    },
    {
      title: getIn18Text('MOBANNEIRONG'),
      dataIndex: 'structure',
      className: style.templateStructureWidth,
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
      className: style.createByWidth,
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 190,
      fixed: 'right',
      dataIndex: 'operations',
      className: style.operations,
      render: (_: any, template: WhatsAppTemplateV2) => {
        return (
          <>
            <PrivilegeCheck accessLabel="VIEW" resourceLabel="WHATSAPP">
              <a onClick={() => showTemplatePreviewModal(template)}>{getIn18Text('CHAKAN')}</a>
            </PrivilegeCheck>
            {template.status === WhatsAppTemplateStatus.DRAFT && (
              <>
                <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                  <a onClick={() => handleTemplateDraftSubmit(template)}>{getIn18Text('TIJIAO')}</a>
                </PrivilegeCheck>
                <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                  <a onClick={() => handleTemplateDraftEdit(template.id)}>{getIn18Text('BIANJI')}</a>
                </PrivilegeCheck>
                <PrivilegeCheck accessLabel="DELETE" resourceLabel="WHATSAPP">
                  <a onClick={() => handleTemplateDraftDelete(template.id)}>{getIn18Text('SHANCHU')}</a>
                </PrivilegeCheck>
              </>
            )}
            {template.status === WhatsAppTemplateStatus.APPROVED && (
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleTemplateJob(template.id)}>{getIn18Text('CHUANGJIANQUNFA')}</a>
              </PrivilegeCheck>
            )}
          </>
        );
      },
    },
  ];
  useEffect(() => {
    whatsAppTracker.trackTemplate('show');
  }, []);
  useEffect(() => {
    refreshAllotPhones();
  }, []);
  useEffect(() => {
    let didCancel = false;
    setFetching(true);
    whatsAppApi
      .getTemplatesV2(params)
      .then(data => {
        if (didCancel) return;
        if (!data) return;
        setTableData(data.content || []);
        setTotal(data.totalSize);
      })
      .finally(() => {
        if (didCancel) return;
        setFetching(false);
      });
    return () => {
      didCancel = true;
    };
  }, [params]);
  // 编辑框: 编辑内容 -> 存草稿
  const handleTemplateDraft = (template: WhatsAppTemplateV2) => {
    // 新建场景: 新建草稿
    if (!editingTemplate || !editingTemplate.id) {
      setDrafting(true);
      whatsAppApi
        .editTemplateDraftV2(template)
        .then(() => {
          setParams({ ...params, page: 1 });
          setEditorVisible(false);
          Toast.success({ content: getIn18Text('XINJIANCHENGGONG\uFF01') });
        })
        .finally(() => {
          setDrafting(false);
        });
    } else {
      // 编辑场景: 更新草稿 by id
      template.id = editingTemplate.id;
      setDrafting(true);
      whatsAppApi
        .editTemplateDraftV2(template)
        .then(() => {
          setParams({ ...params });
          setEditorVisible(false);
          setEditingTemplate(null);
          Toast.success({ content: getIn18Text('BIANJICHENGGONG\uFF01') });
        })
        .finally(() => {
          setDrafting(false);
        });
    }
  };
  // 编辑框: 编辑内容 -> 提交审核
  const handleTemplateSubmit = (template: WhatsAppTemplateV2) => {
    whatsAppTracker.trackTemplate('submit');
    // 新建场景: 提交模板审核
    if (!editingTemplate || !editingTemplate.id) {
      setSubmitting(true);
      whatsAppApi
        .submitTemplateV2(template)
        .then(() => {
          setParams({ ...params, page: 1 });
          setEditorVisible(false);
          Toast.success({ content: getIn18Text('TIJIAOCHENGGONG\uFF01') });
        })
        .finally(() => {
          setSubmitting(false);
        });
    } else {
      // 编辑场景: 提交模板审核 by id
      template.id = editingTemplate.id;
      setSubmitting(true);
      whatsAppApi
        .submitTemplateV2(template)
        .then(() => {
          setParams({ ...params });
          setEditorVisible(false);
          setEditingTemplate(null);
          Toast.success({ content: getIn18Text('TIJIAOCHENGGONG\uFF01') });
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };
  // 列表中: 草稿模板 -> 提交审核
  const handleTemplateDraftSubmit = (template: WhatsAppTemplateV2) => {
    Modal.confirm({
      title: getIn18Text('TIJIAOCAOGAOMOBAN'),
      content: getIn18Text('QUERENTIJIAOCICAOGAOMOBANMA\uFF1F'),
      onOk: () => {
        whatsAppTracker.trackTemplate('submit');
        return whatsAppApi.submitTemplateV2(template).then(() => {
          setParams({ ...params });
          Toast.success({ content: getIn18Text('TIJIAOCHENGGONG\uFF01') });
        });
      },
    });
  };
  const handleTemplateDraftDelete = (id: string) => {
    Modal.confirm({
      title: getIn18Text('SHANCHUCAOGAOMOBAN'),
      content: getIn18Text('QUERENSHANCHUCICAOGAOMOBANMA\uFF1F'),
      onOk: () =>
        whatsAppApi.deleteTemplateDraftV2({ id }).then(() => {
          setParams({ ...params, page: 1 });
          Toast.success({ content: getIn18Text('SHANCHUCHENGGONG\uFF01') });
        }),
    });
  };
  const handleTemplateDraftEdit = (id: string) => {
    const nextEditingTemplate = tableData.find(item => item.id === id);
    if (nextEditingTemplate) {
      setEditorVisible(true);
      setEditingTemplate(nextEditingTemplate);
    }
  };
  const handleTemplateCancel = () => {
    setEditorVisible(false);
    setEditingTemplate(null);
  };
  const handleTemplateJob = (id: string) => {
    navigate(`#edm?page=whatsAppJobEdit&defaultTemplateId=${id}`);
  };
  return (
    <PermissionCheckPage resourceLabel="WHATSAPP" accessLabel="VIEW" menu="WHATSAPP_MSG_TPL_SETTING">
      <div className={classnames('edm', edmStyle.container, style.template, layout.container)}>
        <div className={layout.static}>
          <div className={classnames(edmStyle.pageHeader, style.header)}>
            <span className={classnames(edmStyle.title, style.title)}>
              {getIn18Text('WhatsApp MOBANXIAOXILIEBIAO')}
              <span
                className={classnames(style.refresh, 'sirius-no-drag')}
                onClick={() => {
                  setParams({ ...params });
                  refreshOrgStatus();
                  refreshAllotPhones();
                }}
              >
                <RefreshSvg />
              </span>
            </span>
            <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
              <Button
                type="primary"
                className={classnames(style.headerButton, 'ant-btn-wide', 'sirius-no-drag')}
                onClick={() => {
                  setEditorVisible(true);
                  whatsAppTracker.trackTemplate('create');
                }}
              >
                {getIn18Text('CHUANGJIANMOBAN')}
              </Button>
            </PrivilegeCheck>
          </div>
          <div className={style.notice}>
            <img src={TemplateNotice} />
            <div className={style.noticeContent}>
              <div className={style.noticeTitle}>{getIn18Text('WhatsApp XIAOXIMOBAN\uFF0CKEYIBANGZHUQIYECHUDAQIANZAIKEHU\uFF0CDADAOJIANLIGOUTONGDEMUDE\u3002')}</div>
              <div className={style.noticeItem}>
                {getIn18Text('-MOBANDETIJIAOSHENHEHOU\uFF0CXUYOU WhatsApp GUANFANGSHENHERENYUANJINXINGSHENHE\uFF0CYUJI2-3GEGONGZUORI\uFF0CQINGNAIXINDENGDAI~')}
              </div>
            </div>
          </div>
          <div className={classnames(edmStyle.filterBlock, style.filter)}>
            <Input
              placeholder={getIn18Text('QINGSHURUSOUSUONEIRONG')}
              prefix={<SearchIcon />}
              suffix={null}
              value={params.templateName}
              allowClear
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
            />
            <EnhanceSelect
              placeholder={getIn18Text('MOBANZHUANGTAI')}
              className="no-border-select"
              allowClear
              value={params.templateStatus}
              onChange={templateStatus =>
                setParams({
                  ...params,
                  templateStatus,
                  page: 1,
                })
              }
            >
              {TEMPLATE_STATUS_OPTIONS.map(option => (
                <InSingleOption key={option.value} value={option.value}>
                  {option.text}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          </div>
        </div>
        {tableData.length ? (
          <div className={layout.grow} ref={growRef}>
            <Table
              rowKey="id"
              columns={columns}
              loading={fetching}
              scroll={{
                x: 'max-content',
                y: scrollY,
              }}
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
              onChange={(pagination: any) => {
                setParams(previous => ({
                  ...params,
                  pageSize: pagination.pageSize as number,
                  page: pagination.pageSize === previous.pageSize ? (pagination.current as number) : 1,
                }));
              }}
            />
          </div>
        ) : (
          <EmptyList style={{ height: 300 }}>
            <p>{getIn18Text('DANGQIANMEIYOURENHEXIAOXIMOBAN')}</p>
          </EmptyList>
        )}
        <Modal className={style.templateEditorModal} title={getIn18Text('MOBANSHEZHI')} width={820} footer={null} visible={editorVisible} onCancel={handleTemplateCancel}>
          <TemplateEditor
            template={editingTemplate}
            drafting={drafting}
            submitting={submitting}
            onCancel={handleTemplateCancel}
            onDraft={handleTemplateDraft}
            onSubmit={handleTemplateSubmit}
          />
        </Modal>
      </div>
    </PermissionCheckPage>
  );
};
export default Template;
