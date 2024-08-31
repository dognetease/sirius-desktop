import React, { useMemo } from 'react';
import classnames from 'classnames';
import { api, WhatsAppTemplate, WhatsAppFileExtractResult, WhatsAppVariableType, getWhatsAppVariableTypeName } from 'api';
import { Form, FormInstance, Select, Input, Upload } from 'antd';
import TemplatePreview from './templatePreview';
import MediaUrlUploadIcon from '@/images/icons/whatsApp/media-url-upload.png';
import MediaUrlDeleteIcon from '@/images/icons/whatsApp/media-url-delete.svg';
import { fillTemplateWithTemplateParams } from '@/components/Layout/SNS/WhatsApp/utils';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getTransText } from '@/components/util/translate';
import style from './templateParams.module.scss';
import { getIn18Text } from 'api';
interface TemplateParamsProps {
  className?: string;
  form?: FormInstance;
  template: WhatsAppTemplate;
  extraction: WhatsAppFileExtractResult;
}
const systemApi = api.getSystemApi();
const WhatsAppVariableTypeName = getWhatsAppVariableTypeName();
const VARIABLE_TYPE_OPTIONS = Object.values(WhatsAppVariableType)
  .filter(value => typeof value === 'number')
  .map(value => ({
    label: WhatsAppVariableTypeName[value as WhatsAppVariableType],
    value,
  }));
const TemplateParams: React.FC<TemplateParamsProps> = props => {
  const { className, form: formFromProps, template, extraction } = props;
  const [innerForm] = Form.useForm();
  const form = useMemo(() => formFromProps || innerForm, [formFromProps, innerForm]);
  const renderFormItems = (formItems: React.ReactElement) => {
    if (formFromProps) return formItems;
    return (
      <Form form={innerForm} layout="vertical">
        {formItems}
      </Form>
    );
  };
  const handleBeforeUpload = (file: File) => {
    if (!['image/jpg', 'image/jpeg', 'image/png'].includes(file.type)) {
      Toast.error({ content: getIn18Text('TUPIANGESHICUOWU\uFF0CQINGZHONGXINXUANZE') });
      return false;
    }
    if (file.size > 1024 * 1024 * 5) {
      Toast.error({ content: getIn18Text('TUPIANDAXIAOCHAOCHU5MB\uFF0CQINGZHONGXINXUANZE') });
      return false;
    }
    return true;
  };
  const hanldeMediaUrlDelete = () => {
    const templateParams = form.getFieldValue('templateParams');

    form.setFieldsValue({
      templateParams: {
        ...templateParams,
        header: {
          mediaUrl: undefined,
        },
      },
    });
  };
  return (
    <div className={classnames(style.templateParams, className)}>
      <div className={style.editor}>
        {renderFormItems(
          <>
            <Form.Item name="templateParams" noStyle>
              {template.structure.header && (
                <Form.Item name={['templateParams', 'header']} noStyle>
                  {template.structure.header?.format === 'IMAGE' && (
                    <Form.Item noStyle shouldUpdate>
                      {() => (
                        <Form.Item
                          label={getIn18Text('KAPIANSHANGBU')}
                          name={['templateParams', 'header', 'mediaUrl']}
                          rules={[
                            {
                              validator: (_: any, mediaUrl: string) => (mediaUrl ? Promise.resolve() : Promise.reject(getIn18Text('QINGSHANGCHUANTUPIAN'))),
                              validateTrigger: 'onSubmit',
                            },
                          ]}
                          getValueFromEvent={({ file }) => {
                            if (file.status === 'done' && file.response && file.response.success) {
                              return file.response.data.picUrl;
                            }
                            return undefined;
                          }}
                        >
                          <Upload
                            data={{ needDel: false }}
                            name="picFile"
                            multiple={false}
                            showUploadList={false}
                            accept="image/jpg, image/jpeg, image/png"
                            action={systemApi.getUrl('uploadEdmImage')}
                            beforeUpload={handleBeforeUpload}
                          >
                            {form.getFieldValue(['templateParams', 'header', 'mediaUrl']) ? (
                              <div className={style.mediaUrlPreview} onClick={event => event.stopPropagation()}>
                                <img className={style.mediaUrlPreviewImage} src={form.getFieldValue(['templateParams', 'header', 'mediaUrl'])} />
                                <div className={style.mediaUrlPreviewDelete}>
                                  <img className={style.mediaUrlPreviewDeleteIcon} onClick={hanldeMediaUrlDelete} src={MediaUrlDeleteIcon} />
                                </div>
                              </div>
                            ) : (
                              <div className={style.mediaUrlUpload}>
                                <img className={style.mediaUrlUploadIcon} src={MediaUrlUploadIcon} />
                              </div>
                            )}
                            <div className={style.mediaUrlTypes}>{getIn18Text('ZHICHIjpg\u3001jpeg\u3001pngDENGGESHI\uFF0CZUIDA5MB')}</div>
                          </Upload>
                        </Form.Item>
                      )}
                    </Form.Item>
                  )}
                  <Form.List name={['templateParams', 'header', 'variables']}>
                    {fields => (
                      <>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <Form.Item label={index === 0 ? getIn18Text('KAPIANSHANGBU') : ''} key={key}>
                            <div className={style.variableLabel}>{`{{${index + 1}}}${getTransText('BIANLIANGTIHUANWEI')}`}</div>
                            <div className={style.variableContent}>
                              <Form.Item className={style.variableType} name={[name, 'type']} {...restField}>
                                <Select
                                  placeholder={getIn18Text('QINGXUANZETIHUANLEIXING')}
                                  options={VARIABLE_TYPE_OPTIONS}
                                  onChange={type => {
                                    const templateParams = form.getFieldValue('templateParams');
                                    const nextVariables = [...templateParams.header.variables];
                                    nextVariables.splice(index, 1, { type, value: undefined });
                                    form.setFieldsValue({
                                      templateParams: {
                                        ...templateParams,
                                        header: {
                                          variables: nextVariables,
                                        },
                                      },
                                    });
                                  }}
                                />
                              </Form.Item>
                              <Form.Item shouldUpdate noStyle>
                                {() => {
                                  const type = form.getFieldValue(['templateParams', 'header', 'variables'])[index].type;
                                  if (type === WhatsAppVariableType.FIXED) {
                                    return (
                                      <Form.Item
                                        className={style.variableValue}
                                        name={[name, 'value']}
                                        key="templateParams-header-variables-fixed"
                                        rules={[
                                          {
                                            validator: (_: any, value: string) =>
                                              (value || '').trim() ? Promise.resolve() : Promise.reject(getIn18Text('QINGTIANXIEMOBANBIANLIANG')),
                                          },
                                        ]}
                                        {...restField}
                                      >
                                        <Input placeholder={getIn18Text('QINGSHURU')} />
                                      </Form.Item>
                                    );
                                  }
                                  if (type === WhatsAppVariableType.FILE_FIELD) {
                                    return (
                                      <Form.Item
                                        className={style.variableValue}
                                        name={[name, 'value']}
                                        key="templateParams-header-variables-file_field"
                                        rules={[
                                          {
                                            validator: (_: any, value: number | undefined) =>
                                              value !== undefined ? Promise.resolve() : Promise.reject(getIn18Text('QINGXUANZEMOBANBIANLIANG')),
                                          },
                                        ]}
                                        {...restField}
                                      >
                                        <Select
                                          placeholder={getIn18Text('QINGXUANZE')}
                                          allowClear
                                          options={extraction.header.map((fieldName, index) => ({
                                            label: fieldName,
                                            value: index,
                                          }))}
                                        ></Select>
                                      </Form.Item>
                                    );
                                  }
                                  return null;
                                }}
                              </Form.Item>
                            </div>
                          </Form.Item>
                        ))}
                      </>
                    )}
                  </Form.List>
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item name={['templateParams', 'body']} noStyle>
              <Form.List name={['templateParams', 'body', 'variables']}>
                {fields => (
                  <>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <Form.Item label={index === 0 ? getIn18Text('KAPIANZHONGBU') : ''} key={key}>
                        <div className={style.variableLabel}>{`{{${index + 1}}}${getTransText('BIANLIANGTIHUANWEI')}`}</div>
                        <div className={style.variableContent}>
                          <Form.Item className={style.variableType} name={[name, 'type']} {...restField}>
                            <Select
                              placeholder={getIn18Text('QINGXUANZETIHUANLEIXING')}
                              options={VARIABLE_TYPE_OPTIONS}
                              onChange={type => {
                                const templateParams = form.getFieldValue('templateParams');
                                const nextVariables = [...templateParams.body.variables];
                                nextVariables.splice(index, 1, { type, value: undefined });
                                form.setFieldsValue({
                                  templateParams: {
                                    ...templateParams,
                                    body: {
                                      variables: nextVariables,
                                    },
                                  },
                                });
                              }}
                            />
                          </Form.Item>
                          <Form.Item shouldUpdate noStyle>
                            {() => {
                              const type = form.getFieldValue(['templateParams', 'body', 'variables'])[index].type;
                              if (type === WhatsAppVariableType.FIXED) {
                                return (
                                  <Form.Item
                                    className={style.variableValue}
                                    name={[name, 'value']}
                                    key="templateParams-body-variables-fixed"
                                    rules={[
                                      {
                                        validator: (_: any, value: string) =>
                                          (value || '').trim() ? Promise.resolve() : Promise.reject(getIn18Text('QINGTIANXIEMOBANBIANLIANG')),
                                      },
                                    ]}
                                    {...restField}
                                  >
                                    <Input placeholder={getIn18Text('QINGSHURU')} />
                                  </Form.Item>
                                );
                              }
                              if (type === WhatsAppVariableType.FILE_FIELD) {
                                return (
                                  <Form.Item
                                    className={style.variableValue}
                                    name={[name, 'value']}
                                    key="templateParams-body-variables-file_field"
                                    rules={[
                                      {
                                        validator: (_: any, value: number | undefined) =>
                                          value !== undefined ? Promise.resolve() : Promise.reject(getIn18Text('QINGXUANZEMOBANBIANLIANG')),
                                      },
                                    ]}
                                    {...restField}
                                  >
                                    <Select
                                      placeholder={getIn18Text('QINGXUANZE')}
                                      allowClear
                                      options={extraction.header.map((fieldName, index) => ({
                                        label: fieldName,
                                        value: index,
                                      }))}
                                    ></Select>
                                  </Form.Item>
                                );
                              }
                              return null;
                            }}
                          </Form.Item>
                        </div>
                      </Form.Item>
                    ))}
                  </>
                )}
              </Form.List>
            </Form.Item>
          </>
        )}
      </div>
      <Form.Item noStyle shouldUpdate>
        {() => {
          const templateParams = form.getFieldValue('templateParams');
          if (!templateParams) return null;
          const realTimeTemplate = fillTemplateWithTemplateParams({
            extraction,
            template,
            templateParams,
          });
          return realTimeTemplate && <TemplatePreview className={style.preview} template={realTimeTemplate} />;
        }}
      </Form.Item>
    </div>
  );
};
export default TemplateParams;
