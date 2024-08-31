import React, { useContext, useEffect, useState, useRef } from 'react';
import 'react-resizable/css/styles.css';
import { Modal } from 'antd';
import classnames from 'classnames/bind';
import { apiHolder, IMMessage, IMUser, NIMApi, Session } from 'api';
import lodashGet from 'lodash/get';
import { useLocation } from '@reach/router';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { useObservable } from 'rxjs-hooks';
import { map } from 'rxjs/operators';
import styles from './operation.module.scss';
import { Context as MessageContext } from '../store/messageProvider';
import { FileIcon, SendFiles } from './file';
import { BasicEditor } from './basicEditor';
import { getParams, openSession } from '../../common/navigate';
import ChatEditorHeightManager from '../../store/list/chatEditorHeight';
import { Context as TeamMemberContext } from '../store/memberProvider';
import { EditorPlugins } from './editorPlugins';
import { IMAddSchedule } from './addSchedule';
import ChatForward from '../chatDisplay/chatForward';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const sysApi = apiHolder.api.getSystemApi();
import { ScreenShort as IMScreenShort } from './screenshort';
// 发送
export interface OperationApi {
  sessionId: string;
  toAccount: string;
  scene: string;
}
export const Operation: React.FC<OperationApi> = props => {
  const { sessionId, toAccount, scene = 'p2p' } = props;
  const [visibleForward, setVisibleForward] = useState<boolean>(false);
  const [forwardMsgs, setForwardMsgs] = useState<IMMessage[]>([]);
  const operationWrapRef = useRef(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const { state: TeamMemberlist } = useContext(TeamMemberContext);
  const { sendTextMessage, sendFileMessage, getSelectMsgs, updateSelectState, deleteLocalMsg } = React.useContext(MessageContext);
  const location = useLocation();
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  const $session = useObservable(
    (_, $props) => {
      const $sessionId = $props.pipe(map(args => args[0]));
      return nimApi.sessionStream.getSession($sessionId);
    },
    {} as Session,
    [sessionId]
  );
  useEffect(() => {
    const id = nimApi.interceptor.request.use(([methodname, options]) => {
      // @ts-ignore
      !Reflect.has(options, 'scene') && (options.scene = scene);
      // @ts-ignore
      !Reflect.has(options, 'to') && (options.to = toAccount);
      return Promise.resolve([methodname, options]);
    });
    return () => {
      nimApi.interceptor.request.eject(id);
    };
  }, []);
  useEffect(() => {
    if (getParams(location.hash, 'mode') !== 'history') {
      return () => {};
    }
    const $id = nimApi.interceptor.response.use((...args) => {
      const [methodName] = args;
      // @ts-ignore
      if (/^send/i.test(methodName)) {
        setTimeout(() => {
          openSession({
            mode: 'normal',
            sessionId,
          });
        }, 0);
      }
      return Promise.resolve(...args);
    });
    return () => {
      nimApi.interceptor.response.eject($id);
    };
  }, []);
  const { state: storeEditorHeight, setHeight: setEditorHeight } = useContext(ChatEditorHeightManager.Context);
  const defaultEditWindowHeight = Number.isSafeInteger(storeEditorHeight) ? storeEditorHeight : 94;
  const [editWindowHeight, setEditWindowHeight] = useState(defaultEditWindowHeight);
  const onResize = (_: any, data: ResizeCallbackData) => {
    console.log('[drag]:', _, data);
    const { height } = data.size;
    setEditWindowHeight(height);
    setEditorHeight(height);
  };
  const [resizeStatus, setResizeStatus] = useState<'ing' | 'finish'>('finish');
  const onResizeStart = () => {
    setResizeStatus('ing');
  };
  const onResizeStop = () => {
    setResizeStatus('finish');
  };
  const minConstraints: [number, number] = [0, 94];
  const maxConstraints: [number, number] = [Infinity, 380];
  const [contentBlockSize, setContentBlockSize] = useState(1);
  useEffect(() => {
    const BASIC_HEIGHT = 62;
    const UNIT_HEIGHT = 22;
    /**
     * 34:初始高度
     * 22:行高(最多13行)
     * 60:padding
     */
    const computedHeight = BASIC_HEIGHT + Math.min(contentBlockSize - 1, 13) * UNIT_HEIGHT + 60;
    setEditWindowHeight(Math.max(computedHeight, storeEditorHeight));
  }, [contentBlockSize]);
  const updateContentState = ({ size }) => {
    setContentBlockSize(size);
  };
  const selectList = getSelectMsgs();
  // 转发选中消息
  const forwardSelectMsgs = () => {
    if (!selectList || selectList.length === 0) {
      return;
    }
    nimApi.excute('getLocalMsgsByIdClients', {
      idClients: selectList,
      done: async (error, obj) => {
        const normalMsgs = lodashGet(obj, 'msgs', []);
        setForwardMsgs(normalMsgs);
        setVisibleForward(true);
      },
    });
  };
  // 删除选中消息
  const deleteSelectMsgs = () => {
    if (!selectList || selectList.length === 0) {
      return;
    }
    Modal.confirm({
      title: getIn18Text('QUEDINGSHANCHUXIAO'),
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      width: '448px',
      centered: true,
      onOk: close => {
        if (deleteLoading) {
          return;
        }
        setDeleteLoading(true);
        nimApi.excute('getLocalMsgsByIdClients', {
          idClients: selectList,
          done: async (error, obj) => {
            const normalMsgs = lodashGet(obj, 'msgs', []);
            await Promise.all(normalMsgs.map((item: IMMessage) => deleteLocalMsg(item)));
            setDeleteLoading(false);
            updateSelectState();
            close();
          },
        });
      },
    });
  };
  useEffect(() => {
    const keydownAction = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        updateSelectState('');
      }
    };
    document.addEventListener('keydown', keydownAction);
    return () => {
      document.removeEventListener('keydown', keydownAction);
    };
  }, []);
  const unSelect = lodashGet(selectList, 'length', 0) === 0;
  const calcMentionHeight = () => {
    if (!operationWrapRef?.current) {
      return;
    }
    const height = operationWrapRef.current.offsetHeight;
    setEditWindowHeight(height);
  };
  return (
    <>
      {selectList && (
        <div className={realStyle('chatForwardWrapper')} style={{ minHeight: editWindowHeight }}>
          <div data-test-id="im_session_content_mul_msg_forward_btn" className={realStyle('chatForwardItem')} onClick={() => forwardSelectMsgs()}>
            <span className={realStyle(['chatForwardIcon', unSelect ? 'chatForwardIconDisable' : ''])} />
            <span className={realStyle('chatForwardText')}>{getIn18Text('ZHUTIAOZHUANFA')}</span>
          </div>
          <div data-test-id="im_session_content_mul_msg_delete_btn" className={realStyle('chatForwardItem')} onClick={() => deleteSelectMsgs()}>
            <span className={realStyle(['chatDeleteIcon', unSelect ? 'chatDeleteIconDisable' : ''])} />
            <span className={realStyle('chatForwardText')}>{getIn18Text('SHANCHU')}</span>
          </div>
          <div data-test-id="im_session_content_mul_select_quit" className={realStyle('chatForwardItem')} onClick={() => updateSelectState()}>
            <span className={realStyle('chatQuitIcon')} />
          </div>
          {/* 消息转发 */}
          {visibleForward && <ChatForward msgs={forwardMsgs} onVisibleChange={setVisibleForward} onForwardSuccess={() => updateSelectState()} />}
        </div>
      )}
      <div className={realStyle('chatSendOperationWrapper')} style={{ minHeight: editWindowHeight }} ref={operationWrapRef}>
        {/* 拖拽的时候空白占位符 防止鼠标移动到消息列表触发消息列表的滚动 */}
        {resizeStatus === 'ing' && <div className={realStyle('resizeEmptyPlaceholder')} />}
        <Resizable
          height={editWindowHeight}
          width={Infinity}
          axis="y"
          onResize={onResize}
          maxConstraints={maxConstraints}
          minConstraints={minConstraints}
          onResizeStart={onResizeStart}
          onResizeStop={onResizeStop}
          resizeHandles={['n']}
        >
          <>
            <EditorPlugins
              session={$session}
              sessionId={sessionId}
              userlist={scene === 'team' ? (TeamMemberlist.map(item => item.user) as IMUser[]).filter(item => item?.account !== myAccount) : []}
            >
              <BasicEditor
                scene={scene}
                editWindowHeight={editWindowHeight}
                sendTextMsg={sendTextMessage}
                updateContentState={updateContentState}
                calcMentionHeight={calcMentionHeight}
              />
            </EditorPlugins>
            <div className={`dark-invert ${realStyle('operationIcons')}`} id="operation-entries">
              {/* 截屏 */}
              {process.env.BUILD_ISELECTRON ? <IMScreenShort /> : null}
              {/* 日程创建入口 */}
              {sysApi.isElectron() && <IMAddSchedule scene={scene} />}
              {/* 文件选择入口 */}
              <FileIcon />
            </div>
            {/* 发送文件 */}
            <SendFiles sendFileMsg={sendFileMessage} toAccount={toAccount} scene={scene} sessionId={sessionId} />
          </>
        </Resizable>
      </div>
    </>
  );
};
