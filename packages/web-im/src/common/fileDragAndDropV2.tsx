import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames/bind';
import style from './fileDragAndDrop.module.scss';

const realStyle = classnames.bind(style);

export interface FilesDragAndDropApi {
  onUpload(error: null | Error, files: File[]);
  children: React.ReactNode;
  placeholder?: string;
  count?: number;
  maxSize?: number;
  excludes?: string[];
  validates?: (files: File[]) => Promise<File[]>[];
  dropComponent?: React.ReactNode;
  dropClassname?: string;
  dragClassname?: string;
}

export enum ErrorTypes {
  EXCEED_COUNT_LIMIT = 'EXCEED_COUNT_LIMIT',
  EXCEED_SIZE_LIMIT = 'EXCEED_SIZE_LIMIT',
  EXT_ERROR = 'EXT_ERROR',
  FORBIDDEN_FOLDER = 'FORBIDDEN_FOLDER',
}

class DragFailedError extends Error {
  files: File[] = [];

  constructor({ message, files = [] }: { message: string; files?: File[] }) {
    super(message);
    this.files = files;
  }
}

export const FilesDragAndDrop: React.FC<FilesDragAndDropApi> = props => {
  const {
    onUpload,
    placeholder = '松手上传',
    count = 100,
    excludes = [],
    maxSize = Math.pow(1024, 3),
    validates = [],
    dragClassname = '',
    dropClassname = '',
    dropComponent = <p className={realStyle('')}>松手触发上传</p>,
  } = props;
  const [dragging, setDragging] = useState(false);
  const drop = useRef<HTMLDivElement>(null);
  const drag = useRef<HTMLDivElement>(null);

  const _validates = [
    async (files: File[]) => {
      const error = new DragFailedError({
        message: ErrorTypes.FORBIDDEN_FOLDER,
      });
      // 读取文件第一个字节，能够读取是文件，抛出错误是文件夹
      const len = files.length;
      let flag = false;
      for (let i = 0; i < len; i++) {
        try {
          await files[i].slice(0, 1).arrayBuffer();
        } catch (err) {
          flag = true;
          break;
        }
      }
      if (flag) {
        throw error;
      }
      return files;

      // const reader = new FileReader();
      // let startIndex = 0;
      // let _promise = Promise.resolve();
      // while (startIndex < files.length - 1) {
      //     _promise = _promise.then(async () => {
      //         const file = files[startIndex];
      //         if (lodashGet(file, 'type.length', 0) !== 0) {
      //             return Promise.resolve();
      //         }
      //         reader.readAsText(file);
      //         return new Promise((resolve, reject) => {
      //             // @ts-ignore
      //             reader.onload = resolve;
      //             reader.onerror = reject;
      //         });
      //     });
      // }
      // try {
      //     await _promise;
      //     return files;
      // } catch (ex) {
      //     throw error;
      // }
    },
    (files: File[]) => {
      const error = new Error(ErrorTypes.EXCEED_COUNT_LIMIT);

      if (files.length > count) {
        throw error;
      }
      return files;
    },
    (files: File[]) => {
      const error = new DragFailedError({
        message: ErrorTypes.EXT_ERROR,
      });
      const flag = files.some(file => {
        const ext = file.name.replace(/^.+\.([\w\d]+)$/, '$1');
        if (excludes.includes(ext)) {
          error.files = [file];
          return true;
        }
        return false;
      });
      if (flag) {
        throw error;
      } else {
        return files;
      }
    },
    (files: File[]) => {
      const error = new DragFailedError({
        message: ErrorTypes.EXCEED_SIZE_LIMIT,
      });
      const flag = files.some(file => {
        if (file.size > maxSize) {
          error.files = [file];
          return true;
        }
        return false;
      });
      if (flag) {
        throw error;
      } else {
        return files;
      }
    },
    // @ts-ignore
    ...validates,
  ];

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async e => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const files = [...e.dataTransfer.files];

    const promise = _validates.reduce((total, cur) => total.then(cur), Promise.resolve(files));

    try {
      const finalFiles = await promise;
      onUpload(null, finalFiles);
    } catch (ex) {
      onUpload(ex, files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dataTransferTypes = e.dataTransfer.types.map(item => item.toLowerCase());
    if (e.target !== drop.current && dataTransferTypes.includes('files')) {
      setDragging(true);
    }
  };

  const handleDragLeave = e => {
    console.log('[drag]leave', {
      target: e.target,
      currentTarget: e.currentTarget,
    });
    e.preventDefault();
    e.stopPropagation();
    if (drop.current?.contains(e.target)) {
      setDragging(false);
    }
  };

  return (
    <div
      ref={drag}
      className={realStyle('fileDragAndDrop', dragClassname, {
        dragging,
      })}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {props.children}
      {dragging && (
        <div ref={drop} onDrop={handleDrop} onDragLeave={handleDragLeave} className={realStyle('drop', dropClassname)}>
          {dropComponent}
        </div>
      )}
    </div>
  );
};
