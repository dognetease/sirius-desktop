import React, { useRef, useState } from 'react';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import Loadable from '@loadable/component';
const EmojiPicker = Loadable(() => import('@web-common/components/UI/EmojiPicker'));

const HOCEditorEmoji = (Component: typeof React.Component) => {
  const EditorEmoji = (props: any) => {
    const { ref, ...rest } = props;

    const getEmojiResultCBRef = useRef((emoji: string) => {});
    const [emojiPos, setEmojiPos] = useState({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    });
    // 表情
    const [emojiVisible, setEmojiVisible] = useState(false);

    const insertEmojiAction = (emojiIconPosition: DOMRect, callback: (emoji: any) => {}) => {
      setEmojiPos({
        top: emojiIconPosition.top,
        left: emojiIconPosition.left,
        bottom: emojiIconPosition.bottom,
        right: emojiIconPosition.right,
      });
      getEmojiResultCBRef.current = callback;
      setEmojiVisible(true);
    };
    const onEmojiSelect = (val: any) => {
      getEmojiResultCBRef.current(val.native);
      setEmojiVisible(false);
    };

    return (
      <>
        <Component {...rest} ref={ref} insertEmojiAction={insertEmojiAction} />
        <LxPopover
          top={emojiPos.top}
          left={emojiPos.left}
          right={emojiPos.right}
          bottom={emojiPos.bottom}
          visible={emojiVisible}
          setVisible={setEmojiVisible}
          height={264}
          acceptTopBottom
        >
          <EmojiPicker onEmojiSelect={onEmojiSelect} visible={emojiVisible} />
        </LxPopover>
      </>
    );
  };

  return React.forwardRef((props, ref) => <EditorEmoji {...props} ref={ref} />);
};

export default HOCEditorEmoji;
