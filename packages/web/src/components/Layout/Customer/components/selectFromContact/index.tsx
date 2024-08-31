import * as React from 'react';
import { Checkbox, Spin } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import _ from 'lodash';

import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { getSearchContact, UIContactModel } from '@web-common/components/util/contact';
import { getPersonContact } from '@web-common/utils/contact_util';

import '../selectCustomer/index.scss';

export interface ISelectPersonalContactProps {
  prefixCls?: string;
  excludedKeys?: string[];
  showSearch: boolean;
  onSelectChange?: (selected: string[]) => void;
}
export interface ISelectPersonalContactState {
  data: UIContactModel[];
  filterValue: string;
  loading: boolean;
  checkedKeys: string[];
}

export class SelectFromPersonalContact extends React.Component<ISelectPersonalContactProps, ISelectPersonalContactState> {
  // eslint-disable-next-line react/static-property-placement
  static defaultProps = {
    prefixCls: 'su-select-customer',
    dataSource: [],
    excludedKeys: [],
    showSearch: true,
    includeLabels: true,
  };

  debounceFetch = _.debounce(this.fetchData.bind(this), 400);

  constructor(props: ISelectPersonalContactProps) {
    super(props);
    this.state = {
      data: [],
      filterValue: '',
      checkedKeys: [],
      loading: false,
    };
  }

  componentDidMount() {
    this.fetchData('');
  }

  handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    this.setState({
      filterValue: value,
    });
    // this.props.onSearch && this.props.onSearch(value);
    this.debounceFetch(value);
  };

  onItemSelect = (item: UIContactModel) => {
    const { checkedKeys } = this.state;
    const { onSelectChange } = this.props;
    const key = item.contact.id;
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
    const { checkedKeys } = this.state;
    const keys = keyList ?? checkedKeys;
    if (keys.length === 0) {
      return 'none';
    }
    if (data.every(item => (keys as string[]).indexOf(item.contact.id) >= 0)) {
      return 'all';
    }
    return 'part';
  }

  getCheckedData() {
    const { checkedKeys, data } = this.state;
    if (checkedKeys.length === 0) {
      return [];
    }

    return data.filter(i => checkedKeys.indexOf(i.contact.id) > -1);
  }

  toggleCheckAll() {
    const { data } = this.state;
    const { onSelectChange } = this.props;
    let checkedKeys: string[] = [];
    if (this.getCheckStatus() === 'all') {
      this.setState({
        checkedKeys: [],
      });
    } else {
      checkedKeys = data.map(i => i.contact.id);
      this.setState({
        checkedKeys,
      });
    }
    onSelectChange && onSelectChange(checkedKeys);
  }

  fetchData(value: string) {
    //
    this.setState({ loading: true, checkedKeys: [] });
    if (!value) {
      getPersonContact().then(data => {
        this.setState({
          data,
          loading: false,
        });
      });
    } else {
      getSearchContact(value, false).then(data => {
        data &&
          this.setState({
            data: data[2],
            loading: false,
          });
      });
    }
  }

  renderCustomerItem(item: UIContactModel) {
    const { prefixCls } = this.props;
    const { checkedKeys } = this.state;
    const checked = checkedKeys.indexOf(item.contact.id) > -1;

    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <li key={item.contact.id} className={`${prefixCls}-item`} onClick={() => this.onItemSelect(item)}>
        <Checkbox checked={checked} />
        <AvatarTag user={{ name: item.contact.contactName, email: item.contact.accountName }} size={32} />
        <div className={`${prefixCls}-item-content`}>
          <div className={`${prefixCls}-item-content-name`}>{item.contact.contactName}</div>
          <div className={`${prefixCls}-item-content-email`}>{item.contact.accountName}</div>
        </div>
      </li>
    );
  }

  renderList(): React.ReactNode | null {
    const { data } = this.state;
    const { prefixCls } = this.props;
    if (data.length === 0) {
      return this.renderEmpty();
    }
    return <ul className={`${prefixCls}-list`}>{data.map(item => this.renderCustomerItem(item))}</ul>;
  }

  renderLoading() {
    const { prefixCls } = this.props;
    return (
      <div className={`${prefixCls}-loading`}>
        <Spin />
      </div>
    );
  }

  renderEmpty() {
    return <div className={`${this.props.prefixCls}-empty`}>暂无数据</div>;
  }

  render() {
    const { filterValue, loading } = this.state;
    const { prefixCls } = this.props;
    const listBody = this.renderList();
    const placeholder = '搜索联系人';

    return (
      <div className={prefixCls}>
        <div className={`${prefixCls}-search-wrapper`}>
          <Input placeholder={placeholder} value={filterValue} onChange={this.handleSearch} allowClear prefix={<SearchIcon />} />
        </div>
        {loading ? this.renderLoading() : listBody}
      </div>
    );
  }
}
