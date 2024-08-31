import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import { TongyongSousuo } from '@sirius/icons';
import { apiHolder, apis, MaterielApi, MaterielFileListReq, MaterielFile, MaterielDirectory, DataTrackerApi } from 'api';
import { ColumnsType } from 'antd/lib/table';
import { Divider } from 'antd';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { timestampFormatter } from '@web-materiel/utils';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import { RenameFile } from './RenameFile';
import { FileCard } from '@web-materiel/components/FileCard';
import { uploadEmitter, UploadTrigger, MaterielAddedEventArgs } from '@web-materiel/components/FileUploader';
import { formatFileSize } from '@web-common/utils/file';
import style from './index.module.scss';

const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const FileListUploadKey = 'MaterielBusinessFileListUpload';

interface FileListProps {}

export const FileList: React.FC<FileListProps> = props => {
  const { layout, growRef, scrollY } = useResponsiveTable();
  const [params, setParams] = useState<MaterielFileListReq>({
    page: 1,
    pageSize: 20,
    fileName: '',
    parentFileId: '0',
  });
  const [data, setData] = useState<(MaterielFile | MaterielDirectory)[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState(false);
  const lastFetchTime = useRef<number>(0);
  const [editing, setEditing] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);

  const handleFetch = (params: MaterielFileListReq) => {
    const fetchTime = (lastFetchTime.current = Date.now());
    setFetching(true);
    materielApi
      .getFileList(params)
      .then(res => {
        if (fetchTime !== lastFetchTime.current) return;
        setData(res.content || []);
        setTotal(res.totalSize);
      })
      .finally(() => {
        if (fetchTime !== lastFetchTime.current) return;
        setFetching(false);
      });
    trackApi.track('personal_WA_file_list', { type: 'search' });
  };

  const handleFetchDebounced = useRef(
    debounce((value: MaterielFileListReq) => {
      handleFetch(value);
    }, 300)
  ).current;

  const handleFileDelete = (item: MaterielFile) => {
    Modal.error({
      title: '提示',
      content: '删除文件后，会导致已分享文件无法查看',
      onOk: () =>
        materielApi.deleteFile({ fileId: item.fileId }).then(() => {
          const nextParams: MaterielFileListReq = { ...params, page: 1 };
          setParams(nextParams);
          handleFetch(nextParams);
        }),
    });
    trackApi.track('personal_WA_file_list', { type: 'delete' });
  };

  useEffect(() => {
    handleFetch(params);
  }, []);

  useEffect(() => {
    uploadEmitter.on('added', ({ file, uploadKey }: MaterielAddedEventArgs) => {
      if (uploadKey === FileListUploadKey) {
        const nextParams: MaterielFileListReq = { ...params, page: 1 };
        setParams(nextParams);
        handleFetch(nextParams);
      }
    });
  }, [uploadEmitter, params]);

  const columns: ColumnsType<MaterielFile | MaterielDirectory> = [
    {
      title: '文件名',
      fixed: 'left',
      ellipsis: true,
      width: 200,
      dataIndex: 'fileName',
      className: style.maxWidthCell,
      render: (_, item: MaterielFile | MaterielDirectory) => {
        if (item.fileType !== 'FILE') return item.fileName;
        return <FileCard className={style.fileCard} file={item} iconSize={28} />;
      },
    },
    {
      title: '创建人',
      width: 100,
      ellipsis: true,
      dataIndex: 'createBy',
    },
    {
      title: '创建时间',
      width: 200,
      dataIndex: 'createAt',
      render: (timestamp: number) => timestampFormatter(timestamp),
    },
    {
      title: '最近使用时间',
      width: 200,
      dataIndex: 'lastUseAt',
      render: (timestamp: number) => timestampFormatter(timestamp),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      render: (size: number) => formatFileSize(size, 1024),
    },
    {
      title: '操作',
      fixed: 'right',
      dataIndex: 'options',
      render: (_, item: MaterielFile | MaterielDirectory) => {
        if (item.fileType !== 'FILE') return '-';
        return (
          <>
            <a
              onClick={() => {
                window.open(item.fileLink);
                trackApi.track('personal_WA_file_list', { type: 'download' });
              }}
            >
              下载
            </a>
            <Divider type="vertical" />
            <a
              onClick={() => {
                setEditingFileId(item.fileId);
                setEditingFileName(item.fileName);
                trackApi.track('personal_WA_file_list', { type: 'rename' });
              }}
            >
              重命名
            </a>
            <Divider type="vertical" />
            <a onClick={() => handleFileDelete(item)}>删除</a>
          </>
        );
      },
    },
  ];

  return (
    <div className={classnames(style.fileList, layout.container)}>
      <div className={classnames(style.title, layout.static)}>文件列表</div>
      <div className={classnames(style.filter, layout.static)}>
        <Input
          className={style.input}
          placeholder="请输入文件名称"
          value={params.fileName}
          allowClear
          prefix={<TongyongSousuo wrapClassName={classnames('wmzz', style.searchIcon)} />}
          onChange={event => {
            const nextParams: MaterielFileListReq = { ...params, fileName: event.target.value, page: 1 };
            setParams(nextParams);
            handleFetchDebounced(nextParams);
          }}
        />
        <UploadTrigger uploadKey={FileListUploadKey} addToMateriel>
          <Button btnType="primary" onClick={() => trackApi.track('personal_WA_file_list', { type: 'upload' })}>
            上传
          </Button>
        </UploadTrigger>
      </div>
      <div className={classnames(style.tableWrapper, layout.grow)} ref={growRef}>
        <Table
          className={style.table}
          rowKey="fileId"
          loading={fetching}
          columns={columns as any}
          dataSource={data}
          scroll={{ x: 'max-content', y: scrollY }}
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
      </div>
      <RenameFile
        visible={!!editingFileId}
        name={editingFileName || ''}
        loading={editing}
        onCancel={() => {
          setEditingFileId('');
          setEditingFileName('');
        }}
        onOk={fileName => {
          setEditing(true);
          materielApi
            .renameFile({
              fileId: editingFileId!,
              fileName,
            })
            .then(() => {
              const nextParams: MaterielFileListReq = { ...params, page: 1 };
              setParams(nextParams);
              handleFetch(nextParams);
              setEditingFileId('');
              setEditingFileName('');
            })
            .finally(() => {
              setEditing(false);
            });
        }}
      />
    </div>
  );
};
