import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import Header from './Header/Header';
import WriteContent from '@web-mail-write/WritePage';
import './WriteLetterWeb.scss';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { MailActions } from '@web-common/state/reducer';
import { TemplateAddModal } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';

const WriteLetterWeb: React.FC = () => {
  const [translate, settranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const showWebWriteLetter = useAppSelector(state => state.mailReducer.showWebWriteLetter);
  const mailLength = useAppSelector(state => state.mailReducer.mails.length);

  const mailActions = useActions(MailActions);

  const [boxWidth, setBoxWidth] = useState<number>(1000);
  const [boxHeight, setBoxHeight] = useState<number>(600);
  const [maxConstraints, setMaxConstraints] = useState<[number, number]>([300, 200]);
  const defaultX = 150;
  const defaultY = 150;
  const [preW, setPreW] = useState<number>(boxWidth);
  const [preH, setPreH] = useState<number>(boxHeight);
  const [execAutoSaveDraft, setExecAutoSaveDraft] = useState<boolean>(false);
  useEffect(() => {
    const clientW = document.body.clientWidth;
    const clientH = document.body.clientHeight;
    setMaxConstraints([clientW - 20, clientH - 20]);
    // defaultX = (clientW - boxWidth) / 2;
    // defaultY = (clientH - boxHeight) / 2;
    settranslate({ x: defaultX, y: defaultY });
  }, []);

  // resize 时候需要translate 因为 ResizableBox组件 左上角顶点一直不会移动 只改变宽高
  const onResize = (e: any, data: any) => {
    const gapH = data.size.height - preH;
    const gapW = data.size.width - preW;
    setBoxWidth(data.size.width);
    setBoxHeight(data.size.height);
    let { x } = translate;
    let { y } = translate;
    if (['w', 'nw', 'sw'].includes(data.handle)) {
      x = translate.x - gapW;
    }
    if (['n', 'nw', 'ne'].includes(data.handle)) {
      y = translate.y - gapH;
    }
    settranslate({ x, y });
    setPreH(data.size.height);
    setPreW(data.size.width);
  };

  const handleDrag = (e: any, data: any) => {
    settranslate({
      x: data.x,
      y: data.y,
    });
  };

  const showWrapStyle = {
    width: '100vw',
    height: '100vh',
    top: 0,
    left: 0,
  };
  const hideWrapStyle = {
    width: '0',
    height: '0',
    top: 'calc(100vh - 65px)',
    left: 'calc(100vw - 44px)',
  };

  const clickWrap = e => {
    e.persist();
    if (e.target.className === 'write-mail-wrap draggable-animate') {
      mailActions.doShowWebWrite(false);
    }
  };

  useEffect(() => {
    // 隐藏写信弹窗（最小化）或者内容被清空（关闭弹窗）
    if (!showWebWriteLetter || mailLength < 1) {
      // 停止自动保存
      setExecAutoSaveDraft(false);
    } else {
      // 开启自动保存
      setExecAutoSaveDraft(true);
    }
  }, [showWebWriteLetter, mailLength]);

  useEffect(
    () => () => {
      // 停止自动保存
      setExecAutoSaveDraft(false);
    },
    []
  );

  return (
    <div
      className="write-mail-wrap draggable-animate"
      onClick={e => {
        clickWrap(e);
      }}
      hidden={mailLength === 0}
      style={showWebWriteLetter ? showWrapStyle : hideWrapStyle}
    >
      <Draggable
        handle=".handle"
        bounds="parent"
        // defaultClassName={props.showWebWriteLetter ? 'draggable' : 'draggable-animate draggable'}
        defaultClassName="draggable"
        onDrag={(e, data) => {
          handleDrag(e, data);
        }}
        position={{ x: translate.x, y: translate.y }}
      >
        <ResizableBox
          width={boxWidth}
          height={boxHeight}
          minConstraints={[740, 640]}
          maxConstraints={maxConstraints}
          className="write-letter-resize"
          handle={h => <span className={`custom-component-${h}`} />}
          onResize={(e, data) => {
            onResize(e, data);
          }}
          resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
        >
          <div className="container">
            <Header />
            <div className="write">
              <WriteContent execAutoSaveDraft={execAutoSaveDraft} cond="innerWeb" />
              <TemplateAddModal />
            </div>
          </div>
        </ResizableBox>
      </Draggable>
    </div>
  );
};

export default WriteLetterWeb;
