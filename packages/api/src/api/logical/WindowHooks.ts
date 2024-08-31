import { Api } from '@/api/_base/api';

export interface WindowHooksListener {
  (data: any): void;
}

export interface WindowHooksApi extends Api {
  onResize(listener: WindowHooksListener): void;
}
