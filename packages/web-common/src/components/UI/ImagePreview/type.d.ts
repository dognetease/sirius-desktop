/*
 * @Author: your name
 * @Date: 2021-11-17 15:13:56
 * @LastEditTime: 2021-12-15 17:30:13
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/UI/ImagePreview/type.d.ts
 */
export interface DataType {
  downloadUrl?: string;
  previewUrl: string;
  OriginUrl?: string;
  name?: string;
  size?: number;
  [key: string]: any;
  type?: string;
  nonOriginal?: boolean;
}

export interface ImgPreviewModalProps {
  visible: boolean;
  data: DataType[];
  startIndex: number | null;
  onCancel: () => void;
}

export interface ImgPreviewContentProps {
  data: DataType[];
  startIndex: number | null;
  onCurUrlChange?: (url: DataType['previewUrl']) => void;
}

interface StaticPreview {
  preview: (val: ImgPreviewContentProps) => void;
}

export type ImgPreviewtype = React.FC<ImgPreviewModalProps> & StaticPreview;
