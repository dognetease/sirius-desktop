import { getIn18Text } from 'api';
import React, { useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import { api, apiHolder, apis, WhatsAppTemplateV2, WhatsAppApi } from 'api';
import { Button, Form, Upload, message } from 'antd';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/delete.svg';
import TemplatePreview from './templatePreview';
import Notice from '../notice/notice';
import { variableRegExp, initialComponents, orderComponents } from '@/components/Layout/SNS/WhatsAppV2/utils';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import HeaderExampleUploadIcon from '@/images/icons/whatsApp/media-url-upload.png';
import { getTransText } from '@/components/util/translate';
import cloneDeep from 'lodash/cloneDeep';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { PhoneSelect } from '../phoneSelect/phoneSelect';
import style from './templateEditor.module.scss';
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const { TextArea } = Input;
const templateHeaderPlaceholder = getTransText('QINGSHURUMOBANNEIRONG\uFF0CZHICHICHARU1GEBIANLIANG\uFF0CZUIDUO60GEZIFU\u3002LIRU:hello{{1}}.');
const templateBodyPlaceholder = getTransText(
  'QINGSHURUMOBANNEIRONG\uFF0CZHICHICHARUBIANLIANG\uFF0CZUIDUO1024GEZIFU\u3002LIRU:hello{{1}}\uFF0C your order have been delivered\uFF0C please connect with me{{2}}.'
);
const templateFooterPlaceholder = getTransText('QINGSHURUMOBANNEIRONG\uFF0CBUZHICHIBIANLIANG\uFF0CZUIDUO60GEZIFU\u3002');
const systemApi = api.getSystemApi();

const submitFilter = (template: WhatsAppTemplateV2) => {
  template = cloneDeep(template);

  template.components = template.components.filter(item => {
    if (item.type === 'FOOTER') {
      return !!item.text;
    }
    if (item.type === 'BUTTONS') {
      return !!item.buttons?.every(button => button.text && button.url);
    }
    return true;
  });

  return template;
};

interface TemplateEditorProps {
  className?: string;
  template?: WhatsAppTemplateV2 | null;
  drafting?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onDraft: (template: WhatsAppTemplateV2) => void;
  onSubmit: (template: WhatsAppTemplateV2) => void;
}

const initialTemplate = {
  name: '',
  category: undefined,
  language: undefined,
  components: cloneDeep(initialComponents),
} as unknown as WhatsAppTemplateV2;

const TemplateEditor: React.FC<TemplateEditorProps> = props => {
  const { className, template, drafting, submitting, onCancel, onDraft, onSubmit } = props;
  const [categories, setCategories] = useState<
    {
      value: string;
      desc: string;
    }[]
  >([]);
  const [languages, setLanguages] = useState<
    {
      value: string;
      desc: string;
    }[]
  >([]);
  const [form] = Form.useForm();
  const [finishType, setFinishType] = useState<'draft' | 'submit' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplateV2>(cloneDeep(initialTemplate));
  const previewTemplate = useMemo(() => {
    const template = cloneDeep(editingTemplate);
    const { name, components } = template;

    return {
      ...template,
      name: name || getIn18Text('MOBANMINGCHENG'),
      components: components.map(item => {
        if (item.type === 'HEADER') {
          if (item.format === 'TEXT' && !item.text) {
            item.text = getTransText('KAPIANSHANGBU');
          }
          if (!item.format) {
            item.format = 'TEXT';
            item.text = getTransText('KAPIANSHANGBU');
          }
        }
        if (item.type === 'BODY') {
          if (!item.text) {
            item.text = getTransText('KAPIANZHONGBU');
          }
        }
        if (item.type === 'FOOTER') {
          if (!item.text) {
            item.text = getTransText('KAPIANXIABU');
          }
        }
        if (item.type === 'BUTTONS') {
          if (!Array.isArray(item.buttons) || !item.buttons[0] || !item.buttons[0].text) {
            item.buttons = [
              {
                type: 'URL',
                text: getTransText('KAPIANANNIU'),
                url: '',
              },
            ];
          }
        }
        return item;
      }),
    };
  }, [editingTemplate]);
  useEffect(() => {
    whatsAppApi.getTemplateCategoriesV2().then(data => setCategories(data));
    whatsAppApi.getTemplateLanguagesV2().then(data => setLanguages(data));
  }, []);

  useEffect(() => {
    if (template) {
      const completeTemplate = orderComponents(template, true);

      form.setFieldsValue(completeTemplate);
      setEditingTemplate(completeTemplate);
    } else {
      form.setFieldsValue(initialTemplate);
      setEditingTemplate(cloneDeep(initialTemplate));
    }
  }, [template]);
  const getVariableValidator = (variableMaxCount: number) => {
    return (_: any, text: string) => {
      const variables = (text || '').match(variableRegExp) || [];
      if (variables.some((variable, index) => variable !== `{{${index + 1}}}`)) {
        return Promise.reject(getTransText('BIANLIANGJINZHICHICONG1KAISHIQIELIANXUDESHUZILEIXING'));
      }
      if (variables.length > variableMaxCount) {
        return Promise.reject(`最多支持${variableMaxCount}个变量`);
      }
      return Promise.resolve();
    };
  };
  const appendPreviewSuffix = (sourceUrl: string) => {
    return sourceUrl.includes('?') ? `${sourceUrl}&imageView&blur=1x1` : `${sourceUrl}?imageView&blur=1x1`;
  };
  const handleValuesChange = (changedValues: WhatsAppTemplateV2, allValues: WhatsAppTemplateV2) => {
    setEditingTemplate(allValues);
  };
  const handleBeforeUpload = (file: File) => {
    if (!['image/jpg', 'image/jpeg', 'image/png'].includes(file.type)) {
      Toast.error({
        content: getTransText('TUPIANGESHICUOWU\uFF0CQINGZHONGXINXUANZE'),
      });
      return false;
    }
    if (file.size > 1024 * 1024 * 5) {
      Toast.error({
        content: getTransText('TUPIANDAXIAOCHAOCHU5MB\uFF0CQINGZHONGXINXUANZE'),
      });
      return false;
    }
    return true;
  };
  return (
    <div className={classnames(style.templateEditor, className)}>
      <Notice className={style.header} type="error">
        {getTransText(
          'WhatsApp XIAOXIMOBANBIXUJINGGUOGUANFANGSHENHECAIKESHIYONG\uFF0CQINGZHENGQUESHEZHIMOBANNEIRONGYIJIMOBANZHONGLEIDEXINXI\uFF0CZHEJIANGYOUZHUYUTONGGUOGUANFANGSHENHE'
        )}
      </Notice>
      <div className={style.body}>
        <div className={style.setting}>
          <div className={style.settingContent}>
            <Form
              form={form}
              layout="vertical"
              preserve={false}
              initialValues={initialTemplate}
              onValuesChange={handleValuesChange}
              scrollToFirstError={{ behavior: 'smooth' }}
              onFinish={values => {
                values = submitFilter(values);

                if (finishType === 'draft') {
                  onDraft(values);
                }
                if (finishType === 'submit') {
                  onSubmit(values);
                }
              }}
            >
              <Form.Item
                label={getTransText('MOBANMINGCHENG')}
                name="name"
                required
                rules={[
                  {
                    required: true,
                    message: getTransText('QINGSHURUMOBANMINGCHENG'),
                  },
                  {
                    pattern: /^[a-z0-9_]*$/,
                    message: getTransText('ZHICHIXIAOXIEZIMU\u3001SHUZIJIXIAHUAXIAN'),
                  },
                  {
                    max: 100,
                    message: getTransText('ZUIDUOKEBAOHAN100GEZIFU'),
                  },
                ]}
              >
                <Input placeholder={getTransText('QINGSHURUMOBANMINGCHENG_ZHICHI')} />
              </Form.Item>
              <Form.Item className={style.templateContent} label={getTransText('MOBANNEIRONG')} required>
                <Form.Item name={['components', 0, 'type']} noStyle>
                  <Input hidden />
                </Form.Item>
                <Form.Item label={getTransText('KAPIANSHANGBU')} name={['components', 0, 'format']} required>
                  <EnhanceSelect placeholder={getTransText('QINGXUANZEKAPIANSHANGBU')} allowClear>
                    <InSingleOption value="IMAGE">{getTransText('TUPIAN')}</InSingleOption>
                    <InSingleOption value="TEXT">{getTransText('WENBEN')}</InSingleOption>
                  </EnhanceSelect>
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                  {() => (
                    <>
                      {form.getFieldValue(['components', 0, 'format']) === 'IMAGE' && (
                        <Form.Item
                          label={getTransText('TUPIANYANGLI')}
                          name={['components', 0, 'example', 'custom_header_handle_url']}
                          rules={[
                            {
                              validator: (_: any, mediaUrl: string) => (mediaUrl ? Promise.resolve() : Promise.reject(getTransText('QINGSHANGCHUANTUPIAN'))),
                              validateTrigger: 'onSubmit',
                            },
                          ]}
                          getValueFromEvent={({ file }) => {
                            if (file.status === 'done' && file.response && file.response.success) {
                              return appendPreviewSuffix(file.response.data.picUrl);
                            }
                            return undefined;
                          }}
                          required
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
                            {form.getFieldValue(['components', 0, 'example', 'custom_header_handle_url']) ? (
                              <img className={style.headerExamplePreview} src={form.getFieldValue(['components', 0, 'example', 'custom_header_handle_url'])} />
                            ) : (
                              <div className={style.headerExampleUpload}>
                                <div className={style.headerExampleUploadTrigger}>
                                  <img className={style.headerExampleUploadIcon} src={HeaderExampleUploadIcon} />
                                </div>
                                <span className={style.headerExampleUploadTypes}>{getTransText('ZHICHIjpg\u3001jpeg\u3001pngDENGGESHI\uFF0CZUIDA5MB')}</span>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>
                      )}
                      {form.getFieldValue(['components', 0, 'format']) === 'TEXT' && (
                        <>
                          <Form.Item
                            className={style.headerText}
                            name={['components', 0, 'text']}
                            rules={[
                              {
                                required: true,
                                message: getTransText('QINGSHURUMOBANNEIRONG'),
                              },
                              {
                                max: 60,
                                message: getTransText('ZUIDUOKEBAOHAN60GEZIFU'),
                              },
                              { validator: getVariableValidator(1) },
                            ]}
                          >
                            <TextArea placeholder={templateHeaderPlaceholder} autoSize={{ minRows: 2 }} />
                          </Form.Item>
                          <Form.Item className={style.variables} shouldUpdate>
                            {() => {
                              const headerText = form.getFieldValue(['components', 0, 'text']) || '';
                              const variables: string[] = headerText.match(variableRegExp) || [];
                              const variablesInvalid = variables.some((variable, index) => variable !== `{{${index + 1}}}`);
                              if (variables.length !== 1 || variablesInvalid) return null;
                              return (
                                <Form.Item
                                  label={getTransText('BIANLIANGYANGLI')}
                                  name={['components', 0, 'example', 'header_text', 0]}
                                  rules={[
                                    {
                                      required: true,
                                      message: getTransText('QINGSHURUBIANLIANGYANGLI'),
                                    },
                                  ]}
                                  required
                                >
                                  <Input addonBefore={`变量1:`} placeholder={`请输入变量{{1}}样例`} />
                                </Form.Item>
                              );
                            }}
                          </Form.Item>
                        </>
                      )}
                    </>
                  )}
                </Form.Item>
                <Form.Item name={['components', 1, 'type']} noStyle>
                  <Input hidden />
                </Form.Item>
                <Form.Item label={getTransText('KAPIANZHONGBU')} required>
                  <Form.Item
                    name={['components', 1, 'text']}
                    rules={[
                      {
                        required: true,
                        message: getTransText('QINGSHURUMOBANNEIRONG'),
                      },
                      {
                        max: 1024,
                        message: getTransText('ZUIDUOKEBAOHAN1024GEZIFU'),
                      },
                      { validator: getVariableValidator(Infinity) },
                    ]}
                    required
                    noStyle
                  >
                    <TextArea placeholder={templateBodyPlaceholder} autoSize={{ minRows: 2 }} />
                  </Form.Item>
                </Form.Item>
                <Form.Item className={style.variables} shouldUpdate>
                  {() => {
                    const bodyText = form.getFieldValue(['components', 1, 'text']) || '';
                    const variables: string[] = bodyText.match(variableRegExp) || [];
                    const variablesInvalid = variables.some((variable, index) => variable !== `{{${index + 1}}}`);
                    if (!variables.length || variablesInvalid) return null;
                    return variables.map((variable, index) => (
                      <Form.Item
                        name={['components', 1, 'example', 'body_text', 0, index]}
                        label={index === 0 ? getTransText('BIANLIANGYANGLI') : ''}
                        rules={[
                          {
                            required: true,
                            message: getTransText('QINGSHURUBIANLIANGYANGLI'),
                          },
                        ]}
                      >
                        <Input addonBefore={`变量${index + 1}:`} placeholder={`请输入变量{{${index + 1}}}样例`} />
                      </Form.Item>
                    ));
                  }}
                </Form.Item>
                <Form.Item name={['components', 2, 'type']} noStyle>
                  <Input hidden />
                </Form.Item>
                <Form.Item label={getTransText('KAPIANXIABU')}>
                  <Form.Item
                    name={['components', 2, 'text']}
                    rules={[
                      {
                        max: 60,
                        message: getTransText('ZUIDUOKEBAOHAN60GEZIFU'),
                      },
                      {
                        validator: (_: any, text?: string) => {
                          text = text || '';
                          const variables = text.match(variableRegExp) || [];

                          if (variables.length) return Promise.reject(getTransText('KAPIANDIBUBUZHICHIBIANLIANG'));
                          if (/\n/.test(text)) return Promise.reject(getIn18Text('KAPIANDIBUBUZHICHI'));

                          return Promise.resolve();
                        },
                      },
                    ]}
                    noStyle
                  >
                    <TextArea placeholder={templateFooterPlaceholder} autoSize={{ minRows: 2 }} />
                  </Form.Item>
                </Form.Item>
                <Form.Item name={['components', 3, 'type']} noStyle>
                  <Input hidden />
                </Form.Item>
                <Form.List name={['components', 3, 'buttons']}>
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      {fields.map(({ key, name, ...restField }, index) => (
                        <Form.Item className={style.buttonSetting} label={index === 0 ? <span>{getTransText('KAPIANANNIU')}</span> : ''} required={false} key={key}>
                          <Form.Item shouldUpdate noStyle>
                            {() => {
                              const { text, url } = form.getFieldValue(['components', 3, 'buttons'])[index];

                              return (
                                <>
                                  <Form.Item
                                    className={style.text}
                                    name={[name, 'text']}
                                    rules={[
                                      {
                                        validator: (_: any, text: string) => {
                                          if (!text) {
                                            if (url) {
                                              return Promise.reject(getTransText('QINGSHURUANNIUMINGCHENG'));
                                            } else {
                                              return Promise.resolve();
                                            }
                                          } else {
                                            if (!/^.{1,20}$/.test(text)) {
                                              return Promise.reject(getTransText('BUCHAOGUO20ZIFU'));
                                            } else {
                                              return Promise.resolve();
                                            }
                                          }
                                        },
                                      },
                                    ]}
                                    {...restField}
                                  >
                                    <Input placeholder={getTransText('ANNIUMINGCHENG')} />
                                  </Form.Item>
                                  <Form.Item
                                    className={style.url}
                                    name={[name, 'url']}
                                    rules={[
                                      {
                                        validator: (_: any, url: string) => {
                                          if (!url) {
                                            if (text) {
                                              return Promise.reject(getTransText('QINGSHURUANNIUTIAOZHUANDIZHI'));
                                            } else {
                                              return Promise.resolve();
                                            }
                                          } else {
                                            if (!/^(http|https):\/\/.*/.test(url)) {
                                              return Promise.reject(getTransText('QINGSHURUHEFADEANNIUTIAOZHUANDEZHI'));
                                            } else {
                                              return Promise.resolve();
                                            }
                                          }
                                        },
                                      },
                                    ]}
                                    {...restField}
                                  >
                                    <Input placeholder={getTransText('ANNIUTIAOZHUANDEZHI')} />
                                  </Form.Item>
                                </>
                              );
                            }}
                          </Form.Item>
                        </Form.Item>
                      ))}
                      {!!errors.length && (
                        <Form.Item className={style.buttonsErrorList}>
                          <Form.ErrorList errors={errors} />
                        </Form.Item>
                      )}
                    </>
                  )}
                </Form.List>
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    {getTransText('MOBANZHONGLEI')}
                    <span className={style.subLabel}>{getTransText('QINGXUANZEZHENGQUEMOBANZHONGLEI\uFF0CZHEJIANGYOUZHUYUTONGGUOGUANFANGSHENHE')}</span>
                  </span>
                }
                name="category"
                required
                rules={[
                  {
                    required: true,
                    message: getTransText('QINGXUANZEMOBANZHONGLEI'),
                  },
                ]}
              >
                <EnhanceSelect placeholder={getTransText('QINGXUANZEMOBANZHONGLEI')}>
                  {categories.map(item => (
                    <InSingleOption key={item.value} value={item.value}>
                      {item.desc}
                    </InSingleOption>
                  ))}
                </EnhanceSelect>
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    {getTransText('MOBANYUYAN')}
                    <span className={style.subLabel}>{getTransText('QINGXUANZEMOBANYUYAN\uFF0CZHENGQUEDEYUYANYOUZHUYUTONGGUOGUANFANGSHENHE')}</span>
                  </span>
                }
                name="language"
                required
                rules={[
                  {
                    required: true,
                    message: getTransText('QINGXUANZEMOBANYUYAN'),
                  },
                ]}
              >
                <EnhanceSelect placeholder={getTransText('QINGXUANZEMOBANYUYAN')}>
                  {languages.map(item => (
                    <InSingleOption key={item.value} value={item.value}>
                      {item.desc}
                    </InSingleOption>
                  ))}
                </EnhanceSelect>
              </Form.Item>
            </Form>
          </div>
        </div>
        <div className={style.preview}>
          <div className={style.previewTitle}>{getTransText('XIAOGUOYULAN')}</div>
          <div className={style.previewContent}>
            <TemplatePreview template={previewTemplate} />
          </div>
        </div>
      </div>
      <div className={style.footer}>
        <Button onClick={onCancel}>{getTransText('QUXIAO')}</Button>
        <Button
          loading={drafting}
          onClick={() => {
            setFinishType('draft');
            form.submit();
          }}
        >
          {getTransText('CUNCAOGAO')}
        </Button>
        <Button
          type="primary"
          loading={submitting}
          onClick={() => {
            setFinishType('submit');
            form.submit();
          }}
        >
          {getTransText('TIJIAOSHENHE')}
        </Button>
      </div>
    </div>
  );
};
export default TemplateEditor;
