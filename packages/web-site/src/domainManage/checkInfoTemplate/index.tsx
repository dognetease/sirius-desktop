import React, { useState, useEffect } from 'react';
import { Form } from 'antd';
import { navigate } from '@reach/router';
import style from './style.module.scss';
import { api, apis, SiteApi } from 'api';
import { TemplateItem } from '../infoTemplate';
import { IDType } from '../createInfoTemplate';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as SuccessIcon } from '../../images/status-success.svg';
import { ReactComponent as FailedIcon } from '../../images/status-failed.svg';
import { ReactComponent as CheckingIcon } from '../../images/status-checking.svg';
import { countryMap } from '../createInfoTemplate/country.js';
import { getTransText } from '@/components/util/translate';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const { Item } = Form;

interface PageQueryString {
  templateId: string;
}

interface CheckInfoTemplateProps {
  qs: PageQueryString; // url 参数
  isComponent?: Boolean;
  onClose?: () => void;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

export const CheckInfoTemplate = (props: CheckInfoTemplateProps) => {
  const { templateId } = props.qs;
  const { isComponent = false, onClose } = props;
  const [data, setData] = useState<TemplateItem>();
  const [IDTypeList, setIDTypeList] = useState<IDType[]>([]);
  const openHelpCenter = useOpenHelpCenter();

  const getIDTypeList = async () => {
    try {
      const list = await siteApi.listIDType({});
      setIDTypeList(list);
    } catch {}
  };

  useEffect(() => {
    if (!templateId) {
      if (isComponent) {
        onClose?.();
      } else {
        goInfoTemplate();
      }
      return;
    }
    getIDTypeList();
    getTemplateData();
  }, []);

  const goMyDomain = () => {
    navigate('#site?page=myDomain');
  };

  const goInfoTemplate = () => {
    navigate('#site?page=infoTemplate');
  };

  const goEdit = () => {
    navigate(`#site?page=createInfoTemplate&templateId=${data?.templateId}`);
  };

  const goBack = () => {
    navigate(-1);
  };

  const getTemplateData = async () => {
    try {
      const res = await siteApi.getDomainTemplate({ templateId });
      setData(res);
    } catch {}
  };

  const goHelpCenter = () => {
    // window.open('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
    openHelpCenter('/d/1649407615124459521.html');
  };

  return (
    <div className={style.checkInfoTemplate}>
      <div className={isComponent ? `${style.container} ${style.compContainer}` : style.container}>
        {!isComponent && (
          <div className={style.checkInfoTemplateHeader}>
            <Breadcrumb>
              <Breadcrumb.Item onClick={goMyDomain}>域名管理</Breadcrumb.Item>
              <Breadcrumb.Item onClick={goInfoTemplate}>信息模板</Breadcrumb.Item>
              <Breadcrumb.Item>查看模板</Breadcrumb.Item>
            </Breadcrumb>
            <div className={style.headerRight}>
              <QuestionIcon />
              <span>域名管理常见问题</span>
              <div onClick={goHelpCenter}>点击了解</div>
            </div>
          </div>
        )}
        <Form colon={false}>
          <div className={style.checkInfoTemplateContent}>
            {/* <div className={style.back} onClick={goBack}>{`< 返回`}</div> */}
            {data?.status === 4 && (
              <div className={style.statusContainer}>
                <SuccessIcon />
                <div className={style.statusTitle}>审核通过</div>
                <div>已完成实名认证的域名信息模板，不可修改只可查看，可直接用于域名购买操作</div>
              </div>
            )}
            {data?.status === 2 && (
              <div className={style.statusContainerCheck}>
                <CheckingIcon />
                <div className={style.statusTitle}>审核中</div>
                <div>实名信息已递交至注册局，需要等待相关机构进行实名审核，平均审核时长为4天左右，请您耐心等待；审核完成后您的手机会收到短信通知，请您注意查收。</div>
              </div>
            )}
            {data?.status === 3 && (
              <div className={style.statusContainerFail}>
                <FailedIcon />
                <div className={style.statusTitle}>审核失败</div>
                <div>请根据失败原因和解决方案修改模板信息重新提交</div>
                <span className={style.link} onClick={goEdit}>{`${getTransText('SITE_QUXIUGAI')} >`}</span>
              </div>
            )}
            {data?.status === 1 && (
              <div className={style.statusContainerFail}>
                <FailedIcon />
                <div className={style.statusTitle}>信息错误</div>
                <div>请根据失败原因和解决方案修改模板信息重新提交</div>
                <span className={style.link} onClick={goEdit}>{`${getTransText('SITE_QUXIUGAI')} >`}</span>
              </div>
            )}
            {(data?.status === 1 || data?.status === 3) && (
              <div className={style.failInfo}>
                <div className={style.failTitle}>失败原因：</div>
                <div className={style.failContent} dangerouslySetInnerHTML={{ __html: data?.failInfo ?? '' }}></div>
              </div>
            )}
            <div className={style.title}>模板状态</div>
            <Item label="认证状态">
              {data?.status === 1 && '信息错误'}
              {data?.status === 2 && '审核中'}
              {data?.status === 3 && '审核失败'}
              {data?.status === 4 && '审核通过'}
            </Item>
            <div className={style.line}></div>
            <div className={style.title}>中文信息模板</div>
            <Item label="域名持有者类型">{!data ? '' : data.regType === 'I' ? '个人' : '企业/组织'}</Item>
            {data?.regType === 'E' && <Item label="所有者单位名称">{data?.orgName}</Item>}
            <Item label="域名持有者姓名">{!data ? '' : data?.fullName ? data.fullName : `${data?.lastName}${data?.firstName}`}</Item>
            <Item label="所属区域">
              {!data ? '' : (countryMap as any)[data?.countryCode ?? 'CN'].l} {!data ? '' : data?.province} {!data ? '' : data?.city}
            </Item>
            <Item label="通讯地址">{!data ? '' : data?.address}</Item>
            <Item label="邮编">{!data ? '' : data?.postalCode}</Item>
            <Item label="联系电话">
              {!data ? '' : (countryMap as any)[data?.countryCode ?? 'CN'].p}{' '}
              {!data ? '' : data?.cellphone ? data.cellphone : `${data?.telephoneCode}-${data?.telephone} ${data?.telephoneExt}`}
            </Item>
            <Item label="电子邮箱">{!data ? '' : data?.email}</Item>
            <div className={style.title} style={{ marginTop: '45px' }}>
              域名所有者身份认证
            </div>
            <Item label="证件类型">{!data ? '' : IDTypeList.find(i => i.code === data?.idTypeGswl)?.description}</Item>
            <Item label="证件号码">{!data ? '' : data?.idCode}</Item>
          </div>
        </Form>
      </div>
    </div>
  );
};
