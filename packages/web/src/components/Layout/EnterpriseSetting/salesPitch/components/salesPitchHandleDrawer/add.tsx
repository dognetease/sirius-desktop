import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { AddSalesPitchModel } from 'api';
import { Button, Form, Input, Radio, message } from 'antd';
import { salesPitchRequest as request } from '@web-common/state/reducer/salesPitchReducer/request';
import { MailTemplateEditor } from '@web-edm/mailTemplate/template/editor';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { SALES_PITCH_STAGE_CONFIG_LIST } from '@web-common/state/reducer/salesPitchReducer/config';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { SalesPitchActions } from '@web-common/state/reducer';
import { SalesPitchThunks } from '@web-common/state/reducer/salesPitchReducer/thunk';
import { checkContentSize } from '@web-edm/send/utils/checkContentSize';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import styles from './index.module.scss';
import { SalesPitchDrawerProps } from '../../types';
import { isSame, salesPitchManageTrack } from '../../utils/util';
import RadioButton from './radioButton';
import { getIn18Text } from 'api';

// let editorInstance: any;

interface SalesPitchAddProps extends SalesPitchDrawerProps {}

const SalesPitchAdd = (props: SalesPitchAddProps, ref: any) => {
  const dispatch = useAppDispatch();
  // const { onClose } = props || {};
  const [form] = Form.useForm<AddSalesPitchModel>();
  const [selectedStageId] = useState2ReduxMock('selectedStageId');
  // 是否是管理员
  const isAdmin = useAppSelector(state => state.privilegeReducer.roles.some(role => role?.roleType === 'ADMIN'));
  // 查看弹窗，点击转存为我的话术的数据
  const [saveAsMySalesPitch, setSaveAsMySalesPitch] = useState2ReduxMock('saveAsMySalesPitch');
  // 编辑器实例
  const [editorInstance, setEditorInstance] = useState<any>(null);
  // 初始化的数据，关闭是比较使用
  const initData = useRef<any>(null);

  useEffect(() => {
    if (saveAsMySalesPitch) {
      const { discourseScene, discourseContent, discourseStage, type } = saveAsMySalesPitch;
      const values = {
        discourseScene,
        discourseContent,
        discourseStage,
        type,
      };
      // 延迟执行，防止被置空
      setTimeout(() => {
        initData.current = values;
        form.setFieldsValue(values as AddSalesPitchModel);
        // if (editorInstance) {
        //   editorInstance.setContent(discourseContent);
        //   setTimeout(() => {
        //     editorInstance.fire('updatePlaceholder', { show: false });
        //   }, 300)
        // }
        // setSaveAsMySalesPitch(null);
      }, 200);
    }
  }, [saveAsMySalesPitch]);

  useEffect(() => {
    // 管理员默认企业，个人固定个人
    const type = isAdmin ? 'ENTERPRISE' : 'PERSONAL';
    const values = {
      discourseScene: '',
      discourseContent: '',
      discourseStage: selectedStageId,
      type,
    };
    initData.current = values;
    form.setFieldsValue(values as AddSalesPitchModel);
  }, []);

  // 初始化编辑器后
  const getEditorInstance = (editor: any) => {
    // editorInstance = editor;
    setEditorInstance(editor);
    // 设置默认值
    if (editor) {
      // 先初始化，在赋值
      if (saveAsMySalesPitch) {
        // 延迟执行，防止被置空
        editor.setContent(saveAsMySalesPitch?.discourseContent);
        setTimeout(() => {
          // editor.fire('updatePlaceholder', { show: false });
          setSaveAsMySalesPitch(null);
        }, 500);
      } else {
        editor.setContent('');
      }
    }
  };

  // 点击确认
  const onOK = async () => {
    const values = await form.validateFields();
    // 打点
    salesPitchManageTrack({ opera: 'ADD', type: values.type });
    const result = await request.addSalesPitch(values);
    if (result?.success) {
      dispatch(SalesPitchThunks.fetchData({}));
      setTimeout(() => {
        dispatch(SalesPitchActions.doCloseDrawer());
      }, 100);
    } else {
      // const content = getIn18Text('XINJIANHUASHU') + getIn18Text('SHIBAI');
      const content = result.message || getIn18Text(['XINJIANHUASHU', 'SHIBAI']);
      message.error(content);
    }
  };

  // 点击取消
  const onCancel = () => {
    // 判断是否有修改
    const hasChange = !isSame(initData.current, form.getFieldsValue(true));
    // 判断是否有修改
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
          {getIn18Text('BAOCUN')}
        </Button>
      </div>
    </>
  );
};

export default React.forwardRef(SalesPitchAdd);
