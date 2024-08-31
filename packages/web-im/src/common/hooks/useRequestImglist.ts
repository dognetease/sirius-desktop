import { useContext } from 'react';
import { Context } from '../../subcontent/store/messageProvider';
import { notSupportVideo } from '../imgVideoHandle';

export const useRequestImgList = (): any => {
  const { state: MsgState } = useContext(Context);
  return MsgState.msgList
    .filter(item => ['image', 'video'].includes(item.type) && !notSupportVideo(item?.type, item?.file?.videoCodec))
    .map(item => ({
      url: item.file?.url as string,
      ext: item.file?.ext as string,
      type: item?.type,
      fileName: item?.file?.name || '',
      fileSize: item?.file?.size || 0,
      fileSourceType: item?.type === 'image' ? 3 : 2,
      fileHeight: item?.file?.h || 0,
      fileWidth: item?.file?.w || 0,
    }));
};
