import { MailBoxModel } from 'api';
import { MailTreeMap } from '../../types';

export interface AdvancedSearchFormProps {
  isSearching?: boolean;
  advancedSearchLoading: boolean;
  advancedSearchVisible: boolean;
  referenceElement: any;
  onSubmit(values: any): void;
  form: any;
  onClose(v: boolean): void;
  treeMap: MailTreeMap;
  fids?: string;
}
