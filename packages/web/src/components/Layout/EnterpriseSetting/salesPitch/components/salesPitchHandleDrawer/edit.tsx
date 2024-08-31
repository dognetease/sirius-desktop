import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { EditSalesPitchModel, SalesPitchModel, SalesPitchTypes } from 'api';
import { Button, Form, Input, Radio, message } from 'antd';

import { SalesPitchActions } from '@web-common/state/reducer';
import { SalesPitchThunks } from '@web-common/state/reducer/salesPitchReducer/thunk';
import { checkContentSize } from '@web-edm/send/utils/checkContentSize';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { MailTemplateEditor } from '@web-edm/mailTemplate/template/editor';
import { salesPitchRequest as request } from '@web-common/state/reducer/salesPitchReducer/request';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { SALES_PITCH_STAGE_CONFIG_LIST } from '@web-common/state/reducer/salesPitchReducer/config';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { getSalePitchByCardID, isSame, salesPitchManageTrack } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import { SalesPitchDrawerProps } from '../../types';
import styles from './index.module.scss';
import RadioButton from './radioButton';
import { getIn18Text } from 'api';

// let editorInstance: any;

interface SalesPitchEditProps extends SalesPitchDrawerProps {}

const SalesPitchEdit = (props: SalesPitchEditProps, ref: any) => {
  const dispatch = useAppDispatch();
  const [drawerDataId] = useState2ReduxMock('drawerDataId');
  // const { onClose } = props || {};
  const [form] = Form.useForm<SalesPitchModel>();
  // 是否是管理员
  const isAdmin = useAppSelector(state => state.privilegeReducer.roles.some(role => role?.roleType === 'ADMIN'));
  // 编辑器实例
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const data = useAppSelector<SalesPitchModel | undefined>(state => getSalePitchByCardID(drawerDataId, state.salesPitchReducer.dataMap));

  const oldData = useRef<SalesPitchModel>();
  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
      oldData.current = data;
    }
  }, [data]);

  // 初始化编辑器后
  const getEditorInstance = (editor: any) => {
    // editorInstance = editor;
    setEditorInstance(editor);
    // 设置默认值
    if (data && data.discourseContent && editor) {
      editor.setContent(data.discourseContent);
    }
  };

  // 点击确认
  const onOK = async () => {
    const values = (await form.validateFields()) as EditSalesPitchModel;
    values.oldType = oldData.current?.type as SalesPitchTypes;
    values.id = data?.id as number;
    // 打点
    salesPitchManageTrack({ opera: 'EDIT', type: values.type });
    const result = await request.editSalesPitch(values);
    if (result) {
      dispatch(SalesPitchThunks.fetchData({}));
      setTimeout(() => {
        dispatch(SalesPitchActions.doCloseDrawer());
      }, 100);
    } else {
      const content = getIn18Text(['BIANJIHUASHU', 'SHIBAI']);
      message.error(content);
    }
  };

  // 点击取消
  const onCancel = () => {
    // 判断是否有修改
    const hasChange = !isSame(oldData.current as any, form.getFieldsValue(true));
    if (hasChange) {
      SiriusModal.confirm({
        title: getIn18Text('confirmLogoutTitle'),
        content: getIn18Text('confirmLogoutContent'),
        okText: getIn18Text('QUEREN'),
        okButtonProps: { type: 'primary' },
        okType: 'primary',
        cancelText: getIn18Text('QUXIAO'),
        onOk: () => {
          dispatch(SalesPitchActions.doCloseDrawer());
        },
      });
    } else {
      dispatch(SalesPitchActions.doCloseDrawer());
    }
  };

  // 中英文
  const stageLabel = getIn18Text('discourseStageLabel');
  const stageTip = getIn18Text('discourseStageTip');
  const rangeLabel = getIn18Text('discourseRangeLabel');
  const rangeText1 = getIn18Text('discourseRangeRadio1');
  const rangeText2 = getIn18Text('discourseRangeRadio2');
  const sceneLabel = getIn18Text('discourseSceneLabel');
  const sceneTip = getIn18Text('discourseSceneTip');
  const contentLabel = getIn18Text('discourseContentLabel');
  const contentTip = getIn18Text('discourseContentTip');
  const contentPlaceholder = getIn18Text('contentPlaceholder');
  const scenePlaceholder = getIn18Text('scenePlaceholder');
  const emptyContentTip = getIn18Text('NEIRONGWEIKONG');

  // 外层的方法
  useImperativeHandle(ref, () => ({
    onClose: onCancel,
  }));

  return (
    <>
      <Form form={form} colon={false} name="basic" layout="vertical" requiredMark={false}>
        {/* <Form.Item label={stageLabel} name="discourseStage" rules={[{ required: true, message: stageTip }]}>
          <Radio.Group buttonStyle="solid">
            {SALES_PITCH_STAGE_CONFIG_LIST.map(v => (
              <Radio.Button value={v.id} key={v.id}>
                {v.name}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item> */}
        <Form.Item label={stageLabel} name="discourseStage" rules={[{ required: true, message: stageTip }]}>
          <RadioButton options={SALES_PITCH_STAGE_CONFIG_LIST} />
        </Form.Item>
        <Form.Item label={rangeLabel} name="type" hidden={!isAdmin}>
          <Radio.Group>
            <Radio value="ENTERPRISE">
              <span className={styles.radioText}>{rangeText1}</span>
            </Radio>
            <Radio value="PERSONAL">
              <span className={styles.radioText}>{rangeText2}</span>
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={sceneLabel}
          name="discourseScene"
          rules={[
            { required: true, message: sceneTip },
            { type: 'string', max: 30, message: sceneTip },
          ]}
        >
          <Input placeholder={scenePlaceholder} />
        </Form.Item>
        <Form.Item
          label={contentLabel}
          name="discourseContent"
          rules={[
            () => ({
              validator(_, value) {
                if (editorInstance) {
                  if (!editorInstance.getBody().innerHTML && !editorInstance.getDoc()?.querySelector('body').innerHTML) {
                    return Promise.reject(new Error(emptyContentTip));
                  }
                  if (!checkContentSize(value)) {
                    return Promise.reject(new Error(contentTip));
                  }
                  return Promise.resolve();
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <div className={styles.contentEditor}>
            <MailTemplateEditor
              placeholder={contentPlaceholder}
              changeMailContent={() => {
                if (editorInstance) {
                  form.setFieldsValue({
                    discourseContent: editorInstance.getContent(),
                  });
                }
              }}
              onEditorChange={content => {
                form.setFieldsValue({
                  discourseContent: content,
                });
                editorInstance && editorInstance.fire('updatePlaceholder', { show: false });
              }}
              getEditorInstance={getEditorInstance}
            />
          </div>
        </Form.Item>
      </Form>
      <div className={styles.footer} style={{ textAlign: 'right' }}>
        <Button onClick={onCancel}>{getIn18Text('QUXIAO')}</Button>
        <Button onClick={onOK} type="primary" style={{ marginLeft: 16 }}>
          {getIn18Text('QUEREN')}
        </Button>
      </div>
    </>
  );
};

export default React.forwardRef(SalesPitchEdit);
