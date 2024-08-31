import React, { useCallback, useContext, useEffect, useState } from 'react';
// import SearchOutlined from '@ant-design/icons/SearchOutlined';
import { Table, message, Checkbox } from 'antd';
import { Tooltip } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { GlobalSearchCompanyDetail, GlobalSearchContactItem } from 'api';
import classnames from 'classnames';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './companyDetail.module.scss';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import LinkedinIcon from '../assets/linkedin.svg';
import FacebookIcon from '../assets/facebook.svg';
import TwitterIcon from '../assets/twitter.svg';
import { ReactComponent as ScreenIcon } from '../assets/screen.svg';
import { ReactComponent as SelectScreenIcon } from '../assets/selectedScreen.svg';
import { ReactComponent as AvatarIcon } from '@/images/icons/edm/default-avatar52.svg';
import { SubKeyWordContext } from '../keywordsSubscribe/subcontext';
import cloneDeep from 'lodash/cloneDeep';
import { globalSearchDataTracker } from '../tracker';
import { getIn18Text } from 'api';
import SocailMediaLink from '../component/SocialMediaLink/SocialMediaLink';
import { edmCustomsApi } from '../constants';
import LoadingGif from '../../../../../../web-site/src/images/loading.gif';
interface TableProps {
  data?: GlobalSearchCompanyDetail;
  total: number;
  tableData: GlobalSearchContactItem[];
  pageSize: number;
  selectData?: string[];
  onSelect?: (value: any[]) => void;
  selectChange?: (value: CheckboxValueType[]) => void;
  isCheckAll?: (value: boolean) => void;
  paginationOptions?: false | TablePaginationConfig | undefined;
  hideMutiCheck?: boolean;
  handleGuessMail?: (param: UpdateEmail) => void;
}
// 联系人分类，采购（SALE），老板高层（LEADERS），管理者（MANAGER），其他（COMMON/null ）
export const filiterCondition = [
  {
    key: 'ALL',
    label: getIn18Text('QUANBU'),
  },
  {
    key: 'LEADERS',
    label: getIn18Text('LAOBAN'),
  },
  {
    key: 'MANAGER',
    label: getIn18Text('GUANLICENG'),
  },
  {
    key: 'SALE',
    label: getIn18Text('CAIGOU'),
  },
  {
    key: 'NULL',
    label: getIn18Text('QITA'),
  },
];

export const filterContact = [
  {
    label: '邮箱',
    value: 'contact',
  },
  {
    label: '电话',
    value: 'phone',
  },
  {
    label: '其他联系方式',
    value: 'other',
  },
];

export interface UpdateEmail {
  contactId: string;
  info: {
    emails: {
      email: string;
      origin?: string;
      emailStatus?: string;
    }[];
    contact?: string;
    checkStatus?: number;
  };
  guessStatus?: 'success' | 'fail';
  guess?: boolean;
}
// const defaultCheckedList = []

const RenderEmail = (props: { value: string; record: GlobalSearchContactItem; data?: GlobalSearchCompanyDetail; hanldeUpdateData?: (param: UpdateEmail) => void }) => {
  const { value, record, data, hanldeUpdateData } = props;
  const [copyVisible, setCopyVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // const [_, dispatch] = useContext(SubKeyWordContext);
  const extraEmails = record.emails?.filter(emlObj => emlObj.email !== record.contact);

  // checkStatus  className={classnames(style.box, style[`bgColor${index}`], className)}
  const getText = () => {
    if (record.checkStatus) {
      return record.checkStatus === 1 ? '已验证为真实邮箱' : '尚未验证';
    }
    return '暂未校验';
  };

  const handleGuessMail = useCallback(() => {
    edmCustomsApi
      .guessAndSave({
        id: data?.id ?? '',
        name: record.name ?? '',
      })
      .then(res => {
        setLoading(false);
        hanldeUpdateData &&
          hanldeUpdateData({
            contactId: record.contactId ?? '',
            info: {
              contact: res ? res[0] : undefined,
              checkStatus: res ? 1 : undefined,
              emails: res
                ? res.map(item => {
                    return {
                      email: item,
                    };
                  })
                : [],
            },
            guessStatus: res ? 'success' : 'fail',
            guess: true,
          });
      });
  }, [data?.name, data?.id]);

  if (!data || !data.id || !record.name || (record.guess && !record.guessStatus)) {
    return null;
  }
  // null/0:未校验，-1:校验不通过，1:校验通过
  return (
    <>
      <span style={{ display: 'flex', alignItems: 'center', paddingRight: 6 }} hidden={Boolean(value)}>
        <i className={style.iconEmail} style={{ marginTop: 0 }}></i>
        <span
          hidden={!data?.domain}
          className={style.tableLink}
          style={{ color: record.guessStatus === 'fail' ? '#545a6e' : '#4c6aff' }}
          onClick={() => {
            globalSearchDataTracker.trackEmailGuessEntry({
              type: 'detail',
            });
            if (record.guessStatus === 'fail') {
            } else {
              setLoading(true);
              handleGuessMail();
            }
          }}
        >
          {loading ? (
            <>
              {' '}
              <img src={LoadingGif} alt="" width="16" height="16" />
              邮箱探测中
            </>
          ) : (
            ''
          )}
          {!loading ? (record.guessStatus === 'fail' ? '未探测到邮箱' : '邮箱探测') : ''}
        </span>
      </span>
      <div
        className={style.emailWrapper}
        onMouseEnter={() => {
          setCopyVisible(!0);
        }}
        onMouseLeave={() => {
          setCopyVisible(false);
        }}
        hidden={!Boolean(value)}
      >
        <span style={{ display: 'flex', alignItems: 'flex-start', paddingRight: 6 }}>
          <i className={style.iconEmail}></i>
          <Tooltip overlayClassName={style.globalSearchContactTooltip} placement="top" title={getText()}>
            <span className={style.emailText}>{value}</span>
          </Tooltip>
          {extraEmails && extraEmails.length > 0 && (
            <Tooltip
              overlayClassName={style.globalSearchContactTooltip}
              placement="top"
              title={
                <>
                  {extraEmails.map(e => (
                    <>
                      <span>{e.email}</span> <br />
                    </>
                  ))}
                </>
              }
            >
              <span className={style.emailCount}>{`+${extraEmails.length}`}</span>
            </Tooltip>
          )}
          <Tooltip overlayClassName={style.globalSearchContactTooltip} placement="top" title={getText()}>
            <span
              className={classnames(style.emailPrefixIcon, {
                [style.emailPrefixIconUnknow]: !record.checkStatus,
                [style.emailPrefixIconValid]: record.checkStatus === 1,
                [style.emailPrefixIconInValid]: record.checkStatus && record.checkStatus !== 1,
              })}
            ></span>
          </Tooltip>
        </span>

        {copyVisible && (
          <CopyToClipboard
            onCopy={(_, result) => {
              message.success({
                content: <span>{result ? getIn18Text('FUZHICHENGGONG') : getIn18Text('FUZHISHIBAI')}</span>,
              });
            }}
            text={[value].concat(extraEmails ? extraEmails?.map(e => e.email) : '').join('\n')}
          >
            <Tooltip overlayClassName="global-search-contact-tooltip" title={'复制邮箱'}>
              <span className={style.copyIcon}></span>
            </Tooltip>
          </CopyToClipboard>
        )}
      </div>
    </>
  );
};

const ContactsTable = (props: TableProps) => {
  const { onSelect, selectChange, selectData, isCheckAll, paginationOptions, data, hideMutiCheck, handleGuessMail } = props;
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [screenSelect, setScreenSelect] = useState<CheckboxValueType[]>([]);
  // const [checkedList, setCheckedList] = useState<CheckboxValueType[]>(filterContact);
  const getIcon = (value: string, record: GlobalSearchContactItem) => {
    return (
      <div>
        {!!value && <span className={style.newIcon}>NEW</span>}
        {!value && record.isNew && <span className={style.newIconSeven}>七天内新增</span>}
      </div>
    );
  };

  useEffect(() => {
    selectData ? setSelectedRowKeys(selectData) : '';
  }, [selectData]);

  const renderSocialMedia = (value: string, record: GlobalSearchContactItem) => {
    type baseKey = keyof GlobalSearchContactItem;
    let socialMedia = [
      {
        key: 'linkedinUrl',
        icon: LinkedinIcon,
        href: '',
      },
      {
        key: 'facebookUrl',
        icon: FacebookIcon,
        href: '',
      },
      {
        key: 'twitterUrl',
        icon: TwitterIcon,
        href: '',
      },
    ];

    let renderData = socialMedia
      .map(item => {
        item.href = record[item.key as baseKey] as string;
        return item;
      })
      .filter(ele => ele.href);

    if (renderData?.length) {
      return (
        <div style={{ paddingTop: 2 }}>
          {renderData.map(ele => (
            <SocailMediaLink
              tipType={ele.key === 'linkedinUrl' ? 'linkedin' : undefined}
              href={ele.href}
              key={ele.key}
              style={{ marginRight: 8 }}
              target="_blank"
              onClick={ev => {
                ev.stopPropagation();
              }}
              rel="noreferrer"
            >
              <img width={20} height={20} src={ele.icon} alt="icon" />
            </SocailMediaLink>
          ))}
        </div>
      );
    } else {
      return null;
    }
  };
  const tableColumns: ColumnsType<GlobalSearchContactItem> = [
    {
      title: getIn18Text('XINGMINGZHIWEI'),
      dataIndex: 'name',
      render: (value, record) => (
        <>
          <div className={style.globalName}>
            <div className={style.globalNameRight}>
              <div className={style.globalSearchTableName}>
                {' '}
                <EllipsisTooltip>{value}</EllipsisTooltip>
              </div>
              {record.jobTitle && <div className={style.globalSearchTableSubName}>{record.jobTitle}</div>}
            </div>
          </div>
        </>
      ),
    },
    {
      title: getIn18Text('LIANXIFANGSHI'),
      dataIndex: 'phone',
      filterDropdown: ({}) => {
        return (
          <div>
            {/* <Checkbox.Group className={style.checkGroup} options={filterContact} defaultValue={['all']} onChange={onChange} /> */}
            <Checkbox.Group
              className={style.checkGroup}
              options={filterContact}
              onChange={value => {
                // console.log(value, '>>>>>>>>>>@$%%%%%%%%%%%%%%%%%');
                setScreenSelect(value);
                selectChange ? selectChange(value) : '';
              }}
            />
          </div>
        );
      },
      filterIcon: (filtered: boolean) => {
        // console.log(filtered, '$$@MKL@NJKBEKJ@______________');
        return screenSelect.length > 0 ? <SelectScreenIcon /> : <ScreenIcon />;
      },
      render: (value, record) => (
        <div>
          <RenderEmail
            data={data}
            hanldeUpdateData={param => {
              handleGuessMail && handleGuessMail(param);
            }}
            value={record.contact}
            record={record}
          />
          {value && (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span className={style.iconPhone}></span>
              <EllipsisTooltip>
                <span>{value}</span>
              </EllipsisTooltip>
            </span>
          )}
          {renderSocialMedia(value, record)}
        </div>
      ),
    },
    {
      title: getIn18Text('LAIYUAN'),
      dataIndex: 'origin',
      width: 120,
      render: value => (
        <EllipsisTooltip>
          <span style={{ color: '#478E83' }}>{value || '-'}</span>
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('GENGXINSHIJIAN'),
      dataIndex: 'grubStatus',
      width: 120,
      render: (value, record) => (
        <>
          <EllipsisTooltip>{record.updateTime || '-'}</EllipsisTooltip>
          {getIcon(value, record)}
        </>
      ),
    },
  ];

  return (
    <div>
      <SiriusTable
        className={style.table}
        rowSelection={
          hideMutiCheck
            ? undefined
            : {
                type: 'checkbox',
                onChange: (newSelectedRowKeys: any[]) => {
                  let cloneSelectData: string[] = [];
                  let nowAllRowKeys = props.tableData.map(item => item.contactId);
                  let yesRowKeys = selectData?.filter(item => nowAllRowKeys.includes(item)) || [];
                  if (yesRowKeys.length > newSelectedRowKeys?.length) {
                    const differentValues = yesRowKeys.filter(element => !newSelectedRowKeys.includes(element)) || [];
                    cloneSelectData = cloneDeep(selectData)?.filter(item => !differentValues.some(i => i === item)) || [];
                  } else {
                    cloneSelectData = cloneDeep(selectData) || [];
                  }
                  let concaRowKeys = [...new Set([...newSelectedRowKeys, ...(cloneSelectData || [])])];
                  setSelectedRowKeys(concaRowKeys);
                  if (onSelect) {
                    onSelect((data?.contactList || []).filter(item => concaRowKeys.includes(item.contactId)));
                  }
                },
                selectedRowKeys,
                onSelectAll: (selected: boolean) => {
                  isCheckAll ? isCheckAll(selected) : '';
                },
              }
        }
        rowKey={'contactId'}
        tableLayout="fixed"
        columns={tableColumns}
        scroll={{ y: 425 }}
        dataSource={props.tableData}
        pagination={paginationOptions}
      />
    </div>
  );
};

export { ContactsTable };
