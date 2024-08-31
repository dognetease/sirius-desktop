import React from 'react';
import { Checkbox, Form, FormInstance, Select, Spin } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { apiHolder, CustomerApi, CustomerContactModel, LabelModel, RequestCompanyMyList } from 'api';
import { debounce } from 'lodash';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import style from './labelManager.module.scss';
import { getLabelStyle } from '../utils/utils';
import classnames from 'classnames';
import removeIcon from '@/images/icons/close_modal.svg';
import { customerDataTracker, LabelListAction } from '../tracker/customerDataTracker';
import { LabelColorSelector } from '../components/labelColorSelector/selector';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { getIn18Text } from 'api';
export interface IEditLabelModalProps {
  visible: boolean;
  label?: LabelModel;
  type?: number;
  selected?: string[];
  onOk: () => void;
  onCancel: () => void;
}
interface CompanyModel {
  /* eslint-disable camelcase */
  company_id: string;
  company_name: string;
  company_domain: string;
  label_list: Array<{
    label_id: string;
    label_name: string;
  }>;
}
interface IEditLabelModalState {
  companyList: CompanyModel[];
  contactList: CustomerContactModel[];
  checkedKeys: string[];
  loading: boolean;
  fetching: boolean;
  searchValue: string;
  labelType: number;
}
const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;
const RemoveIcon = ({ size = 8 }) => <img src={removeIcon} width={size} height={size} />;
export class EditLabelModal extends React.Component<IEditLabelModalProps, IEditLabelModalState> {
  formRef = React.createRef<FormInstance>();
  debounceFetch = debounce(this.fetchData.bind(this), 500);
  debounceFetchContact = debounce(this.fetchContactData.bind(this), 500);
  _lastFetch: number = 0;
  _lastFeatchContact: number = 0;
  constructor(props: IEditLabelModalProps) {
    super(props);
    const { selected } = this.props;
    this.state = {
      companyList: [],
      contactList: [],
      checkedKeys: selected ? [...selected] : [],
      loading: false,
      fetching: false,
      searchValue: '',
      labelType: props.label?.label_type ?? props.type ?? 0,
    };
  }
  componentDidMount() {
    this.state.labelType === 0 ? this.fetchData() : this.fetchContactData();
  }
  onLabelTypeChange = (value: number) => {
    this.setState({
      checkedKeys: [],
      labelType: value as number,
    });
    value === 0 ? this.fetchData() : this.fetchContactData();
  };
  onSelect = (id: string) => {
    const { checkedKeys } = this.state;
    this.setState({
      checkedKeys: Array.from(new Set([...checkedKeys, id])),
    });
  };
  onDeselect = (id: string) => {
    const { checkedKeys } = this.state;
    const idx = checkedKeys.indexOf(id);
    if (idx > -1) {
      checkedKeys.splice(idx, 1);
      this.setState({
        checkedKeys: [...checkedKeys],
      });
    }
  };
  onChange = (value: string[]) => {
    this.setState({
      checkedKeys: value,
    });
  };
  onDropdownVisibleChange = (open: boolean) => {
    const { searchValue } = this.state;
    if (!open && searchValue) {
      this.setState({
        searchValue: '',
      });
      if (searchValue) {
        this.fetchData();
      }
    }
  };
  handleOk = () => {
    const { onOk, label } = this.props;
    this.setState({ loading: true });
    this.formRef.current
      ?.validateFields()
      .then(values => {
        //
        const params: Record<string, any> = {
          label_name: values.label_name,
          label_color: values.label_color,
          label_type: values.label_type,
        };
        if (params.label_type === 0) {
          params.label_companies = values.label_companies.join(',');
        } else {
          params.label_contacts = values.label_contacts.join(',');
        }
        if (label) {
          return customerApi.editLabel({
            label_id: label.label_id,
            ...params,
          });
        }
        return customerApi.addLabel(params);
      })
      .then(newLabel => {
        onOk();
        customerDataTracker.trackLabelListAction(label ? LabelListAction.Edit : LabelListAction.Create, {
          labID: newLabel.label_id,
          number: newLabel.label_company_count,
        });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };
  async fetchData(key?: string) {
    const req: RequestCompanyMyList = { sort: '', is_desc: false, page: 1, page_size: 1000, label_name_list: [] };
    if (key) {
      req.search_key = key;
    }
    this.setState({ fetching: true });
    const _lastFetch = (this._lastFetch = +new Date());
    customerApi
      .companyMyList(req)
      .then(data => {
        if (_lastFetch !== this._lastFetch) {
          // 过时请求
          return;
        }
        const companyList = data.content.map(
          item =>
            ({
              company_id: item.company_id,
              company_name: item.company_name,
              company_domain: item.company_domain,
              label_list: item.label_list ? item.label_list.map(i => ({ ...i, label_id: String(i.label_id), label_name: i.label_name })) : [],
            } as CompanyModel)
        );
        this.setState({
          fetching: false,
          companyList,
        });
        return data;
      })
      .catch(() => {
        this.setState({
          fetching: false,
        });
      });
  }
  async fetchContactData(key?: string) {
    const _lastFeatchContact = (this._lastFeatchContact = +new Date());
    this.setState({ fetching: true });
    return customerApi
      .contactList({
        condition: 'company',
        search_key: key,
      })
      .then(data => {
        if (_lastFeatchContact !== this._lastFeatchContact) {
          // 过时请求
          return;
        }
        this.setState({
          fetching: false,
          contactList: data,
        });
        return data;
      })
      .catch(() => {
        this.setState({
          fetching: false,
        });
      });
  }
  renderOptions() {
    const { companyList, checkedKeys } = this.state;
    return companyList.map(company => {
      const checked = checkedKeys.indexOf(company.company_id) > -1;
      return (
        <Select.Option key={company.company_id} value={company.company_id} label={company.company_name} className={style.companyOptionItem}>
          <Checkbox checked={checked} />
          <div className={style.companyOptionContent}>
            <div className={style.companyNameWrapper}>
              <span className={style.companyName} title={company.company_name}>
                {company.company_name}
              </span>
              <div className={style.companyLabels} title={company.label_list.map(l => l.label_name).join(', ')}>
                {company.label_list.map(label => {
                  const styleObj = getLabelStyle(label.label_id);
                  return (
                    <span className={style.companyLabel} style={styleObj} key={label.label_id}>
                      {label.label_name}
                    </span>
                  );
                })}
              </div>
            </div>
            {company.company_domain && <div className={style.companyDomain}>{company.company_domain}</div>}
          </div>
        </Select.Option>
      );
    });
  }
  renderContactOptions() {
    const { contactList, checkedKeys } = this.state;
    return contactList.map(contact => {
      const checked = checkedKeys.indexOf(contact.contact_id) > -1;
      return (
        <Select.Option key={contact.contact_id} value={contact.contact_id} label={contact.contact_name} className={style.companyOptionItem}>
          <Checkbox checked={checked} />
          <div className={style.contactContent}>
            <div>
              <AvatarTag user={{ name: contact.contact_name, email: contact.email }} />
            </div>
            <div className={style.contactNameWrapper}>
              <span className={style.companyName} title={contact.contact_name}>
                {contact.contact_name}
              </span>
              {/* <div className={style.companyLabels} title={contact.label_list.map(l => l.label_name).join(', ')}>
{contact.label_list.map(label => {
const styleObj = getLabelStyle(label.label_id);
return (
<span
className={style.companyLabel}
style={styleObj}
key={label.label_id}
>
{label.label_name}
</span>
);
})}
</div> */}
              <div className={style.companyDomain}>{contact.email}</div>
            </div>
          </div>
        </Select.Option>
      );
    });
  }
  render() {
    const { label, visible, onCancel } = this.props;
    const { loading, fetching, checkedKeys, searchValue, labelType } = this.state;
    const title = label ? getIn18Text('BIANJIBIAOQIAN') : getIn18Text('XINJIANBIAOQIAN');
    return (
      <SiriusModal
        width={520}
        title={title}
        visible={visible}
        onCancel={onCancel}
        confirmLoading={loading}
        onOk={this.handleOk}
        className={classnames([style.editLabelModal, 'custom-modal-footer', 'custom-modal-header'])}
        destroyOnClose
        maskClosable={false}
      >
        <Form ref={this.formRef} layout="vertical">
          <Form.Item label={getIn18Text('BIAOQIANMINGCHENG')} name="label_name" rules={[{ required: true }]} initialValue={label?.label_name}>
            <Input placeholder={getIn18Text('QINGSHURUBIAOQIANMINGCHENG')} maxLength={20} />
          </Form.Item>
          <Form.Item label={getIn18Text('BIAOQIANLEIXING')} name="label_type" initialValue={labelType}>
            <Select
              placeholder={getIn18Text('QINGXUANZEBIAOQIANLEIXING')}
              disabled={!!label}
              onChange={this.onLabelTypeChange}
              dropdownClassName={style.editLabelDropdown}
              suffixIcon={<DownTriangle />}
            >
              <Select.Option value={0}>{getIn18Text('KEHU')}</Select.Option>
              <Select.Option value={1}>{getIn18Text('LIANXIREN')}</Select.Option>
            </Select>
          </Form.Item>
          {labelType === 0 && (
            <Form.Item label={getIn18Text('TIANJIAKEHU')} name="label_companies" initialValue={checkedKeys}>
              <Select
                showSearch
                allowClear
                value={checkedKeys}
                filterOption={false}
                placeholder={getIn18Text('QINGSHURUKEHUMINGCHENG')}
                mode="multiple"
                optionLabelProp="label"
                className={style.compaySelector}
                onSearch={value => {
                  this.debounceFetch(value);
                  this.setState({ searchValue: value });
                }}
                onChange={this.onChange}
                notFoundContent={fetching ? <Spin size="small" /> : null}
                dropdownClassName={style.editLabelDropdown}
                removeIcon={<RemoveIcon />}
                autoClearSearchValue={false}
                searchValue={searchValue}
                onDropdownVisibleChange={this.onDropdownVisibleChange}
              >
                {this.renderOptions()}
              </Select>
            </Form.Item>
          )}
          {labelType === 1 && (
            <Form.Item label={getIn18Text('TIANJIALIANXIREN')} name="label_contacts" initialValue={checkedKeys}>
              <Select
                showSearch
                allowClear
                value={checkedKeys}
                filterOption={false}
                placeholder={getIn18Text('QINGSHURULIANXIRENXINGMING')}
                mode="multiple"
                optionLabelProp="label"
                className={style.compaySelector}
                onSearch={value => {
                  this.debounceFetchContact(value);
                  this.setState({ searchValue: value });
                }}
                onChange={this.onChange}
                notFoundContent={fetching ? <Spin size="small" /> : null}
                dropdownClassName={style.editLabelDropdown}
                removeIcon={<RemoveIcon />}
                autoClearSearchValue={false}
                searchValue={searchValue}
                onDropdownVisibleChange={this.onDropdownVisibleChange}
              >
                {this.renderContactOptions()}
              </Select>
            </Form.Item>
          )}
          <Form.Item label={getIn18Text('BIAOQIANYANSE')} name="label_color" initialValue={label?.label_color || '#6BA9FF'}>
            <LabelColorSelector />
          </Form.Item>
        </Form>
      </SiriusModal>
    );
  }
}
