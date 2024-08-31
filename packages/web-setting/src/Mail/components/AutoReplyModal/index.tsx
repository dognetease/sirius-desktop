import React, { useState, useEffect } from 'react';
import { getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Radio, Checkbox, Button } from 'antd';
import { ScheduleDatePicker, ScheduleTimeStepPicker } from '@web-schedule/components/FormComponents';
import moment, { Moment } from 'moment';
import { AutoReplyActions, useActions } from '@web-common/state/createStore';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { AutoReplyEditor } from './editor';
import { AutoReplyModel, MomentType, AutoReplyApi, apiHolder, apis, DataTrackerApi } from 'api';
import './index.scss';
const limitWordCount = 76006;
let contentChanged = false;
const autoReplyApi = apiHolder.api.requireLogicalApi(apis.autoReplyApiImpl) as AutoReplyApi;
const FormItem = Form.Item;
let editorInstance: any;
let oldAutoReply: AutoReplyModel;
const needDiff = ['onlyContact', 'onceForSameSender', 'disabled'];
const needMoments = ['startDate', 'endDate', 'startTime', 'endTime'];
// const changeVisible = false
const AutoReplyModal: React.FC<{
  visible: boolean;
  closeModel: () => void;
}> = props => {
  const { visible, closeModel } = props;
  const [form] = Form.useForm<AutoReplyModel>();
  // 获取reducer 和 更新
  const { updateAutoReplyDetail } = useActions(AutoReplyActions);
  const [isDisabled, setIsdisabled] = useState<boolean>(false);
  const [overLimit, setOverLimit] = useState<boolean>(false);
  const [noContant, setNoContant] = useState<boolean>(false);
  const [changeVisible, setChangeVisible] = useState<boolean>(false);
  const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
  const chengeEndDate = (endDate: Moment | null) => {
    const moments = form.getFieldValue(['moments']);
    const endTime = endDate ? endDate.hour(18).minute(0).seconds(0) : null;
    form.setFieldsValue({
      moments: {
        ...moments,
        endTime: endTime || null,
        endDate: endTime?.clone() || null,
      },
    });
  };
  const compareReply = (oldData: AutoReplyModel, newData: AutoReplyModel): boolean => {
    if (contentChanged) {
      return true;
    }
    for (let i = 0; i < needDiff.length; i++) {
      if (oldData[needDiff[i] as keyof typeof oldData] !== newData[needDiff[i] as keyof typeof newData]) {
        return true;
      }
    }
    for (const n of needMoments) {
      if (moment.isMoment(oldData.moments[n]) && moment.isMoment(newData.moments[n])) {
        if (!(oldData.moments[n] as Moment).isSame(newData.moments[n])) {
          return true;
        }
      } else if (newData.moments[n] === null && oldData.moments[n] === null) {
        continue;
      } else {
        return true;
      }
    }
    return false;
  };
  const cancelModel = () => {
    const newAutoReply = form.getFieldsValue(true);
    const hasChange = compareReply(oldAutoReply, newAutoReply);
    if (hasChange) {
      setChangeVisible(true);
    } else {
      closeModel();
    }
  };
  const confirmModal = () => {
    const wordCount = getWordCount();
    if (wordCount === 0 || wordCount > limitWordCount) {
      return;
    }
    const { startDate, startTime, endDate, endTime } = form.getFieldValue(['moments']);
    if (!startDate || !startTime) {
      SiriusMessage.error({
        content: !startDate ? getIn18Text('KAISHIRIQIBU') : getIn18Text('KAISHISHIJIANBU'),
      });
      return;
    }
    if (endDate && !endTime) {
      SiriusMessage.error({
        content: getIn18Text('QINGXUANZEJIESHU'),
      });
      return;
    }
    const startDateAndTime: MomentType = startDate.clone().set({
      hour: startTime.hours(),
      minute: startTime.minutes(),
      second: 0,
      millisecond: 0,
    });
    let endDateAndTime: MomentType = null;
    if (moment.isMoment(endDate) && moment.isMoment(endTime)) {
      endDateAndTime = endDate.clone().set({
        hour: endTime.hours(),
        minute: endTime.minutes(),
        second: 0,
        millisecond: 0,
      });
    }
    // 将startTime 和 endTime 同步
    form.setFieldsValue({
      moments: {
        startDate,
        endDate,
        startTime: startDateAndTime || null,
        endTime: endDateAndTime || null,
      },
      content: editorInstance.getContent(),
    });
    if (endDateAndTime && startDateAndTime && startDateAndTime.isAfter(endDateAndTime)) {
      SiriusMessage.error({
        content: getIn18Text('JIESHUSHIJIANBU'),
      });
      return;
    }
    let params: AutoReplyModel = form.getFieldsValue(true);
    // 埋点
    trackApi.track('pcMineCenter_click_save_setAutoResponsePage', {
      state: !params.disabled,
      onlyContacts: params.onlyContact,
      onlyOnce: params.onceForSameSender,
    });
    if (!params.id) {
      autoReplyApi
        .addMailRulesByAutoReply(params)
        .then(res => {
          if (res) {
            SiriusMessage.success({
              content: params.disabled ? getIn18Text('YIGUANBIZIDONG') : getIn18Text('YIKAIQIZIDONG'),
            });
            updateAutoReplyDetail({
              ...form.getFieldsValue(true),
              id: res, //
            });
            form.resetFields();
            closeModel();
          }
        })
        .catch(() => {
          SiriusMessage.error({
            content: getIn18Text('ZIDONGHUIFUSHE'),
          });
        });
    } else {
      autoReplyApi
        .updateMailRulesByAutoReply(params)
        .then(res => {
          if (res) {
            updateAutoReplyDetail(form.getFieldsValue(true));
            SiriusMessage.success({
              content: params.disabled ? getIn18Text('YIGUANBIZIDONG') : getIn18Text('YIKAIQIZIDONG'),
            });
            form.resetFields();
            closeModel();
          }
        })
        .catch(() => {
          SiriusMessage.error({
            content: getIn18Text('ZIDONGHUIFUSHE'),
          });
        });
    }
  };
  const onRadioChange = e => {
    setIsdisabled(e.target.value);
  };
  const editorChange = () => {
    contentChanged = true;
    const wordCount = getWordCount();
    setOverLimit(wordCount > limitWordCount);
    setNoContant(false);
  };
  const editorBlur = () => {
    const wordCount = getWordCount();
    setNoContant(wordCount === 0);
  };
  const getWordCount = () => {
    if (editorInstance) {
      return editorInstance.plugins.wordcount.body.getCharacterCount() || 0;
    }
    return 0;
  };
  const getEditorInstance = (editor: any) => {
    editorInstance = editor;
  };
  const changeContactSet = (val, name: string) => {
    form.setFieldsValue({
      [name]: val.target.checked,
    });
  };
  useEffect(() => {
    autoReplyApi.getMailRulesByAutoReply().then((autoReply: AutoReplyModel) => {
      trackApi.track('pcMineCenter_click_setAutoResponse_mailSettingPage', { state: !autoReply.disabled });
      setIsdisabled(autoReply.disabled);
      oldAutoReply = autoReply;
      contentChanged = false;
      form.setFieldsValue(autoReply);
    });
  }, []);
  return (
    <>
      {
        // 一定不要加 getContainer={() => document.body}，否则编辑器第二次会加载不出来
        <>
          <Modal className="AutoReplyModal" footer={null} destroyOnClose centered width={680} visible={visible} onCancel={cancelModel}>
            <div className="title">{getIn18Text('ZIDONGHUIFU')}</div>
            <Form<AutoReplyModel> form={form}>
              <FormItem label="" name="disabled" className="content-radio">
                <Radio.Group onChange={onRadioChange}>
                  <Radio value={false}>{getIn18Text('QIYONG')}</Radio>
                  <Radio value={true}>{getIn18Text('BUQIYONG')}</Radio>
                </Radio.Group>
              </FormItem>
              <FormItem label={getIn18Text('KAISHISHIJIAN')} name={['moments']} className="content-time">
                <FormItem name={['moments', 'startDate']} className="content-time-date">
                  <ScheduleDatePicker disabled={isDisabled} allowClear={false} />
                </FormItem>
                <FormItem name={['moments', 'startTime']} className="content-time-time">
                  <ScheduleTimeStepPicker disabled={isDisabled} timeIntervals={15} defaultTime={false} />
                </FormItem>
                <span className="content-time-label">{getIn18Text('JIESHUSHIJIAN')}</span>
                <FormItem name={['moments', 'endDate']} className="content-time-date">
                  <ScheduleDatePicker allowClear={true} placeholder={getIn18Text('BUSHEZHIZECHANG')} onChange={chengeEndDate} disabled={isDisabled} />
                </FormItem>
                <FormItem dependencies={['moments', 'endDate']} style={{ display: 'inline-block' }}>
                  {({ getFieldValue }) => {
                    return (
                      <div>
                        <FormItem
                          name={['moments', 'endTime']}
                          style={{ display: !getFieldValue(['moments', 'endDate']) ? 'none' : 'inline-block' }}
                          className="content-time-time"
                        >
                          <ScheduleTimeStepPicker timeIntervals={15} defaultTime={false} disabled={isDisabled} />
                        </FormItem>
                      </div>
                    );
                  }}
                </FormItem>
              </FormItem>

              <FormItem name="content" label="" className="content-editor">
                <Form.Item noStyle dependencies={['content']}>
                  {({ getFieldValue }) => {
                    return (
                      <>
                        <div className="content-editor-mask" style={{ display: isDisabled ? 'block' : 'none' }}></div>
                        <AutoReplyEditor
                          originContent={getFieldValue('content')}
                          editorChange={editorChange}
                          editorBlur={editorBlur}
                          getEditorInstance={getEditorInstance}
                          isWarn={overLimit || noContant}
                          disabled={isDisabled}
                        />
                        <div className="content-editor-limit">
                          {overLimit && `最多输入${limitWordCount}个字符`}
                          {noContant && `请填写自动回复内容`}
                        </div>
                      </>
                    );
                  }}
                </Form.Item>
              </FormItem>

              <FormItem style={{ marginBottom: 0 }} className="footer">
                <FormItem name="onlyContact" label="" valuePropName="checked" className="content-auto">
                  <Checkbox
                    disabled={isDisabled}
                    onChange={value => {
                      changeContactSet(value, 'onlyContact');
                    }}
                  >
                    {getIn18Text('JINXIANGTONGXUNLU')}
                  </Checkbox>
                </FormItem>
                <FormItem name="onceForSameSender" label="" valuePropName="checked" className="content-auto">
                  <Checkbox
                    disabled={isDisabled}
                    style={{ lineHeight: '32px' }}
                    onChange={value => {
                      changeContactSet(value, 'onceForSameSender');
                    }}
                  >
                    {getIn18Text('TONGYIFAJIANREN')}
                  </Checkbox>
                </FormItem>
                <FormItem className="content-btn" style={{ display: 'inline-block', float: 'right' }}>
                  <Button
                    onClick={() => {
                      closeModel();
                    }}
                    className="btn-cancel"
                  >
                    {getIn18Text('QUXIAO')}
                  </Button>
                  <Button type="primary" htmlType="submit" onClick={confirmModal} className="btn-save">
                    {getIn18Text('BAOCUN')}
                  </Button>
                </FormItem>
              </FormItem>
            </Form>
          </Modal>
          <Modal className="change-model-confirm" footer={null} centered width={400} closable={false} destroyOnClose mask={false} visible={changeVisible}>
            <div className="content">
              <div className="icon"></div>
              <div className="text">{getIn18Text('DANGQIANSHEZHISHANG')}</div>
            </div>
            <div className="footer">
              <Button
                className="cancel"
                onClick={() => {
                  setChangeVisible(false);
                }}
              >
                {getIn18Text('JIXUBIANJI')}
              </Button>
              <Button
                className="confirm"
                type="primary"
                htmlType="submit"
                onClick={() => {
                  closeModel();
                  form.resetFields();
                }}
              >
                {getIn18Text('QUEDINGTUICHU')}
              </Button>
            </div>
          </Modal>
        </>
      }
    </>
  );
};
export default AutoReplyModal;
