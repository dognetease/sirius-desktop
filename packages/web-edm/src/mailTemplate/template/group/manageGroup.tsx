import React, { useState, useEffect } from 'react';
import './index.scss';
import MultiSelectManage from '../../../components/multiSelectManage/multiSelectManage';
import { apiHolder as api, apis, MailTemplateApi, WaimaoRecommendTemplateTag, DataTrackerApi } from 'api';

const templateApi = api.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
interface Props {
  visible: boolean;
  closeModal: () => void;
}

const ManageGroup: React.FC<Props> = ({ visible, closeModal }) => {
  const [tagList, setTagList] = useState<WaimaoRecommendTemplateTag[]>([]);
  const [editId, setEditId] = useState<number>();
  const [editName, setEditName] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const editTag = (tag: WaimaoRecommendTemplateTag) => {
    if (editId) {
      return;
    }
    setEditId(tag.tagId);
    setEditName(tag.tagName);
  };

  const deleteTag = async (tag: WaimaoRecommendTemplateTag) => {
    const res = await templateApi.deleteTemplateTags({ tagIdList: [tag.tagId as number] });
    if (res.success) {
      setErrMsg('');
      setTagList(
        tagList.filter(item => {
          return item.tagId !== tag.tagId;
        }) || []
      );
      trackApi.track('pc_markting_edm_template_newgroup_operation', {
        operation: 'delete',
      });
      return;
    }
    setErrMsg(res.message || '');
  };
  const onCancel = () => {
    setEditId(undefined);
    setEditName('');
    setErrMsg('');
  };

  const onSave = async (tag: WaimaoRecommendTemplateTag) => {
    const res = await templateApi.saveOrUpdateTemplateTag({ tagId: tag.tagId, tagName: editName, templateCategory: 'LX-WAIMAO' });
    if (res.success) {
      setErrMsg('');
      onCancel();
      getTemplateTagList();
      trackApi.track('pc_markting_edm_template_newgroup_operation', {
        operation: 'edit',
      });
      return;
    }
    setErrMsg(res.message || '');
  };

  const getTemplateTagList = async () => {
    const res = await templateApi.getTemplateTagList({ templateType: 'PERSONAL' });
    if (res.success) {
      setTagList(res.data?.tagList || []);
      return;
    }
    setTagList([]);
  };

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditName(event.target.value || '');
  };

  useEffect(() => {
    visible && getTemplateTagList();
  }, [visible]);

  return (
    <MultiSelectManage
      visible={visible}
      editId={editId}
      editName={editName}
      dataList={tagList.map(item => ({
        ...item,
        id: item.tagId,
        name: item.tagName,
      }))}
      editItem={editTag}
      saveItem={onSave}
      deleteItem={deleteTag}
      closeModal={closeModal}
      onNameChange={onNameChange}
      onCancel={onCancel}
      errorMessage={errMsg}
    />
  );
};

export default ManageGroup;
