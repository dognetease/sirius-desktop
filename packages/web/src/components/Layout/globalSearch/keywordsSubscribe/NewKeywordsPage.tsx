import React, { useContext, useEffect, useRef, useState } from 'react';
import { SubKeyWordContext } from './subcontext';
import styles from './keywordsubscribe.module.scss';
import customsStyles from '../../CustomsData/customs/customs.module.scss';
import classnames from 'classnames';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import NewSubWaterFall from './NewSubWaterFall/NewSubWaterFall';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as EditIcon } from './NewSubWaterFall/asset/common_edit.svg';
import { ReactComponent as DeleteIcon } from './NewSubWaterFall/asset/common_delete.svg';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Alert from '@web-common/components/UI/Alert/Alert';
import { GlobalSearchApi, api, apis } from 'api';
import { Loading } from '@/components/UI/Loading';
import { Tooltip } from 'antd';
import { ReactComponent as BaseAi } from './NewSubWaterFall/asset/base_ai.svg';
import { ReactComponent as BaseData } from './NewSubWaterFall/asset/base_data.svg';
import { ReactComponent as BaseMember } from './NewSubWaterFall/asset/base_member.svg';
import { getIn18Text } from 'api';
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const dataStoreApi = api.getDataStoreApi();
const NEW_SUB_INTRO_MODAL_ENABLE = 'NEW_SUB_INTRO_MODAL_ENABLE';

interface NewKeywordsPageProps extends React.HTMLAttributes<HTMLDivElement> {}
const NewKeywordsPage: React.FC<NewKeywordsPageProps> = ({ className, ...rest }) => {
  const [state, dispatch] = useContext(SubKeyWordContext);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [titleOpVisible, setTitleOpVisible] = useState<boolean>(false);
  const [introModalVisible, setIntroModalVisible] = useState<boolean>(false);
  const modalNeedReopen = useRef<boolean>(false);
  const handleConfirmDelSub = (id: number) => {
    Alert.destroyAll();
    Alert.warn({
      title: '是否删除订阅规则',
      content: (
        <span>
          <span>删除订阅规则后，将不会再推送该规则下的订阅结果。</span>
          <br />
          <span>历史订阅结果仍将保留。</span>
        </span>
      ),
      okText: '删除',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        handleDelSub(id);
      },
      okCancel: true,
    });
  };
  const handleDelSub = async (id: number) => {
    try {
      await globalSearchApi.doDeleteSub([id]);
      SiriusMessage.success('删除成功');
      dispatch({
        type: 'LIST_REFRESH',
      });
    } catch (error) {}
  };
  const renderBody = () => {
    if (state.list.length === 0) {
      if (state.listLoading) {
        return (
          <div className={styles.introContainer}>
            <Loading />
          </div>
        );
      }
      return (
        <div className={styles.introContainer}>
          <div className={styles.intro}>
            <h1>{getIn18Text('CHANPINDINGYUE')}</h1>
            <h2>{getIn18Text('DINGZHIHUATUIJIAN')}</h2>
            <p>{getIn18Text('GENJUNINDEHUOKEXUQIUDINGYUECHANPINGUANJIANCI,XITONGHUIGENJUDINGYUENEIRONGHESOUSUOLISHIWEININTUIJIANKEHU')}</p>
            <h2>{getIn18Text('ZIDONGWAJUEKEHU')}</h2>
            <p>{getIn18Text('SHUJUSHISHIGENGXIN,GENJUNINDEXIHAOJINXINGZHENBIE,ZIDONGBANGNINXUNZHAOHAILIANGQIANZAIKEHU')}</p>
            <h2>{getIn18Text('ZIDONGYOUHUAKEHU')}</h2>
            <p>{getIn18Text('WOMENJIANGGENJUNINDEFANKUIJINXINGYOUHUA,XITONGHUITUIJIANGENGDUOFUHENINXINXIDEKEHU')}</p>
            <Button
              btnType="primary"
              onClick={() => {
                dispatch({
                  type: 'MODAL_OPEN_CHANGE',
                  payload: {
                    open: true,
                  },
                });
              }}
            >
              创建产品订阅，开启智能推荐
            </Button>
          </div>
          <div className={styles.introImg}></div>
        </div>
      );
    }
    return (
      <NewSubWaterFall
        onChangeTitleOp={setTitleOpVisible}
        onOpenRules={() => {
          setModalVisible(true);
        }}
      />
    );
  };
  useEffect(() => {
    if (!dataStoreApi.getSync(NEW_SUB_INTRO_MODAL_ENABLE).data) {
      setIntroModalVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!state.addModalOpen && modalNeedReopen.current) {
      setModalVisible(true);
      modalNeedReopen.current = false;
    }
  }, [state.addModalOpen]);

  useEffect(() => {
    if (state.list.length === 0) {
      setModalVisible(false);
    }
  }, [state.list.length]);

  return (
    <div className={classnames(customsStyles.customsContainer, styles.container, className)} {...rest}>
      <div className={styles.titleWrapper}>
        <span className={styles.title}>{getIn18Text('CHANPINDINGYUE')}</span>
        {titleOpVisible && (
          <Button
            btnType="primary"
            onClick={() => {
              setModalVisible(true);
            }}
          >
            管理订阅规则
          </Button>
        )}
      </div>
      {renderBody()}
      <SiriusModal
        visible={introModalVisible}
        footer={null}
        title={null}
        width={961}
        className={styles.guideModal}
        afterClose={() => {
          dataStoreApi.putSync(NEW_SUB_INTRO_MODAL_ENABLE, 'true');
        }}
        onCancel={() => {
          setIntroModalVisible(false);
        }}
      >
        <div className={styles.guideModalBody}>
          <div className={styles.guideLeft}>
            <p className={styles.guideModalTitle}>【产品订阅】功能升级啦！</p>
            <div className={styles.guideModalDesc}>
              <p className={styles.guideModalDescTitle}>
                <BaseData />
                推荐范围更广
              </p>
              <p className={styles.guideModalDescSubTitle}>根据您的获客需求订阅产品关键词，系统会根据订阅内容和搜索历史为您推荐客户。</p>
            </div>
            <div className={styles.guideModalDesc}>
              <p className={styles.guideModalDescTitle}>
                <BaseMember />
                识别客户更高效
              </p>
              <p className={styles.guideModalDescSubTitle}>卡片形式展示推荐公司，显示更多相关信息，帮助您高效判断意向企业。</p>
            </div>
            <div className={styles.guideModalDesc}>
              <p className={styles.guideModalDescTitle}>
                <BaseAi />
                推荐反馈更智能
              </p>
              <p className={styles.guideModalDescSubTitle}>我们将根据您的反馈进行优化，系统会推荐更多符合你心意的客户。</p>
            </div>
            <Button
              btnType="primary"
              onClick={() => {
                setIntroModalVisible(false);
              }}
            >
              知道了
            </Button>
          </div>
          <div className={styles.guideRight}></div>
        </div>
      </SiriusModal>
      <SiriusModal
        className={styles.rulesModal}
        title={
          <>
            <p className={styles.modalHeaderTitle}>管理订阅规则</p>
            <p className={styles.modalHeaderSubTitle}>修改订阅规则 系统将在24小时内返回订阅结果</p>
          </>
        }
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        okText={getIn18Text('XINJIANTUIJIANGUIZE')}
        cancelButtonProps={{
          hidden: true,
        }}
        onOk={() => {
          setModalVisible(false);
          modalNeedReopen.current = true;
          dispatch({
            type: 'MODAL_OPEN_CHANGE',
            payload: {
              open: true,
            },
          });
        }}
      >
        <div className={styles.ruleList}>
          {state.list.map(rule => {
            return (
              <div key={rule.id} className={styles.ruleItem}>
                <div className={styles.row}>
                  <span className={styles.label}>{rule.type === 'product' ? getIn18Text('CHANPINMINGCHENG') : 'HSCode'}包括：</span>
                  <span title={rule.value} className={styles.rowText}>
                    {rule.value}
                  </span>
                  <div className={styles.iconGroup}>
                    <Tooltip title={getIn18Text('BIANJI')}>
                      <span
                        className={styles.icon}
                        onClick={() => {
                          modalNeedReopen.current = true;
                          dispatch({
                            type: 'MODAL_OPEN_CHANGE',
                            payload: {
                              open: true,
                              initForm: {
                                targetCompanys: rule.targetCompanys ?? undefined,
                                keyword: rule.value,
                                product: rule.type,
                                country: rule.originCountrys ?? undefined,
                                id: rule.id,
                              },
                            },
                          });
                        }}
                      >
                        <EditIcon />
                      </span>
                    </Tooltip>
                    <Tooltip title={getIn18Text('SHANCHU')}>
                      <span
                        className={styles.icon}
                        onClick={() => {
                          handleConfirmDelSub(rule.id);
                        }}
                      >
                        <DeleteIcon />
                      </span>
                    </Tooltip>
                  </div>
                </div>
                {rule.country && (
                  <div className={styles.row}>
                    <span className={styles.label}>目标客户所在国家/地区：</span>
                    <span title={rule.country.join(';')} className={styles.rowText}>
                      {rule.country.join(';')}
                    </span>
                  </div>
                )}
                {rule.targetCompanys?.map((target, index) => {
                  const fullShow = target.companyName && target.domain;
                  const singleShow = target.companyName || target.domain;
                  if (singleShow) {
                    return (
                      <div key={index} className={styles.row}>
                        {!!target.companyName && (
                          <div
                            className={classnames(styles.row, styles.rowInner, {
                              [styles.rowhalf]: fullShow,
                            })}
                          >
                            <span className={styles.label}>{getIn18Text('KEHUMINGCHENG')}：</span>
                            <span className={styles.rowText}>{target.companyName}</span>
                          </div>
                        )}
                        {!!target.domain && (
                          <div
                            className={classnames(styles.row, styles.rowInner, {
                              [styles.rowhalf]: fullShow,
                            })}
                          >
                            <span className={styles.label}>客户官网：</span>
                            <span className={styles.rowText}>{target.domain}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            );
          })}
        </div>
      </SiriusModal>
    </div>
  );
};

export default NewKeywordsPage;
