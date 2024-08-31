// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import { Alert, Empty, Form, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'react-use';
import { EmailGuessState } from '../keywordsSubscribe/subcontext';
import { AddressBookApi, api, apiHolder, apis, BusinessMapModel, EdmSendBoxApi, GlobalSearchApi } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import style from './emailguess.module.scss';

import { ImageEmptyNormal } from '../search/EmptyResult/EmptyImge';
import useEdmSendCount, { IEdmEmailList } from '../../Customer/components/hooks/useEdmSendCount';
import { addContact2AddressBookRequest } from '@web-edm/addressBook/views/addContact2AddressBook/utils';
import { AddContact2AddressBook } from '@web-edm/addressBook/views/addContact2AddressBook';
import EmailGuessResult from './EmailGuessResult';
import EmailGuessCheckProcess from './EmailGuessCheckProcess';
import { globalSearchDataTracker } from '../tracker';
import classNames from 'classnames';
import { getIn18Text } from 'api';
import getPageRouterWithoutHash from '../hook/getPageRouterWithoutHash';

const inWindowsClient = apiHolder.env.forElectron && !apiHolder.env.isMac;
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const addressBookApi = api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const eventApi = api.getEventApi();

interface CheckedRes {
  verifyContactList: Array<{
    contactEmail: string;
    contactName: string;
    op: string;
    reason: string;
    verifyStatus: -1 | 1 | number;
  }>;
  businessMap: Record<string, number | string>;
}

interface EmailGuessProps extends EmailGuessState {
  onClose?(): void;
  container?: HTMLElement;
}

type FormData = Omit<Required<EmailGuessState>['initInfo'], 'id'>;

const EmailGuess: React.FC<EmailGuessProps> = ({ visible, initInfo, onClose, container }) => {
  const [form] = Form.useForm<FormData>();
  const { domain: formDomain = initInfo?.domain, name: formName = initInfo?.name } = form.getFieldsValue();
  const [guessEmailList, setGuessEmailList] = useState<string[]>([]);
  const [sellEmailState, setSellEmailState] = useState<{
    list: string[];
    draftId: string;
  }>({
    list: [],
    draftId: '',
  });
  const [validState, setValidState] = useState<{
    stage?: 'validing' | 'finish';
    draftId?: string;
    list?: Array<{
      email: string;
      valid: boolean;
    }>;
  }>({});

  const handleValidEmails = async (list: string[]) => {
    const draftId = await edmApi.createDraft();
    let first = true;
    let businessMapTemp: BusinessMapModel | null | undefined = null;
    const checkedMap = new Map<string, CheckedRes['verifyContactList'][number]>();
    const uncheckedList = new Set<string>(list);
    let limit = 20;
    setValidState({
      stage: 'validing',
    });
    while (uncheckedList.size > 0 && limit > 0 && checkedMap.size < list.length) {
      try {
        const { verifyContactList, businessMap }: CheckedRes = await new Promise((res, rej) => {
          edmApi
            .checkEmailAddress({
              draftId,
              contacts: Array.from(uncheckedList).map(eml => ({ email: eml, name: '' })),
              businessMap: businessMapTemp,
              first,
              businessType: 'global_search',
            })
            .then(result => {
              setTimeout(() => {
                res(result);
              }, 3000);
            })
            .catch(rej);
        });
        businessMapTemp = businessMap;
        first = false;
        limit--;
        verifyContactList.forEach(vc => {
          // 已经检测并且Map
          if (vc.verifyStatus !== -1) {
            checkedMap.set(vc.contactEmail, vc);
            uncheckedList.delete(vc.contactEmail);
          }
        });
        setValidState({
          stage: 'validing',
          list: Array.from(checkedMap.keys()).map(key => {
            return {
              email: key,
              valid: checkedMap.get(key)?.verifyStatus === 1,
            };
          }),
        });
      } catch (error) {
        message.error('校验失败，请检查域名格式或稍后再试');
        limit = 0;
        setValidState({});
      }
    }
    const finalList = Array.from(checkedMap.keys()).map(key => {
      return {
        email: key,
        valid: checkedMap.get(key)?.verifyStatus === 1,
      };
    });
    setValidState({
      stage: 'finish',
      list: finalList,
      draftId,
    });
    if (initInfo && finalList.filter(e => e.valid).map(e => e.email).length > 0) {
      await globalSearchApi.doSaveEmailGuessValid({
        id: initInfo.id,
        name: initInfo.name,
        validEmailList: finalList.filter(e => e.valid).map(e => e.email),
      });
    }
  };
  useDebounce(
    async () => {
      if (visible && formName && formDomain) {
        try {
          const { name, domain } = await form.validateFields();
          const listRes = await globalSearchApi.doGetEmailGuess({
            name,
            domain,
          });
          if (listRes) {
            setGuessEmailList(Array.from(new Set(listRes)));
          }
        } catch (error) {
          setGuessEmailList([]);
        }
      }
    },
    500,
    [visible, formDomain, formName]
  );

  const formItemDisable = new Boolean(initInfo || validState.stage === 'validing').valueOf();

  const sendEmails = useMemo<IEdmEmailList[]>(() => {
    return sellEmailState.list.map(e => ({ contactEmail: e, contactName: '', sourceName: '全球搜索' }));
  }, [sellEmailState.list]);

  useEdmSendCount(sendEmails, 'normal', 'global_search', sellEmailState.draftId, 'globalSearch', 'globalSearch', getPageRouterWithoutHash());

  return (
    <>
      <SiriusDrawer
        getContainer={container}
        visible={visible}
        zIndex={1050}
        title="猜测邮箱"
        destroyOnClose
        onClose={() => {
          if (validState.stage === 'validing') {
            message.warn('邮箱验证中，请稍后');
          } else {
            if (initInfo && validState.list && validState.list.filter(e => e.valid).length > 0) {
              eventApi.sendSysEvent({
                eventName: 'globalSearchGrubTaskFinish',
                eventData: {
                  type: 'refresh',
                  data: {
                    id: initInfo.id,
                  },
                },
              });
            }
            onClose?.();
          }
        }}
        className={classNames(style.drawer, {
          [style.drawerWindows]: inWindowsClient,
        })}
        bodyStyle={{
          padding: '0 24px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
        }}
        width={468}
      >
        {!!initInfo && <Alert className={style.alert} type="info" message="系统已为您捕获到该客户的姓名和域名信息" showIcon />}
        <Form<FormData>
          initialValues={{
            name: initInfo?.name,
            domain: initInfo?.domain,
          }}
          layout="vertical"
          form={form}
          onChange={() => {
            setValidState({});
          }}
          requiredMark={false}
          className={style.form}
        >
          <Form.Item
            rules={[
              {
                required: true,
              },
              {
                max: 100,
                message: '最大不超过100字符',
              },
            ]}
            shouldUpdate
            label="客户姓名"
            name="name"
          >
            <Input placeholder="请输入英文/拼音 例如 John Doe" disabled={formItemDisable} />
          </Form.Item>
          <Form.Item
            style={{
              marginBottom: 0,
            }}
            rules={[
              {
                max: 100,
                message: '最大不超过100字符',
              },
              {
                type: 'url',
                message: '请输入正确的域名，如Google.com',
                transform(value: string = '') {
                  const protocalSplitSign = '://';
                  const [protocal] = value.split(protocalSplitSign);
                  // 不包含 :// 文件协议分隔符
                  if (protocal === value) {
                    return 'http://' + value;
                  }
                  return value;
                },
              },
            ]}
            shouldUpdate
            label="域名"
            name="domain"
          >
            <Input placeholder="例如 Google.com" disabled={formItemDisable} />
          </Form.Item>
        </Form>
        <div
          className={classNames(style.workspace, {
            [style.workspaceValiding]: validState.stage === 'validing' && guessEmailList.length > 0,
          })}
        >
          {guessEmailList.length > 0 ? (
            <>
              {!validState.stage && (
                <div className={style.workspaceInner}>
                  <p className={style.workspaceTitle}>已为您生成以下猜测邮箱，请验证邮箱有效性</p>
                  <div className={style.workspaceScroll}>
                    {guessEmailList.map(eml => (
                      <div className={style.guessEmailItem} key={eml}>
                        <span title={eml} className={style.guessEmailText}>
                          {eml}
                        </span>
                        <span className={style.guessEmailTag}>{/* <Tag type="label-4-1" >待验证</Tag> */}</span>
                      </div>
                    ))}
                  </div>
                  <div className={style.btns}>
                    <Button
                      btnType="primary"
                      onClick={() => {
                        globalSearchDataTracker.trackEmailGuessCheckClick({
                          from: !!initInfo ? 'auto' : 'mannual',
                        });
                        handleValidEmails(guessEmailList);
                      }}
                    >
                      验证邮箱有效性
                    </Button>
                  </div>
                </div>
              )}
              {validState.stage === 'finish' && validState.list && (
                <div className={style.workspaceInner}>
                  <p className={style.workspaceTitle}>已验证猜测邮箱有效性</p>
                  <EmailGuessResult
                    className={style.workspaceScroll}
                    validEmail={validState.list.filter(e => e.valid).map(e => e.email)}
                    notValidEmail={validState.list.filter(e => !e.valid).map(e => e.email)}
                    validEmptyDesc={initInfo ? '无有效邮箱' : '未猜测到有效邮箱，请修改信息后重试'}
                  />
                  <div className={style.btns}>
                    <Button
                      onClick={() => {
                        if (validState.list && validState.draftId) {
                          setSellEmailState({
                            list: validState.list.filter(e => e.valid).map(e => e.email),
                            draftId: validState.draftId,
                          });
                        }
                        globalSearchDataTracker.trackEmailGuessResultOp({
                          buttonName: 'sendEdm',
                        });
                      }}
                      disabled={validState.list.filter(e => e.valid).length === 0}
                    >
                      {getIn18Text('YIJIANYINGXIAO')}
                    </Button>
                  </div>
                  <p className={style.bottomTip}>仅对有效邮箱生效</p>
                </div>
              )}
              {validState.stage === 'validing' && (
                <div className={style.workspaceInner}>
                  <EmailGuessCheckProcess filteredLen={validState.list?.length || 0} total={guessEmailList.length || 1} />
                  <div className={style.btns}>
                    <Button btnType="primary" disabled>
                      验证邮箱有效性
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Empty description="请输入客户姓名以及企业域名" className={style.empty} image={<ImageEmptyNormal />} />
          )}
        </div>
      </SiriusDrawer>
    </>
  );
};

const EmailGuessWrapper: React.FC<EmailGuessProps> = props => {
  if (!props.visible) {
    return null;
  } else {
    return <EmailGuess {...props} />;
  }
};

export default EmailGuessWrapper;
