import React, { useState, useEffect } from 'react';
import { Drawer, Tabs, Tag, Divider, message } from 'antd';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import style from './assistant.module.scss';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/editor/close-icon.svg';
import CopyToClipboard from 'react-copy-to-clipboard';
import { EdmEmailContentAssistant, getIn18Text, EdmEmailContentAssistantTopic, apiHolder, apis, EdmSendBoxApi, EdmEmailContentAssistantGroup } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import CommentIcon from '@/images/icons/edm/yingxiao/commont-icon.png';
import EditorHelperIcon from '@/images/icons/edm/yingxiao/edm-editor-helper.svg';
import TongyongJianTouYou from '@web-common/images/newIcon/tongyong_jiantou_you';
import { edmDataTracker } from '../../tracker/tracker';

interface EmailContentAssistantProps {
  isTheme?: boolean;
  insertContent?: (content?: string) => void;
  /** 主题入口要设置: 内容助手抽屉是否打开 */
  emailContentAssistantOpen?: boolean;
  /** 主题入口要设置: 设置内容助手抽屉隐藏 */
  setEmailContentAssistantOpen?: (value: boolean) => void;
}

const { TabPane } = Tabs;
const { CheckableTag } = Tag;

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const EmailContentAssistantComponent: React.FC<EmailContentAssistantProps> = props => {
  const { isTheme, emailContentAssistantOpen, setEmailContentAssistantOpen, insertContent } = props;
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false); // 设置助手详情抽屉是否打开
  const [activeTab, setActiveTab] = useState<string>(''); // 当前正在选中的Tab
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // 当前选中的标签
  const [groups, setGroups] = useState<EdmEmailContentAssistantGroup[]>([]); // 所有阶段Tab数据源
  const [topics, setTopics] = useState<EdmEmailContentAssistantTopic[]>([]); // 所有阶段Tab数据源
  const [currentTopic, setCurrentTopic] = useState<EdmEmailContentAssistantTopic>({}); // 当前选中Tab对应的模型
  const [currentTopicDisplayAssistants, setCurrentTopicDisplayAssistants] = useState<EdmEmailContentAssistant[]>([]); // 过滤选中标签对应的所有模板

  useEffect(() => {
    edmApi
      .getEmailContentAssistant()
      .then(data => {
        if (isTheme) {
          // 与服务端约定groups第一个元素是主题topic，其他topic属于邮件内容助手
          const group = data[0];
          if (group.topics && group.topics[0]) {
            setCurrentTopic(group.topics[0]);
            setCurrentTopicDisplayAssistants(group.topics[0].assistants || []);
          }
        } else {
          let filterNothemeGroup = data.slice(1);
          let statesResp = Array<EdmEmailContentAssistantTopic>();
          filterNothemeGroup.forEach(group => {
            if (group?.topics) {
              statesResp.push(...group?.topics);
            }
          });
          setGroups(filterNothemeGroup);
          setTopics(statesResp);
        }
      })
      .catch(error => {})
      .finally(() => {});
  }, []);

  useEffect(() => {
    if (!isTheme) {
      topics.forEach(topic => {
        if (topic.subject === activeTab) {
          setCurrentTopic(topic);
          setSelectedTags([]);
          setCurrentTopicDisplayAssistants(topic.assistants || []);
        }
      });
    }
  }, [activeTab]);

  const openTargetTabDetailDrawer = (subject: string) => {
    setActiveTab(subject);
    setDetailDrawerOpen(true);
    const type: string = trackerType(subject);
    edmDataTracker.track('pc_markting_edm_contentTemplate', {
      type: type,
    });
  };

  const closeDrawer = () => {
    if (isTheme) {
      setEmailContentAssistantOpen && setEmailContentAssistantOpen(false);
    } else {
      setDetailDrawerOpen(false);
      // 关闭抽屉重置页面数据
      setActiveTab('');
      setSelectedTags([]);
      setCurrentTopic({});
      setCurrentTopicDisplayAssistants([]);
    }
  };

  const clickInsertEmail = (content?: string) => {
    insertContent && insertContent(content);
    let type: string = getDifferentTrackerType();
    edmDataTracker.track('pc_markting_edm_contentAction', {
      click: 'insert',
      type: type,
    });
  };

  const getDifferentTrackerType = () => {
    if (isTheme) {
      return '主题';
    } else {
      return trackerType(activeTab);
    }
  };

  const trackerType = (subject?: string) => {
    let type: string = '';
    switch (subject) {
      case '开场白':
        type = 'beginning';
        break;
      case '公司/产品介绍':
        type = 'introduce';
        break;
      case '价值阐述':
        type = 'value';
        break;
      case '案例展示':
        type = 'showcase';
        break;
      case '约客户':
        type = 'action';
        break;
      case '结尾':
        type = 'ending';
        break;
      default:
        break;
    }
    return type;
  };

  const clickCheckableTag = (tag: string, checked: boolean) => {
    const nextSelectedTags = checked ? [tag, ...selectedTags] : selectedTags.filter(t => t !== tag);
    setSelectedTags(nextSelectedTags);
    if (nextSelectedTags.length) {
      const assistants: EdmEmailContentAssistant[] = [];
      nextSelectedTags.forEach(selectedTag => {
        currentTopic.assistants &&
          currentTopic.assistants.forEach(assistant => {
            if (assistant.tags && assistant.tags.includes(selectedTag)) {
              assistants.push(assistant);
            }
          });
      });
      setCurrentTopicDisplayAssistants(assistants);
    } else {
      setCurrentTopicDisplayAssistants(currentTopic.assistants || []);
    }
  };

  const coreDrawerDetailComp = (topic: EdmEmailContentAssistantTopic) => {
    return (
      <div>
        <div className={isTheme ? style.themeTagContainer : style.tagContainer}>
          {topic.tags &&
            topic.tags.map(tag => {
              return (
                <CheckableTag key={tag} checked={selectedTags.includes(tag)} onChange={checked => clickCheckableTag(tag, checked)}>
                  {tag}
                </CheckableTag>
              );
            })}
        </div>
        {currentTopicDisplayAssistants.map(assistant => {
          return (
            <>
              <div className={style.cardStyle}>
                <p className={style.cardOrigin}>{assistant.origin}</p>
                <div className={style.cardButtonContainer}>
                  <Button className={style.insertButton} size="mini" onClick={() => clickInsertEmail(assistant.origin)}>
                    {isTheme ? '插入主题' : '插入光标处'}
                  </Button>
                  <CopyToClipboard
                    onCopy={(_, result) => {
                      message.success({
                        content: getIn18Text('FUZHICHENGGONG'),
                      });
                      let type: string = getDifferentTrackerType();
                      edmDataTracker.track('pc_markting_edm_contentAction', {
                        click: 'copy',
                        type: type,
                      });
                    }}
                    options={{ format: 'text/plain' }}
                    text={assistant.origin || ''}
                  >
                    <Button className={style.copyButton} size="mini" btnType={'minorLine'}>
                      复制
                    </Button>
                  </CopyToClipboard>
                </div>
                <Divider className={style.cardDivider} />
                <div>
                  <div className={style.cardTranslate}>
                    <span className={style.cardTranslateTag}>翻译</span>
                    <p>{assistant.translate}</p>
                  </div>
                </div>
              </div>
              <div className={style.commentContainer}>
                <div className={style.arrowUp}></div>
                <div className={style.arrowUpInside}></div>
                <span style={{ backgroundImage: `url(${CommentIcon})` }} className={style.commontTag}>
                  <span className={style.commontTagContent}>专家点评</span>
                </span>
                <p className={style.commentContent}>{assistant.comment}</p>
                <p className={style.commentSelectedTagContainer}>
                  {assistant.tags &&
                    assistant.tags.map(tag => {
                      return <span className={style.commentSelectedTag}>{tag}</span>;
                    })}
                </p>
              </div>
              <Divider className={style.divider} />
            </>
          );
        })}
      </div>
    );
  };

  const themeDrawerDetailComp = () => {
    return coreDrawerDetailComp(currentTopic);
  };

  const noThemeDrawerDetailComp = () => {
    return (
      <Tabs className={style.tabStyle} activeKey={activeTab} onChange={setActiveTab}>
        {topics.map(topic => {
          return (
            <TabPane tab={topic.subject} key={topic.subject}>
              {coreDrawerDetailComp(topic)}
            </TabPane>
          );
        })}
      </Tabs>
    );
  };

  const deatilDrawer = () => {
    return (
      <SiriusDrawer
        maskStyle={{ background: '#ffffff00' }}
        width={504}
        className={style.emailContentAssistantDrawer}
        onClose={closeDrawer}
        visible={isTheme ? emailContentAssistantOpen : detailDrawerOpen}
        headerStyle={{ display: 'none' }}
      >
        <div className={style.drawerHeader}>
          <span>{isTheme ? '主题内容助手' : '开发信内容助手'}</span>
          <CloseIcon
            onClick={() => {
              closeDrawer();
            }}
          />
        </div>
        <div className={style.drawerDetail}>{isTheme ? themeDrawerDetailComp() : noThemeDrawerDetailComp()}</div>
      </SiriusDrawer>
    );
  };

  const generalItem = (topic: EdmEmailContentAssistantTopic) => {
    return (
      <div className={style.item}>
        <div className={style.titleArea}>
          <img src={EditorHelperIcon} />
          <div className={style.title}>{topic.subject}</div>
        </div>
        <div className={style.bodyArea}>
          <div className={style.desc}>{topic.desc}</div>
          <div className={style.count}>
            <div
              className={style.title}
              onClick={() => {
                openTargetTabDetailDrawer(topic.subject || '');
              }}
            >
              {topic.assistants?.length}条推荐模板
            </div>
            <TongyongJianTouYou fill={'#4C6AFF'} />
          </div>
        </div>
      </div>
    );
  };

  const ListComp = () => {
    return (
      <div className={style.list}>
        {groups &&
          groups.map(group => {
            return (
              <>
                <div className={style.commonHeader}>{group.moduleName}</div>
                {group.topics &&
                  group.topics?.map(topic => {
                    return generalItem(topic);
                  })}
              </>
            );
          })}
      </div>
    );
  };

  const ListRoot = () => {
    return (
      <div className={style.listRoot}>
        {ListComp()}
        {deatilDrawer()}
      </div>
    );
  };

  if (isTheme) {
    return <>{deatilDrawer()}</>;
  }

  return ListRoot();
};
