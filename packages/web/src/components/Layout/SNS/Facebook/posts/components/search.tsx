import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Input, Form, Checkbox } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { ReactComponent as AiSearchIcon } from '@/images/icons/whatsApp/ai-search-search.svg';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';
import { FacebookApi, apiHolder, apis, PagePostListReq } from 'api';
import style from './search.module.scss';

const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;

interface SearchProps {
  onChange: (params: (data: PagePostListReq) => PagePostListReq) => void;
  postValue: string | undefined;
  setPostValue: (value: string | undefined) => void;
  init: () => string;
}

const Search = (props: SearchProps) => {
  const { onChange, postValue, setPostValue, init } = props;
  const [form] = Form.useForm();
  const [publicPageList, setPublicPageList] = useState<{ pageId: string; pageName: string }[]>([]);

  const handlePublicPageFetch = () => {
    facebookApi.getPublicPageBriefList().then(nextPublicPageList => {
      if (nextPublicPageList && nextPublicPageList.length) {
        let allSelect = [
          {
            pageId: 'ALL',
            pageName: getTransText('QUANBUGONGGONGZHUYE'),
          },
        ];
        setPublicPageList([...allSelect, ...nextPublicPageList]);
        if (!init()) {
          handleSearchStart({
            pageIdList: nextPublicPageList.map(item => item.pageId),
          });
        }
      } else {
        setPostValue(undefined);
      }
    });
  };

  useEffect(() => {
    handlePublicPageFetch();
  }, []);

  const handleSearchStart = (data: Partial<PagePostListReq>, type?: 'search' | 'filter' | 'unread') => {
    switch (type) {
      case 'search':
      case 'filter':
      case 'unread':
        facebookTracker.trackPostsAction(type);
        break;
      default:
        break;
    }

    if (data.pageIdList && data.pageIdList[0] === 'ALL') {
      onChange(prev => ({
        ...prev,
        ...data,
        pageIdList: publicPageList.filter(item => item.pageId !== 'ALL').map(item => item.pageId),
      }));
    } else {
      onChange(prev => ({
        ...prev,
        ...data,
      }));
    }
  };

  return (
    <div className={classnames(style.fbPostFilter)}>
      <Form form={form} layout="inline">
        <Form.Item>
          <Input
            style={{ width: 220 }}
            placeholder={getTransText('QINGSHURUTIEZINEIRONG')}
            prefix={<AiSearchIcon />}
            onChange={e => !(e.target as HTMLInputElement).value && handleSearchStart({ postContent: '' }, 'search')}
            onPressEnter={e => handleSearchStart({ postContent: (e.target as HTMLInputElement).value }, 'search')}
            allowClear
          />
        </Form.Item>
        <Form.Item>
          <Select
            dropdownClassName="edm-selector-dropdown"
            style={{ width: 220 }}
            maxTagCount="responsive"
            placeholder={getTransText('XUANZEGONGGONGZHUYE')}
            defaultValue={'ALL'}
            value={postValue}
            onChange={e => {
              handleSearchStart({ pageIdList: [e as string] }, 'filter');
              setPostValue(e as string);
            }}
            filterOption
            optionFilterProp="label"
            options={publicPageList.map(item => ({
              label: item.pageName,
              value: item.pageId,
            }))}
            suffixIcon={<DownTriangle />}
            showArrow
          />
        </Form.Item>
        <div className={style.isAllMatchFormItem}>
          <Form.Item>
            <Checkbox onChange={e => handleSearchStart({ onlyShowUnreadComment: e.target.checked as boolean }, 'unread')}>
              {getTransText('JINKANWEIDUPINGLUNDETIEZI')}
            </Checkbox>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default Search;
