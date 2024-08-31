// /* eslint-disable react/jsx-props-no-spreading */
// import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
// import { Provider } from 'react-redux';
// import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import { Radio, Spin, Input, Select } from 'antd';
// import { api, apis, ContactModel, CustomerApi, RresponseCompanyCommonItem, RresponseCompanyMyList } from 'api';
// import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
// import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
// import store from '@web-common/state/createStore';
// import ReactDOM from 'react-dom';
// import debounce from 'lodash/debounce';
// import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
// import useState2RM from '@web-mail/hooks/useState2ReduxMock';
// import NoCustomer from '@/images/empty/doc.png';
// import styles from './addToExistedCustomerModal.module.scss';
// import { UIContactModel } from '@/../../web-contact/src/data';
// import { DataSource } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
// import { getIn18Text } from 'api';
// import { refreshContactDataByEmails } from '@web-common/state/reducer/contactReducer';
// import { getMainAccount } from '@web-common/components/util/contact';

// const { Option } = Select;

// const clientApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

// export type FromType = 'tip' | 'card' | 'sidebar';

// interface ComsProps {
//   destory: () => void;
//   contact: UIContactModel & ContactModel;
//   from: FromType;
//   _account?: string;
// }

// interface GetCustomersParams {
//   page: number;
//   searchKey?: string;
// }

// const PAGE_SIZE = 50;

// const FILTER_OPTIONS = [
//   { val: 'company', text: 'GONGSI', placeholder: 'QINGSHURUGONGSIMINGCHENG' },
//   { val: 'email', text: 'YOUXIANG', placeholder: 'QINGSHURUYOUXIANG' },
//   { val: 'telephone', text: 'DIANHUA', placeholder: 'QINGSHURUDIANHUA' },
//   { val: 'whats_app', text: 'WA', placeholder: 'QINGSHURUwhatsApp' },
//   { val: 'contactName', text: 'XINGMING', placeholder: 'QINGSHURUXINGMING' },
// ];

// type FilterType = 'company' | 'email' | 'telephone' | 'whats_app' | 'contactName';

// const AddToExistedCustomerModal: React.FC<ComsProps> = ({ destory, contact, from, _account = getMainAccount() }) => {
//   const [searchCustomerVal, setSearchCustomerVal] = useState<string>('');
//   const [customers, setCustomers] = useState<RresponseCompanyCommonItem[]>([]);
//   const [page, setPage] = useState<number>(1);
//   const [noMore, setNoMore] = useState<boolean>(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<RresponseCompanyCommonItem | null>(null);
//   const [gettingCustomers, setGettingCustomers] = useState<boolean>(false);
//   const [filterType, setFilterType] = useState<FilterType>('company');
//   const customersRef = useRef<RresponseCompanyCommonItem[]>(customers);
//   customersRef.current = customers;
//   const filterTypeRef = useRef<FilterType>(filterType);
//   filterTypeRef.current = filterType;
//   const [, setUniCustomerParam] = useState2RM('uniCustomerParam');

//   // placeholder
//   const filterPlaceholder = useMemo(() => {
//     if (typeof window !== 'undefined') {
//       const opt = FILTER_OPTIONS.find(item => item.val === filterType);
//       if (!opt) return '';
//       const { placeholder } = opt;
//       return getIn18Text(placeholder);
//     }
//     return '';
//   }, [filterType]);

//   // 分页获取客户
//   const getCustomers = async (params: GetCustomersParams) => {
//     if (gettingCustomers) return;
//     const { page: pageNum, searchKey } = params;
//     try {
//       setGettingCustomers(true);
//       // 基础参数
//       const basicParams = {
//         active_time_end: '',
//         active_time_start: '',
//         create_time_end: '',
//         create_time_start: '',
//         filter_label_op: 'contain',
//         is_desc: '',
//         label_name_list: [],
//         manager_id_list: [],
//         sort: '',
//         page_size: PAGE_SIZE,
//       };
//       // 过滤相关参数
//       const filterParams =
//         filterTypeRef.current === 'company'
//           ? { search_key: searchKey || '' }
//           : {
//               contact_search_key: {
//                 blank: true,
//                 [filterTypeRef.current]: searchKey || '',
//               },
//             };
//       const customerData: RresponseCompanyMyList = await clientApi.companyMyList({
//         ...basicParams,
//         ...filterParams,
//         page: pageNum || 1,
//       } as any);
//       setGettingCustomers(false);
//       // eslint-disable-next-line camelcase
//       const { total_size, content } = customerData;
//       // eslint-disable-next-line consistent-return
//       return { total_size, content };
//     } catch (error) {
//       setGettingCustomers(false);
//       console.log('获取客户列表失败', error);
//       // eslint-disable-next-line consistent-return
//       return null;
//     }
//   };

//   const uniSource = useMemo(() => {
//     const map: Record<FromType, keyof typeof DataSource> = {
//       card: 'mailListStranger',
//       sidebar: 'mailListStrangerSideBar',
//       tip: 'mailListRead',
//     };
//     return map[from];
//   }, [from]);

//   // 添加至客户（公司）下
//   const confirmAddToCustomer = async () => {
//     if (!selectedCustomer) return;
//     destory(); // 点击确定，关闭弹框
//     // eslint-disable-next-line camelcase
//     const { company_id } = selectedCustomer;
//     const { contact: contactObj } = contact;
//     const { contactName, accountName } = contactObj;
//     try {
//       // 调用uni的iframe
//       setUniCustomerParam({
//         visible: true,
//         source: uniSource,
//         customerId: +company_id, // 传入客户id
//         customerData: {
//           company_name: '',
//           contact_list: [
//             {
//               condition: 'company',
//               contact_name: contactName,
//               main_contact: true,
//               email: accountName,
//             },
//           ],
//         },
//         onSuccess: () => {
//           refreshContactDataByEmails(
//             {
//               [_account]: [accountName],
//             },
//             new Map([[accountName, contactName]])
//           );
//           setUniCustomerParam({ visible: false, source: uniSource });
//         },
//         onClose: () => {
//           setUniCustomerParam({ visible: false, source: uniSource });
//         },
//       });
//       // 原逻辑
//       // const addRes = await clientApi.contactAdd({
//       //   company_id,
//       //   condition: 'company',
//       //   contact_name: contactName,
//       //   email: accountName,
//       //   main_contact: false
//       // } as any);
//       // if (addRes) {
//       //   SiriusMessage.success({ content: getIn18Text('TIANJIACHENGGONG') });
//       //   destory();
//       // } else {
//       //   SiriusMessage.error({ content: getIn18Text('TIANJIASHIBAI') });
//       // }
//     } catch (error) {
//       console.log('添加至客户下失败', error);
//       SiriusMessage.error({ content: getIn18Text('TIANJIASHIBAI') });
//     }
//   };

//   const onOk = () => {
//     confirmAddToCustomer();
//   };

//   const onCancel = () => destory();

//   // 选择客户
//   const selectCustomer = (item: RresponseCompanyCommonItem) => {
//     setSelectedCustomer(item);
//   };

//   // 重新获取第1页
//   const reGetFirPage = async (key?: string) => {
//     // 清空
//     setNoMore(false);
//     setPage(1);
//     setCustomers([]);
//     // 并获取第一页
//     const res = await getCustomers({ page: 1, searchKey: key });
//     if (res) {
//       const { content } = res;
//       setCustomers([...content] || []);
//     }
//   };

//   // 节流获取下一页
//   const debounceGetNextPage = useCallback(
//     debounce(async () => {
//       if (noMore) return;
//       const curPage = page;
//       const nextPage = curPage + 1;
//       const nextPageData = await getCustomers({ page: nextPage, searchKey: searchCustomerVal });
//       // 拿到了
//       if (nextPageData) {
//         const { content: nextPageList } = nextPageData;
//         if (nextPageList?.length > 0) {
//           setCustomers([...customers, ...nextPageList]);
//           setPage(nextPage);
//         }
//         // 没有更多了
//         if (!nextPageList?.length || nextPageList?.length < 20) {
//           setNoMore(true);
//         }
//       }
//     }, 500),
//     [page, noMore, customers]
//   );

//   const debouceReGetFirPage = useCallback(
//     debounce(async (val: string) => {
//       reGetFirPage(val || '');
//     }, 500),
//     []
//   );

//   // 输入值发生变换
//   const searchCustomerKWChange = (e: React.FormEvent<HTMLInputElement>) => {
//     const val = (e.target as HTMLInputElement).value;
//     const curVal = val || '';
//     // 清空选中项
//     setSelectedCustomer(null);
//     setSearchCustomerVal(curVal);
//     debouceReGetFirPage(curVal);
//   };

//   // 滚动加载
//   const onScrollCapture = e => {
//     const { target } = e;
//     const { scrollHeight, scrollTop, clientHeight } = target as HTMLDivElement;
//     // 快要触底 加载下一页文件
//     if (scrollHeight - scrollTop - clientHeight < 40) debounceGetNextPage();
//   };

//   useEffect(() => {
//     reGetFirPage();
//   }, []);

//   // 切换搜索类型
//   const selectKeyChange = (val: FilterType) => {
//     setFilterType(val);
//     // setSelectedCustomer(null);
//     // 清空（并不会触发change）
//     // 清空选中项
//     setSelectedCustomer(null);
//     // 清空输入框（并不会触发change）
//     setSearchCustomerVal('');
//     // 获取第一页
//     debouceReGetFirPage('');
//   };

//   const selectBefore = (
//     <Select
//       defaultValue="company"
//       className={'select-after' + styles.selectBefore}
//       suffixIcon={<DownTriangle />}
//       dropdownClassName="edm-selector-dropdown"
//       onChange={selectKeyChange}
//     >
//       {FILTER_OPTIONS.map(opt => (
//         <Option value={opt.val}>{opt.text === 'WA' ? 'WA' : getIn18Text(opt.text)}</Option>
//       ))}
//     </Select>
//   );

//   return (
//     <Modal
//       title={getIn18Text('WODEKEHU')}
//       getContainer={false}
//       className={styles.addToCustomersModal}
//       maskClosable={false}
//       visible
//       okText={getIn18Text('QUEREN')}
//       cancelText={getIn18Text('QUXIAO')}
//       destroyOnClose
//       onOk={onOk}
//       onCancel={onCancel}
//       okButtonProps={{ disabled: !selectedCustomer }}
//     >
//       <div className={styles.addToCustomersCont}>
//         <Input
//           placeholder={filterPlaceholder}
//           className={styles.searchCustomerInput}
//           prefix={<SearchIcon />}
//           value={searchCustomerVal}
//           allowClear
//           onChange={searchCustomerKWChange}
//           addonBefore={selectBefore}
//         />
//         <div className={styles.contArea}>
//           {/* 有数据 公司列表 */}
//           {customersRef.current.length > 0 && (
//             <div className={styles.customers} onScrollCapture={onScrollCapture}>
//               {customersRef.current.map((item: RresponseCompanyCommonItem) => (
//                 <div key={item.company_id} className={styles.customerItem} onClick={() => selectCustomer(item)}>
//                   <Radio checked={item?.company_id === selectedCustomer?.company_id} />
//                   <span className={styles.customerName}>{item?.company_name || ''}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//           {/* 无数据 */}
//           {!gettingCustomers && customersRef.current.length === 0 && (
//             <div className={styles.noCustomer}>
//               <img className={styles.noCustomerImg} src={NoCustomer} alt="no customer" />
//               <p className={styles.noCustomerTxt}>{getIn18Text('ZANWUSHUJU')}</p>
//             </div>
//           )}
//           {/* 加载中 */}
//           {!!gettingCustomers && customersRef.current.length === 0 && (
//             <div className={styles.loadingCustomer}>
//               <Spin />
//             </div>
//           )}
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default AddToExistedCustomerModal;

// // 添加到原有客户旧逻辑,0830后不再使用了，可以考虑删除
// export const addToExistedCustomerModal = (
//   contact: UIContactModel & ContactModel,
//   container: HTMLElement | undefined,
//   from: 'card' | 'tip' | 'sidebar' = 'card',
//   _account = getMainAccount()
// ) => {
//   const div = document.createElement('div');
//   let parent: HTMLElement | null = container || document.body;

//   const destory = () => {
//     if (parent) {
//       ReactDOM.unmountComponentAtNode(div);
//       parent.removeChild(div);
//       parent = null;
//     }
//   };

//   const options: ComsProps = { destory, contact, from, _account };

//   parent.appendChild(div);
//   ReactDOM.render(
//     <Provider store={store}>
//       <AddToExistedCustomerModal {...options} />
//     </Provider>,
//     div
//   );
//   return destory;
// };
