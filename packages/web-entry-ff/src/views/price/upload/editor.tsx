import React from 'react';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import classnames from 'classnames';
import { Button } from 'antd';
import style from './editor.module.scss';

interface Props {
  value?: string;
  setValue: (content: string) => void;
  analyzeText: (content: string) => void;
  disabled: boolean;
  className?: string;
}

const placeholder = `请粘贴报价信息，识别后会录入到表格中，表格可编辑。每一行为一条报价，报价数据需用逗号或空格隔开。输入参照：
宁波，洛杉矶，MSK, 1000/1001/1002，20230503，20230507`;
const placeholderDisabled = '报价数已超40条，无法添加；若要继续添加，可删除部分报价再添加';

const Editor: React.FC<Props> = ({ value, setValue, disabled, className, analyzeText }) => {
  return (
    <div className={classnames(className, style.followEditor)}>
      <div className={classnames([style.editorWrap])}>
        <Input.TextArea
          autoSize={{ minRows: 10, maxRows: 30 }}
          autoFocus
          placeholder={disabled ? placeholderDisabled : placeholder}
          disabled={disabled}
          value={value}
          onChange={e => {
            let value = e.target.value;
            setValue(value);
          }}
        />
        <div className={style.editorFooter}>
          <div className={style.editorBtns}>
            <Button size="small" type="primary" disabled={disabled || !value} onClick={() => value && analyzeText(value)}>
              识别
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
