export interface IBaseModalType {
  visible: boolean;
  id: number | string;
  onSuccess?: (id: number | string, res?: any) => void;
  onError?: (id: number | string, error?: any) => void;
  onClose: (id: number | string) => void;
}
