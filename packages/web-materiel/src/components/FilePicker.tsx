import React, { useState, useEffect } from 'react';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { apiHolder, apis, MaterielApi, MaterielFile, MaterielDirectory, MaterielFileListReq } from 'api';
import { ColumnsType } from 'antd/lib/table';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { FileCard } from '@web-materiel/components/FileCard';
import { formatFileSize } from '@web-common/utils/file';
import { timestampFormatter } from '@web-materiel/utils';
import style from './FilePicker.module.scss';

const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;

interface FilePickerProps {
  visible: boolean;
  onOk: (file: MaterielFile) => void;
  onCancel: () => void;
}

const initialParams: MaterielFileListReq = {
  page: 1,
  pageSize: 20,
  fileName: '',
  parentFileId: '0',
};

export const FilePicker: React.FC<FilePickerProps> = props => {
  const { visible, onOk, onCancel } = props;
  const [params, setParams] = useState<MaterielFileListReq>(initialParams);
  const [data, setData] = useState<(MaterielFile | MaterielDirectory)[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState(false);
  const [file, setFile] = useState<MaterielFile | null>(null);

  const handleFetch = (params: MaterielFileListReq) => {
    setFetching(true);
    materielApi
      .getFileList(params)
      .then(res => {
        setData(res.content || []);
        setTotal(res.totalSize);
      })
      .finally(() => {
        setFetching(false);
      });
  };

  useEffect(() => {
    if (visible) {
      setParams(initialParams);
      handleFetch(initialParams);
    } else {
      setFile(null);
    }
  }, [visible]);

  const columns: ColumnsType<MaterielFile | MaterielDirectory> = [
    {
      title: '文件名',
      fixed: 'left',
      width: 300,
      ellipsis: true,
      dataIndex: 'fileName',
      render: (_, item: MaterielFile | MaterielDirectory) => {
        if (item.fileType !== 'FILE') return item.fileName;
        return <FileCard className={style.fileCard} file={item} iconSize={28} />;
      },
    },
    {
      title: '创建时间',
      width: 200,
      dataIndex: 'createAt',
      render: (timestamp: number) => timestampFormatter(timestamp),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      render: (size: number) => formatFileSize(size, 1024),
    },
  ];

  return (
    <Modal className={style.filePicker} title="选择文件" width={720} visible={visible} okButtonProps={{ disabled: !file }} onOk={() => onOk(file!)} onCancel={onCancel}>
      <Table
        className={style.table}
        rowKey="fileId"
        loading={fetching}
        columns={columns as any}
        dataSource={data}
        scroll={{ y: 400 }}
        rowSelection={{
          type: 'radio',
          getCheckboxProps: item => ({
            disabled: (item as MaterielFile | MaterielDirectory).fileType === 'DIRECTORY',
          }),
          onChange: selectedRowKeys => {
            if (selectedRowKeys[0]) {
              const nextFile = data.find(item => item.fileId === selectedRowKeys[0]) as MaterielFile;
              nextFile && setFile(nextFile);
            }
          },
        }}
        pagination={{
          total,
          current: params.page,
          pageSize: params.pageSize,
          showTotal: (total: number) => `共 ${total} 条数据`,
          showQuickJumper: true,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
        }}
        onChange={(pagination: any) => {
          const nextParams: MaterielFileListReq = {
            ...params,
            pageSize: pagination.pageSize as number,
            page: pagination.pageSize === params.pageSize ? (pagination.current as number) : 1,
          };
          setParams(nextParams);
          handleFetch(nextParams);
        }}
      />
    </Modal>
  );
};
