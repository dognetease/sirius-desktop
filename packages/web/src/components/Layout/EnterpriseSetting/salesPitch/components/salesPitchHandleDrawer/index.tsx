import React, { useMemo, useRef } from 'react';
import { apiHolder } from 'api';
import classnames from 'classnames';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';

import { SalesPitchActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';
import { SalesPitchDrawerProps } from '../../types';
import SalesPitchAdd from './add';
import SalesPitchEdit from './edit';
import SalesPitchCheck from './check';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import styles from './index.module.scss';
import { getIn18Text } from 'api';

const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const isWindows = systemApi.isElectron() && !isMac;

interface PitchRef {
  onClose: () => void;
}

// 默认宽度
const defaultWidth = 504;

// 抽屉组件的入口，主要支持，新建，编辑，查看，三个类型
const SalesPitchHandleDrawer = (props: SalesPitchDrawerProps) => {
  const dispatch = useAppDispatch();

  const [drawerType] = useState2ReduxMock('drawerType');
  const [drawerVisible] = useState2ReduxMock('drawerVisible');

  // 新增编辑的ref
  const SalesPitchAddRef = useRef<PitchRef>(null);
  const SalesPitchEditRef = useRef<PitchRef>(null);

  const { width = defaultWidth, scene } = props || {};

  const title = useMemo(() => {
    let result = '';
    if (drawerType === 'ADD') {
      result = getIn18Text('XINJIANHUASHU');
    } else if (drawerType === 'EDIT') {
      result = getIn18Text('BIANJIHUASHU');
    } else if (drawerType === 'CHECK') {
      result = getIn18Text('HUASHUXIANGQING');
    }
    return result;
  }, [drawerType]);

  // 关闭弹窗
  const handleClose = () => {
    // if (success) {
    //   dispatch(SalesPitchThunks.fetchData({}));
    // }
    // setTimeout(() => {
    //   dispatch(SalesPitchActions.doCloseDrawer());
    // }, 100);

    // 如果是新增和编辑需要调子组件方法，验证是否修改
    if (drawerType === 'ADD') {
      SalesPitchAddRef.current?.onClose();
    } else if (drawerType === 'EDIT') {
      SalesPitchEditRef.current?.onClose();
    } else {
      dispatch(SalesPitchActions.doCloseDrawer());
    }
  };

  return (
    <SiriusDrawer
      className={classnames(styles.salesPitchHandleDrawer, {
        [styles.isWindows]: isWindows,
      })}
      headerStyle={{ padding: 20, borderBottom: 'none' }}
      bodyStyle={{ padding: '4px 20px 20px', marginBottom: 64 }}
      maskStyle={{ backgroundColor: 'transparent' }}
      title={title}
      width={width}
      placement="right"
      onClose={() => handleClose()}
      visible={drawerVisible}
      destroyOnClose
      maskClosable={drawerType === 'CHECK'}
    >
      {/* 新建 */}
      {drawerType === 'ADD' && <SalesPitchAdd ref={SalesPitchAddRef} />}
      {/* 编辑 */}
      {drawerType === 'EDIT' && <SalesPitchEdit ref={SalesPitchEditRef} />}
      {/* 查看 */}
      {drawerType === 'CHECK' && <SalesPitchCheck scene={scene} />}
    </SiriusDrawer>
  );
};

export default SalesPitchHandleDrawer;
