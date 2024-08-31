import React, { useEffect, useRef, useState } from 'react';
import { Radio, Checkbox, Button } from 'antd';
import { useForm, Controller, FormProvider, useFieldArray } from 'react-hook-form';
import { SignDetail } from 'api';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { editSignAsync, addSignAsync, deleteSignAsync, previewSignAsync } from '@web-common/state/reducer/mailConfigReducer';
import { MailConfigActions, MailActions } from '@web-common/state/reducer';
import { ModalIdList } from '@web-common/state/reducer/niceModalReducer';
import { ReactComponent as AddIcon } from '@/images/icons/mail/icon-add.svg';
import { ReactComponent as DeleteIcon } from '@/images/icons/icon-close.svg';
import { defaultFormFields, FormSubmitData, getDefaultValue, getOptions, MacChar100Rule } from './const';
import CancelPopover from './cancel-popover';
import SignPreviewModal from './sign-preview-modal';
import AvatarUpload from './avatar-upload';
import SignEditor from './sign-editor';
import SignInput from './sign-input';
import style from './style.module.scss';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { getIn18Text } from 'api';

interface CustomSignFormProps {
  editData?: SignDetail | null;
  onSave?: (content: string) => void;
  noScroll?: boolean;
  currentAccount: string;
  signEditId: ModalIdList;
}
export const CustomSignForm = (props: CustomSignFormProps) => {
  const { editData, onSave, noScroll = false, currentAccount } = props;
  const { signTemplates, signPriviewContent, signActionLoading, hasContent, nickname, displayMail } = useAppSelector(state => state.mailConfigReducer);
  // 第三方账号的两个回填值不同
  const defaultValue = getDefaultValue(currentAccount);
  defaultValue.name = nickname || defaultValue.name;
  defaultValue.emailAddr = displayMail || defaultValue.emailAddr;
  const methods = useForm<FormSubmitData>({
    mode: 'onChange',
    criteriaMode: 'firstError',
    reValidateMode: 'onChange',
    defaultValues: defaultValue,
  });
  const {
    watch,
    control,
    getValues,
    reset,
    formState: { errors, isValid },
  } = methods;
  const { divContent, signInfoDTO: data } = editData || {};
  const { doChangeContent, doSetHasContent } = useActions(MailConfigActions);
  const { append, fields, remove } = useFieldArray({
    name: 'extraFields',
    control,
  });
  const signEditModal = useNiceModal(props.signEditId);
  const [showCancelPopover, setShowCancelPopover] = useState<boolean>(true);
  const content = useAppSelector(state => state.mailConfigReducer.signContent);
  const defaultTemplate = signTemplates[0]?.id || 1;
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  /** 显示头像|不显示头像|自定义签名 */
  const showAvatar = watch('signTemplateId', data?.signTemplateId);
  const vipChecked = data && 'showAppVipTag' in data ? data.showAppVipTag : false;
  // const defaultSignChecked = data && 'isSetDefault' in data ? data.isSetDefault : true;
  const [defaultSignChecked, setDefaultSignChecked] = useState<string[]>([]);
  useEffect(() => {
    let res = [];
    if (data && data.defaultItem) {
      data.defaultItem.compose && res.push('compose');
      data.defaultItem.reply && res.push('reply');
      data.defaultItem.forward && res.push('forward');
    } else {
      res = ['compose', 'reply', 'forward'];
    }
    setDefaultSignChecked(res);
  }, [data]);
  const isRTXContentEmpty = !hasContent && showAvatar === 0;
  const isFieldsValid = !isValid && showAvatar !== 0;
  const hideToolTip = () => dispatch(MailActions.doChangeEditorTooltip({ left: -1000, top: -1000, title: '' }));
  // const NoScrollStyle:CSSProperties = noScroll ? { maxHeight: 'unset', overflowY: 'unset' } : { maxHeight: 345, overflowY: 'scroll' };
  /** 回填数据 */
  useEffect(() => {
    if (data) {
      reset({ ...data, extraFields: data.userAddItem?.map(item => ({ field: item })), name: data.name ? data.name : defaultValue?.name || '' });
    }
  }, [data, reset]);
  /**
   * 回填 自定义签名 content
   */
  useEffect(() => {
    if (divContent && data?.signTemplateId === 0) {
      doChangeContent(divContent || '');
      doSetHasContent(true);
    } else {
      doSetHasContent(false);
    }
  }, [divContent]);
  const handleSave = async () => {
    if (!isValid && showAvatar !== 0) return;
    hideToolTip();
    const submitData = getValues();
    const { extraFields } = submitData;
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
      defaultItem: {
        control: defaultSignChecked.length,
        compose: defaultSignChecked.includes('compose'),
        forward: defaultSignChecked.includes('forward'),
        reply: defaultSignChecked.includes('reply'),
      },
      _account: currentAccount,
      modalId: props.signEditId,
    } as any;
    // 编辑 （多账号先将传入的邮箱信息设置为当前默认）
    if (data?.signId) {
      /** 模板和富文本切换没法直接编辑 需要先删除再新增模拟编辑 */
      if ((isSubmitRTX && !isEditingRTX) || (!isSubmitRTX && isEditingRTX)) {
        dispatch(deleteSignAsync({ id: data.signId, refresh: false, _account: currentAccount }));
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
      const noChange = isEqual(defaultValue, getValues());
      if (noChange) {
        setShowCancelPopover(false);
        doChangeContent('');
        signEditModal.hide(true);
        return;
      }
    }
    hideToolTip();
    const changedData = getValues();
    if (showAvatar === 0 && divContent !== content) {
      setShowCancelPopover(true);
      return;
    }
    if (showAvatar === 0 && divContent === content) {
      setShowCancelPopover(false);
      doChangeContent('');
      signEditModal.hide(true);
      return;
    }
    const initialData = data ? { ...data, extraFields: data.userAddItem?.map(item => ({ field: item })) } : defaultValue;
    if (isEqual(initialData, changedData)) {
      setShowCancelPopover(false);
      doChangeContent('');
      signEditModal.hide(true);
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

  const DefaultItem = () => {
    const defaultOptions = [
      { label: getIn18Text('YINGYONGXIEXIN'), value: 'compose' },
      { label: getIn18Text('YINGYONGHUIFU'), value: 'reply' },
      { label: getIn18Text('YINGYONGZHUANFA'), value: 'forward' },
    ];
    const defaultValueChange = (value: any) => {
      setDefaultSignChecked(value);
      setShowCancelPopover(true);
    };

    return (
      <div style={{ margin: '16px 0' }} className={style.signDefault}>
        <span style={{ marginRight: '16px' }}>{getIn18Text('SHEWEIMOREN')}</span>
        <Checkbox.Group defaultValue={defaultSignChecked} options={defaultOptions} onChange={defaultValueChange} />
      </div>
    );
  };

  return (
    <FormProvider {...methods}>
      <form className={style.customSignForm} onSubmit={e => e.preventDefault()} hidden={signTemplates.length === 0}>
        <div className={`ant-allow-dark ${style.formContent}`} ref={scrollRef}>
          <div className={style.radioGroup}>
            <Controller
              name="signTemplateId"
              control={control}
              defaultValue={data?.signTemplateId || 1}
              render={({ field, fieldState }) => <Radio.Group className={style.wrapper} {...field} options={getOptions(signTemplates, field.value ?? 1)} />}
            />
          </div>
          {/* 自定义文本签名 */}
          <div hidden={showAvatar !== 0} style={{ minHeight: 426 }}>
            <SignEditor />
            <DefaultItem />
          </div>
          {/* 带头像 & 不带头像 form 定制签名 */}
          <div className={style.inputWrapper} hidden={showAvatar === 0}>
            <div hidden={showAvatar !== defaultTemplate}>
              <AvatarUpload avatarUrl={data?.profilePhoto || ''} currentAccount={currentAccount} />
            </div>
            <div className={style.rightPart}>
              <div className={style.inputScroll}>
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
                        placeholder={getIn18Text('ZIDINGYI')}
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
              <CancelPopover placement="bottomRight" disable={!showCancelPopover} signEditId={props.signEditId}>
                <span onClick={handleCheckFormChanged} className={`sirius-no-drag ${style.closeIcon}`}>
                  <DeleteIcon />
                </span>
              </CancelPopover>
              <div className={style.addField}>
                <span onClick={handleAppend}>
                  <AddIcon />
                </span>
                <span onClick={handleAppend}>{getIn18Text('TIANJIAZIDINGYI')}</span>
              </div>
              <DefaultItem />
              <div className={style.config}>
                <Controller
                  name="showAppVipTag"
                  defaultValue={vipChecked}
                  render={({ field }) => (
                    <Checkbox {...field} defaultChecked={vipChecked} style={{ color: '#A8AAAD' }}>
                      {getIn18Text('XIANSHI\u201CQIANMING')}
                      <span className={style.highLight}>{getIn18Text('WANGYILINGXIBAN')}</span>
                      {getIn18Text('DINGZHI\u201D')}
                    </Checkbox>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className={style.footer}>
            <div>
              <CancelPopover placement="top" signEditId={props.signEditId}>
                <Button className={`${style.actionBtn} ${style.del}`} onClick={handleCheckFormChanged}>
                  {getIn18Text('QUXIAO')}
                </Button>
              </CancelPopover>
              <Button
                type="ghost"
                disabled={isFieldsValid || isRTXContentEmpty}
                loading={signActionLoading}
                className={`${style.actionBtn} ${style.preview}`}
                onClick={handlePreview}
              >
                {getIn18Text('YULAN')}
              </Button>
              <Button disabled={isFieldsValid || isRTXContentEmpty} loading={signActionLoading} className={`${style.actionBtn} ${style.primary}`} onClick={handleSave}>
                {getIn18Text('BAOCUN')}
              </Button>
            </div>
          </div>
        </div>
        <SignPreviewModal />
      </form>
    </FormProvider>
  );
};
