import React, { useMemo, useState } from 'react';
import { getIn18Text } from 'api';
import { Input } from 'antd';
// import { InsertVariable } from "../../insertVariable/insertVariable";
import { InsertVariablModal } from '../../insertVariable/insertVariableModal';
import './index.scss';
interface MySelectProps {
  visible: boolean;
  setOptions: (options: string[]) => void;
  options: string[];
}

export const VarSelect = ({ visible, options, setOptions }: MySelectProps) => {
  // 变量弹窗
  const [variableVisible, setVariableVisible] = useState(false);
  const values = useMemo(() => options.map(item => `#{${item}}`).join(''), [options]);

  const onSelect = (value: (string | number)[]) => {
    const key = value[value.length - 1] as string;
    if (options.includes(key)) {
      const newOptions = [...options];
      const index = newOptions.indexOf(key);
      newOptions.splice(index, 1);
      setOptions(newOptions);
      return;
    }
    setOptions(options.concat(value as string[]));
  };

  return (
    <div hidden={!visible}>
      <Input
        value={values}
        style={{ width: 288 }}
        placeholder={getIn18Text('QINGXUANZEBIANLIANGNEIRONG')}
        maxLength={256}
        // suffix={(

        //   <InsertVariable trackSource='源代码' onChange={onSelect} expandPosition='rightTop' />
        // )}
        suffix={
          <div
            onMouseDown={e => {
              e.stopPropagation();
            }}
            onClick={() => {
              setVariableVisible(true);
            }}
          >
            <div className="insert-btn">{getIn18Text('CHARUBIANLIANG')}</div>
          </div>
        }
      />
      {variableVisible && (
        <InsertVariablModal
          trackSource={getIn18Text('YUANDAIMA')}
          variableVisible={variableVisible}
          onChange={value => {
            onSelect(value);
            setVariableVisible(false);
          }}
          onVisible={visible => {
            !visible && setVariableVisible(false);
          }}
        />
      )}
    </div>
  );
};

export default VarSelect;
