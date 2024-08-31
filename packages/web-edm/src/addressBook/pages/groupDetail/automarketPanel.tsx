import { getIn18Text } from 'api';
import React, { useState, useRef, useEffect } from 'react';
import {
  apiHolder,
  apis,
  AutoMarketApi,
  AddressBookGroup,
  DataTrackerApi,
  AutoMarketTaskObjectType,
  AutoMarketTaskObjectTypeName,
  AutoMarketTaskType,
  AutoMarketTask,
} from 'api';
import { useAsyncFn } from 'react-use';
import { Alert, Row, Col, Carousel, Tooltip, Skeleton, Button } from 'antd';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { navigate } from '@reach/router';
import { getTransText } from '@/components/util/translate';
import classnames from 'classnames';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as SliderLeftIcon } from '@/images/icons/edm/addressBook/sliderLeft.svg';
import { ReactComponent as SliderRightIcon } from '@/images/icons/edm/addressBook/sliderRight.svg';
import { ReactComponent as InfoIcon } from '@/images/icons/edm/addressBook/info.svg';
import { AutoMarketCard } from './automarketCard';
import { AutoTaskTemplateModal } from '../../../autoMarket/components/autoTaskTemplateModal';
import style from './automarket.module.scss';
import { jumpToAutoMarketing } from './../../../autoMarket/utils';
import variables from '@web-common/styles/export.module.scss';

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Props {
  groupId: string;
  groupDetail: AddressBookGroup | null;
}

export const AutoMarketPanel: React.FC<Props> = ({ groupId, groupDetail }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carousel = useRef<any>();
  const templateRef = useRef<any>();
  const [templateVisible, setTemplateVisible] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);

  const [state, fetchTask] = useAsyncFn(async () => {
    if (!groupId) {
      return { autoMarketTasks: [] };
    }

    return autoMarketApi.getAutoMarketTaskByGroup(groupId);
  }, [groupId]);

  useEffect(() => {
    fetchTask();
    fetchTemplate();
  }, []);

  async function fetchTemplate() {
    const res = await autoMarketApi.getTaskList({
      page: 1,
      pageSize: 1,
      taskType: '',
      template: true,
    });
    setHasTemplate(Boolean(res?.autoMarketTasks?.length));
  }

  if (state.loading || !groupDetail) {
    return (
      <div className={style.wrapper}>
        <div className={style.loading}>
          <Skeleton />
        </div>
      </div>
    );
  }

  if (String(groupDetail?.groupType) === '0') {
    // 系统分组不展示
    return <></>;
  }

  const slidePre = () => {
    carousel.current.prev();
  };

  const slideNext = () => {
    carousel.current.next();
  };

  const onDelete = () => {
    fetchTask();
  };

  const createAutoTask = () => {
    trackerApi.track('pc_waimao_address_group_creatjob_click');
    navigate(`#edm?page=autoMarketTask&groupId=${groupId}`);
  };

  // 有营销任务 展示任务卡片
  if (state?.value?.autoMarketTasks?.length) {
    return (
      <div className={style.wrapper}>
        <div className={style.taskTitle}>
          <span>{getTransText('AutoTask')}</span>
          {/* <Button type="text"><PlusOutlined style={{ color: '4C6AFF' }} />创建自动化任务</Button> */}
          {state.value.autoMarketTasks.length < 5 ? (
            <a onClick={createAutoTask}>
              <PlusOutlined style={{ color: `${variables.brand6}` }} />
              {getTransText('CreateAutoTask')}
            </a>
          ) : (
            <Tooltip title={getTransText('CreateAutoTaskTip')}>
              <a style={{ color: `${variables.brand3}` }}>
                <PlusOutlined style={{ color: '$Brand-3' }} />
                {getTransText('CreateAutoTask')}
              </a>
            </Tooltip>
          )}
        </div>
        <div className={style.taskWrapper}>
          {state.value.autoMarketTasks.length > 3 ? (
            <>
              {currentSlide > 0 ? (
                <div className={classnames(style.slideBtn, style.slidePre)} onClick={slidePre}>
                  <SliderLeftIcon />
                </div>
              ) : (
                ''
              )}
              {currentSlide < 1 ? (
                <div className={classnames(style.slideBtn, style.slideNext)} onClick={slideNext}>
                  <SliderRightIcon />
                </div>
              ) : (
                ''
              )}
            </>
          ) : (
            ''
          )}
          <div className={style.carousel}>
            <Carousel dots={false} afterChange={index => setCurrentSlide(index)} ref={carousel}>
              <div>
                <Row gutter={12}>
                  {state.value.autoMarketTasks.slice(0, 3).map(item => (
                    <Col span={8}>
                      <AutoMarketCard data={item} onDelete={onDelete} />
                    </Col>
                  ))}
                </Row>
              </div>
              <div>
                <Row gutter={12}>
                  {state.value.autoMarketTasks.slice(3, 5).map(item => (
                    <Col span={8}>
                      <AutoMarketCard data={item} onDelete={onDelete} />
                    </Col>
                  ))}
                </Row>
              </div>
            </Carousel>
          </div>
        </div>
      </div>
    );
  }

  const onTemplateSelect = async (taskId: string, taskType: AutoMarketTaskType) => {
    let taskObjectInfo;
    if (taskType === AutoMarketTaskType.FIXED_CONTACT) {
      // 固定名单营销  需要获取联系人
      const res = await autoMarketApi.getAddressContactForAutomarket([groupId], 'GROUP');
      const contactInfos =
        res?.addressList?.map(item => {
          return {
            contactEmail: item.contactAddressInfo,
            contactName: item.contactName,
          };
        }) || [];

      if (!contactInfos.length) {
        Toast.error(getTransText('QINGCHONGXINXUANZEMOBAN'));
        return;
      }

      taskObjectInfo = {
        objectType: AutoMarketTaskObjectType.ADDRESS,
        objectName: AutoMarketTaskObjectTypeName.ADDRESS,
        objectContent: {
          groupIdList: [groupId],
          addressType: 1,
          contactInfos,
        },
      };
    } else {
      taskObjectInfo = {
        objectType: AutoMarketTaskObjectType.ADDRESS,
        objectName: AutoMarketTaskObjectTypeName.ADDRESS,
        objectContent: {
          groupIdList: [groupId],
          addressType: 0,
        },
      };
    }

    const res = await autoMarketApi.saveByTemplate(taskId, taskObjectInfo, groupDetail.groupName);
    fetchTask();
    setTemplateVisible(false);
    Toast.success({
      content: (
        <>
          {getTransText('YIKAIQIZIDONGHUAYINGXIAO，JUTIRENWUXIANGQINGQIANWANG')}
          <span className={style.linkBtn} onClick={() => jumpToAutoMarketing(`#edm?page=autoMarketTaskDetail&taskId=${res.taskId}`)}>
            {getIn18Text('CHAKAN')}
          </span>
        </>
      ),
      duration: 5,
    });
  };

  async function createByTemplate() {
    const hasTemplate = await templateRef.current.hasTemplate();
    if (hasTemplate) {
      setTemplateVisible(true);
    } else {
      jumpToAutoMarketing(`#edm?page=autoMarketTask&groupId=${groupId}`);
    }
  }

  // 无营销任务 展示引导 GroupTemplateTaskTip
  return (
    <div className={style.wrapper} style={{ background: 'transparent', padding: 0 }}>
      {/* <div className={style.automarketHelp}>
        <div className={style.automarketHelpContent}>
          <div className={style.title}>自动化营销，开启高效的精细化营销！</div>
          <div className={style.tip}>自动化营销，开启高效的精细化营销！</div>
          <div className={style.btn}>
            <Button type="primary" onClick={() => navigate(`#edm?page=autoMarketTask&groupId=${groupId}`)}>
              {getTransText('CreateAutoMarketTask')}
            </Button>
          </div>
        </div>
        <div className={style.automarketHelpIcon}><GroupTipIcon /></div>
      </div> */}

      <Alert
        className={style.alert}
        icon={<InfoIcon />}
        closable
        message={
          <>
            {hasTemplate ? getTransText('GroupTemplateTaskTip') : getTransText('GroupTaskTip')}
            <Button type="primary" size="small" className={style.createBtn} onClick={() => createByTemplate()}>
              {getTransText('GroupTaskCreate')}
            </Button>
          </>
        }
        type="info"
        showIcon
      />

      <AutoTaskTemplateModal
        visible={templateVisible}
        ref={templateRef}
        onSelect={onTemplateSelect}
        onCancel={() => setTemplateVisible(false)}
        filter={(task: AutoMarketTask) => {
          // 从分组创建时，条件选
          return Boolean(task?.addressTemplate);
        }}
      />
    </div>
  );
};
