/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-len */
import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { Radio, Checkbox, Button } from 'antd';
import { useForm, Controller, FormProvider, useFieldArray } from 'react-hook-form';
import { SignDetail } from 'api';
import { get, isEqual } from 'lodash';
import { ReactComponent as AddIcon } from '../../../../../images/icons/mail/icon-add.svg';
import { ReactComponent as DeleteIcon } from '../../../../../images/icons/icon-close.svg';
import { defaultFormFields, EmptyRtxContent, FormSubmitData, getDefaultValue, getOptions, MacChar100Rule } from './const';
import { CancelPopover } from './cancel-popover';
import { SignPreviewModal } from './sign-preview-modal';

import { AvatarUpload } from './avatar-upload';
import { SignEditor } from './sign-editor';
import { SignInput } from './sign-input';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { editSignAsync, addSignAsync, deleteSignAsync, previewSignAsync } from '@web-common/state/reducer/mailConfigReducer';
import { MailConfigActions, MailActions } from '@web-common/state/reducer';

import style from './style.module.scss';

interface CustomSignFormProps {
  editData?: SignDetail | null;
  onSave?: (content: string) => void;
  noScroll?: boolean;
}

export const CustomSignForm = (props: CustomSignFormProps) => {
  const methods = useForm<FormSubmitData>({
    mode: 'onChange',
    criteriaMode: 'firstError',
    reValidateMode: 'onChange',
    defaultValues: getDefaultValue(),
  });
  const {
    watch,
    control,
    getValues,
    reset,
    formState: { errors, isValid },
  } = methods;
  const { editData, onSave, noScroll = false } = props;
  const { divContent, signInfoDTO: data } = editData || {};
  const { doToggleModal, doChangeContent } = useActions(MailConfigActions);
  const { signModalVisible, signTemplates, signPriviewContent, signActionLoading } = useAppSelector(state => state.mailConfigReducer);

  const { append, fields, remove } = useFieldArray({
    name: 'extraFields',
    control,
  });

  const [showCancelPopover, setShowCancelPopover] = useState<boolean>(true);

  const content = useAppSelector(state => state.mailConfigReducer.signContent);
  const defaultTemplate = signTemplates[0]?.id || 1;
  const scrollRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();

  /** 显示头像|不显示头像|自定义签名 */
  const showAvatar = watch('signTemplateId', data?.signTemplateId);

  const vipChecked = data && 'showAppVipTag' in data ? data.showAppVipTag : true;
  const defaultSignChecked = data && 'isSetDefault' in data ? data.isSetDefault : true;
  const isRTXContentEmpty = (EmptyRtxContent === content || content?.trim() === '') && showAvatar === 0;
  const isFieldsValid = !isValid && showAvatar !== 0;
  const hideToolTip = () => dispatch(MailActions.doChangeEditorTooltip({ left: -1000, top: -1000, title: '' }));

  // const NoScrollStyle:CSSProperties = noScroll ? { maxHeight: 'unset', overflowY: 'unset' } : { maxHeight: 345, overflowY: 'scroll' };

  /** 回填数据 */
  useEffect(() => {
    if (data) {
      reset({ ...data, extraFields: data.userAddItem?.map(item => ({ field: item })), name: data.name ? data.name : getDefaultValue()?.name || '' });
    }
  }, [data, reset]);

  /**
   * 回填 自定义签名 content
   */
  useEffect(() => {
    if (divContent && data?.signTemplateId === 0) {
      doChangeContent(divContent || '');
    }
  }, [divContent]);

  const handleSave = async () => {
    if (!isValid && showAvatar !== 0) return;
    hideToolTip();

    const submitData = getValues();
    const { extraFields, isSetDefault } = submitData;
    const userAddItem = extraFields?.map(item => item.field).filter(v => v.trim() !== '') || [];
    /** 提交时选择富文本签名 */
    const isSubmitRTX = submitData.signTemplateId === 0;
    /** 编辑时为富文本签名 */
    const isEditingRTX = data?.signTemplateId === 0;

    const rtxContent = isSubmitRTX ? content : '';
    const payload = {
      ...submitData,
      userAddItem,
      rtxContent,
      isDefault: isSetDefault,
    } as any;

    // 编辑
    if (data?.signId) {
      /** 模板和富文本切换没法直接编辑 需要先删除再新增模拟编辑 */
      if ((isSubmitRTX && !isEditingRTX) || (!isSubmitRTX && isEditingRTX)) {
        dispatch(deleteSignAsync({ id: data.signId, refresh: false }));
        dispatch(addSignAsync(payload));
      } else {
        dispatch(
          editSignAsync({
            ...payload,
            signId: data?.signId,
          } as any)
        );
      }
    } else {
      dispatch(addSignAsync(payload));
      if (onSave) {
        onSave(signPriviewContent);
      }
    }
  };

  const handlePreview = () => {
    const submitData = getValues();
    const { extraFields } = submitData;
    const userAddItem = extraFields?.map(item => item.field) || [];

    const payload = {
      ...submitData,
      userAddItem,
    };
    dispatch(previewSignAsync({ needHtmlContent: true, signInfo: payload }));
    hideToolTip();
  };

  /** 检查表单的值是否变化 */
  const handleCheckFormChanged = () => {
    if (!editData) {
      const noChange = isEqual(getDefaultValue(), getValues());
      if (noChange) {
        setShowCancelPopover(false);

        doToggleModal({ visble: false, signItem: null });
        return;
      }
    }
    hideToolTip();
    const changedData = getValues();

    if (showAvatar === 0 && (divContent !== content || changedData.isSetDefault !== data?.isSetDefault)) {
      setShowCancelPopover(true);
      return;
    }

    if (showAvatar === 0 && divContent === content) {
      setShowCancelPopover(false);
      doToggleModal({ visble: false, signItem: null });
      return;
    }

    const initialData = data ? { ...data, extraFields: data.userAddItem?.map(item => ({ field: item })) } : getDefaultValue();

    if (isEqual(initialData, changedData)) {
      setShowCancelPopover(false);
      doToggleModal({ visble: false, signItem: null });
    } else {
      setShowCancelPopover(true);
    }
  };

  const handleAppend = () => {
    append({ field: '' });
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current?.scrollHeight;
      }
    }, 100);
  };

  return (
    <FormProvider {...methods}>
      <form className={style.customSignForm} onSubmit={e => e.preventDefault()} hidden={signTemplates.length === 0}>
        <div className={style.formContent} ref={scrollRef}>
          <div className={style.radioGroup}>
            <Controller
              name="signTemplateId"
              control={control}
              defaultValue={data?.signTemplateId || 1}
              render={({ field }) => <Radio.Group className={style.wrapper} {...field} options={getOptions(signTemplates)} />}
            />
          </div>
          <div hidden={showAvatar !== 0} style={{ minHeight: 426 }}>
            <SignEditor />
          </div>
          <div className={style.inputWrapper} hidden={showAvatar === 0}>
            <div hidden={showAvatar !== defaultTemplate}>
              <AvatarUpload avatarUrl={data?.profilePhoto || ''} />
            </div>
            <div className={style.rightPart}>
              <div className={style.inputScroll} style={showAvatar !== defaultTemplate ? { paddingLeft: 24 } : {}}>
                {defaultFormFields.map(({ name, placeholder, rules }) => (
                  <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field }) => (
                      // @ts-ignore
                      <SignInput className={style.inputField} placeholder={placeholder} errorMsg={get(errors, [name, 'message'], '')} {...field} />
                    )}
                  />
                ))}

                {fields.map((item, index) => (
                  <Controller
                    key={item.id}
                    control={control}
                    defaultValue={item.field}
                    name={`extraFields.${index}.field`}
                    rules={MacChar100Rule}
                    render={({ field }) => (
                      <SignInput
                        className={style.inputField}
                        errorMsg={get(errors, ['extraFields', index, 'field', 'message'], '')}
                        placeholder="自定义"
                        suffix={
                          <div onClick={() => remove(index)} className={style.iconDelete}>
                            x
                          </div>
                        }
                        {...field}
                      />
                    )}
                  />
                ))}
              </div>
              {signModalVisible && (
                <CancelPopover placement="bottomRight" disable={!showCancelPopover} onConfirm={() => doToggleModal({ visble: false })}>
                  <span onClick={handleCheckFormChanged} className={`sirius-no-drag ${style.closeIcon}`}>
                    <DeleteIcon />
                  </span>
                </CancelPopover>
              )}

              <div className={style.addField} style={{ paddingLeft: showAvatar == 1 ? 0 : 24 }}>
                <span onClick={handleAppend}>
                  <AddIcon />
                </span>
                <span onClick={handleAppend}>添加自定义</span>
              </div>

              <div className={style.config} style={{ paddingLeft: showAvatar == 1 ? 0 : 24 }}>
                <Controller
                  name="showAppVipTag"
                  defaultValue={vipChecked}
                  render={({ field }) => (
                    <Checkbox {...field} defaultChecked={vipChecked} style={{ color: '#A8AAAD' }}>
                      显示“签名由
                      <span className={style.highLight}>网易外贸通</span>
                      定制”
                    </Checkbox>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className={style.footer}>
            <Controller
              name="isSetDefault"
              defaultValue={defaultSignChecked}
              render={({ field }) => (
                <Checkbox {...field} defaultChecked={defaultSignChecked}>
                  设为默认
                </Checkbox>
              )}
            />
            <div>
              {signModalVisible && (
                <CancelPopover onConfirm={() => doToggleModal({ visble: false, signItem: null })} placement="top">
                  <Button className={style.actionBtn} onClick={handleCheckFormChanged}>
                    取消
                  </Button>
                </CancelPopover>
              )}
              <Button disabled={isFieldsValid || isRTXContentEmpty} loading={signActionLoading} className={style.actionBtn} onClick={handlePreview}>
                预览
              </Button>
              <Button disabled={isFieldsValid || isRTXContentEmpty} loading={signActionLoading} className={`${style.actionBtn} ${style.primary}`} onClick={handleSave}>
                保存
              </Button>
              {/* <Button disabled={isFieldsValid || isRTXContentEmpty} loading={signActionLoading} className={`${style.actionBtn} ${style.primary}`} onClick={handleSave}>
                保存
              </Button> */}
            </div>
          </div>
        </div>
        <SignPreviewModal />
      </form>
    </FormProvider>
  );
};
