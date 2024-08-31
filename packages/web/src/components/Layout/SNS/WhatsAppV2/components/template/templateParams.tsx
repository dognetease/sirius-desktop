import React, { useMemo } from 'react';
import classnames from 'classnames';
import { cloneDeep } from 'lodash';
import { api, WhatsAppTemplateV2, WhatsAppFileExtractResult, WhatsAppVariableType, getWhatsAppVariableTypeName, WhatsAppTemplateParamV2 } from 'api';
import { Form, FormInstance, Select, Input, Upload } from 'antd';
import TemplatePreview from './templatePreview';
import MediaUrlUploadIcon from '@/images/icons/whatsApp/media-url-upload.png';
import MediaUrlDeleteIcon from '@/images/icons/whatsApp/media-url-delete.svg';
import { fillTemplateWithTemplateParams, getTemplateParams, getComponentsItems } from '@/components/Layout/SNS/WhatsAppV2/utils';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getTransText } from '@/components/util/translate';
import style from './templateParams.module.scss';
import { getIn18Text } from 'api';
interface TemplateParamsProps {
  className?: string;
  form?: FormInstance;
  template: WhatsAppTemplateV2;
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
  const { header, body } = getComponentsItems(template);
  const layouts = useMemo(() => {
    return getTemplateParams(template);
  }, [template]);
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
  const appendPreviewSuffix = (sourceUrl: string) => {
    return sourceUrl.includes('?') ? `${sourceUrl}&imageView&blur=1x1` : `${sourceUrl}?imageView&blur=1x1`;
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
  return (
    <div className={classnames(style.templateParams, className)}>
      <div className={style.editor}>
        {renderFormItems(
          <>
            {layouts.map((item, index) => {
              if (item.type === 'header') {
                if (header?.format === 'IMAGE') {
                  return (
                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const headerTypeName = ['templateParams', index, 'type'];
                        const headerImageTypeName = ['templateParams', index, 'parameters', 0, 'type'];
                        const headerImageValueName = ['templateParams', index, 'parameters', 0, 'value'];
                        const hasHeaderImage = form.getFieldValue(headerImageValueName);

                        return (
                          <>
                            <Form.Item name={headerTypeName} noStyle>
                              <Input hidden />
                            </Form.Item>
                            <Form.Item name={headerImageTypeName} noStyle>
                              <Input hidden />
                            </Form.Item>
                            <Form.Item
                              label={getIn18Text('KAPIANSHANGBU')}
                              name={headerImageValueName}
                              rules={[
                                {
                                  validator: (_: any, url: string) => (url ? Promise.resolve() : Promise.reject(getIn18Text('QINGSHANGCHUANTUPIAN'))),
                                  validateTrigger: 'onSubmit',
                                },
                              ]}
                              getValueFromEvent={({ file }) => {
                                if (file.status === 'done' && file.response && file.response.success) {
                                  return appendPreviewSuffix(file.response.data.picUrl);
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
                                {hasHeaderImage ? (
                                  <div className={style.mediaUrlPreview} onClick={event => event.stopPropagation()}>
                                    <img className={style.mediaUrlPreviewImage} src={form.getFieldValue(headerImageValueName)} />
                                    <div className={style.mediaUrlPreviewDelete}>
                                      <img
                                        className={style.mediaUrlPreviewDeleteIcon}
                                        src={MediaUrlDeleteIcon}
                                        onClick={() => {
                                          setTimeout(() => {
                                            const templateParams = form.getFieldValue('templateParams') as WhatsAppTemplateParamV2[];
                                            const nextTemplateParams = templateParams.map((item, i) => {
                                              if (i !== index) return item;

                                              return {
                                                type: WhatsAppVariableType.FIXED,
                                                value: undefined,
                                              };
                                            });

                                            form.setFieldsValue({ templateParams: nextTemplateParams });
                                          });
                                        }}
                                      />
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
                          </>
                        );
                      }}
                    </Form.Item>
                  );
                }
                if (header?.format === 'TEXT') {
                  const headerTypeName = ['templateParams', index, 'type'];

                  return (
                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        return (
                          <>
                            <Form.Item name={headerTypeName} noStyle>
                              <Input hidden />
                            </Form.Item>
                            {(item.parameters || []).map((variable, variableIndex) => {
                              const typeName = ['templateParams', index, 'parameters', variableIndex, 'type'];
                              const valueName = ['templateParams', index, 'parameters', variableIndex, 'value'];

                              return (
                                <Form.Item label={variableIndex === 0 ? getIn18Text('KAPIANSHANGBU') : ''} key={variableIndex}>
                                  <div className={style.variableLabel}>{`{{${variableIndex + 1}}}${getTransText('BIANLIANGTIHUANWEI')}`}</div>
                                  <div className={style.variableContent}>
                                    <Form.Item className={style.variableType} name={typeName}>
                                      <Select
                                        placeholder={getIn18Text('QINGXUANZETIHUANLEIXING')}
                                        options={VARIABLE_TYPE_OPTIONS}
                                        onChange={() => {
                                          setTimeout(() => {
                                            form.setFieldsValue({
                                              [`templateParams[${index}].parameters[${variableIndex}].value`]: undefined,
                                            });
                                          });
                                        }}
                                      />
                                    </Form.Item>
                                    <Form.Item shouldUpdate noStyle>
                                      {() => {
                                        const type = form.getFieldValue(typeName);
                                        if (type === WhatsAppVariableType.FIXED) {
                                          return (
                                            <Form.Item
                                              className={style.variableValue}
                                              name={valueName}
                                              key={WhatsAppVariableType.FIXED}
                                              preserve={false}
                                              rules={[
                                                {
                                                  validator: (_: any, value: string) =>
                                                    (value || '').trim() ? Promise.resolve() : Promise.reject(getIn18Text('QINGTIANXIEMOBANBIANLIANG')),
                                                },
                                              ]}
                                            >
                                              <Input placeholder={getIn18Text('QINGSHURU')} />
                                            </Form.Item>
                                          );
                                        }
                                        if (type === WhatsAppVariableType.FILE_FIELD) {
                                          return (
                                            <Form.Item
                                              className={style.variableValue}
                                              name={valueName}
                                              key={WhatsAppVariableType.FILE_FIELD}
                                              preserve={false}
                                              rules={[
                                                {
                                                  validator: (_: any, value: number | undefined) =>
                                                    value !== undefined ? Promise.resolve() : Promise.reject(getIn18Text('QINGXUANZEMOBANBIANLIANG')),
                                                },
                                              ]}
                                            >
                                              <Select
                                                placeholder={getIn18Text('QINGXUANZE')}
                                                allowClear
                                                options={extraction.header.map((fieldName, index) => ({
                                                  label: fieldName,
                                                  value: `${index}`,
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
                              );
                            })}
                          </>
                        );
                      }}
                    </Form.Item>
                  );
                }
              }
              if (item.type === 'body') {
                const bodyTypeName = ['templateParams', index, 'type'];

                return (
                  <Form.Item noStyle shouldUpdate>
                    {() => {
                      return (
                        <>
                          <Form.Item name={bodyTypeName} noStyle>
                            <Input hidden />
                          </Form.Item>
                          {(item.parameters || []).map((variable, variableIndex) => {
                            const typeName = ['templateParams', index, 'parameters', variableIndex, 'type'];
                            const valueName = ['templateParams', index, 'parameters', variableIndex, 'value'];

                            return (
                              <Form.Item label={variableIndex === 0 ? getIn18Text('KAPIANZHONGBU') : ''} key={variableIndex}>
                                <div className={style.variableLabel}>{`{{${variableIndex + 1}}}${getTransText('BIANLIANGTIHUANWEI')}`}</div>
                                <div className={style.variableContent}>
                                  <Form.Item className={style.variableType} name={typeName}>
                                    <Select
                                      placeholder={getIn18Text('QINGXUANZETIHUANLEIXING')}
                                      options={VARIABLE_TYPE_OPTIONS}
                                      onChange={() => {
                                        setTimeout(() => {
                                          form.setFieldsValue({
                                            [`templateParams[${index}].parameters[${variableIndex}].value`]: undefined,
                                          });
                                        });
                                      }}
                                    />
                                  </Form.Item>
                                  <Form.Item shouldUpdate noStyle>
                                    {() => {
                                      const type = form.getFieldValue(typeName);
                                      if (type === WhatsAppVariableType.FIXED) {
                                        return (
                                          <Form.Item
                                            className={style.variableValue}
                                            name={valueName}
                                            key={WhatsAppVariableType.FIXED}
                                            preserve={false}
                                            rules={[
                                              {
                                                validator: (_: any, value: string) =>
                                                  (value || '').trim() ? Promise.resolve() : Promise.reject(getIn18Text('QINGTIANXIEMOBANBIANLIANG')),
                                              },
                                            ]}
                                          >
                                            <Input placeholder={getIn18Text('QINGSHURU')} />
                                          </Form.Item>
                                        );
                                      }
                                      if (type === WhatsAppVariableType.FILE_FIELD) {
                                        return (
                                          <Form.Item
                                            className={style.variableValue}
                                            name={valueName}
                                            key={WhatsAppVariableType.FILE_FIELD}
                                            preserve={false}
                                            rules={[
                                              {
                                                validator: (_: any, value: number | undefined) =>
                                                  value !== undefined ? Promise.resolve() : Promise.reject(getIn18Text('QINGXUANZEMOBANBIANLIANG')),
                                              },
                                            ]}
                                          >
                                            <Select
                                              placeholder={getIn18Text('QINGXUANZE')}
                                              allowClear
                                              options={extraction.header.map((fieldName, index) => ({
                                                label: fieldName,
                                                value: `${index}`,
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
                            );
                          })}
                        </>
                      );
                    }}
                  </Form.Item>
                );
              }
              return null;
            })}
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
