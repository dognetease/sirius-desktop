import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { navigate } from '@reach/router';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './style.module.scss';
import edmStyle from '@web-edm/edm.module.scss';
import styles from '../myDomain/style.module.scss';
import { api, apis, SiteApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as EmptyIcon } from '../../images/empty-1.svg';
import { ReactComponent as InfoIcon } from '../../images/info.svg';
// import { openWebUrlWithLoginCode } from '@web-common/utils/utils';
import { DomainNav } from '../../components/DomainNav';

export interface TemplateItem {
  addressEnglish: string;
  address: string;
  countryCode: string;
  cityEnglish: string;
  city: string;
  email: string;
  idCode: string;
  idTypeGswl: string;
  postalCode: string;
  regType: string;
  provinceEnglish: string;
  province: string;
  telephone: string;
  orgName: string;
  orgNameEnglish: string;
  fullName: string;
  fullNameEnglish: string;
  status: number;
  templateId: string;
  failInfo: string;
  cellphone: string;
  telephoneCode: string;
  telephoneExt: string;
  firstName?: string;
  firstNameEnglish?: string;
  lastName?: string;
  lastNameEnglish?: string;
}

interface ListItem {
  name: string;
  status: number;
  templateId: string;
  email: string;
  type: string;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

export const InfoTemplate = () => {
  const columns: ColumnsType<ListItem> = [
    {
      title: '持有者姓名(中文)',
      dataIndex: 'name',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: '持有者类型',
      dataIndex: 'type',
      render: value => <EllipsisTooltip>{value === 'I' ? '个人' : '企业/组织'}</EllipsisTooltip>,
    },
    {
      title: '模板状态',
      dataIndex: 'status',
      render: value => (
        <>
          {value === 2 && (
            <div className={style.statusWarn}>
              <span />
              审核中
            </div>
          )}
          {value === 4 && (
            <div className={style.statusSuccess}>
              <span />
              审核通过
            </div>
          )}
          {value === 1 && (
            <div className={style.statusFail}>
              <span />
              信息错误
            </div>
          )}
          {value === 3 && (
            <div className={style.statusFail}>
              <span />
              审核失败
            </div>
          )}
        </>
      ),
    },
    {
      title: '操作',
      dataIndex: 'templateId',
      render: (value, record) => (
        <div className={style.operator}>
          <div className={style.link} onClick={() => goCheckInfoTemplate(value)}>
            查看
          </div>
          {record.status !== 2 && (
            <>
              <div className={style.split}></div>
              <div className={style.link} onClick={() => showDeleteModal(value)}>
                删除
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  const [templateId, setCurrentId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ListItem[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });
  const [submiting, setSubmiting] = useState(false);

  const goMyDomain = () => {
    navigate('#site?page=myDomain');
  };

  const goCreateTemplate = () => {
    navigate('#site?page=createInfoTemplate');
  };

  const goCheckInfoTemplate = (id: string) => {
    navigate(`#site?page=checkInfoTemplate&templateId=${id}`);
  };

  const showDeleteModal = (id: string) => {
    setCurrentId(id);
    setShowModal(true);
  };

  const hideConfirmModal = () => {
    setShowModal(false);
  };

  const getTemplateList = async () => {
    try {
      setLoading(true);
      const { data, total } = await siteApi.domainTemplateList({
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      });
      setList(data ?? []);
      setTotalRecords(total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async () => {
    setSubmiting(true);
    try {
      await siteApi.deleteDomainTemplate({ templateId });
    } finally {
      setSubmiting(false);
      getTemplateList();
      hideConfirmModal();
    }
  };

  useEffect(() => {
    getTemplateList();
  }, [pagination]);

  // const goHelpCenter = () => {
  //   // window.open('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
  //   openWebUrlWithLoginCode('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
  // };

  return (
    <div className={style.infoTemplate}>
      <div className={style.infoTemplateHeader}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={goMyDomain}>域名管理</Breadcrumb.Item>
          <Breadcrumb.Item>信息模板</Breadcrumb.Item>
        </Breadcrumb>
        <div className={style.headerRight}>
          <button className={style.btn} onClick={goCreateTemplate}>
            创建模板
          </button>
        </div>
      </div>
      <div className={style.domainNav}>
        <DomainNav />
      </div>
      <div className={style.infoTemplateContent}>
        <div className={style.infoHeader}>
          <div>温馨提示</div>
          <p>1.根据最新政策法规要求，自2022年1月1日起，域名注册前必须使用已实名审核的信息模板，未及时完成实名认证的域名将限制续费、转移、过户等操作。</p>
          <p>2.已完成实名认证的域名信息模板，可直接用于域名新注、转入等操作，有助加快实名认证审核进程，建议您提前创建信息模板。</p>
          <p>3.域名信息模板实名审核一般需要 1～3 个工作日，具体取决于相关注册局审核时间。</p>
          <p>4.根据相关政策法规，域名实名信息必须使用已验证的手机、邮箱，已有信息模板需要补充完成验证才可使用。</p>
          <p>5.请前往手机邮箱验证页面，添加需要使用的手机、邮箱。</p>
        </div>
        <div className={style.infoTable}>
          <Table
            locale={{ emptyText: <div /> }}
            className={`${edmStyle.contactTable}`}
            rowKey="contactEmail"
            loading={loading}
            columns={columns}
            dataSource={list}
            scroll={{ x: list.length ? 910 : 0 }}
            pagination={
              list.length
                ? {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      height: 56,
                      margin: 0,
                    },
                    className: 'pagination-wrap',
                    size: 'small',
                    total: totalRecords,
                    pageSize: pagination.pageSize,
                    pageSizeOptions: ['20', '50', '100'],
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                      setPagination({
                        page,
                        pageSize: pageSize as number,
                      });
                    },
                  }
                : false
            }
          />
          {!loading && list.length === 0 && (
            <div className={style.emptyContainer}>
              {window.innerHeight > 700 && <EmptyIcon />}
              <span>暂无数据</span>
            </div>
          )}
        </div>
      </div>
      <Modal
        zIndex={800}
        visible={showModal}
        getContainer={false}
        width={400}
        className={styles.selectModal}
        title={
          <div className={styles.infoTitle}>
            <InfoIcon />
            提示
          </div>
        }
        maskClosable={false}
        destroyOnClose={true}
        onCancel={hideConfirmModal}
        onOk={deleteTemplate}
        footer={null}
      >
        <div className={styles.infoContent}>是否删除该信息模板？删除后不可恢复</div>
        <div className={style.btnGroup}>
          <button className={style.cancelBtn} onClick={hideConfirmModal}>
            取消
          </button>
          <button className={submiting ? style.submitBtnDisabled : style.submitBtn} onClick={deleteTemplate}>
            {submiting ? '提交中...' : '确定'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
