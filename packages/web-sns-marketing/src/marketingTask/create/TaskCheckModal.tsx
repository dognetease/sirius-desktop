import { getIn18Text } from 'api';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import classnames from 'classnames';
import { SnsMarketingPost, SnsPostType, getSnsPostTypeName } from 'api';
import { useAppDispatch } from '@web-common/state/createStore';
import { snsMarketingTaskActions } from '@web-common/state/reducer';
import { Tabs } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { EnhanceSelect as Select } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select } from '@lingxi-common-component/sirius-ui/Select';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import PostPreview, { translateHandler } from '../../components/PostPreview';
import PostEditModal from '../../components/PostEditModal';
import { ReactComponent as CheckLeftIcon } from '@web-sns-marketing/images/check-left.svg';
import { ReactComponent as CheckRightIcon } from '@web-sns-marketing/images/check-right.svg';
import { ReactComponent as CheckEditIcon } from '@web-sns-marketing/images/check-edit.svg';
import style from './TaskCheckModal.module.scss';

const SnsPostTypeName = getSnsPostTypeName();

const SLICE_COUNT = 9;

interface TaskCheckModalProps {
  visible: boolean;
  posts: SnsMarketingPost[];
  onFinish: () => void;
  onCancel: () => void;
}

interface TaskCheckTab {
  key: SnsPostType;
  name: string;
  posts: (SnsMarketingPost & { postSeqNo: number })[];
  prevTabKey: SnsPostType | null;
  nextTabKey: SnsPostType | null;
}

const TaskCheckModal: React.FC<TaskCheckModalProps> = props => {
  const { visible, posts, onFinish, onCancel } = props;
  const appDispatch = useAppDispatch();
  const [tabKey, setTabKey] = useState<Partial<SnsPostType> | null>(null);
  const [postDbId, setPostDbId] = useState<string | null>(null);
  const [postEditVisible, setPostEditVisible] = useState<boolean>(false);

  const tabs = useMemo<TaskCheckTab[]>(() => {
    let tabs: TaskCheckTab[] = [
      { key: SnsPostType.COMPANY_INFO, name: SnsPostTypeName[SnsPostType.COMPANY_INFO], posts: [], prevTabKey: null, nextTabKey: null },
      {
        key: SnsPostType.PRODUCT_INFO,
        name: SnsPostTypeName[SnsPostType.PRODUCT_INFO],
        posts: [],
        prevTabKey: null,
        nextTabKey: null,
      },
      { key: SnsPostType.INDUSTRY, name: SnsPostTypeName[SnsPostType.INDUSTRY], posts: [], prevTabKey: null, nextTabKey: null },
    ];

    posts.forEach(post => {
      const tab = tabs.find(item => item.key === post.type);

      if (tab) {
        tab.posts.push({ ...post, postSeqNo: 0 });
      }
    });

    tabs = tabs.filter(tab => tab.posts.length);

    tabs.forEach((tab, index) => {
      const prevTab = tabs[index - 1];
      const nextTab = tabs[index + 1];

      if (prevTab) {
        tab.prevTabKey = prevTab.key;
      }
      if (nextTab) {
        tab.nextTabKey = nextTab.key;
      }
    });

    let seqNo = 0;

    tabs.forEach(tab => {
      tab.posts.forEach(post => {
        post.postSeqNo = ++seqNo;
      });
    });

    return tabs;
  }, [posts]);

  useEffect(() => {
    if (visible) {
      updatePosts({
        translating: false,
        translateResult: '',
        translateChecked: false,
      });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && tabs.length && tabs.every(item => item.key !== tabKey)) {
      handleTabChange(tabs[0].key);
    }
  }, [visible, tabs, tabKey]);

  const handleTabChange = (nextTabKey: string, toLast?: boolean) => {
    setTabKey(nextTabKey as SnsPostType);

    const nextTab = tabs.find(item => item.key === nextTabKey);

    if (!nextTab) return;

    if (!toLast) {
      const firstPost = nextTab.posts[0];

      firstPost && setPostDbId(firstPost.postDbId);
    } else {
      const lastPost = nextTab.posts[nextTab.posts.length - 1];

      lastPost && setPostDbId(lastPost.postDbId);
    }
  };

  const tab = tabs.find(item => item.key === tabKey) || null;
  const tabPosts = tab?.posts || [];
  const postIndex = tabPosts.findIndex(item => item.postDbId === postDbId);
  const post = tabPosts[postIndex] || null;
  const prevDisabled = !tab || !post || (postIndex === 0 && !tab.prevTabKey);
  const nextDisabled = !tab || !post || (postIndex === tabPosts.length - 1 && !tab.nextTabKey);
  const postsRef = useRef<SnsMarketingPost[]>([]);

  postsRef.current = posts;

  const updatePosts = (commonPayload: Partial<SnsMarketingPost>, targetPayload: Record<string, Partial<SnsMarketingPost>> = {}) => {
    appDispatch(
      snsMarketingTaskActions.setCurrentPosts({
        posts: postsRef.current.map(item => ({ ...item, ...commonPayload, ...targetPayload[item.postDbId] })),
      })
    );
  };

  return (
    <>
      <Modal
        className={style.taskCheckModal}
        width={984}
        title={`请检查 ${posts.length}篇 帖子`}
        visible={visible && !postEditVisible}
        keyboard={false}
        maskClosable={false}
        onCancel={onCancel}
        footer={
          <>
            <div className={style.switch}>
              <Button
                btnType="minorLine"
                disabled={prevDisabled}
                onClick={() => {
                  if (!prevDisabled) {
                    if (postIndex === 0) {
                      handleTabChange(tab.prevTabKey!, true);
                    } else {
                      setPostDbId(tabPosts[postIndex - 1].postDbId);
                    }
                  }
                }}
              >
                <CheckLeftIcon className={classnames(style.icon, style.prevIcon)} />
                <span>{getIn18Text('SHANGYIGE')}</span>
              </Button>
              <Button
                btnType="minorLine"
                disabled={nextDisabled}
                onClick={() => {
                  if (!nextDisabled) {
                    if (postIndex === tabPosts.length - 1) {
                      handleTabChange(tab.nextTabKey!);
                    } else {
                      setPostDbId(tabPosts[postIndex + 1].postDbId);
                    }
                  }
                }}
              >
                <span>{getIn18Text('XIAYIGE')}</span>
                <CheckRightIcon className={classnames(style.icon, style.nextIcon)} />
              </Button>
            </div>
            <div className={style.buttons}>
              <Button btnType="minorLine" onClick={onCancel}>
                {getIn18Text('setting_system_switch_cancel')}
              </Button>
              <Button btnType="primary" onClick={onFinish}>
                {getIn18Text('YIQUANBUJIANCHA，QI')}
              </Button>
            </div>
          </>
        }
      >
        <Tabs className={style.tabs} activeKey={tabKey || ''} onChange={handleTabChange}>
          {tabs.map(tab => (
            <Tabs.TabPane key={tab.key} tab={`${tab.name} ${tab.posts.length}`} />
          ))}
        </Tabs>
        <div className={style.list}>
          {tabPosts.slice(0, tabPosts.length === SLICE_COUNT + 1 ? SLICE_COUNT + 1 : SLICE_COUNT).map(post => (
            <Button key={post.postDbId} btnType={post.postDbId === postDbId ? 'default' : 'minorLine'} onClick={() => setPostDbId(post.postDbId)}>
              {getIn18Text('TIEZI')}
              {post.postSeqNo}
            </Button>
          ))}
          {tabPosts.length > SLICE_COUNT + 1 && (
            <Select
              className={classnames(style.more, {
                [style.active]: tabPosts.slice(SLICE_COUNT).some(item => item.postDbId === postDbId),
              })}
              value={tabPosts.slice(SLICE_COUNT).some(item => item.postDbId === postDbId) ? postDbId : getIn18Text('GENGDUO')}
              options={tabPosts.slice(SLICE_COUNT).map(post => ({
                value: post.postDbId,
                label: `帖子${post.postSeqNo}`,
              }))}
              onChange={nextPostDbId => {
                setPostDbId(nextPostDbId);
              }}
              dropdownMatchSelectWidth={false}
            />
          )}
        </div>
        <div className={style.content}>
          <div className={style.postPreviewWrapper}>
            <PostPreview
              className={style.postPreview}
              post={post}
              editable
              translatable
              translateAppear="always"
              onEdit={() => setPostEditVisible(true)}
              onTranslate={(checked, contentHTML) => {
                if (post) {
                  if (!checked) {
                    return updatePosts({ translateChecked: false });
                  }

                  if (post.translateResult || post.translating) {
                    return updatePosts({ translateChecked: true });
                  }

                  updatePosts(
                    {
                      translateChecked: true,
                    },
                    {
                      [post.postDbId]: {
                        translating: true,
                      },
                    }
                  );

                  translateHandler(contentHTML)
                    .then(translateHTML => {
                      updatePosts(
                        {},
                        {
                          [post.postDbId]: {
                            translating: false,
                            translateResult: translateHTML,
                          },
                        }
                      );
                    })
                    .catch((error: Error) => {
                      updatePosts(
                        {
                          translateChecked: false,
                        },
                        {
                          [post.postDbId]: {
                            translating: false,
                            translateResult: '',
                          },
                        }
                      );
                      Message.error(error.message);
                    });
                }
              }}
            />
          </div>
          <div className={style.suggestion}>
            <div className={style.title}>{getIn18Text('JIANCHAJIANYI')}</div>
            <div className={style.subTitle}>{getIn18Text('WENBENJIANCHAJIANYI')}</div>
            <div className={style.suggestionItem}>{getIn18Text('· JIANCHAWENBENZHONGv16')}</div>
            <div className={style.suggestionItem}>{getIn18Text('· JIANCHAWENBENZHONG')}</div>
            <div className={style.subTitle}>{getIn18Text('TUPIANJIANCHAJIANYI')}</div>
            <div className={style.suggestionItem}>{getIn18Text('JIANCHAAISHENGTUDE')}</div>
            <a className={style.edit} onClick={() => setPostEditVisible(true)}>
              <span>{getIn18Text('QUBIANJI')}</span>
              <CheckEditIcon className={style.icon} />
            </a>
          </div>
        </div>
      </Modal>
      <PostEditModal
        visible={postEditVisible}
        postDbId={postDbId}
        onCancel={() => setPostEditVisible(false)}
        onFinish={post => {
          updatePosts(
            {
              translateChecked: false,
            },
            {
              [post.postDbId]: {
                ...post,
                translateResult: '',
              },
            }
          );
          Message.success(getIn18Text('BIANJIWANCHENG'));
          setPostEditVisible(false);
        }}
      />
    </>
  );
};

export default TaskCheckModal;
