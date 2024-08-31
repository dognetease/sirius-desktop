import { getIn18Text } from 'api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import classnames from 'classnames';
import { api, apiHolder, apis, WhatsAppTemplate, WhatsAppApi } from 'api';
import { Button, Form, Upload, message } from 'antd';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/delete.svg';
import TemplatePreview from './templatePreview';
import Notice from '../notice/notice';
import { variableRegExp } from '@/components/Layout/SNS/WhatsApp/utils';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import HeaderExampleUploadIcon from '@/images/icons/whatsApp/media-url-upload.png';
import { getTransText } from '@/components/util/translate';
import cloneDeep from 'lodash/cloneDeep';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import style from './templateEditor.module.scss';
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const { TextArea } = Input;
const templateHeaderPlaceholder = getTransText('QINGSHURUMOBANNEIRONG\uFF0CZHICHICHARU1GEBIANLIANG\uFF0CZUIDUO60GEZIFU\u3002LIRU:hello{{1}}.');
const templateBodyPlaceholder = getTransText(
  'QINGSHURUMOBANNEIRONG\uFF0CZHICHICHARUBIANLIANG\uFF0CZUIDUO1024GEZIFU\u3002LIRU:hello{{1}}\uFF0C your order have been delivered\uFF0C please connect with me{{2}}.'
);
const templateFooterPlaceholder = getTransText('QINGSHURUMOBANNEIRONG\uFF0CBUZHICHIBIANLIANG\uFF0CZUIDUO60GEZIFU\u3002');
const systemApi = api.getSystemApi();
interface TemplateFormValues {
  name: string;
  header: {
    format: 'IMAGE' | 'TEXT';
    text?: string;
    example?: string;
  };
  body: {
    text: string;
    examples?: string[];
  };
  footer: {
    text: string;
  };
  buttons?: {
    type: string | 'URL';
    text: string;
    url: string;
  }[];
  category: string;
  language: string;
}
interface TemplateEditorProps {
  className?: string;
  template?: WhatsAppTemplate | null;
  drafting?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onDraft: (template: WhatsAppTemplate) => void;
  onSubmit: (template: WhatsAppTemplate) => void;
}
const defaultButtonUrl = 'https://waimao.163.com/';
const defaultButtonConfig = {
  type: 'URL',
  text: '',
  url: '',
};
export const defaultTemplate = {
  name: '',
  structure: {
    header: {
      format: 'IMAGE',
      text: '',
    },
    body: {
      text: '',
    },
    footer: {
      text: '',
    },
    buttons: [{ ...defaultButtonConfig }],
  },
} as WhatsAppTemplate;
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
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate>(cloneDeep(defaultTemplate) as WhatsAppTemplate);
  const previewTemplate = useMemo(() => {
    const result = cloneDeep(editingTemplate);

    if (!result.name) {
      result.name === getIn18Text('MOBANMINGCHENG');
    }
    if (result.structure.header.format === 'TEXT' && !result.structure.header.text) {
      result.structure.header.text = getTransText('KAPIANSHANGBU');
    }
    if (!result.structure.body.text) {
      result.structure.body.text = getTransText('KAPIANZHONGBU');
    }
    if (!result.structure.footer || !result.structure.footer.text) {
      result.structure.footer = {
        text: getTransText('KAPIANXIABU'),
      };
    }
    if (!Array.isArray(result.structure.buttons) || !result.structure.buttons[0] || !result.structure.buttons[0].text) {
      result.structure.buttons = [
        {
          type: 'URL',
          text: getTransText('KAPIANANNIU'),
          url: '',
        },
      ];
    }

    return result;
  }, [editingTemplate]);
  useEffect(() => {
    whatsAppApi.getTemplateCategories().then(data => setCategories(data));
    whatsAppApi.getTemplateLanguages().then(data => setLanguages(data));
  }, []);
  useEffect(() => {
    if (template) {
      const nextEditingTemplate = {
        id: template.id,
        name: template.name,
        category: template.category,
        language: template.language,
        structure: cloneDeep(template.structure),
      } as WhatsAppTemplate;
      setFieldsValueByTemplate(nextEditingTemplate);
      setEditingTemplate(nextEditingTemplate);
    } else {
      form.resetFields();
      setEditingTemplate(cloneDeep(defaultTemplate));
    }
  }, [template]);
  const getVariableValidator = (variableMaxCount: number) => {
    return (_: any, text: string) => {
      const variables = text.match(variableRegExp) || [];
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
  const setFieldsValueByTemplate = (template: WhatsAppTemplate) => {
    form.setFieldsValue({
      name: template.name,
      header: template.structure.header,
      body: template.structure.body,
      footer: template.structure.footer,
      buttons:
        Array.isArray(template.structure.buttons) && template.structure.buttons.length > 0 ? template.structure.buttons : cloneDeep(defaultTemplate.structure.buttons),
      category: template.category,
      language: template.language,
    });
  };
  const handleValuesChange = (changedValues: TemplateFormValues, allValues: TemplateFormValues) => {
    let nextTemplateHeader = cloneDeep(allValues.header);

    const nextEditingTemplate = {
      name: allValues.name,
      structure: {
        header: {
          ...nextTemplateHeader,
          mediaUrl: allValues.header.format === 'IMAGE' ? nextTemplateHeader.example : undefined,
        },
        body: allValues.body,
        footer: allValues.footer,
        buttons: allValues.buttons,
      },
    };

    setEditingTemplate(nextEditingTemplate as WhatsAppTemplate);
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
              onValuesChange={handleValuesChange}
              scrollToFirstError={{ behavior: 'smooth' }}
              onFinish={values => {
                const { name, category, language, ...structure } = values;
                const params = { name, category, language, structure } as any as WhatsAppTemplate;
                const { header, body, footer, buttons } = params.structure;

                if (header.format === 'TEXT') {
                  const variables: string[] = header.text?.match(variableRegExp) || [];

                  if (!variables.length) {
                    header.example = undefined;
                  }
                }

                if (body.text) {
                  const variables: string[] = body.text.match(variableRegExp) || [];

                  body.examples = variables.length ? body.examples?.slice(0, variables.length) : undefined;
                }

                if (!footer?.text) {
                  params.structure.footer = undefined;
                }

                if (!Array.isArray(buttons) || !buttons[0] || !buttons[0].text || !buttons[0].url) {
                  params.structure.buttons = undefined;
                }

                if (finishType === 'draft') {
                  onDraft(params);
                }
                if (finishType === 'submit') {
                  onSubmit(params);
                }
              }}
            >
              <Form.Item
                label={getTransText('MOBANMINGCHENG')}
                name="name"
                required
                initialValue=""
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
                {/* <Input placeholder={getTransText('QINGSHURUMOBANMINGCHENG')} /> */}
                <Input placeholder={getTransText('QINGSHURUMOBANMINGCHENG_ZHICHI')} />
              </Form.Item>
              <Form.Item className={style.templateContent} label={getTransText('MOBANNEIRONG')} required>
                <Form.Item name="header" shouldUpdate noStyle>
                  <Form.Item label={getTransText('KAPIANSHANGBU')} name={['header', 'format']} initialValue={defaultTemplate.structure.header.format} required>
                    <EnhanceSelect placeholder={getTransText('QINGXUANZEKAPIANSHANGBU')} allowClear>
                      <InSingleOption value="IMAGE">{getTransText('TUPIAN')}</InSingleOption>
                      <InSingleOption value="TEXT">{getTransText('WENBEN')}</InSingleOption>
                    </EnhanceSelect>
                  </Form.Item>
                  {form.getFieldValue(['header', 'format']) === 'IMAGE' && (
                    <Form.Item noStyle shouldUpdate>
                      {() => (
                        <Form.Item
                          label={getTransText('TUPIANYANGLI')}
                          name={['header', 'example']}
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
                            {form.getFieldValue(['header', 'example']) ? (
                              <img className={style.headerExamplePreview} src={form.getFieldValue(['header', 'example'])} />
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
                    </Form.Item>
                  )}
                  {form.getFieldValue(['header', 'format']) === 'TEXT' && (
                    <>
                      <Form.Item
                        className={style.headerText}
                        name={['header', 'text']}
                        initialValue=""
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
                          const headerText = form.getFieldValue(['header', 'text']);
                          const variables: string[] = headerText.match(variableRegExp) || [];
                          const variablesInvalid = variables.some((variable, index) => variable !== `{{${index + 1}}}`);
                          if (variables.length !== 1 || variablesInvalid) return null;
                          console.log('wa-variables-header', variables);
                          return (
                            <Form.Item
                              label={getTransText('BIANLIANGYANGLI')}
                              name={['header', 'example']}
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
                </Form.Item>
                <Form.Item name="body" noStyle>
                  <Form.Item label={getTransText('KAPIANZHONGBU')} required>
                    <Form.Item
                      name={['body', 'text']}
                      required
                      initialValue=""
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
                      noStyle
                    >
                      <TextArea placeholder={templateBodyPlaceholder} autoSize={{ minRows: 2 }} />
                    </Form.Item>
                  </Form.Item>
                  <Form.Item className={style.variables} shouldUpdate>
                    {() => {
                      const bodyText = form.getFieldValue(['body', 'text']);
                      const variables: string[] = bodyText.match(variableRegExp) || [];
                      const variablesInvalid = variables.some((variable, index) => variable !== `{{${index + 1}}}`);
                      if (!variables.length || variablesInvalid) return null;
                      console.log('wa-variables-body', variables);
                      return (
                        <Form.List name={['body', 'examples']}>
                          {() => (
                            <>
                              {new Array(variables.length).fill(1).map((_, index) => (
                                <Form.Item
                                  key={index}
                                  name={index}
                                  fieldKey={index}
                                  isListField
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
                              ))}
                            </>
                          )}
                        </Form.List>
                      );
                    }}
                  </Form.Item>
                </Form.Item>
                <Form.Item label={getTransText('KAPIANXIABU')} name="footer">
                  <Form.Item
                    name={['footer', 'text']}
                    initialValue=""
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
                <Form.List name="buttons" initialValue={defaultTemplate.structure.buttons}>
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      {fields.map(({ key, name, ...restField }, index) => (
                        <Form.Item className={style.buttonSetting} label={index === 0 ? <span>{getTransText('KAPIANANNIU')}</span> : ''} required={false} key={key}>
                          <Form.Item shouldUpdate noStyle>
                            {() => {
                              const { url } = form.getFieldValue(['buttons'])[index];

                              return (
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
                              );
                            }}
                          </Form.Item>
                          <Form.Item shouldUpdate noStyle>
                            {() => {
                              const { text } = form.getFieldValue(['buttons'])[index];

                              return (
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
