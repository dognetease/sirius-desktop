// 此文件注释代码均为原功能后又屏蔽，以后的版本可能还会放开，不可删除
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Form, Popover, FormInstance } from 'antd';
import { useAppSelector } from '@web-common/state/createStore';
import { DOMAIN_MATCH_REGEX } from '../../utils/utils';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, EdmSendBoxApi, SendBoxSender, MailConfApi, AccountApi } from 'api';
// import ExclamationCircleFilled from '@ant-design/icons/ExclamationCircleFilled';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { ReactComponent as RightArrowIcon } from '@/images/icons/edm/yingxiao/right-arrow.svg';
// import Divider from '@web-common/components/UI/Divider';
import Divider from '@lingxi-common-component/sirius-ui/Divider';
import style from './senderEmail.module.scss';
import { getIn18Text } from 'api';

const systemApi = apiHolder.api.getSystemApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const mailConfigApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

const STATUS_LIST = [getIn18Text('YANZHENGZHONG...'), getIn18Text('YANZHENGCHENGGONG'), getIn18Text('YANZHENGSHIBAI')];
// const EXCELLENT_LIST = [0, 1];
// 赠送域名屏蔽
const PRESENT = 'ntesmail.com';

export interface SenderEmailProps {
  // 表单
  form: FormInstance;
  // 下拉框下方提示的左边距
  leftMargin?: number;
  // 表单的key
  name?: string | string[];
  onSenderEmailChange?: (value?: string) => void;
}
export const SenderEmail: React.FC<SenderEmailProps> = prop => {
  // 登录用户主账号
  const mainEmail = systemApi.getCurrentUser()?.id || undefined;
  // 回填邮箱，本来应该直接使用form的自动回填，但因为需要与下拉选项中进行比较，下拉中存在则回填，不存在则取主邮箱，所以使用prop方式传递
  const { form, leftMargin = 0, name = 'senderEmail', onSenderEmailChange } = prop;
  // 选中项发信效果，仅作为select下方内容显示的依据
  const [selectItem, setSelectItem] = useState<SendBoxSender>();
  // 下拉数据
  const [emailDataList, setEmailDataList] = useState<SendBoxSender[]>();
  // 是否有可用发件地址
  const [available, setAvailable] = useState<boolean>(true);
  // 是否是管理员
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // 获取发件地址列表
  const getSenderList = () => {
    edmApi
      .getSendBoxSenderList()
      .then(res => {
        // 过滤赠送域名
        const list = (res?.senderList || []).filter(item => {
          if (item.email) {
            const regexRes = item.email.match(DOMAIN_MATCH_REGEX);
            return !regexRes || regexRes[0].indexOf(PRESENT) === -1;
          }
          return false;
        });
        setEmailDataList(list);
      })
      .catch(() => {
        setEmailDataList([]);
        form.setFields([{ name, value: mainEmail }]);
        sendEmail(mainEmail);
      });
  };

  // 接口获取下拉数据
  useEffect(() => {
    getSenderList();
    // 获取是否为管理员
    accountApi.doGetAccountIsAdmin().then(res => setIsAdmin(res));
  }, []);
  useEffect(() => {
    if (!Array.isArray(emailDataList)) {
      return;
    }
    if (emailDataList.length > 0) {
      const initEmail = form.getFieldValue(name)?.trim();
      // 先在下拉选项中寻找回填邮箱
      let defaultItem = emailDataList.find(item => item.email === initEmail);
      // 不存则在下拉选项中寻找主邮箱
      defaultItem = defaultItem ? defaultItem : emailDataList.find(item => item.email === mainEmail);
      // 下拉中存在则回填（正常情况肯定存在），不存在不回填并清空输入框
      if (defaultItem?.email) {
        form.setFields([{ name, value: defaultItem.email }]);
        sendEmail(defaultItem.email);
        setSelectItem(defaultItem);
        setAvailable(true);
        edmApi.refreshUnsubscribeUrl(defaultItem.email);
      } else {
        form.setFields([{ name, value: undefined }]);
        sendEmail(undefined);
      }
    } else {
      // form.setFields([{ name, errors: [''] }])这种方式无法配置ReactNode
      form.setFields([{ name, value: undefined }]);
      sendEmail(undefined);
      setAvailable(false);
    }
  }, [emailDataList]);

  // 提示和popover的特殊效果文案
  // const renderEffect = () => {
  //   if (selectItem?.levelDesc) {
  //     return <span className={EXCELLENT_LIST.includes(selectItem.level) ? style.senderEmailGood : style.senderEmailBad}>{selectItem.levelDesc}</span>;
  //   }
  //   return <></>;
  // };

  const handleBackEnd = async () => {
    const redirectUrl =
      mailConfigApi.getWebMailHost(true) + '/admin/login.do?anchor=/domainManage/domainManage&hl=zh_CN&uid=' + systemApi.getCurrentUser()?.id + '&app=admin&all_secure=1';
    const url: string | undefined = await mailConfigApi.getWebSettingUrlInLocal('', { url: redirectUrl });
    if (url && url.length > 0) {
      systemApi.openNewWindow(url, false, undefined, undefined, true);
    } else {
      Toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };

  const sendEmail = (email?: string | undefined) => {
    onSenderEmailChange && onSenderEmailChange(email);
  };

  return (
    <div className={style.senderEmail}>
      <Form.Item
        label={getIn18Text('FAJIANDEZHI')}
        name={name}
        rules={[{ required: true, message: getIn18Text('QINGSHURUFAJIANDEZHI') }]}
        // tooltip={
        //   {
        //     title: '支持更换发件地址发送营销邮件，提高送达率',
        //     placement: 'bottom',
        //   }
        // }
        // 过滤选中的内容 决定是否回填标签（选中项属于无法收信时回填标签）
        getValueFromEvent={value => {
          const item = emailDataList?.find(item => item.email === value);
          setSelectItem(item);
          // 选中后重新获取选中域名的基础认证信息，这里直接刷新了列表
          getSenderList();
          // 更新域名相关
          edmApi.refreshUnsubscribeUrl(value);
          return value;
        }}
      >
        <EnhanceSelect
          className={available ? {} : style.emptySelect}
          placeholder={available ? getIn18Text('ZHICHIGENGHUANFAJIANDE') : getIn18Text('WUKEYONGFAJIANDEZHI')}
        >
          {emailDataList?.map(item => (
            <InSingleOption key={item.email} value={item.email}>
              <>
                {item.email}
                {/* {item.levelDesc ? <span className={EXCELLENT_LIST.includes(item.level) ? style.senderEmailGoodTag : style.senderEmailBadTag}>{item.levelDesc}</span> : <></>}
                {item?.tagList?.map((itm: string) => <span className={style.senderEmailWorseTag}>{itm}</span>)} */}
              </>
            </InSingleOption>
          ))}
        </EnhanceSelect>
      </Form.Item>
      {/* leftMargin为什么要写死？ */}
      {available ? (
        selectItem && [selectItem.spf1Status, selectItem.dkimStatus, selectItem.dmarcStatus].includes(2) ? (
          <div className={style.tip} style={{ marginLeft: `${leftMargin}px` }}>
            {getIn18Text('CIYUMINGJICHURENZHENG')}
            <Popover
              placement="bottomRight"
              overlayClassName={style.senderEmailPopover}
              title={
                <div className={style.senderEmailPopoverContent}>
                  <p className={style.popoverTitle}>{getIn18Text('JICHURENZHENG（JICHU')}</p>
                  <p className={style.popoverDesc}>SPF: {STATUS_LIST[selectItem.spf1Status]}</p>
                  <p className={style.popoverDesc}>DKIM: {STATUS_LIST[selectItem.dkimStatus]}</p>
                  <p className={style.popoverDesc}>DMARC: {STATUS_LIST[selectItem.dmarcStatus]}</p>
                  <Divider margin={12} />
                  <p className={style.popoverTitle}>{getIn18Text('PEIZHIFANGSHI（KEZAI')}</p>
                  <p className={style.popoverDesc}>{getIn18Text('QIYEGUANLIYUAN >')}</p>
                </div>
              }
            >
              <span className={style.more}>{getIn18Text('XIANGQING')}</span>
            </Popover>
          </div>
        ) : (
          <div className={style.tip} style={{ marginLeft: `${leftMargin}px` }}>
            {getIn18Text('YONGBUTONGYUMINGDEFA')}
          </div>
        )
      ) : (
        <div className={classnames(style.tip, style.errorTip)} style={{ marginLeft: `${leftMargin}px` }}>
          {getIn18Text('ZENGSONGYUMINGWUFAFA')}
          {isAdmin ? (
            <span className={style.config} onClick={handleBackEnd}>
              {getIn18Text('QUPEIZHI')}
              <RightArrowIcon />
            </span>
          ) : (
            <></>
          )}
        </div>
      )}
      {/* {selectItem ? (
        <div className={style.tip} style={{ marginLeft: `${leftMargin}px` }}>
          所选域名的综合发信效果为{renderEffect()}
          ，{EXCELLENT_LIST.includes(selectItem.level) ? '请您继续保持。' : '建议更换发件地址。'}
          <Popover
            placement='bottomRight'
            overlayClassName={style.senderEmailPopover}
            title={
              <div className={style.senderEmailPopoverContent}>
                <p className={style.popoverTitle}>发信效果：{renderEffect()}</p>
                <p className={style.popoverDesc}>根据域名的基础信息和综合发信效果等维度进行判断。</p>
                <Divider margin={12} />
                <p className={style.popoverTitle}>基础认证: </p>
                <p className={style.popoverDesc}>SPF: {STATUS_LIST[selectItem.spf1Status]}</p>
                <p className={style.popoverDesc}>DKIM: {STATUS_LIST[selectItem.dkimStatus]}</p>
                <p className={style.popoverDesc}>DMARC: {STATUS_LIST[selectItem.dmarcStatus]}</p>
                {[selectItem.spf1Status, selectItem.dkimStatus, selectItem.dmarcStatus].includes(2) ? <p className={style.popoverWarn}><ExclamationCircleFilled className={style.popoverIcon} />请联系管理员进行配置</p> : <></>}
                <Divider margin={12} />
                <p className={style.popoverTitle}>发信数据：</p>
                <p className={style.popoverDesc}>根据您选择的邮箱地址域名的过往发信综合效果进行判断。主要包含拒信率、送达率、退信率、垃圾率等维度。</p>
              </div>
            }
          >
            <span className={style.more}>{getIn18Text('LIAOJIEGENGDUO')}</span>
          </Popover>
        </div>
      ) : null} */}
    </div>
  );
};
