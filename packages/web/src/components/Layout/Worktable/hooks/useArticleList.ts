import { api, WorktableApi, ReqWorktableArticleList, WorktableArticleList } from 'api';
import { useState } from 'react';
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

/**
 * 获取官网数据列表接口
 * 文档参考：https://waimao.office.163.com/doc/#id=19000004359577&from=QIYE&parentResourceId=19000000400379&spaceId=3993514&ref=504237050&type=doc
 */
export function useArticleList(params: ReqWorktableArticleList) {
  const [list, setList] = useState<WorktableArticleList[]>([]);

  const fetchList = async () => {
    try {
      const result = await worktableApi.getWorktableArticleList(params);
      if (result && result.rows && result.rows.length > 0) {
        setList(result.rows);
      } else {
        setList([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    list,
    fetchList,
  };
}
