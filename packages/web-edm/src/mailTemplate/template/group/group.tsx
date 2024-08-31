import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import classes from './group.module.scss';
import { apiHolder as api, apis, DataTrackerApi, MailTemplateApi, WaimaoRecommendTemplateTag } from 'api';
import MultiSelect from '../../../components/multiSelect/multiSelect';
import { getIn18Text } from 'api';
interface Props {
  originTagIds: number[];
  manageGroup: () => void;
  sendSelectedIds: (ids: number[]) => void;
  manageVisible: boolean;
}
const templateApi = api.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const CreateGroupId = -999;
const Group: React.FC<Props> = ({ originTagIds, manageGroup, sendSelectedIds, manageVisible }) => {
  const [tagList, setTagList] = useState<WaimaoRecommendTemplateTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [errMsg, setErrMsg] = useState<string>('');

  const addGroup = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (tagList.length > 0 && tagList[tagList.length - 1].tagId === CreateGroupId) {
      return;
    }
    setTagList([
      ...tagList,
      {
        tagId: CreateGroupId,
        tagName: getIn18Text('XINJIANDEFENZUMINGCHENG'),
      },
    ]);
  };

  const getTemplateTagList = async () => {
    trackApi.track('pc_markting_edm_template_group_click');
    resetErr();
    const res = await templateApi.getTemplateTagList({ templateType: 'PERSONAL' });
    if (res.success) {
      setTagList(res.data?.tagList || []);
      return;
    }
    setTagList([]);
  };

  const onCreateTags = async (tagName: string) => {
    const res = await templateApi.saveOrUpdateTemplateTag({ tagId: undefined, tagName: tagName || '', templateCategory: 'LX-WAIMAO' });
    if (res.success) {
      setTagList(
        tagList.map(item => {
          if (item.tagId === CreateGroupId) {
            return {
              tagId: res.data?.tagId,
              tagName: res.data?.tagName,
            };
          }
          return item;
        })
      );
      resetErr();
      trackApi.track('pc_markting_edm_template_newgroup_operation', {
        operation: 'newobject',
      });
      return;
    }
    setErrMsg(res.message || '');
  };

  const onCancel = () => {
    const list = tagList.filter(item => {
      return item.tagId !== CreateGroupId;
    });
    setTagList(list);
    resetErr();
  };

  const resetErr = () => {
    setErrMsg('');
  };

  const onCheckedChange = (selection: any) => {
    if (selection.length > 10) {
      message.error({
        content: getIn18Text('ZUIDUOXUANZE10GEFENZU\uFF01'),
      });
      return;
    }
    setSelectedTagIds(selection);
    sendSelectedIds(selection);
  };

  const groupNameRender = () => {
    if (selectedTagIds.length === 0) {
      return getIn18Text('XUANZEFENZU');
    }
    const showName =
      tagList.find(item => {
        return item.tagId === selectedTagIds[0];
      })?.tagName || getIn18Text('XUANZEFENZU');
    if (selectedTagIds.length === 1) {
      return <span className={classes.groupName}>{showName}</span>;
    }
    return (
      <>
        <span className={classes.groupName}>{showName}</span> <span className={classes.num}>+{selectedTagIds.length - 1}</span>
      </>
    );
  };

  useEffect(() => {
    setSelectedTagIds(originTagIds);
    getTemplateTagList();
  }, [originTagIds]);

  return (
    <MultiSelect
      dataList={tagList.map(item => ({
        ...item,
        id: item.tagId,
        name: item.tagName,
      }))}
      selectedIds={selectedTagIds}
      onCheckedChange={onCheckedChange}
      getSelectContent={getTemplateTagList}
      groupNameRender={groupNameRender}
      createItems={addGroup}
      manageItems={manageGroup}
      addCancel={onCancel}
      addItems={onCreateTags}
      errorMessage={errMsg}
      hidePopover={manageVisible}
      createGroupId={CreateGroupId}
    />
  );
};

export default Group;
