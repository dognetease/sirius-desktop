import React from 'react';
import { Space, Modal, Table, Tag, Select, Col, Row } from 'antd';
import { useState } from 'react';
import { apiHolder, SystemApi, apis, CustomerApi, newMyClueListReq, ResUploadCientFile as uploadType, urlStore } from 'api';
import useTableDataLoader from '../components/hooks/useTableDataLoader';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import style from '../customer.module.scss';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const { Column, ColumnGroup } = Table;
const { Option } = Select;
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const httpApi = apiHolder.api.getDataTransApi();
interface ParamType {
  page: number;
  page_size: number;
  type?: number;
  status?: number;
}
interface FileItem {
  file_name: string;
  file_id: string;
  dir_id: string;
}
const RecordTable: React.FC<any> = props => {
  let [modalFileList, setModalFileList] = useState<FileItem[]>([]);
  let [isOpen, setOpen] = useState<boolean>(false);
  const [searchParam, setSearchParam] = useState<ParamType>({
    page: 1,
    page_size: 20,
  });
  const { loading, hasClue, tableList, total, requestTableData, current } = useTableDataLoader(clientApi, 'importRecord', searchParam);
  const { downLoadTableExcel } = useDownLoad();
  const paginationProps = {
    onChange: (page: number) => {
      setSearchParam({
        ...searchParam,
        page: page,
      });
    },
    total: total,
    size: 'small',
    current: searchParam.page,
    showSizeChanger: false,
    pageSizeOptions: ['20'],
    defaultPageSize: 20,
    className: 'pagination-wrap',
    defaultCurrent: 1,
  };
  const handleChange = (value: string, type: string) => {
    console.log(`selected ${value}`);
    if (type === 'type') {
      setSearchParam({
        ...searchParam,
        type: value as unknown as number,
      });
    }
    if (type === 'status') {
      setSearchParam({
        ...searchParam,
        status: value as unknown as number,
      });
    }
  };
  const handleExport = (failed_file_list: Array<FileItem>) => {
    const req = {
      fileId: failed_file_list[0].file_id,
      dirId: failed_file_list[0].dir_id,
    };
    httpApi.get(urlStore.get('downloadNSFileP') as string, req).then(({ data }) => {
      systemApi.webDownloadLink(data?.data);
    });
    // downLoadTableExcel(urlStore.get('downloadNSFileP') as string, '文件', {});
  };
  const handleModalOrExport = (origin_file_list: Array<FileItem>) => {
    if (origin_file_list?.length > 1) {
      setOpen(true);
      setModalFileList(origin_file_list);
    } else {
      handleExport(origin_file_list);
    }
  };
  return (
    <>
      <div className="query">
        {/* 1模板导入 2数据迁移 */}
        <Select
          // defaultValue="0"
          placeholder={getIn18Text('LEIXING')}
          style={{ width: 120, margin: '40px 20px 20px 0' }}
          onChange={val => {
            handleChange(val as string, 'type');
          }}
          allowClear
        >
          {/* <Option value={0}>全部</Option> */}
          <Option value={1}>{getIn18Text('MOBANDAORU')}</Option>
          <Option value={2}>{getIn18Text('SHUJUQIANYI')}</Option>
        </Select>
        {/*  1全部成功 2部分成功 3失败 */}
        <Select
          // defaultValue={0}
          placeholder={getIn18Text('ZHUANGTAI')}
          style={{ width: 120 }}
          onChange={val => {
            handleChange(val as string, 'status');
          }}
          allowClear
        >
          {/* <Option value={0}>全部</Option> */}
          <Option value={1}>{getIn18Text('QUANBUCHENGGONG')}</Option>
          <Option value={2}>{getIn18Text('BUFENCHENGGONG')}</Option>
          <Option value={3}>{getIn18Text('SHIBAI')}</Option>
        </Select>
      </div>
      <Table dataSource={tableList} className="edm-table" pagination={paginationProps}>
        <Column title={getIn18Text('LEIXING')} dataIndex="type" render={type => <>{['', getIn18Text('MOBANDAORU'), getIn18Text('SHUJUQIANYI')][type]}</>} />
        <Column
          title={getIn18Text('ZHUANGTAI')}
          dataIndex="status"
          render={status => <>{['', getIn18Text('QUANBUCHENGGONG'), getIn18Text('BUFENCHENGGONG'), getIn18Text('SHIBAI')][status]}</>}
        />
        <Column title={getIn18Text('HAOSHI')} dataIndex="consume_time" />
        <Column title={getIn18Text('DAORUJIEGUO')} dataIndex="result" />
        <Column
          title={getIn18Text('YUANWENJIAN')}
          width={80}
          dataIndex="origin_file_list"
          render={origin_file_list => (
            <span
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                color: 'blue',
              }}
              onClick={() => {
                handleModalOrExport(origin_file_list);
              }}
            >
              {getIn18Text('XIAZAI')}
            </span>
          )}
        />
        <Column
          title={getIn18Text('SHIBAIJIEGUO')}
          width={100}
          dataIndex="failed_file_list"
          render={failed_file_list => (
            <span
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                color: 'blue',
              }}
              onClick={() => {
                handleExport(failed_file_list);
              }}
            >
              {getIn18Text('XIAZAI')}
            </span>
          )}
        />
        <Column title={getIn18Text('CAOZUOREN')} width={80} dataIndex="account_name" />
        <Column title={getIn18Text('CAOZUOSHIJIAN')} dataIndex="create_at" />
      </Table>
      <Modal
        title={getIn18Text('XIAZAI')}
        visible={isOpen}
        footer={null}
        onCancel={() => {
          setOpen(false);
        }}
      >
        {modalFileList.map((e, i) => (
          <p key={i}>
            <Row>
              <Col span={18}>
                <span>{e.file_name}</span>
              </Col>
              <Col span={2}>
                <span
                  style={{
                    textDecoration: 'underline',
                    color: 'blue',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleExport([e]);
                  }}
                >
                  {getIn18Text('XIAZAI')}
                </span>
              </Col>
            </Row>
          </p>
        ))}
      </Modal>
    </>
  );
};
// console.log(RecordTable.type);
export default RecordTable;
