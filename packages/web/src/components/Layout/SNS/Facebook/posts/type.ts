import { getIn18Text } from 'api';
export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
}

export interface PostEditorSuccess {
  id: string;
  nums?: number;
}

export const getText = (key: string) => {
  getIn18Text('GERENKEHU');
};
