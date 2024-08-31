import React, { FC, useState } from 'react';
import { Drawer, Button } from 'antd';

import EditorModal from '../edmMarketingEditorModal/index';
import { DoubleTrackWrite } from '../doubleTrackWrite';
import { getIn18Text } from 'api';

export const DoubleTrackModal: FC<{
  show: boolean;
  setShow(show: boolean): void;
}> = props => {
  const { show, setShow } = props;
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <Drawer title={getIn18Text('TIANJIA')} width={520} destroyOnClose visible={show} onClose={() => setShow(false)}>
        <div>
          <div>
            <Button type="dashed">{getIn18Text('setting_system_switch_cancel')}</Button>
            <Button onClick={() => setShowEditor(true)} type="primary">
              {getIn18Text('QUEDING')}
            </Button>
          </div>
        </div>
      </Drawer>
      <EditorModal visible={showEditor} emailContent="" emailAttachment="" onCancel={() => setShowEditor(false)} onSave={({ emailContent }) => {}} />
    </>
  );
};
