import * as React from 'react';
import { Checkbox, Spin } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import _ from 'lodash';
import classNames from 'classnames';
import { apiHolder, ISearchCustomerReq, CustomerApi, ICustomerContactData, ISearchCustomerRes } from 'api';

import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import CustomerIcon from '@/images/customer.svg';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';

import './index.scss';
import { getLabelStyle } from '../../utils/utils';

const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;

export interface ISelectCustomerProps {
  prefixCls?: string;
  excludedKeys: string[];
  showSearch: boolean;
  includeLabels: boolean;
  onSelectChange?: (selected: string[]) => void;
  onSearch?: (value: string) => void;
  onDataChanged?: (data: ISearchCustomerRes & { contactList: ICustomerContactData[] }) => void;
  onViewChanged?: (view: string, prevView: string) => void;
}

/* eslint-enable */

interface ISelectCustomerState {
  data: ISearchCustomerRes & { contactList: ICustomerContactData[] };
  filterValue: string;
  selectedLabel?: ILabelData;
  checkedKeys: string[];
  showLabelList: boolean;
  loading: boolean;
  mode: 'search' | 'labelList';
  customerLabels: ILabelData[];
}

interface ICrumbData {
  text: string;
  action?: () => void;
}

const getRenderView = (state: ISelectCustomerState) => {
  if (state.selectedLabel) {
    return 'labelDetail';
  }
  if (state.showLabelList) {
    return 'labelList';
  }
  return 'default';
};

export class SelectCustomer extends React.Component<ISelectCustomerProps, ISelectCustomerState> {
  // eslint-disable-next-line react/static-property-placement
  static defaultProps = {
    prefixCls: 'su-select-customer',
    dataSource: [],
    excludedKeys: [],
    showSearch: true,
    includeLabels: true,
  };
  private _lastFetchTime = 0;
  debounceFetch = _.debounce(() => this.fetchData(), 400);

  constructor(props: ISelectCustomerProps) {
    super(props);
    this.state = {
      data: {
        label_list: [],
        contactList: [],
        company_list: [],
      },
      filterValue: '',
      checkedKeys: [],
      mode: 'search',
      showLabelList: false,
      loading: false,
      customerLabels: [],
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(_: ISelectCustomerProps, prev: ISelectCustomerState) {
    const prevView = getRenderView(prev);
    const currentView = getRenderView(this.state);
    if (prevView !== currentView) {
      this.props.onViewChanged && this.props.onViewChanged(currentView, prevView);
    }
  }

  handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    this.setState({
      filterValue: value,
    });
    // this.props.onSearch && this.props.onSearch(value);
    this.debounceFetch();
  };

  onItemSelect = (item: ICustomerContactData) => {
    const key = item.contact_id;
    const { checkedKeys } = this.state;
    const { onSelectChange } = this.props;
    const holder = [...checkedKeys];
    const idx = holder.indexOf(key);

    if (idx > -1) {
      holder.splice(idx, 1);
    } else {
      holder.push(key);
    }
    this.setState({
      checkedKeys: holder,
    });
    onSelectChange && onSelectChange(holder);
  };

  getCheckStatus(keyList?: string[]) {
    const { data } = this.state;
    const { excludedKeys } = this.props;
    // eslint-disable-next-line react/destructuring-assignment
    const keys = keyList ?? this.state.checkedKeys;
    if (keys.length === 0) {
      return 'none';
    }
    if (data.contactList.every(item => excludedKeys.indexOf(item.email) > -1 || keys.indexOf(item.contact_id) > -1)) {
      return 'all';
    }
    return 'part';
  }

  getCheckedData() {
    const { checkedKeys } = this.state;
    // eslint-disable-next-line camelcase
    const {
      data: { contactList },
    } = this.state;
    if (checkedKeys.length === 0) {
      return [];
    }

    return contactList.filter(item => checkedKeys.indexOf(item.contact_id) > -1);
  }

  createBreadCrumb(crumbs: ICrumbData[]) {
    const { prefixCls } = this.props;
    return (
      <div className={`${prefixCls}-crumb`}>
        {crumbs.map((item, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <>
              <span
                className={classNames([`${prefixCls}-crumb-item`, { [`${prefixCls}-crumb-link`]: !!item.action && !isLast }])}
                onClick={() => item.action && item.action()}
              >
                {item.text}
              </span>
              {!isLast && (
                <span className={`${prefixCls}-crumb-sep`}>
                  <ArrowRight />
                </span>
              )}
            </>
          );
        })}
      </div>
    );
  }

  fetchData() {
    const { filterValue, selectedLabel } = this.state;
    const { onDataChanged } = this.props;
    this.setState({ loading: true, checkedKeys: [], customerLabels: [] });
    const params: ISearchCustomerReq = {
      range: 'ALL',
    };
    if (filterValue) {
      params.key = filterValue;
    }
    if (selectedLabel) {
      params.label_id_limit = [String(selectedLabel.label_id)].join(',');
      params.range = 'LABEL';
    }

    const _lastFetchTime = (this._lastFetchTime = +new Date());
    customerApi.search(params).then(data => {
      if (_lastFetchTime !== this._lastFetchTime) {
        // 修复时序问题
        return;
      }
      // trim email space
      data.company_list.forEach(company => {
        company.contacts.forEach(contact => (contact.email = contact.email.trim()));
      });
      let contactList: ICustomerContactData[] = [];
      data.company_list.forEach(company => {
        contactList = [...contactList, ...company.contacts];
      });
      this.setState(
        {
          data: {
            ...data,
            contactList,
          },
          loading: false,
        },
        () => {
          // eslint-disable-next-line react/destructuring-assignment
          onDataChanged && onDataChanged(this.state.data);
        }
      );
    });
  }

  fetchLabelContacts() {
    const { customerLabels } = this.state;
    const { onDataChanged } = this.props;
    const params: ISearchCustomerReq = {
      range: 'LABEL',
      key: '',
      label_id_limit: customerLabels.map(item => item.label_id).join(','),
    };
    const _lastFetchTime = (this._lastFetchTime = +new Date());

    this.setState({ loading: true });

    customerApi
      .search(params)
      .then(data => {
        if (_lastFetchTime !== this._lastFetchTime) {
          // 修复时序问题
          return;
        }
        // trim email space
        data.company_list.forEach(company => {
          company.contacts.forEach(contact => (contact.email = contact.email.trim()));
        });
        const contactList: ICustomerContactData[] = data.company_list.reduce((accumulator, company) => [...accumulator, ...company.contacts], []);

        this.setState(
          {
            checkedKeys: contactList.map(item => item.contact_id),
          },
          () => {
            onDataChanged && onDataChanged(this.state.data);
          }
        );
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  toggleCheckAll() {
    const { data } = this.state;
    const { onSelectChange, excludedKeys } = this.props;
    let checkedKeys: string[] = [];
    if (this.getCheckStatus() === 'all') {
      this.setState({
        checkedKeys: [],
      });
    } else {
      checkedKeys = data.contactList.filter(i => excludedKeys.indexOf(i.email) === -1).map(i => i.contact_id);
      this.setState({
        checkedKeys,
      });
    }
    onSelectChange && onSelectChange(checkedKeys);
  }

  renderLabelItem(name: string, count: number, onClick: () => void, key?: string) {
    const { prefixCls } = this.props;
    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <li className={`${prefixCls}-item ${prefixCls}-label`} onClick={onClick} key={key}>
        {name !== '客户标签' && (
          <Checkbox
            checked={this.state.customerLabels.some(item => item.label_id === key)}
            onClick={event => event.stopPropagation()}
            onChange={event => {
              const label = this.state.data.label_list.find(item => item.label_id === key);

              if (label) {
                this.setState(
                  state => ({
                    customerLabels: event.target.checked ? [...state.customerLabels, label] : state.customerLabels.filter(item => item !== label),
                  }),
                  () => {
                    this.fetchLabelContacts();
                  }
                );
              }
            }}
          />
        )}
        <img src={CustomerIcon} width="32" height="32" alt={name} />
        <span className={`${prefixCls}-label-name`}>{name}</span>
        <span className={`${prefixCls}-label-count`}>{count}</span>
        <i className={`${prefixCls}-arrow-right`}>
          <ArrowRight />
        </i>
      </li>
    );
  }

  renderCustomerItem(item: ICustomerContactData) {
    const { prefixCls, excludedKeys } = this.props;
    const { checkedKeys } = this.state;
    const checked = checkedKeys.indexOf(item.contact_id) > -1;
    const excluded = excludedKeys && excludedKeys.indexOf(item.email) > -1;
    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <li
        key={item.contact_id}
        className={classNames([`${prefixCls}-item`, { [`${prefixCls}-disabled`]: excluded }])}
        onClick={excluded ? undefined : () => this.onItemSelect(item)}
      >
        <Checkbox checked={checked || excluded} disabled={excluded} />
        <AvatarTag user={{ name: item.contact_name, email: item.email }} size={32} innerStyle={{ border: 'none' }} />
        <div className={`${prefixCls}-item-content`}>
          <div className={`${prefixCls}-item-content-name`}>{item.contact_name}</div>
          <div className={`${prefixCls}-item-content-email`}>{item.email}</div>
        </div>
      </li>
    );
  }

  renderList(): React.ReactNode | null {
    const { data, filterValue } = this.state;
    const { includeLabels, prefixCls } = this.props;
    let labelNode: React.ReactNode | null = null;
    if (includeLabels) {
      labelNode = filterValue
        ? data.label_list.map(label =>
            this.renderLabelItem(
              label.label_name,
              label.label_company_count,
              () => {
                this.setState(
                  {
                    selectedLabel: label,
                    filterValue: '',
                    mode: 'search',
                  },
                  () => {
                    this.fetchData();
                  }
                );
              },
              String(label.label_id)
            )
          )
        : this.renderLabelItem('客户标签', data.label_list.length, () => {
            this.setState({
              showLabelList: true,
            });
          });
    }
    if (data.company_list.length === 0 && data.label_list.length === 0) {
      return this.renderEmpty();
    }
    return (
      <ul className={`${prefixCls}-list`}>
        {labelNode}
        {data.company_list.map(item => (
          <div className={`${prefixCls}-company-item`} key={item.company_id}>
            <div className={`${prefixCls}-company-name`}>
              {item.company_name}
              {item.labels.map(label => {
                // todo labelColor from api
                const style = getLabelStyle(label.label_id);
                return (
                  <span className={`${prefixCls}-company-label`} key={label.label_id} style={style}>
                    {label.label_name}
                  </span>
                );
              })}
            </div>
            {item.contacts.map(customer => this.renderCustomerItem(customer))}
          </div>
        ))}
      </ul>
    );
  }

  renderListInLabel(): React.ReactNode | null {
    const { prefixCls } = this.props;
    const { data } = this.state;
    if (data.company_list.length === 0) {
      return this.renderEmpty();
    }
    return (
      <ul className={`${prefixCls}-list`}>
        {/* {data.contactList.map(item => this.renderCustomerItem(item))} */}
        {data.company_list.map(item => (
          <div className={`${prefixCls}-company-item`} key={item.company_id}>
            <div className={`${prefixCls}-company-name`}>{item.company_name}</div>
            {item.contacts.map(customer => this.renderCustomerItem(customer))}
          </div>
        ))}
      </ul>
    );
  }

  renderLabelList() {
    const { data } = this.state;
    const { prefixCls } = this.props;
    return (
      <ul className={`${prefixCls}-list`}>
        {data.label_list.map(label =>
          this.renderLabelItem(
            label.label_name,
            label.label_company_count,
            () => {
              this.setState(
                {
                  selectedLabel: label,
                  mode: 'labelList',
                  filterValue: '',
                },
                () => {
                  this.fetchData();
                }
              );
            },
            String(label.label_id)
          )
        )}
      </ul>
    );
  }

  renderBreadCrumb() {
    const { selectedLabel, showLabelList, mode, filterValue } = this.state;
    let crumbData: ICrumbData[] = [];
    if (selectedLabel) {
      crumbData = [
        {
          text: mode === 'search' ? '搜索' : '客户列表',
          action: () => this.setState({ selectedLabel: undefined, showLabelList: false, filterValue: '' }, () => this.fetchData()),
        },
        {
          text: selectedLabel.label_name,
          action: () => this.setState({ filterValue: '' }, () => this.fetchData()),
        },
      ];
      if (mode === 'labelList') {
        crumbData.splice(1, 0, {
          text: '客户标签',
          action: () => this.setState({ selectedLabel: undefined, showLabelList: true, filterValue: '' }, () => this.fetchData()),
        });
      }
      if (filterValue) {
        crumbData.push({
          text: filterValue,
        });
      }
    } else if (showLabelList) {
      crumbData = [
        {
          text: '客户列表',
          action: () => this.setState({ showLabelList: false }),
        },
        {
          text: '客户标签',
        },
      ];
    }
    return crumbData.length > 0 ? this.createBreadCrumb(crumbData) : null;
  }

  renderLoading() {
    // eslint-disable-next-line react/destructuring-assignment
    return (
      <div className={`${this.props.prefixCls}-loading`}>
        <Spin />
      </div>
    );
  }

  renderEmpty() {
    return <div className={`${this.props.prefixCls}-empty`}>暂无数据</div>;
  }

  render() {
    const { filterValue, selectedLabel, showLabelList, loading } = this.state;
    const { prefixCls } = this.props;
    const breadCrumb = this.renderBreadCrumb();
    // eslint-disable-next-line no-nested-ternary
    const listBody = selectedLabel ? this.renderListInLabel() : showLabelList ? this.renderLabelList() : this.renderList();
    const placeholder = selectedLabel ? `搜索"${selectedLabel.label_name}"下的客户名称` : '请输入客户或标签信息';

    return (
      <div className={prefixCls}>
        <div className={`${prefixCls}-search-wrapper`}>
          <Input placeholder={placeholder} value={filterValue} onChange={this.handleSearch} allowClear prefix={<SearchIcon />} />
        </div>
        {breadCrumb}
        {loading ? this.renderLoading() : listBody}
      </div>
    );
  }
}

/* eslint-disable camelcase */
interface ILabelData {
  label_id: string;
  label_name: string;
  label_company_count: number;
}
